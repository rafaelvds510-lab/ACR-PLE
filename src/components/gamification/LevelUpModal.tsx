'use client';

// ═══════════════════════════════════════════════
//  LevelUpModal — Celebração de Subida de Nível
// ═══════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion';
import GoldParticles from './GoldParticles';
import { LevelDef } from '@/lib/gameEngine';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  newLevel: LevelDef | null;
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  const isOpen = !!newLevel;

  return (
    <AnimatePresence>
      {isOpen && newLevel && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Partículas douradas */}
            <GoldParticles active={isOpen} />

            {/* Linha topo */}
            <div className={styles.topBar} />

            {/* Ícone */}
            <motion.div
              className={styles.iconWrap}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            >
              <span className={styles.levelIcon}>{newLevel.icon}</span>
            </motion.div>

            {/* Texto "Subida de Nível" */}
            <motion.p
              className={styles.eyebrow}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              ✦ SUBIDA DE NÍVEL ✦
            </motion.p>

            <motion.h2
              className={styles.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {newLevel.title}
            </motion.h2>

            <motion.p
              className={styles.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Nível {newLevel.level}: {newLevel.titlePt}
            </motion.p>

            <motion.p
              className={styles.desc}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {newLevel.description}
            </motion.p>

            {/* Recompensa */}
            <motion.div
              className={styles.reward}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className={styles.rewardLabel}>Recompensa Desbloqueada</div>
              <div className={styles.rewardName}>{newLevel.reward}</div>
              <div className={styles.rewardDesc}>{newLevel.rewardDesc}</div>
            </motion.div>

            <motion.button
              className={styles.btn}
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Que a jornada continue →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
