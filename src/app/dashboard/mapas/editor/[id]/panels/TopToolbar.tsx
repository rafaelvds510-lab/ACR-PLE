'use client';

import React, { useState } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';
import { toPng, toSvg, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Undo2, Redo2, Save, Share2, ZoomIn, ZoomOut,
  Maximize2, LayoutTemplate, Plus, ChevronDown,
  Cloud, Check,
} from 'lucide-react';
import { LayoutMode } from '../hooks/useAutoLayout';
import styles from '../xmind.module.css';

const LAYOUT_OPTIONS: { id: LayoutMode; label: string; icon: string }[] = [
  { id: 'mindmap', label: 'Mapa Mental', icon: '⊙' },
  { id: 'logical', label: 'Diagrama Lógico', icon: '→' },
  { id: 'org', label: 'Organograma', icon: '⊤' },
  { id: 'radial', label: 'Radial', icon: '◎' },
];

interface XMindTopic {
  id: string;
  class: string;
  title: string;
  children?: {
    attached: XMindTopic[];
  };
}

// Convert React Flow nodes/edges to XMind topic tree format
function reactFlowToXMind(nodes: Node[], edges: Edge[]): XMindTopic {
  const rootNode = nodes.find(n => n.id === 'root') || nodes[0];
  if (!rootNode) {
    return { id: 'root', class: 'topic', title: 'Tópico Central' };
  }

  const buildTree = (nodeId: string, label: string): XMindTopic => {
    const childEdges = edges.filter(e => e.source === nodeId);
    const attached: XMindTopic[] = [];

    childEdges.forEach(edge => {
      const childNode = nodes.find(n => n.id === edge.target);
      if (childNode) {
        attached.push(buildTree(childNode.id, childNode.data?.label as string || 'Novo Tópico'));
      }
    });

    const topic: XMindTopic = {
      id: nodeId,
      class: 'topic',
      title: label
    };

    if (attached.length > 0) {
      topic.children = { attached };
    }

    return topic;
  };

  return buildTree(rootNode.id, rootNode.data?.label as string || 'Tópico Central');
}

interface TopToolbarProps {
  title: string;
  onTitleChange: (t: string) => void;
  onSave: () => void;
  onAddChild: (id: string) => void;
  selectedNodeId: string | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onLayout: (mode: LayoutMode) => void;
  currentLayout: LayoutMode;
  saveStatus: 'idle' | 'saving' | 'saved';
  zenMode: boolean;
  onZenToggle: () => void;
  nodes: Node[];
  edges: Edge[];
}

