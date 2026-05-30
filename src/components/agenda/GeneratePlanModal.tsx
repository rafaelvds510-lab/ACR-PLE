'use client';

import React, { useState } from 'react';
import styles from './GeneratePlanModal.module.css';

interface GeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GeneratePlanModal({ isOpen, onClose, onSuccess }: GeneratePlanModalProps) {
  const [topic, setTopic] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('flight_plan');
  const [referenceText, setReferenceText] = useState('');
  const [fileData, setFileData] = useState<{ data: string; mimeType: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          hoursPerDay,
          days,
          startDate,
          method,
          referenceText,
          fileData
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert('Erro ao gerar plano: ' + (err.error || 'Desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro inesperado ao gerar o plano.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Gerador Automático de Plano</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.infoBox}>
            <p>O Tutor IA criará tarefas automáticas baseadas nos seus objetivos e distribuirá na sua agenda.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="topic">Assunto ou Objetivo de Estudo (Ou Plano)</label>
            <input 
              id="topic"
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="Ex: Direito Constitucional, ENEM Matemática..."
              required={!fileData} 
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="referenceText">Conteúdo ou Referência (Opcional - Cole o texto aqui)</label>
            <textarea 
              id="referenceText"
              value={referenceText} 
              onChange={(e) => setReferenceText(e.target.value)} 
              placeholder="Cole aqui o conteúdo do edital, capítulos de livros ou detalhes do que quer estudar..."
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="fileUpload">Anexar Material (Opcional - PDF/TXT)</label>
            <input 
              id="fileUpload"
              type="file" 
              accept=".pdf,.txt,.md,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setFileData(null);
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64String = (reader.result as string).split(',')[1];
                  setFileData({
                    data: base64String,
                    mimeType: file.type || 'application/pdf'
                  });
                };
                reader.readAsDataURL(file);
              }}
              className={styles.fileInput}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="method">Método de Estudo</label>
            <select 
              id="method"
              value={method} 
              onChange={(e) => setMethod(e.target.value)} 
              required
              className={styles.select}
            >
              <option value="flight_plan">🧭 Plano de Voo (Plano de 7 dias)</option>
              <option value="autodidact">📚 Trilha Autodidata (Iniciante, Intermediário, Avançado)</option>
              <option value="summary">📄 Resumir Artigo (5 Pontos-Chave)</option>
              <option value="socratic">🏛️ Diálogo Socrático (1ª Pergunta Fundamental)</option>
              <option value="mnemonic">🔗 Técnica de Memorização (Mnemônicos)</option>
              <option value="feynman">🧠 Explicar como Feynman</option>
            </select>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="hoursPerDay">Horas por Dia</label>
              <input 
                id="hoursPerDay"
                type="number" 
                min="0.5"
                step="0.5"
                max="12"
                value={hoursPerDay} 
                onChange={(e) => setHoursPerDay(Number(e.target.value))} 
                required 
              />
            </div>
            
            <div className={styles.field}>
              <label htmlFor="days">Dias de Estudo</label>
              <input 
                id="days"
                type="number" 
                min="1"
                max="30"
                value={days} 
                onChange={(e) => setDays(Number(e.target.value))} 
                required 
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="startDate">Data de Início</label>
            <input 
              id="startDate"
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              required 
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting || (!topic && !fileData && !referenceText)}>
              {isSubmitting ? (fileData || referenceText ? 'Extraindo Cronograma...' : 'Gerando Plano...') : 'Gerar e Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
