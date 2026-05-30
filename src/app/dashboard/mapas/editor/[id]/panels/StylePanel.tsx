'use client';

import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { MindNodeData, BRANCH_COLORS } from '../hooks/useMindMap';
import styles from '../xmind.module.css';

// ─── Shape catalogue ─────────────────────────────────────────────────────────
const SHAPES = [
  // Row 1
  { id: 'rectangle',    label: '▭',  title: 'Retângulo' },
  { id: 'pill',         label: '⬭',  title: 'Pílula' },
  { id: 'ellipse',      label: '⬯',  title: 'Elipse / Oval' },
  // Row 2
  { id: 'circle',       label: '○',  title: 'Círculo' },
  { id: 'diamond',      label: '◇',  title: 'Diamante' },
  { id: 'parallelogram',label: '▱',  title: 'Paralelogramo' },
  // Row 3
  { id: 'hexagon',      label: '⬡',  title: 'Hexágono' },
  { id: 'pentagon',     label: '⬠',  title: 'Pentágono' },
  { id: 'octagon',      label: '⯃',  title: 'Octógono' },
  // Row 4
  { id: 'arrow',        label: '➤',  title: 'Seta' },
  { id: 'ribbon',       label: '⌂',  title: 'Estandarte' },
] as const;

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];

interface StylePanelProps {
  selectedNode: Node | null;
  onUpdateStyle: (nodeId: string, patch: Partial<MindNodeData>) => void;
}

type PanelTab = 'style' | 'tone' | 'map';

export default function StylePanel({ selectedNode, onUpdateStyle }: StylePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('style');
  const data = selectedNode?.data as MindNodeData | undefined;
  const update = (patch: Partial<MindNodeData>) => {
    if (selectedNode) onUpdateStyle(selectedNode.id, patch);
  };

  return (
    <aside className={styles.stylePanel}>
      {/* Tabs */}
      <div className={styles.panelTabs}>
        {(['style', 'tone', 'map'] as PanelTab[]).map(tab => (
          <button
            key={tab}
            className={`${styles.panelTab} ${activeTab === tab ? styles.panelTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'style' ? 'Estilo' : tab === 'tone' ? 'Tom' : 'Mapa'}
          </button>
        ))}
      </div>

      <div className={styles.panelBody}>

        {/* ── STYLE TAB ── */}
        {activeTab === 'style' && (
          <>
            <section className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>▼ Forma</div>
              <div className={styles.shapeGrid}>
                {SHAPES.map(s => (
                  <button
                    key={s.id}
                    className={`${styles.shapeBtn} ${data?.shape === s.id ? styles.shapeBtnActive : ''}`}
                    onClick={() => update({ shape: s.id as any })}
                    title={s.title}
                    disabled={!selectedNode}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.panelSection}>
              <div className={styles.panelRow}>
                <span className={styles.panelLabel}>Preenchimento</span>
                <input
                  type="color"
                  value={data?.bgColor || data?.branchColor || '#4ECDC4'}
                  onChange={e => update({ bgColor: e.target.value })}
                  className={styles.colorPicker}
                  disabled={!selectedNode}
                />
              </div>
              <div className={styles.panelRow}>
                <span className={styles.panelLabel}>Fronteira</span>
                <input
                  type="color"
                  value={data?.borderColor || '#000000'}
                  onChange={e => update({ borderColor: e.target.value })}
                  className={styles.colorPicker}
                  disabled={!selectedNode}
                />
              </div>
            </section>

            <section className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>▼ Texto</div>
              <div className={styles.panelRow}>
                <span className={styles.panelLabel}>Tamanho</span>
                <select
                  value={data?.fontSize || 14}
                  onChange={e => update({ fontSize: Number(e.target.value) })}
                  className={styles.panelSelect}
                  disabled={!selectedNode}
                >
                  {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>
              <div className={styles.panelRow}>
                <span className={styles.panelLabel}>Cor do texto</span>
                <input
                  type="color"
                  value={data?.textColor || '#1a1a1a'}
                  onChange={e => update({ textColor: e.target.value })}
                  className={styles.colorPicker}
                  disabled={!selectedNode}
                />
              </div>
              <div className={styles.formatBtns}>
                <button
                  className={`${styles.formatBtn} ${data?.fontBold ? styles.formatBtnActive : ''}`}
                  onClick={() => update({ fontBold: !data?.fontBold })}
                  disabled={!selectedNode}
                  title="Negrito"
                ><strong>B</strong></button>
                <button
                  className={`${styles.formatBtn} ${data?.fontItalic ? styles.formatBtnActive : ''}`}
                  onClick={() => update({ fontItalic: !data?.fontItalic })}
                  disabled={!selectedNode}
                  title="Itálico"
                ><em>I</em></button>
              </div>
            </section>

            {!selectedNode && (
              <p className={styles.noSelection}>Selecione um nó para editar seu estilo.</p>
            )}
          </>
        )}

        {/* ── TOM TAB ── */}
        {activeTab === 'tone' && (
          <section className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>▼ Cor do Ramo</div>
            <p className={styles.panelHint}>
              A cor escolhida se propaga para todos os nós filhos do ramo.
            </p>
            <div className={styles.colorSwatches}>
              {BRANCH_COLORS.map(color => (
                <button
                  key={color}
                  className={`${styles.swatch} ${data?.branchColor === color ? styles.swatchActive : ''}`}
                  style={{ background: color }}
                  onClick={() => update({ branchColor: color })}
                  disabled={!selectedNode || (selectedNode?.data as MindNodeData)?.nodeType === 'central'}
                />
              ))}
            </div>
            <div className={styles.panelRow} style={{ marginTop: 16 }}>
              <span className={styles.panelLabel}>Personalizada</span>
              <input
                type="color"
                value={data?.branchColor || '#4ECDC4'}
                onChange={e => update({ branchColor: e.target.value })}
                className={styles.colorPicker}
                disabled={!selectedNode}
              />
            </div>
          </section>
        )}

        {/* ── MAPA TAB ── */}
        {activeTab === 'map' && (
          <section className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>▼ Atalhos de Teclado</div>
            <table className={styles.shortcutTable}>
              <tbody>
                <tr><td><kbd>Tab</kbd></td><td>Criar nó filho</td></tr>
                <tr><td><kbd>Enter</kbd></td><td>Criar nó irmão</td></tr>
                <tr><td><kbd>Delete</kbd></td><td>Remover nó</td></tr>
                <tr><td><kbd>Ctrl+Z</kbd></td><td>Desfazer</td></tr>
                <tr><td><kbd>Ctrl+Y</kbd></td><td>Refazer</td></tr>
                <tr><td><kbd>Ctrl+S</kbd></td><td>Salvar</td></tr>
                <tr><td><kbd>F</kbd></td><td>Centralizar mapa</td></tr>
                <tr><td><kbd>Espaço</kbd></td><td>Modo Zen</td></tr>
                <tr><td colSpan={2} style={{ color: '#aaa', paddingTop: 8, fontSize: 11 }}>
                  Arraste no canvas vazio para selecionar múltiplos nós.<br/>
                  Pan: botão do meio ou botão direito do mouse.
                </td></tr>
              </tbody>
            </table>
          </section>
        )}

      </div>
    </aside>
  );
}
