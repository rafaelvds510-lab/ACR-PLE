'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '@/components/editor/extensions/FontSizeExtension';
import { v4 as uuidv4 } from 'uuid';
import { 
  ChevronDown, ChevronRight, FileText, Plus, PenTool, Eraser, MousePointer2, 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Highlighter,
  Baseline, Palette, Undo, Redo
} from 'lucide-react';

import DrawingCanvas, { Stroke } from './DrawingCanvas';
import { useAutoSave } from '../hooks/useAutoSave';
import styles from './notebook.module.css';

interface Page {
  id: string;
  title: string;
  content: any; // TipTap JSON
  ink: Stroke[];
}

interface Chapter {
  id: string;
  title: string;
  pages: Page[];
}

interface NotebookStructure {
  type: 'notebook';
  cover?: { title: string; image?: string };
  chapters: Chapter[];
}

interface NotebookEditorAreaProps {
  writingId: string;
  initialContent: any;
  initialTitle: string;
  isFocusMode: boolean;
}

export default function NotebookEditorArea({
  writingId, initialContent, initialTitle, isFocusMode
}: NotebookEditorAreaProps) {
  const [notebookTitle, setNotebookTitle] = useState(initialTitle);
  const [notebook, setNotebook] = useState<NotebookStructure>(() => {
    if (initialContent?.type === 'notebook') return initialContent;
    return {
      type: 'notebook',
      chapters: [{
        id: uuidv4(),
        title: 'Capítulo 1',
        pages: [{ id: uuidv4(), title: 'Página Inicial', content: { type: 'doc', content: [] }, ink: [] }]
      }]
    };
  });
  
  const [activePageId, setActivePageId] = useState<string>(notebook.chapters[0]?.pages[0]?.id || '');
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  
  // Ink Tools State
  const [toolMode, setToolMode] = useState<'text' | 'pen' | 'highlighter' | 'eraser'>('text');
  const [penColor, setPenColor] = useState('#1a1a1a'); 
  const [penWidth, setPenWidth] = useState(2);
  const [penOpacity, setPenOpacity] = useState(1);

  const { save } = useAutoSave(writingId, () => {});

  // Get active page
  const activeChapterIndex = notebook.chapters.findIndex(c => c.pages.some(p => p.id === activePageId));
  const activeChapter = notebook.chapters[activeChapterIndex];
  const activePageIndex = activeChapter?.pages.findIndex(p => p.id === activePageId);
  const activePage = activeChapter?.pages[activePageIndex];

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escreva ou cole seu conteúdo aqui...' }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: activePage?.content || { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      handlePageChange(activePageId, { content: editor.getJSON() });
    },
    editable: toolMode === 'text',
    immediatelyRender: false,
  });

  // When active page changes, update editor content
  useEffect(() => {
    if (editor && activePage && !editor.isDestroyed) {
      const currentJson = editor.getJSON();
      // Only set if different to avoid cursor jumping
      if (JSON.stringify(currentJson) !== JSON.stringify(activePage.content)) {
        editor.commands.setContent(activePage.content || { type: 'doc', content: [] });
      }
    }
  }, [activePageId, editor]);

  // When toolMode changes, update TipTap editable state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(toolMode === 'text');
    }
  }, [toolMode, editor]);

  const saveNotebook = useCallback((newNotebook: NotebookStructure, title: string) => {
    save(newNotebook, 0, title, 'notebook'); // Word count can be calculated later if needed
  }, [save]);

  // Auto-save when notebook state changes
  useEffect(() => {
    saveNotebook(notebook, notebookTitle);
  }, [notebook, notebookTitle, saveNotebook]);

  const handlePageChange = (pageId: string, updates: Partial<Page>) => {
    setNotebook(prev => {
      const newChapters = prev.chapters.map(c => ({
        ...c,
        pages: c.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
      }));
      return { ...prev, chapters: newChapters };
    });
  };

  const handleAddChapter = () => {
    setNotebook(prev => ({
      ...prev,
      chapters: [...prev.chapters, {
        id: uuidv4(),
        title: `Capítulo ${prev.chapters.length + 1}`,
        pages: [{ id: uuidv4(), title: 'Nova Página', content: { type: 'doc', content: [] }, ink: [] }]
      }]
    }));
  };

  const handleAddPage = (chapterId: string) => {
    const newPageId = uuidv4();
    setNotebook(prev => {
      const newChapters = prev.chapters.map(c => {
        if (c.id === chapterId) {
          return {
            ...c,
            pages: [...c.pages, { id: newPageId, title: 'Nova Página', content: { type: 'doc', content: [] }, ink: [] }]
          };
        }
        return c;
      });
      return { ...prev, chapters: newChapters };
    });
    setActivePageId(newPageId);
  };

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  return (
    <div className={styles.container}>
      {/* Sidebar - Chapters and Pages */}
      <aside className={`${styles.sidebar} ${isFocusMode ? styles.sidebarHidden : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3>Índice</h3>
          <button onClick={handleAddChapter} className={styles.addChapterBtn} title="Novo Capítulo">
            <Plus size={18} />
          </button>
        </div>
        <div className={styles.sidebarContent}>
          {notebook.chapters.map(chapter => (
            <div key={chapter.id} className={styles.chapterItem}>
              <div className={styles.chapterHeader} onClick={() => toggleChapter(chapter.id)}>
                <div className={styles.chapterTitle}>
                  {collapsedChapters[chapter.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <span>{chapter.title}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAddPage(chapter.id); }}
                  className={styles.addChapterBtn}
                  title="Nova Página"
                >
                  <Plus size={14} />
                </button>
              </div>
              {!collapsedChapters[chapter.id] && (
                <div className={styles.pageList}>
                  {chapter.pages.map(page => (
                    <div 
                      key={page.id} 
                      className={`${styles.pageItem} ${activePageId === page.id ? styles.pageItemActive : ''}`}
                      onClick={() => setActivePageId(page.id)}
                    >
                      <FileText size={14} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {page.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Area */}
      <div className={styles.mainArea}>
        {/* Notebook Toolbar */}
        <div className={styles.toolbar}>
          {/* Main Formatting Group */}
          <div className={styles.toolGroup}>
            <span className={styles.toolLabel}>Página Inicial</span>
            
            <select 
              className={styles.dropdown}
              onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
              title="Fonte"
              style={{ width: '120px' }}
            >
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Arial Black">Arial Black</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Courier New">Courier New</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>

            <select 
              className={styles.dropdown}
              onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
              title="Tamanho da Fonte"
              defaultValue="16px"
            >
              <option value="8px">8</option>
              <option value="9px">9</option>
              <option value="10px">10</option>
              <option value="11px">11</option>
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="20px">20</option>
              <option value="24px">24</option>
              <option value="28px">28</option>
              <option value="32px">32</option>
              <option value="36px">36</option>
              <option value="48px">48</option>
            </select>

            <button 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`${styles.toolBtn} ${editor?.isActive('bold') ? styles.toolBtnActive : ''}`}
              title="Negrito"
            >
              <Bold size={16} />
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`${styles.toolBtn} ${editor?.isActive('italic') ? styles.toolBtnActive : ''}`}
              title="Itálico"
            >
              <Italic size={16} />
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`${styles.toolBtn} ${editor?.isActive('underline') ? styles.toolBtnActive : ''}`}
              title="Sublinhado"
            >
              <UnderlineIcon size={16} />
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleHighlight({ color: '#ffff00' }).run()}
              className={`${styles.toolBtn} ${editor?.isActive('highlight') ? styles.toolBtnActive : ''}`}
              title="Realce de Texto"
            >
              <Highlighter size={16} />
            </button>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px', borderLeft: '1px solid #ddd', paddingLeft: '8px' }}>
              {['#000000', '#ffffff', '#4285F4', '#DB4437', '#0F9D58', '#F4B400'].map(c => (
                <div
                  key={c}
                  onClick={() => editor?.chain().focus().setColor(c).run()}
                  style={{ 
                    width: 16, 
                    height: 16, 
                    backgroundColor: c, 
                    borderRadius: '50%', 
                    cursor: 'pointer',
                    border: '1px solid #ccc'
                  }}
                  title={c}
                />
              ))}
              <input 
                type="color" 
                style={{ width: 20, height: 20, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', marginLeft: '4px' }}
                onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                title="Mais Cores"
              />
            </div>

            <button 
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className={styles.toolBtn}
              title="Desfazer"
            >
              <Undo size={16} />
            </button>
            <button 
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className={styles.toolBtn}
              title="Refazer"
            >
              <Redo size={16} />
            </button>
          </div>

          {/* Paragraph Group */}
          <div className={styles.toolGroup}>
            <button 
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`${styles.toolBtn} ${editor?.isActive('bulletList') ? styles.toolBtnActive : ''}`}
              title="Bullets"
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`${styles.toolBtn} ${editor?.isActive('orderedList') ? styles.toolBtnActive : ''}`}
              title="Numeração"
            >
              <ListOrdered size={16} />
            </button>
          </div>

          {/* Drawing Group */}
          <div className={styles.toolGroup}>
            <span className={styles.toolLabel}>Desenhar</span>
            <button 
              className={`${styles.toolBtn} ${toolMode === 'text' ? styles.toolBtnActive : ''}`}
              onClick={() => setToolMode('text')}
              title="Cursor"
            >
              <MousePointer2 size={16} />
            </button>
            
            {/* Pens */}
            <button 
              className={`${styles.toolBtn} ${toolMode === 'pen' && penWidth === 1 ? styles.toolBtnActive : ''}`}
              onClick={() => { setToolMode('pen'); setPenWidth(1); setPenOpacity(1); }}
              title="Caneta 0.5 mm"
            >
              <div className={styles.penIcon}>
                <PenTool size={14} />
                <div className={styles.penTip} style={{ width: 2, height: 2, background: penColor }} />
              </div>
            </button>
            <button 
              className={`${styles.toolBtn} ${toolMode === 'pen' && penWidth === 2 ? styles.toolBtnActive : ''}`}
              onClick={() => { setToolMode('pen'); setPenWidth(2); setPenOpacity(1); }}
              title="Caneta 1.0 mm"
            >
              <div className={styles.penIcon}>
                <PenTool size={16} />
                <div className={styles.penTip} style={{ width: 4, height: 4, background: penColor }} />
              </div>
            </button>
            
            {/* Highlighter */}
            <button 
              className={`${styles.toolBtn} ${toolMode === 'highlighter' ? styles.toolBtnActive : ''}`}
              onClick={() => { setToolMode('highlighter'); setPenWidth(12); setPenOpacity(0.4); }}
              title="Marca-texto 6.0 mm"
            >
              <div className={styles.penIcon} style={{ opacity: 0.6 }}>
                <Baseline size={16} />
                <div style={{ width: 12, height: 4, background: penColor || '#ffff00', borderRadius: 1 }} />
              </div>
            </button>

            <button 
              className={`${styles.toolBtn} ${toolMode === 'eraser' ? styles.toolBtnActive : ''}`}
              onClick={() => setToolMode('eraser')}
              title="Borracha"
            >
              <Eraser size={16} />
            </button>
          </div>

          {/* Drawing Colors */}
          {(toolMode === 'pen' || toolMode === 'highlighter') && (
            <div className={styles.toolGroup}>
              {['#1a1a1a', '#DB4437', '#0F9D58', '#4285F4', '#F4B400', '#ffff00'].map(c => (
                <div
                  key={c}
                  className={`${styles.colorCircle} ${penColor === c ? styles.colorCircleActive : ''}`}
                  onClick={() => setPenColor(c)}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Editor Wrapper */}
        <div className={styles.editorWrapper}>
          {activePage ? (
            <div className={styles.pageContainer}>
              <input
                className={styles.pageTitleInput}
                value={activePage.title}
                onChange={(e) => handlePageChange(activePage.id, { title: e.target.value })}
                placeholder="Título da Página"
                readOnly={toolMode !== 'text'}
              />
              
              <div style={{ position: 'relative' }}>
                <EditorContent editor={editor} className={styles.tiptapEditor} />
                
                {/* Ink Layer */}
                <div className={styles.drawingOverlay}>
                  <DrawingCanvas
                    strokes={activePage.ink || []}
                    onStrokesChange={(strokes) => handlePageChange(activePage.id, { ink: strokes })}
                    isDrawingMode={toolMode === 'pen' || toolMode === 'highlighter'}
                    isEraserMode={toolMode === 'eraser'}
                    color={penColor}
                    lineWidth={penWidth}
                    opacity={penOpacity}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#aaa', marginTop: '100px' }}>
              Selecione ou crie uma página no menu lateral.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
