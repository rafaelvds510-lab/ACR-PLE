'use client';

// ═══════════════════════════════════════════════
//  Dashboard Home — A Ágora Pessoal
//  Layout completo com Oráculo + stats rápidas
// ═══════════════════════════════════════════════

import { useGame } from '@/lib/GameContext';
import { getXPProgress } from '@/lib/gameEngine';
import AIRecommendations from '@/components/dashboard/AIRecommendations';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './home.module.css';

interface Props {
  docCount: number;
  deckCount: number;
  todayEvents: any[];
  upcomingEvents: any[];
}

export default function DashboardHomeClient({ docCount, deckCount, todayEvents, upcomingEvents }: Props) {
  const { state, currentLevel } = useGame();
  const progress = useMemo(() => getXPProgress(state.totalXP), [state.totalXP]);
  const router = useRouter();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' :
    hour < 18 ? 'Boa tarde' :
    'Boa noite';

  const [plans, setPlans] = useState<any[]>([]);
  const [localEvents, setLocalEvents] = useState(todayEvents);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const res = await fetch('/api/plans');
    if (res.ok) setPlans(await res.json());
  };

  const handleToggleEvent = async (eventId: string, currentStatus: boolean) => {
    // Optimistic update
    setLocalEvents(prev => prev.map(e => e.id === eventId ? { ...e, concluida: !currentStatus } : e));
    
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: !currentStatus })
      });
      if (res.ok) fetchPlans();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Excluir plano e limpar agenda?')) return;
    const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
    if (res.ok) fetchPlans();
  };

  const handleFinishPlan = async (planId: string) => {
    if (!confirm('Finalizar plano agora? Isso excluirá as sessões futuras não concluídas.')) return;
    const res = await fetch(`/api/plans/${planId}`, { method: 'PATCH' });
    if (res.ok) fetchPlans();
  };

  return (
    <div className={styles.page}>

      {/* ── Cabeçalho pessoal ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>A Ágora Pessoal</h1>
          <p className={styles.pageSub}>
            {greeting}, <span className={styles.levelName}>{currentLevel.icon} {currentLevel.title}</span>.
            {' '}Onde seu conhecimento é cultivado.
          </p>
        </div>
        <div className={styles.streakBadge}>
          {state.streakDays > 0 ? (
            <>🔥 <strong>{state.streakDays}</strong> dia{state.streakDays !== 1 ? 's' : ''}</>
          ) : (
            <>✦ Comece hoje</>
          )}
        </div>
      </div>

      {/* ── Layout principal: 2 colunas ── */}
      <div className={styles.layout}>

        {/* Coluna principal */}
        <div className={styles.mainCol}>

          {/* Oráculo — Recomendações IA */}
          <AIRecommendations />

          <div className={styles.todaySection}>
            <h2 className={styles.sectionTitle}>Sua Jornada de Hoje</h2>
            <div className={styles.eventGrid}>
              <div className={styles.eventList}>
                <h3 className={styles.eventListSubtitle}>Hoje</h3>
                {localEvents.length > 0 ? (
                  localEvents.map(event => (
                    <div key={event.id} className={`${styles.eventCard} ${event.concluida ? styles.eventDone : ''}`} style={{ borderLeftColor: event.color || 'var(--accent)' }}>
                      <button 
                        className={styles.eventCheck} 
                        onClick={() => handleToggleEvent(event.id, !!event.concluida)}
                      >
                        {event.concluida ? '✓' : ''}
                      </button>
                      <div className={styles.eventTime}>
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={styles.eventInfo}>
                        <div className={styles.eventTitle} style={{ color: event.color || 'inherit' }}>{event.title}</div>
                        {event.description && <div className={styles.eventDesc}>{event.description}</div>}
                      </div>
                      <div className={styles.eventBadge}>{event.type}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noEvents}>
                    <p>Nenhum estudo agendado para hoje.</p>
                  </div>
                )}
              </div>

              <div className={styles.eventList}>
                <h3 className={styles.eventListSubtitle}>Planos Ativos</h3>
                <div className={styles.plansContainer}>
                  {plans.length > 0 ? (
                    plans.map(plan => (
                      <div key={plan.id} className={styles.planTrackerCard}>
                        <div className={styles.planHeader}>
                          <span className={styles.planName}>{plan.name}</span>
                          <div className={styles.planActions}>
                            <button onClick={() => handleFinishPlan(plan.id)} title="Finalizar Plano">🏁</button>
                            <button onClick={() => handleDeletePlan(plan.id)} title="Excluir Plano">🗑️</button>
                          </div>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div 
                            className={styles.progressBarFill} 
                            style={{ width: `${(plan.completed / plan.total) * 100}%`, backgroundColor: plan.color }} 
                          />
                        </div>
                        <div className={styles.planStats}>
                          {plan.completed} / {plan.total} sessões ({Math.round((plan.completed / plan.total) * 100)}%)
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noPlans}>Nenhum plano de estudo em progresso.</p>
                  )}
                </div>
              </div>
            </div>
            {todayEvents.length === 0 && upcomingEvents.length === 0 && (
              <button className={styles.linkBtn} onClick={() => router.push('/dashboard/agenda')}>
                Agendar agora na Agenda →
              </button>
            )}
          </div>

          {/* Stats rápidas */}
          <div className={styles.statsRow}>
            {[
              { icon: '📜', value: docCount, label: 'Pergaminhos', url: '/dashboard/biblioteca' },
              { icon: '🃏', value: deckCount, label: 'Baralhos', url: '/dashboard/revisao' },
              { icon: '⚡', value: state.totalXP, label: 'XP Total', url: '/dashboard/conquistas' },
              { icon: '🏅', value: state.earnedBadgeIds.length, label: 'Badges', url: '/dashboard/conquistas' },
            ].map(stat => (
              <button
                key={stat.label}
                className={styles.statCard}
                onClick={() => router.push(stat.url)}
              >
                <span className={styles.statIcon}>{stat.icon}</span>
                <span className={styles.statNum}>{stat.value.toLocaleString()}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna lateral — Progresso de nível */}
        <div className={styles.sideCol}>
          <div className={styles.levelWidget}>
            <div className={styles.lwTopLine} />
            <div className={styles.lwHeader}>
              <span className={styles.lwIcon}>{currentLevel.icon}</span>
              <div>
                <div className={styles.lwTitle}>{currentLevel.title}</div>
                <div className={styles.lwSub}>{currentLevel.titlePt}</div>
              </div>
            </div>

            <div className={styles.lwXP}>
              <span className={styles.lwXPNum}>{state.totalXP.toLocaleString()}</span>
              <span className={styles.lwXPLabel}> XP</span>
            </div>

            <div className={styles.lwBarTrack}>
              <div className={styles.lwBarFill} style={{ width: `${progress.pct}%` }} />
            </div>
            <div className={styles.lwBarLabels}>
              <span>{progress.pct}%</span>
              {currentLevel.level < 5 && (
                <span style={{ fontStyle: 'italic', color: 'var(--stone)' }}>
                  próx: {progress.max - progress.current} XP
                </span>
              )}
            </div>

            <div className={styles.lwChallenge}>
              <div className={styles.lwChallengeLabel}>Desafio Atual</div>
              <div className={styles.lwChallengeText}>{currentLevel.challenge}</div>
            </div>

            <button
              className={styles.lwBtn}
              onClick={() => router.push('/dashboard/conquistas')}
            >
              Ver Olimpo Completo →
            </button>
          </div>

          {/* Próximos Passos */}
          {(docCount === 0 || deckCount === 0) && (
            <div className={styles.onboardingWidget}>
              <div className={styles.onboardingTitle}>Próximos Passos</div>
              <div className={styles.onboardingList}>
                {[
                  { done: docCount > 0, label: 'Faça upload de um PDF ou artigo', url: '/dashboard/biblioteca' },
                  { done: deckCount > 0, label: 'Crie seu primeiro baralho de flashcards', url: '/dashboard/revisao' },
                  { done: state.totalXP > 0, label: 'Ganhe seu primeiro XP', url: '/dashboard/revisao' },
                ].map(step => (
                  <button
                    key={step.label}
                    className={`${styles.onboardingStep} ${step.done ? styles.stepDone : ''}`}
                    onClick={() => !step.done && router.push(step.url)}
                    disabled={step.done}
                  >
                    <span className={styles.stepDot}>{step.done ? '✓' : '○'}</span>
                    <span>{step.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
