'use client';

import React, { useState } from 'react';
import styles from './GenerateFlashcardsModal.module.css';

interface GenerateFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function GenerateFlashcardsModal({ isOpen, onClose, onSuccess }: GenerateFlashcardsModalProps) {
  const [deckName, setDeckName] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckName,
          text
        })
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.count);
      } else {
        const err = await res.json();
        alert('Erro ao gerar flashcards: ' + (err.error || 'Desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro inesperado ao gerar os flashcards.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>✨ Gerador de Flashcards com IA</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.infoBox}>
            <p>Cole um texto ou resumo abaixo e a IA criará um baralho no <b>Padrão Atômico</b> otimizado para sua memória de longo prazo.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="deckName">Nome do Baralho</label>
            <input 
              id="deckName"
              type="text" 
              value={deckName} 
              onChange={(e) => setDeckName(e.target.value)} 
              placeholder="Ex: Revolução Francesa, Anatomia - Coração"
              required 
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="text">Texto / Resumo</label>
            <textarea 
              id="text"
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Cole aqui o texto que você deseja transformar em flashcards..."
              required 
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting || !deckName || !text}>
              {isSubmitting ? 'Gerando...' : 'Gerar Baralho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
