'use client';

// ═══════════════════════════════════════════════
//  BadgesDisplay — grade de conquistas heroicas
// ═══════════════════════════════════════════════

import { BADGES } from '@/lib/gameEngine';
import { GameState } from '@/hooks/useGameStore';
import styles from './BadgesDisplay.module.css';

interface BadgesDisplayProps {
  state: GameState;
}

export default function BadgesDisplay({ state }: BadgesDisplayProps) {
  return (
    <div className={styles.grid}>
      {BADGES.map(badge => {
        const earned = state.earnedBadgeIds.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}
            title={earned ? `✦ Conquistado!` : 'Ainda não conquistado'}
          >
            <div className={styles.iconWrap}>
              <span className={styles.icon}>{earned ? badge.icon : '🔒'}</span>
              {earned && <div className={styles.glow} />}
            </div>
            <div className={styles.name}>{badge.name}</div>
            <div className={styles.desc}>{badge.desc}</div>
            {earned && <div className={styles.earnedTag}>✦ Conquistado</div>}
          </div>
        );
      })}
    </div>
  );
}
