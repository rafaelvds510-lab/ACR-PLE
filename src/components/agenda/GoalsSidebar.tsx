'use client';

import React, { useState, useEffect } from 'react';
import styles from './GoalsSidebar.module.css';
import { useRouter } from 'next/navigation';

interface GoalsSidebarProps {
  userId: string;
}

export default function GoalsSidebar({ userId }: GoalsSidebarProps) {
  const [goals, setGoals] = useState({
    hours: { current: 0, target: 0 },
    flashcards: { current: 0, target: 0 },
    pages: { current: 0, target: 0 }
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/stats/goals');
      if (res.ok) {
        const data = await res.json();
        if (data.goals) {
          setGoals(data.goals);
        }
      }
    } catch (e) {
      console.error('Failed to fetch goals', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const res = await fetch(`/api/events?start=${today.toISOString()}`); // Reuse existing API with filter if possible
      if (res.ok) {
        const data = await res.json();
        // Filtrar apenas futuros e limitar a 5
        const future = data
          .filter((e: any) => new Date(e.start_time) >= today)
          .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          .slice(0, 5);
        setUpcomingEvents(future);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchUpcoming();
  }, []);

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  if (loading) {
    return (
      <aside className={styles.sidebar}>
        <h2 className={styles.title}>Metas da Semana</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--stone)', textAlign: 'center' }}>Carregando metas...</p>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Metas da Semana</h2>
      
      <div className={styles.goalGroup}>
        <div className={styles.goalHeader}>
          <span className={styles.goalLabel}>Horas de Estudo</span>
          <span className={styles.goalValues}>{goals.hours.current} / {goals.hours.target}h</span>
        </div>
        <div className={styles.progressBarBg}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${calculateProgress(goals.hours.current, goals.hours.target)}%`, backgroundColor: 'var(--neon-accent)' }}
          />
        </div>
      </div>

      <div className={styles.goalGroup}>
        <div className={styles.goalHeader}>
          <span className={styles.goalLabel}>Flashcards Revisados</span>
          <span className={styles.goalValues}>{goals.flashcards.current} / {goals.flashcards.target}</span>
        </div>
        <div className={styles.progressBarBg}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${calculateProgress(goals.flashcards.current, goals.flashcards.target)}%`, backgroundColor: 'var(--neon-green)' }}
          />
        </div>
      </div>

      <div className={styles.goalGroup}>
        <div className={styles.goalHeader}>
          <span className={styles.goalLabel}>Páginas Lidas</span>
          <span className={styles.goalValues}>{goals.pages.current} / {goals.pages.target}</span>
        </div>
        <div className={styles.progressBarBg}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${calculateProgress(goals.pages.current, goals.pages.target)}%`, backgroundColor: 'var(--neon-purple)' }}
          />
        </div>
      </div>
      <div className={styles.sectionDivider} />

      <h2 className={styles.title}>Próximas Sessões</h2>
      <div className={styles.eventList}>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <div key={event.id} className={styles.eventMiniCard}>
               <div className={styles.eventMiniDate}>
                 {new Date(event.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
               </div>
               <div className={styles.eventMiniInfo}>
                 <div className={styles.eventMiniTitle}>{event.title}</div>
                 <div className={styles.eventMiniTime}>
                   {new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                 </div>
               </div>
            </div>
          ))
        ) : (
          <p className={styles.noEvents}>Nenhuma sessão próxima.</p>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 20 }}>
        <button 
          className={styles.resetBtn}
          onClick={() => router.push('/dashboard/clear-agenda')}
        >
          🗑️ Resetar Agenda (Debug)
        </button>
      </div>
    </aside>
  );
}
