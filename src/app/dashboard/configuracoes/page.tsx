'use client';

import React, { useState, useEffect } from 'react';
import styles from './configuracoes.module.css';
import { IconSettings, IconBell, IconMail, IconChartBar } from '@/components/icons/AcropoleIcons';

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState({
    push_notifications_enabled: false,
    daily_summary_email_enabled: false,
    weekly_report_enabled: false,
    reading_progress_enabled: false,
    summary_email_time: '08:00:00'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notifications/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Configurações salvas com sucesso!' });
      } else {
        const errData = await res.json();
        setStatus({ type: 'error', message: `Erro ao salvar: ${errData.error || 'Erro desconhecido'}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Erro de conexão ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTestEmail = async () => {
    setStatus({ type: 'success', message: 'Solicitando envio de e-mail de teste...' });
    try {
      // Usamos o endpoint de relatório existente para o teste
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameState: { totalXP: 1250, streakDays: 5, totalFlashcardsCreated: 12, totalMapsCreated: 3 },
          nextSteps: ['Revisar Cartas de Platão', 'Terminar leitura de Ética a Nicômaco']
        })
      });
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'E-mail de teste enviado com sucesso para rafaelvds510@gmail.com!' });
      } else {
        setStatus({ type: 'error', message: 'Falha ao enviar e-mail de teste. Verifique se a API Key do Resend está configurada.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Erro ao tentar enviar e-mail de teste.' });
    }
  };

  if (isLoading) return <div className={styles.container}>Carregando configurações...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configurações do Oráculo</h1>
      <p className={styles.subtitle}>Ajuste como o Oráculo deve se comunicar com você.</p>

      {status && (
        <div className={`${styles.statusMsg} ${styles[status.type]}`}>
          {status.message}
        </div>
      )}

      {/* Seção de Notificações */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <IconBell size={20} color="var(--gold)" /> Notificações Push
        </h2>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Alertas do Navegador</span>
            <span className={styles.settingDesc}>Receba lembretes de estudo e badges conquistadas diretamente no desktop.</span>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={settings.push_notifications_enabled} 
              onChange={() => toggleSetting('push_notifications_enabled')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Seção de E-mail */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <IconMail size={20} color="var(--gold)" /> Comunicação por E-mail
        </h2>
        
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Cronograma Semanal</span>
            <span className={styles.settingDesc}>Receba toda segunda-feira seu plano de estudos para a semana.</span>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={settings.weekly_report_enabled} 
              onChange={() => toggleSetting('weekly_report_enabled')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Progresso de Leitura</span>
            <span className={styles.settingDesc}>Relatório de páginas lidas e livros em andamento.</span>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={settings.reading_progress_enabled} 
              onChange={() => toggleSetting('reading_progress_enabled')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Resumo Diário</span>
            <span className={styles.settingDesc}>Um breve resumo das metas batidas no dia anterior.</span>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={settings.daily_summary_email_enabled} 
              onChange={() => toggleSetting('daily_summary_email_enabled')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingRow} style={{ marginTop: '20px', borderBottom: 'none' }}>
          <button className={styles.saveBtn} onClick={handleTestEmail} style={{ background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)' }}>
            Enviar E-mail de Teste
          </button>
        </div>
      </div>

      <div className={styles.saveSection}>
        <button 
          className={styles.saveBtn} 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
