'use client';

import React from 'react';
import { X, Copy, Check, Save, Share2 } from 'lucide-react';
import styles from './ai-result.module.css';

interface AIResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'flashcards' | 'mindmap' | 'summary' | 'quiz' | 'translate';
  content: any;
  onSave?: (data: any) => void;
}

export default function AIResultModal({ isOpen, onClose, title, type, content, onSave }: AIResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.typeTag}>{type.toUpperCase()}</span>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <div className={styles.content}>
          {type === 'flashcards' && (
            <div className={styles.flashcardGrid}>
              {content.map((card: any, idx: number) => (
                <div key={idx} className={styles.cardPreview}>
                  <div className={styles.cardFront}><b>F:</b> {card.front}</div>
                  <div className={styles.cardBack}><b>V:</b> {card.back}</div>
                </div>
              ))}
            </div>
          )}

          {type === 'mindmap' && (
            <div className={styles.mindmapContainer}>
              <pre className={styles.mermaidCode}>{content}</pre>
              <p className={styles.hint}>Este mapa mental pode ser visualizado no módulo de Mapas Mentais.</p>
            </div>
          )}

          {type === 'summary' && (
            <div className={styles.summaryBox}>
              {content}
            </div>
          )}

          {type === 'quiz' && (
            <div className={styles.quizList}>
              {content.map((q: any, idx: number) => (
                <div key={idx} className={styles.quizItem}>
                  <p><b>Q{idx + 1}:</b> {q.question}</p>
                  <ul className={styles.optionsList}>
                    {q.options?.map((opt: string, i: number) => (
                      <li key={i} className={q.answer === i ? styles.correct : ''}>{opt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {type === 'translate' && (
            <div className={styles.translationBox}>
              {content}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button onClick={onClose} className={styles.secondaryBtn}>Cancelar</button>
          <button 
            onClick={() => onSave && onSave(content)} 
            className={styles.primaryBtn}
          >
            <Save size={18} />
            Salvar no Módulo
          </button>
        </footer>
      </div>
    </div>
  );
}
