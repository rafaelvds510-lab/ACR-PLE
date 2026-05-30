'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import styles from './flashcards.module.css';

// Reuse the RichTextEditor we already built for the agenda, or build a new one.
// For now we'll import a simple one to avoid hydration errors.
const RichTextEditor = dynamic(() => import('@/components/agenda/RichTextEditor'), { ssr: false });

interface CardEditorProps {
  frontHtml: string;
  backHtml: string;
  onFrontChange: (html: string) => void;
  onBackChange: (html: string) => void;
  onSave: () => void;
}

export default function CardEditor({ frontHtml, backHtml, onFrontChange, onBackChange, onSave }: CardEditorProps) {
  return (
    <div className={styles.editorContainer}>
      <div className={styles.field}>
        <label>Frente do Cartão (Pergunta)</label>
        <RichTextEditor content={frontHtml} onChange={onFrontChange} />
      </div>

      <div className={styles.field} style={{ marginTop: 24 }}>
        <label>Verso do Cartão (Resposta)</label>
        <RichTextEditor content={backHtml} onChange={onBackChange} />
      </div>

      <button className={styles.saveBtn} onClick={onSave} style={{ marginTop: 32 }}>
        Salvar Cartão
      </button>
    </div>
  );
}
