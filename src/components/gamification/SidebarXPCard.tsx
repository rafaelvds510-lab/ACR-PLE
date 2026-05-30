'use client';

// ═══════════════════════════════════════════════
//  SidebarXPCard — mini-card de progresso
//  Exibido no topo do footer da sidebar
// ═══════════════════════════════════════════════

import { useMemo } from 'react';
import { getLevelDef, getXPProgress, LEVELS } from '@/lib/gameEngine';
import { GameState } from '@/hooks/useGameStore';
import styles from './SidebarXPCard.module.css';

interface SidebarXPCardProps {
  state: GameState;
}

export default function SidebarXPCard({ state }: SidebarXPCardProps) {
  const lvl = useMemo(() => getLevelDef(state.totalXP), [state.totalXP]);
  const progress = useMemo(() => getXPProgress(state.totalXP), [state.totalXP]);
  const isMax = lvl.level === 5;

  return (
    <div className={styles.card}>
      {/* Linha decorativa topo */}
      <div className={styles.topLine} />

      {/* Nível + ícone */}
      <div className={styles.row}>
        <span className={styles.icon} title={lvl.title}>{lvl.icon}</span>
        <div className={styles.info}>
          <div className={styles.title}>{lvl.title}</div>
          <div className={styles.subtitle}>{lvl.titlePt}</div>
        </div>
        <div className={styles.xpBadge}>{state.totalXP.toLocaleString()} XP</div>
      </div>

      {/* Barra de progresso */}
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${progress.pct}%` }}
        />
        {!isMax && (
          <div
            className={styles.barGlow}
            style={{ left: `${progress.pct}%` }}
          />
        )}
      </div>

      {/* Labels de progresso */}
      {!isMax ? (
        <div className={styles.labels}>
          <span>{progress.current} / {progress.max} XP</span>
          <span className={styles.nextLevel}>
            Nv. {lvl.level + 1}: {LEVELS[lvl.level].title}
          </span>
        </div>
      ) : (
        <div className={styles.labels} style={{ justifyContent: 'center' }}>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>✦ Olimpo Atingido ✦</span>
        </div>
      )}

      {/* Streak */}
      {state.streakDays > 0 && (
        <div className={styles.streak}>
          🔥 {state.streakDays} dia{state.streakDays !== 1 ? 's' : ''} consecutivo{state.streakDays !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
