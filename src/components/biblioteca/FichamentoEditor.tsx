'use client';

import React, { useState, useEffect } from 'react';
import { updateDocument } from '@/app/actions/library';
import { DocumentType } from '@/components/biblioteca/DocumentCard';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '@/components/editor/extensions/FontSizeExtension';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  Highlighter
} from 'lucide-react';
import styles from '@/app/dashboard/escrita/editor/[id]/components/notebook.module.css';

interface FichamentoEditorProps {
  document: DocumentType;
}

export default function FichamentoEditor({ document }: FichamentoEditorProps) {
  const documentId = document.id;
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(document.category || '');
  const [notes, setNotes] = useState(document.notes || '');
  const [currentPage, setCurrentPage] = useState(document.current_page || 0);
  const [totalPages, setTotalPages] = useState(document.total_pages || 0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escreva seus insights, ideias principais e conceitos...' }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: (() => {
      try {
        return notes ? JSON.parse(notes) : { type: 'doc', content: [] };
      } catch {
        return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: notes }] }] };
      }
    })(),
    onUpdate: ({ editor }) => {
      setNotes(JSON.stringify(editor.getJSON()));
    },
    immediatelyRender: false,
  });

  // Load from localStorage on mount (for draft)
  useEffect(() => {
    const saved = localStorage.getItem(`fichamento_draft_${documentId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setTitle(data.title || '');
      setCategory(data.category || category);
      setCurrentPage(data.currentPage || currentPage);
      setTotalPages(data.totalPages || totalPages);
      
      const savedNotes = data.notes || notes;
      setNotes(savedNotes);
      
      if (editor && !editor.isDestroyed) {
        try {
          editor.commands.setContent(JSON.parse(savedNotes));
        } catch {
          editor.commands.setContent(savedNotes);
        }
      }
    }
  }, [documentId, editor]);

  // Save to localStorage on change
  useEffect(() => {
    const data = { title, category, currentPage, totalPages, notes };
    localStorage.setItem(`fichamento_draft_${documentId}`, JSON.stringify(data));
  }, [title, category, currentPage, totalPages, notes, documentId]);

  const handleSave = async (status: 'reading' | 'finished') => {
    setIsSaving(true);
    setMessage('');
    
    try {
      const res = await updateDocument(documentId, {
        category,
        notes,
        current_page: currentPage,
        total_pages: totalPages,
        status
      });

      if (res.error) {
        setMessage('Erro ao salvar: ' + res.error);
      } else {
        setMessage(status === 'finished' ? 'Texto Encerrado!' : 'Salvo no Banco!');
      }
    } catch {
      setMessage('Erro ao salvar.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: '8px', border: '1px solid var(--marble-deep)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--marble-deep)', background: 'var(--surface-base)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📖</span> Fichamento Estratégico
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--stone-dark)', marginBottom: '4px' }}>Título da Obra / Capítulo</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Ex: Capítulo 1 - O Início..."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--marble)', background: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--stone-dark)', marginBottom: '4px' }}>Categoria / Tema</label>
            <input 
              type="text" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Ex: Marketing..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--marble)', background: 'white' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--stone-dark)', marginBottom: '4px' }}>Progresso (Páginas)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="number" 
                value={currentPage}
                onChange={e => setCurrentPage(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--marble)', background: 'white' }}
              />
              <span style={{ color: 'var(--stone)' }}>/</span>
              <input 
                type="number" 
                value={totalPages}
                onChange={e => setTotalPages(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--marble)', background: 'white' }}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalPages > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ height: '6px', background: 'var(--marble)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${Math.min(100, (currentPage / totalPages) * 100)}%`, 
                background: 'var(--gold)', 
                transition: 'width 0.3s ease' 
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '15px', color: 'var(--ink)', fontWeight: 700 }}>
              <span>{Math.round((currentPage / totalPages) * 100)}% Concluído</span>
              <span>{currentPage} / {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar} style={{ borderTop: '1px solid var(--marble-deep)', borderBottom: '1px solid var(--marble-deep)', background: '#f9f9f9', padding: '4px 12px' }}>
        <div className={styles.toolGroup}>
          <select 
            className={styles.dropdown}
            onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
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
          >
            <Bold size={14} />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`${styles.toolBtn} ${editor?.isActive('italic') ? styles.toolBtnActive : ''}`}
          >
            <Italic size={14} />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`${styles.toolBtn} ${editor?.isActive('underline') ? styles.toolBtnActive : ''}`}
          >
            <UnderlineIcon size={14} />
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleHighlight({ color: '#ffff00' }).run()}
            className={`${styles.toolBtn} ${editor?.isActive('highlight') ? styles.toolBtnActive : ''}`}
          >
            <Highlighter size={14} />
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
        </div>

        <div className={styles.toolGroup}>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={styles.toolBtn}>
            <List size={14} />
          </button>
          <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={styles.toolBtn}>
            <ListOrdered size={14} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--stone-dark)', marginBottom: '8px', fontWeight: 600 }}>Minhas Anotações</label>
        <div style={{ flex: 1, border: '1px solid var(--marble-deep)', borderRadius: '4px', background: 'white', padding: '12px' }}>
          <EditorContent editor={editor} style={{ outline: 'none', minHeight: '300px' }} />
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--marble-deep)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--marble-deep)' }}>
        <span style={{ flex: 1, fontSize: '13px', color: message.includes('Erro') ? 'var(--terra)' : 'var(--gold)', fontWeight: 500 }}>
          {message}
        </span>
        
        <button 
          onClick={() => handleSave('reading')}
          disabled={isSaving}
          style={{
            padding: '10px 16px',
            background: 'white',
            border: '1px solid var(--marble-deep)',
            borderRadius: '4px',
            color: 'var(--stone-dark)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Salvar Rascunho
        </button>
        <button 
          onClick={() => handleSave('finished')}
          disabled={isSaving}
          style={{
            padding: '10px 16px',
            background: 'var(--gold)',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Encerrar Texto
        </button>
      </div>

    </div>
  );
}
