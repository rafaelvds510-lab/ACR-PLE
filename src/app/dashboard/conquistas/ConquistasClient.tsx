'use client';

// ═══════════════════════════════════════════════════
//  Conquistas — O Olimpo Digital v2.0
//  Sistema completo de XP, Badges e Trilha 1-1000 dias
// ═══════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import {
  LEVELS,
  BADGES,
  DAY_MILESTONES,
  MILESTONE_MAP,
  getXPProgress,
  RARITY_COLORS,
} from '@/lib/gameEngine';
import styles from './conquistas.module.css';

const CATEGORIES = [
  { id: 'all',        label: 'Todos' },
  { id: 'days',       label: '📅 Dias' },
  { id: 'streak',     label: '🔥 Sequência' },
  { id: 'flashcards', label: '🃏 Flashcards' },
  { id: 'maps',       label: '🗺️ Mapas' },
  { id: 'writing',    label: '✍️ Escrita' },
  { id: 'debate',     label: '💬 Debate' },
  { id: 'xp',         label: '⚡ XP' },
  { id: 'special',    label: '🏅 Especial' },
];

export default function ConquistasClient() {
  const { state, currentLevel } = useGame();
  const progress = useMemo(() => getXPProgress(state.totalXP), [state.totalXP]);
  const isMax = currentLevel.level === 10;
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  const totalDays = state.totalDaysStudied ?? 0;
  const earnedIds = new Set(state.earnedBadgeIds);

  const filteredBadges = BADGES.filter(b => {
    if (categoryFilter === 'all') return true;
    return b.category === categoryFilter;
  });

  const earnedCount = BADGES.filter(b => earnedIds.has(b.id)).length;
  const legendaryCount = BADGES.filter(b => b.rarity === 'legendary' && earnedIds.has(b.id)).length;

  const sendEmail = async () => {
    setIsSending(true);
    try {
      const recsRes = await fetch('/api/recommendations');
      const recsData = await recsRes.json();
      const nextSteps = (recsData.recommendations || []).slice(0, 3).map((r: any) => ({
        title: r.title, subtitle: r.subtitle, actionUrl: r.actionUrl
      }));
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState: state, nextSteps })
      });
      const data = await res.json();
      setEmailMsg(data.success ? 'Relatório enviado! Verifique seu e-mail.' : 'Falha ao enviar relatório.');
    } catch {
      setEmailMsg('Erro de conexão.');
    }
    setIsSending(false);
    setTimeout(() => setEmailMsg(''), 5000);
  };

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.heroSection}>
        <div className={styles.heroOrn}>✦ ✦ ✦</div>
        <h1 className={styles.heroTitle}>O Olimpo</h1>
        <p className={styles.heroSub}>Sua jornada rumo à excelência — da tábula rasa à Luz de Atena</p>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button onClick={sendEmail} disabled={isSending} className={styles.reportBtn}>
            {isSending ? 'Enviando...' : '✉️ RECEBER RELATÓRIO SEMANAL'}
          </button>
          {emailMsg && <span className={styles.emailMsg}>{emailMsg}</span>}
        </div>
      </div>

      {/* ── Nível Atual ── */}
      <div className={styles.levelCard}>
        <div className={styles.levelTopLine} />
        <div className={styles.levelInner}>
          <div className={styles.levelIconWrap}>
            <span className={styles.levelIcon}>{currentLevel.icon}</span>
          </div>

          <div className={styles.levelInfo}>
            <div className={styles.levelBadge}>
              Nível {currentLevel.level} · {currentLevel.days} dias
            </div>
            <h2 className={styles.levelTitle}>{currentLevel.title}</h2>
            <p className={styles.levelTitlePt}>{currentLevel.titlePt}</p>
            <p className={styles.levelDesc}>{currentLevel.description}</p>
            <div className={styles.levelChallenge}>
              <strong>Desafio:</strong> {currentLevel.challenge}
            </div>
            <div className={styles.rewardBox}>
              <span className={styles.rewardLabel}>⚔️ Recompensa</span>
              <span className={styles.rewardName}>{currentLevel.reward}</span>
              <span className={styles.rewardDesc}>{currentLevel.rewardDesc}</span>
            </div>
          </div>

          {/* XP + Streak */}
          <div className={styles.xpColumn}>
            <div className={styles.xpTotal}>{state.totalXP.toLocaleString()}</div>
            <div className={styles.xpLabel}>XP Total</div>

            {!isMax && (
              <>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${progress.pct}%` }} />
                </div>
                <div className={styles.xpSub}>
                  {progress.current.toLocaleString()} / {progress.max.toLocaleString()} XP para {LEVELS[currentLevel.level]?.title}
                </div>
              </>
            )}
            {isMax && (
              <div className={styles.xpSub} style={{ color: 'var(--gold)' }}>✦ Nível Máximo Atingido</div>
            )}

            {state.streakDays > 0 && (
              <div className={styles.streakCard}>
                <span className={styles.streakFire}>🔥</span>
                <div>
                  <div className={styles.streakNum}>{state.streakDays}</div>
                  <div className={styles.streakLabel}>dia{state.streakDays !== 1 ? 's' : ''} consecutivo{state.streakDays !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}

            {/* Total dias */}
            <div className={styles.streakCard} style={{ marginTop: 4 }}>
              <span className={styles.streakFire}>📅</span>
              <div>
                <div className={styles.streakNum}>{totalDays}</div>
                <div className={styles.streakLabel}>dias estudados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trilha de Níveis ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trilha do Olimpo</h2>
        <p className={styles.sectionSub}>10 estágios de crescimento — de Aprendiz a Sábio</p>
        <div className={styles.levelsTrack}>
          {LEVELS.map((lvl, i) => {
            const reached = state.totalXP >= lvl.minXP;
            const isCurrent = lvl.level === currentLevel.level;
            return (
              <div key={lvl.level}
                className={`${styles.trackItem} ${reached ? styles.trackReached : ''} ${isCurrent ? styles.trackCurrent : ''}`}
              >
                <div className={styles.trackIcon}>{lvl.icon}</div>
                <div className={styles.trackTitle}>{lvl.title}</div>
                <div className={styles.trackSub}>{lvl.titlePt}</div>
                <div className={styles.trackXP}>{lvl.minXP.toLocaleString()} XP</div>
                <div style={{ fontSize: 10, color: 'var(--stone)', fontFamily: 'Inter, system-ui', marginTop: 4 }}>
                  {lvl.days}d
                </div>
                {i < LEVELS.length - 1 && (
                  <div className={`${styles.trackConnector} ${reached ? styles.connectorActive : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Trilha de Marcos 1-1000 dias ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Marcos da Jornada — 1 a 1.000 Dias</h2>
        <p className={styles.sectionSub}>
          {totalDays} / 1.000 dias · {Math.round((totalDays / 1000) * 100)}% da jornada completa
        </p>

        {/* Barra global de progresso */}
        <div className={styles.barTrack} style={{ marginBottom: 24 }}>
          <div className={styles.barFill} style={{ width: `${Math.min(100, (totalDays / 1000) * 100)}%` }} />
        </div>

        <div className={styles.milestoneTrack}>
          {DAY_MILESTONES.map((day, i) => {
            const info = MILESTONE_MAP[day];
            const reached = totalDays >= day;
            const isCurrent = !reached && (i === 0 || totalDays >= DAY_MILESTONES[i - 1]);
            const nextActive = i < DAY_MILESTONES.length - 1;
            return (
              <div key={day}
                className={`${styles.milestoneItem} ${reached ? styles.milestoneReached : ''} ${isCurrent ? styles.milestoneCurrent : ''}`}
                title={`${info.label} — +${info.xpBonus.toLocaleString()} XP`}
              >
                <div className={styles.milestoneDot}>
                  {reached ? info.icon : day}
                </div>
                <div className={styles.milestoneLabel}>Dia {day}</div>
                <div style={{ fontSize: 9, color: 'var(--stone)', fontFamily: 'Inter, system-ui', textAlign: 'center' }}>
                  +{info.xpBonus.toLocaleString()} XP
                </div>
                {nextActive && (
                  <div className={`${styles.milestoneConnector} ${reached ? styles.milestoneConnectorActive : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Badges ── */}
      <section className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 4 }}>Marcos Heroicos</h2>
            <p className={styles.sectionSub} style={{ marginTop: 0 }}>
              {earnedCount} / {BADGES.length} conquistas · {legendaryCount} lendárias 🏅
            </p>
          </div>
        </div>

        {/* Filtros por categoria */}
        <div className={styles.badgeTabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`${styles.badgeTab} ${categoryFilter === cat.id ? styles.badgeTabActive : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.badgesGrid}>
          {filteredBadges.map(badge => {
            const earned = earnedIds.has(badge.id);
            const rarity = RARITY_COLORS[badge.rarity];
            return (
              <div
                key={badge.id}
                className={`${styles.badgeCard} ${earned ? styles.badgeCardEarned : styles.badgeCardLocked}`}
                style={{ borderColor: earned ? rarity.text + '44' : undefined }}
              >
                <div
                  className={styles.badgeIconWrap}
                  style={{ background: earned ? rarity.bg : 'var(--marble-deep)' }}
                >
                  <span className={styles.badgeIcon} style={{ filter: earned ? 'none' : 'grayscale(1) opacity(0.4)' }}>
                    {badge.icon}
                  </span>
                </div>
                <div className={styles.badgeInfo}>
                  <div className={styles.badgeRarity} style={{ color: earned ? rarity.text : 'var(--stone-medium)' }}>
                    {rarity.label}
                  </div>
                  <div className={styles.badgeName} style={{ color: earned ? 'var(--ink)' : 'var(--stone)' }}>
                    {badge.name}
                  </div>
                  <div className={styles.badgeDesc}>{badge.desc}</div>
                </div>
                <div className={styles.badgeCheck} style={{ color: earned ? rarity.text : 'var(--marble-deep)' }}>
                  {earned ? '✓' : '○'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Estatísticas ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tábua de Feitos</h2>
        <div className={styles.statsGrid}>
          {[
            { label: 'XP Total',             value: state.totalXP.toLocaleString() },
            { label: 'Dias Estudados',        value: totalDays },
            { label: 'Dias Consecutivos',     value: state.streakDays },
            { label: 'Flashcards Criados',    value: state.totalFlashcardsCreated.toLocaleString() },
            { label: 'Flashcards Revisados',  value: (state.totalFlashcardsReviewed ?? 0).toLocaleString() },
            { label: 'Mapas Mentais',         value: state.totalMapsCreated },
            { label: 'Textos Escritos',       value: state.totalWritings ?? 0 },
            { label: 'Pomodoros',             value: state.totalPomodoros ?? 0 },
            { label: 'Livros Concluídos',     value: state.totalBooksFinished ?? 0 },
            { label: 'Debates',               value: state.totalDebateArgs ?? 0 },
            { label: 'Nível Atual',           value: currentLevel.level },
            { label: 'Badges Conquistados',   value: earnedCount },
          ].map(({ label, value }) => (
            <div key={label} className={styles.statItem}>
              <div className={styles.statNum}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
