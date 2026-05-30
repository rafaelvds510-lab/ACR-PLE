'use client';

import React, { useState, useRef } from 'react';
import styles from './EventModal.module.css';
import { IconLaurel, IconChartBar, IconCalendar, IconFlame } from '@/components/icons/AcropoleIcons';

interface StudyPlanInjectorProps {
  onSuccess: () => void;
  onCancel: () => void;
  topic: string;
  setTopic: (v: string) => void;
}

interface ParsedDay {
  title: string;
  content: string;
}

export default function StudyPlanInjector({ onSuccess, onCancel, topic, setTopic }: StudyPlanInjectorProps) {
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [totalDays, setTotalDays] = useState(21);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#346a8a');
  const [studyWeekends, setStudyWeekends] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        setIsInjecting(true);
        const pdfjs = await import('pdfjs-dist');
        // Usando o worker local para garantir compatibilidade com Turbopack
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        setContent(fullText);
      } catch (error) {
        console.error('PDF parsing error:', error);
        alert('Erro ao processar PDF. Por favor, cole o texto do plano manualmente no campo abaixo para prosseguir com a injeção.');
      } finally {
        setIsInjecting(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const parseContent = (text: string, days: number): ParsedDay[] => {
    // Regex para capturar padrões como "Dia 01", "Dia 1", "Dia 1:", etc.
    const dayRegex = /(?:Dia|Sessão|Módulo|Semana)\s*(\d+)[:\s-]*(.*)/gi;
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const result: ParsedDay[] = [];
    let currentDay: ParsedDay | null = null;

    for (const line of lines) {
      const match = dayRegex.exec(line);
      if (match) {
        if (currentDay) result.push(currentDay);
        currentDay = {
          title: match[2].trim() || `Sessão ${match[1]}`,
          content: ''
        };
      } else if (currentDay) {
        currentDay.content += line + '\n';
      }
      dayRegex.lastIndex = 0;
    }
    if (currentDay) result.push(currentDay);

    if (result.length === 0) {
      const blockSize = Math.ceil(lines.length / days);
      for (let i = 0; i < days; i++) {
        const blockLines = lines.slice(i * blockSize, (i + 1) * blockSize);
        result.push({
          title: blockLines[0]?.substring(0, 40) || `Sessão ${i + 1}`,
          content: blockLines.join('\n')
        });
      }
    }
    return result;
  };

  const handleInject = async () => {
    if (!topic || !content) {
      alert('Defina o Eixo Temático e forneça o conteúdo do plano.');
      return;
    }

    setIsInjecting(true);
    const parsedBlocks = parseContent(content, totalDays);
    const newEvents = [];
    const planId = crypto.randomUUID(); // Identificador único para o plano completo
    
    // Normalização da data de início para 09:00 local
    const dateParts = startDate.split('-');
    let currentDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]), 9, 0, 0);

    // Garante que o número de dias solicitado seja preenchido
    for (let i = 0; i < totalDays; i++) {
      if (!studyWeekends) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0) currentDate.setDate(currentDate.getDate() + 1);
        else if (dayOfWeek === 6) currentDate.setDate(currentDate.getDate() + 2);
      }

      // Cicla pelos blocos parseados se houver menos blocos que dias
      const block = parsedBlocks[i % parsedBlocks.length] || { title: `Sessão ${i + 1}`, content: 'Estudo programado' };
      const endTime = new Date(currentDate);
      endTime.setHours(currentDate.getHours() + hoursPerDay);

      newEvents.push({
        title: `${topic}: ${block.title}`,
        type: 'reading',
        start_time: currentDate.toISOString(),
        end_time: endTime.toISOString(),
        is_all_day: false,
        notes_html: `<p>${block.content.replace(/\n/g, '<br>') || 'Sem detalhes adicionais'}</p>`,
        concluida: false,
        color,
        text_color: '#ffffff',
        plan_id: planId,
        plan_name: topic
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    try {
      const res = await fetch('/api/events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: newEvents })
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('Erro na comunicação com o Oráculo para injeção.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Injetor de Planos (Oráculo)</h3>
      
      <div className={styles.field}>
        <label>Eixo Temático</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: 12 }}>
             <IconLaurel size={16} color="#bbb" />
          </div>
          <input 
            type="text" 
            placeholder="Ex: Oratória, Filosofia, Programação" 
            style={{ paddingLeft: 40 }}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Vigor (h/dia)</label>
          <input 
            type="number" 
            value={hoursPerDay} 
            onChange={(e) => setHoursPerDay(Number(e.target.value))} 
          />
        </div>
        <div className={styles.field}>
          <label>Ciclo (dias)</label>
          <input 
            type="number" 
            value={totalDays} 
            onChange={(e) => setTotalDays(Number(e.target.value))} 
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Marco Inicial</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={{ backgroundColor: '#f2a38c22', borderColor: '#f2a38c' }}
          />
        </div>
        <div className={styles.field}>
           <div className={styles.toggleRow} style={{ marginTop: 22 }}>
              <span className={styles.toggleLabel}>Incessante (Finais de Semana)</span>
              <div 
                className={`${styles.toggle} ${studyWeekends ? styles.toggleActive : ''}`}
                onClick={() => setStudyWeekends(!studyWeekends)}
              >
                <div className={styles.toggleThumb} />
              </div>
           </div>
        </div>
      </div>

      <div className={styles.field}>
        <label>Cor do Plano na Agenda</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            style={{ padding: 2, height: 40, width: 80, cursor: 'pointer', border: '1px solid #e0d9d0', borderRadius: 8 }}
          />
          <span style={{ fontSize: 13, color: '#666', fontWeight: 700 }}>{color}</span>
        </div>
      </div>

      <div className={styles.field}>
        <label>Roteiro do Plano / PDF</label>
        <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
          <IconChartBar size={20} color="#346a8a" />
          <p>Clique para subir PDF/TXT ou arraste o arquivo</p>
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} />
        </div>
        <textarea 
          placeholder="O texto extraído do plano aparecerá aqui para sua revisão..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 120 }}
        />
      </div>

      <div className={styles.actions} style={{ padding: '16px 0', border: 'none', backgroundColor: 'transparent' }}>
        <button onClick={handleInject} className={styles.saveBtn} disabled={isInjecting}>
          {isInjecting ? 'Processando...' : 'Gerar e Injetar Plano'}
        </button>
        <button onClick={onCancel} className={styles.cancelBtn}>Cancelar</button>
      </div>

      {isInjecting && (
        <div className={styles.loadingOverlay}>
          <IconFlame size={40} color="#346a8a" className="animate-pulse" />
          <p style={{ marginTop: 12, fontWeight: 700, color: '#346a8a' }}>Forjando Estratégia...</p>
        </div>
      )}
    </div>
  );
}
