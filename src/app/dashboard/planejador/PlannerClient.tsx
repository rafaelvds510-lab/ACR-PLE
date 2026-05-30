'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './planner.module.css';

type Step = 'source' | 'config' | 'preview';

export default function PlannerClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('source');
  const [method, setMethod] = useState<'create' | 'extract'>('create');
  const [topic, setTopic] = useState('');
  const [days, setDays] = useState(21);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceText, setReferenceText] = useState('');
  const [fileData, setFileData] = useState<{ data: string; mimeType: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFileData({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    setPreviewEvents([]);
    try {
      const res = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          hoursPerDay,
          days,
          startDate,
          method: method === 'extract' ? 'flight_plan' : 'flight_plan', // Backend handles logic based on fileData/referenceText
          referenceText,
          fileData,
          previewOnly: true // Custom flag for V2
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.events) {
          setPreviewEvents(data.events);
          setStep('preview');
        } else {
          alert('IA não conseguiu extrair dados. Tente colar o texto manualmente.');
        }
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error || 'Falha na IA'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão.');
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmPlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/study-plan/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: previewEvents })
      });
      if (res.ok) {
        router.push('/dashboard/agenda');
      }
    } catch (error) {
      alert('Erro ao salvar plano.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Planejador de Estudos IA <span className={styles.v2}>V2</span></h1>
        <div className={styles.stepper}>
          <div className={`${styles.stepIndicator} ${step === 'source' ? styles.active : ''}`}>1. Fonte</div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepIndicator} ${step === 'config' ? styles.active : ''}`}>2. Ajustes</div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepIndicator} ${step === 'preview' ? styles.active : ''}`}>3. Revisão</div>
        </div>
      </header>

      <main className={styles.content}>
        {step === 'source' && (
          <div className={styles.stepCard}>
            <h2 className={styles.cardTitle}>Como vamos começar?</h2>
            <div className={styles.sourceGrid}>
              <button 
                className={`${styles.sourceBtn} ${method === 'create' ? styles.sourceActive : ''}`}
                onClick={() => setMethod('create')}
              >
                <span className={styles.sourceIcon}>🧠</span>
                <h3>IA Criativa</h3>
                <p>Eu dou o tema e a IA cria o cronograma do zero.</p>
              </button>
              <button 
                className={`${styles.sourceBtn} ${method === 'extract' ? styles.sourceActive : ''}`}
                onClick={() => setMethod('extract')}
              >
                <span className={styles.sourceIcon}>📄</span>
                <h3>Extrair de Material</h3>
                <p>Vou colar um edital, texto ou PDF para a IA organizar.</p>
              </button>
            </div>

            {method === 'extract' && (
              <div className={styles.extractFields}>
                <textarea 
                  placeholder="Cole aqui seu cronograma, lista de tópicos ou edital..."
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  className={styles.textarea}
                />
                <div className={styles.fileBox}>
                  <label>Ou anexe um PDF/TXT:</label>
                  <input type="file" onChange={handleFileChange} accept=".pdf,.txt" />
                </div>
              </div>
            )}

            {method === 'create' && (
              <input 
                type="text" 
                placeholder="Qual tema você deseja dominar?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={styles.textInput}
              />
            )}

            <button 
              className={styles.nextBtn}
              disabled={(!topic && method === 'create') || (!referenceText && !fileData && method === 'extract')}
              onClick={() => setStep('config')}
            >
              Próximo Passo →
            </button>
          </div>
        )}

        {step === 'config' && (
          <div className={styles.stepCard}>
            <h2 className={styles.cardTitle}>Refinando seu Cronograma</h2>
            <div className={styles.configGrid}>
              <div className={styles.field}>
                <label>Duração (Dias)</label>
                <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min={1} max={90} />
              </div>
              <div className={styles.field}>
                <label>Horas por Dia</label>
                <input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} min={1} max={24} />
              </div>
              <div className={styles.field}>
                <label>Data de Início</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setStep('source')}>Voltar</button>
              <button className={styles.generateBtn} onClick={generatePlan} disabled={isGenerating}>
                {isGenerating ? 'IA Processando...' : 'Gerar Rascunho para Revisão'}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className={styles.stepCard}>
            <h2 className={styles.cardTitle}>Revisão Final ({previewEvents.length} dias)</h2>
            <p className={styles.previewSub}>Analise se os tópicos estão corretos antes de salvar na sua Agenda.</p>
            
            <div className={styles.previewList}>
              {previewEvents.map((ev, i) => (
                <div key={i} className={styles.previewItem}>
                  <div className={styles.previewDay}>Dia {i + 1}</div>
                  <div className={styles.previewInfo}>
                    <h4>{ev.title}</h4>
                    <p>{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setStep('config')}>Ajustar</button>
              <button className={styles.confirmBtn} onClick={confirmPlan} disabled={isGenerating}>
                {isGenerating ? 'Salvando...' : 'Confirmar e Ir para Agenda'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
