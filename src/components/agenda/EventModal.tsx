'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './EventModal.module.css';
import StudyPlanInjector from './StudyPlanInjector';
import { IconLaurel, IconPen } from '@/components/icons/AcropoleIcons';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false, loading: () => <p style={{fontSize: 14, color: '#666'}}>Carregando editor...</p> });

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  selectedDate: { start: Date; end: Date; allDay: boolean } | null;
  selectedEvent: any | null;
}

export default function EventModal({ isOpen, onClose, onSave, selectedDate, selectedEvent }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('reading');
  const [notesHtml, setNotesHtml] = useState('');
  const [color, setColor] = useState('#346a8a');
  const [textColor, setTextColor] = useState('#ffffff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setType(selectedEvent.extendedProps?.type || 'other');
      setNotesHtml('<p>Carregando notas...</p>'); 
      setColor(selectedEvent.backgroundColor || '#346a8a');
      setTextColor(selectedEvent.textColor || '#ffffff');
    } else {
      setTitle('');
      setType('reading');
      setNotesHtml('');
      setColor('#346a8a');
      setTextColor('#ffffff');
    }
  }, [selectedEvent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        title,
        type,
        start_time: selectedEvent ? selectedEvent.startStr : selectedDate?.start.toISOString(),
        end_time: selectedEvent ? selectedEvent.endStr : selectedDate?.end.toISOString(),
        is_all_day: selectedEvent ? selectedEvent.allDay : selectedDate?.allDay,
        notes_html: notesHtml,
        color,
        text_color: textColor
      };

      const url = selectedEvent ? `/api/events/${selectedEvent.id}` : '/api/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishPlan = async () => {
    const planId = selectedEvent?.extendedProps?.plan_id;
    if (!planId) return;
    if (!confirm('Finalizar plano agora? Isso excluirá as sessões futuras não concluídas deste plano.')) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'PATCH' });
      if (res.ok) onSave(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFullPlan = async () => {
    const planId = selectedEvent?.extendedProps?.plan_id;
    if (!planId) return;
    if (!confirm('Excluir plano INTEIRO e limpar agenda deste tema?')) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      if (res.ok) onSave(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!confirm('Deseja realmente excluir este evento?')) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onSave(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            <IconLaurel size={24} />
            {selectedEvent ? 'Editar Sessão de Estudo' : 'Adicionar Sessão de Estudo'}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        
        <div className={styles.scrollArea}>
          {/* Single Session Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Sessão Única</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Título do Evento</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ex: História Geral: Roma Antiga"
                  required 
                />
              </div>

              <div className={styles.field}>
                <label>Tipo de Atividade</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="reading">Leitura / Pesquisa</option>
                  <option value="flashcards">Revisão / Prática</option>
                  <option value="video">Aula / Vídeo</option>
                  <option value="debate">Debate / Discussão</option>
                  <option value="writing">Escrita / Síntese</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Cor do Quadro</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)}
                      style={{ padding: 2, height: 40, width: 60, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: '#666' }}>{color}</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Cor da Fonte</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      style={{ padding: 2, height: 40, width: 60, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: '#666' }}>{textColor}</span>
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label>Anotações da Sessão</label>
                <RichTextEditor content={notesHtml} onChange={setNotesHtml} />
              </div>

              {!selectedEvent && (
                <div style={{ paddingBottom: 24, borderBottom: '1px solid #eee', marginBottom: 32 }}>
                  <button type="submit" className={styles.saveBtn} disabled={isSubmitting} style={{ backgroundColor: '#5c8da0' }}>
                    {isSubmitting ? 'Salvando...' : 'Adicionar Sessão Única'}
                  </button>
                </div>
              )}

              {selectedEvent && (
                <div className={styles.actions}>
                   <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>Salvar Alterações</button>
                   <button type="button" onClick={handleDelete} className={styles.cancelBtn} style={{ color: '#d9534f', borderColor: '#d9534f' }}>Excluir Sessão</button>
                </div>
              )}

              {selectedEvent?.extendedProps?.plan_id && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', gap: 12 }}>
                   <button type="button" onClick={handleFinishPlan} className={styles.cancelBtn} style={{ flex: 1, borderColor: 'var(--stone)', color: 'var(--stone)' }}>
                     🏁 Finalizar Plano
                   </button>
                   <button type="button" onClick={handleDeleteFullPlan} className={styles.cancelBtn} style={{ flex: 1, borderColor: '#d9534f', color: '#d9534f' }}>
                     🗑️ Excluir Plano Inteiro
                   </button>
                </div>
              )}
            </form>
          </div>

          {/* Plan Injector Section - Only shown when creating new */}
          {!selectedEvent && (
            <StudyPlanInjector 
              onSuccess={() => onSave(null)} 
              onCancel={onClose}
              topic={title}
              setTopic={setTitle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