export default function TopToolbar({
  title, onTitleChange, onSave, onAddChild, selectedNodeId,
  onUndo, onRedo, canUndo, canRedo, onLayout, currentLayout,
  saveStatus, zenMode, onZenToggle, nodes, edges,
}: TopToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handleExport = async (format: 'png' | 'jpeg' | 'svg' | 'pdf' | 'xmind') => {
    setExportOpen(false);
    
    if (format === 'xmind') {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const rootTopic = reactFlowToXMind(nodes, edges);

        const contentJson = [
          {
            id: `sheet-${Date.now()}`,
            class: 'sheet',
            title: title || 'Sheet 1',
            rootTopic
          }
        ];

        zip.file('content.json', JSON.stringify(contentJson, null, 2));

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `${title || 'mapa-mental'}.xmind`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to export xmind workbook:', err);
        alert('Falha ao exportar arquivo .xmind.');
      }
      return;
    }

    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;
    const filter = (n: HTMLElement) =>
      !n.classList?.contains('react-flow__controls') &&
      !n.classList?.contains('react-flow__minimap');

    if (format === 'png') {
      const url = await toPng(el, { backgroundColor: '#F7F7F5', filter });
      const a = document.createElement('a');
      a.download = `${title}.png`;
      a.href = url;
      a.click();
    } else if (format === 'jpeg') {
      const url = await toJpeg(el, { backgroundColor: '#F7F7F5', filter, quality: 0.95 });
      const a = document.createElement('a');
      a.download = `${title}.jpeg`;
      a.href = url;
      a.click();
    } else if (format === 'svg') {
      const url = await toSvg(el, { backgroundColor: '#F7F7F5', filter });
      const a = document.createElement('a');
      a.download = `${title}.svg`;
      a.href = url;
      a.click();
    } else if (format === 'pdf') {
      const url = await toPng(el, { backgroundColor: '#fff', filter, pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
      pdf.addImage(url, 'PNG', 0, 0, 1280, 720);
      pdf.save(`${title}.pdf`);
    }
  };

  return (
    <header className={styles.toolbar}>
      {/* Left: Title + Save status */}
      <div className={styles.toolbarLeft}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Mapa sem título"
        />
        <span className={styles.saveStatus}>
          {saveStatus === 'saving' && <><Cloud size={13} /> Salvando...</>}
          {saveStatus === 'saved' && <><Check size={13} color="#43AA8B" /> Salvo</>}
        </span>
      </div>

      {/* Center: Actions */}
      <div className={styles.toolbarCenter}>
        <button className={styles.tbBtn} onClick={onUndo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button className={styles.tbBtn} onClick={onRedo} disabled={!canRedo} title="Refazer (Ctrl+Y)">
          <Redo2 size={16} />
        </button>

        <div className={styles.tbDivider} />

        <button
          className={styles.tbBtn}
          onClick={() => selectedNodeId && onAddChild(selectedNodeId)}
          disabled={!selectedNodeId}
          title="Adicionar filho (Tab)"
        >
          <Plus size={16} /> Nó
        </button>

        {/* Layout Selector */}
        <div className={styles.tbDropdown}>
          <button
            className={styles.tbBtn}
            onClick={() => setLayoutOpen(o => !o)}
            title="Mudar layout"
          >
            <LayoutTemplate size={16} />
            {LAYOUT_OPTIONS.find(l => l.id === currentLayout)?.label}
            <ChevronDown size={13} />
          </button>
          {layoutOpen && (
            <div className={styles.tbMenu}>
              {LAYOUT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`${styles.tbMenuItem} ${currentLayout === opt.id ? styles.tbMenuItemActive : ''}`}
                  onClick={() => { onLayout(opt.id); setLayoutOpen(false); }}
                >
                  <span className={styles.tbMenuIcon}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <div className={styles.tbDropdown}>
          <button className={styles.tbBtn} onClick={() => setExportOpen(o => !o)}>
            Exportar <ChevronDown size={13} />
          </button>
          {exportOpen && (
            <div className={styles.tbMenu}>
              <button className={styles.tbMenuItem} onClick={() => handleExport('xmind')}>XMind Workbook (.xmind)</button>
              <button className={styles.tbMenuItem} onClick={() => handleExport('png')}>Imagem PNG</button>
              <button className={styles.tbMenuItem} onClick={() => handleExport('jpeg')}>Imagem JPEG</button>
              <button className={styles.tbMenuItem} onClick={() => handleExport('pdf')}>Documento PDF</button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Zoom + Share + Zen */}
      <div className={styles.toolbarRight}>
        <button className={styles.tbBtn} onClick={() => zoomIn()} title="Zoom in"><ZoomIn size={16} /></button>
        <button className={styles.tbBtn} onClick={() => zoomOut()} title="Zoom out"><ZoomOut size={16} /></button>
        <button className={styles.tbBtn} onClick={() => fitView({ padding: 0.3 })} title="Encaixar (F)">
          <Maximize2 size={16} />
        </button>
        <div className={styles.tbDivider} />
        <button className={styles.tbBtn} onClick={onZenToggle} title="Modo Zen (Espaço)">
          {zenMode ? 'Sair do Zen' : 'Zen'}
        </button>
        <button className={styles.shareBtn} title="Compartilhar (em breve)">
          <Share2 size={15} /> Compartilhar
        </button>
      </div>
    </header>
  );
}
