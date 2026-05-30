'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Focus, Download, ChevronDown, Palette } from 'lucide-react';
import EditorArea from './components/EditorArea';
import NotebookEditorArea from './components/NotebookEditorArea';
import { TEMPLATES, TemplateId } from './components/templates';
import styles from './editor.module.css';

export type EditorTheme = 'light' | 'dark' | 'sepia' | 'academic';

interface WritingEditorProps {
  writingId: string;
  initialTitle: string;
  initialContent: any;
  initialTemplate: TemplateId;
}

export default function WritingEditor({
  writingId, initialTitle, initialContent, initialTemplate,
}: WritingEditorProps) {
  const [isFocusMode, setFocusMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [theme, setTheme] = useState<EditorTheme>('light');

  const template = TEMPLATES[initialTemplate] || TEMPLATES.essay;

  const handleExportPDF = async () => {
    setShowExport(false);
    const el = document.querySelector(`.${styles.editorInner}`) as HTMLElement;
    if (!el) return;
    const { toPng } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');
    const img = await toPng(el, { backgroundColor: '#fff', pixelRatio: 2 });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    const h = (el.scrollHeight / el.scrollWidth) * w;
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    pdf.save(`${initialTitle}.pdf`);
  };

  const handleExportMD = () => {
    setShowExport(false);
    const el = document.querySelector(`.${styles.proseMirror}`) as HTMLElement;
    if (!el) return;
    const text = el.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.download = `${initialTitle}.md`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const themes: { id: EditorTheme, label: string, color: string }[] = [
    { id: 'light', label: 'Claro', color: '#ffffff' },
    { id: 'dark', label: 'Escuro', color: '#1e1e2e' },
    { id: 'sepia', label: 'Sépia', color: '#f4ecd8' },
    { id: 'academic', label: 'Acadêmico', color: '#fafaf9' },
  ];

  return (
    <div className={`${styles.editorShell} ${styles[`theme-${theme}`]}`}>
      {/* Top navigation bar */}
      <nav className={`${styles.editorNav} ${isFocusMode ? styles.focusHide : ''}`}>
        <div className={styles.navLeft}>
          <Link href="/dashboard/escrita" className={styles.navBackBtn}>
            <ArrowLeft size={15} /> Escrita
          </Link>
          <span className={styles.templateBadge}>
            {template.emoji} {template.label}
          </span>
        </div>

        <div className={styles.navRight}>
          {/* Theme Selector */}
          <div style={{ position: 'relative' }}>
            <button
              className={styles.navBtn}
              onClick={() => setShowThemes(!showThemes)}
              title="Mudar Tema"
            >
              <Palette size={15} /> Tema
            </button>
            {showThemes && (
              <div className={styles.dropdownMenu}>
                {themes.map(t => (
                  <button 
                    key={t.id} 
                    className={`${styles.dropdownItem} ${theme === t.id ? styles.dropdownItemActive : ''}`}
                    onClick={() => { setTheme(t.id); setShowThemes(false); }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, border: '1px solid #ddd' }} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`${styles.navBtn} ${isFocusMode ? styles.navBtnActive : ''}`}
            onClick={() => setFocusMode(f => !f)}
            title="Modo Foco"
          >
            <Focus size={15} />
            {isFocusMode ? 'Sair do Foco' : 'Modo Foco'}
          </button>

          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className={styles.exportBtn}
              onClick={() => setShowExport(o => !o)}
            >
              <Download size={15} /> Exportar <ChevronDown size={13} />
            </button>
            {showExport && (
              <div className={styles.dropdownMenu}>
                {[
                  { label: 'PDF', action: handleExportPDF },
                  { label: 'Markdown (.md)', action: handleExportMD },
                ].map(opt => (
                  <button key={opt.label} className={styles.dropdownItem} onClick={opt.action}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Editor */}
      {initialTemplate === 'notebook' ? (
        <NotebookEditorArea
          writingId={writingId}
          initialContent={initialContent}
          initialTitle={initialTitle}
          isFocusMode={isFocusMode}
        />
      ) : (
        <EditorArea
          writingId={writingId}
          initialContent={initialContent}
          initialTitle={initialTitle}
          template={initialTemplate}
          isFocusMode={isFocusMode}
          theme={theme}
        />
      )}
    </div>
  );
}
