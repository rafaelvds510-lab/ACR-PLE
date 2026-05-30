'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Highlight } from '@tiptap/extension-highlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Typography } from '@tiptap/extension-typography';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '@/components/editor/extensions/FontSizeExtension';

import Toolbar from './Toolbar';
import PomodoroTimer from './PomodoroTimer';
import { useAutoSave } from '../hooks/useAutoSave';
import styles from '../editor.module.css';
import { Bold, Italic, Strikethrough, Highlighter } from 'lucide-react';

interface EditorAreaProps {
  writingId: string;
  initialContent: any;
  initialTitle: string;
  template: string;
  isFocusMode: boolean;
  theme?: string;
}

export default function EditorArea({
  writingId, initialContent, initialTitle, template, isFocusMode, theme
}: EditorAreaProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch — TipTap is client-only
  useEffect(() => { setMounted(true); }, []);

  const { save } = useAutoSave(writingId, (status) => {
    setSaveStatus(status === 'saved' ? 'saved' : 'idle');
    if (status === 'saved') setTimeout(() => setSaveStatus('idle'), 2500);
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Título...';
          return 'Escreva aqui…';
        },
      }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Mathematics,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: initialContent || { type: 'doc', content: [] },
    editorProps: {
      attributes: { class: styles.proseMirror, spellcheck: 'true' },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const wordCount = editor.storage.characterCount?.words() ?? 0;
      setSaveStatus('saving');
      save(content, wordCount, title, template);
    },
    immediatelyRender: false,
  });

  // Save title on change
  useEffect(() => {
    if (!mounted || title === initialTitle) return;
    setSaveStatus('saving');
    save(editor?.getJSON() ?? null, editor?.storage.characterCount?.words() ?? 0, title, template);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const words = editor?.storage.characterCount?.words() ?? 0;
  const chars = editor?.storage.characterCount?.characters() ?? 0;

  if (!mounted) {
    return (
      <div className={styles.editorContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ color: '#aaa', fontSize: 14 }}>Carregando editor...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.editorContainer} ${isFocusMode ? styles.focusMode : ''}`}>
      <PomodoroTimer visible={isFocusMode} />
      {!isFocusMode && <Toolbar editor={editor} />}

      {editor && (
        <BubbleMenu editor={editor} className={styles.bubbleMenu}>
          <button
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            className={`${styles.bubbleBtn} ${editor.isActive('bold') ? styles.bubbleBtnActive : ''}`}
          ><Bold size={13} /></button>
          <button
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            className={`${styles.bubbleBtn} ${editor.isActive('italic') ? styles.bubbleBtnActive : ''}`}
          ><Italic size={13} /></button>
          <button
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
            className={`${styles.bubbleBtn} ${editor.isActive('strike') ? styles.bubbleBtnActive : ''}`}
          ><Strikethrough size={13} /></button>
          <button
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHighlight().run(); }}
            className={`${styles.bubbleBtn} ${editor.isActive('highlight') ? styles.bubbleBtnActive : ''}`}
          ><Highlighter size={13} /></button>
        </BubbleMenu>
      )}

      <div className={styles.editorInner}>
        <input
          className={styles.docTitle}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do documento"
        />
        <EditorContent editor={editor} />
      </div>

      <div className={styles.editorFooter}>
        <span>{words} palavras · {chars} caracteres</span>
        <span className={`${styles.saveIndicator} ${saveStatus === 'saved' ? styles.saveIndicatorSaved : ''}`}>
          {saveStatus === 'saving' && '● Salvando...'}
          {saveStatus === 'saved' && '✓ Salvo automaticamente'}
        </span>
      </div>
    </div>
  );
}
