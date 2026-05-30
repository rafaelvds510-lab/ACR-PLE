'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu as TipTapBubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Strikethrough, Highlighter, Link } from 'lucide-react';
import styles from '../editor.module.css';

interface BubbleMenuProps {
  editor: Editor | null;
}

export default function BubbleMenuBar({ editor }: BubbleMenuProps) {
  if (!editor) return null;

  return (
    <TipTapBubbleMenu
      editor={editor}
      className={styles.bubbleMenu}
    >
      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        className={`${styles.bubbleBtn} ${editor.isActive('bold') ? styles.bubbleBtnActive : ''}`}
        title="Negrito"
      >
        <Bold size={13} />
      </button>
      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        className={`${styles.bubbleBtn} ${editor.isActive('italic') ? styles.bubbleBtnActive : ''}`}
        title="Itálico"
      >
        <Italic size={13} />
      </button>
      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
        className={`${styles.bubbleBtn} ${editor.isActive('strike') ? styles.bubbleBtnActive : ''}`}
        title="Tachado"
      >
        <Strikethrough size={13} />
      </button>
      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHighlight().run(); }}
        className={`${styles.bubbleBtn} ${editor.isActive('highlight') ? styles.bubbleBtnActive : ''}`}
        title="Destacar"
      >
        <Highlighter size={13} />
      </button>
    </TipTapBubbleMenu>
  );
}
