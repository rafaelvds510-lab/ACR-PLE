'use client';

// ═══════════════════════════════════════════════
//  GameContext — Contexto global de gamificação
//  Envolve o dashboard e fornece addXP a qualquer componente
// ═══════════════════════════════════════════════

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useGameStore, UseGameStore } from '@/hooks/useGameStore';
import { LevelDef } from '@/lib/gameEngine';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import XPFloat from '@/components/gamification/XPFloat';

// Tipo do contexto exposto
interface GameContextValue extends UseGameStore {
  // nada extra por agora — UseGameStore já tem tudo
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const store = useGameStore();

  // ── Level-up detection ───────────────────────
  const prevLevelRef = useRef(store.currentLevel.level);
  const [levelUpDef, setLevelUpDef] = useState<LevelDef | null>(null);

  useEffect(() => {
    const prev = prevLevelRef.current;
    const current = store.currentLevel.level;
    if (current > prev) {
      setLevelUpDef(store.currentLevel);
    }
    prevLevelRef.current = current;
  }, [store.currentLevel]);

  // ── XP Float ────────────────────────────────
  const [floatXP, setFloatXP] = useState(0);

  // Quando o lastXPGain muda, aciona o float
  const prevXPRef = useRef(store.lastXPGain);
  useEffect(() => {
    if (store.lastXPGain > 0 && store.lastXPGain !== prevXPRef.current) {
      setFloatXP(store.lastXPGain);
    }
    prevXPRef.current = store.lastXPGain;
  }, [store.lastXPGain]);

  // ── Daily streak ─────────────────────────────
  useEffect(() => {
    store.checkDailyStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFloatDone = useCallback(() => {
    setFloatXP(0);
    store.resetLastXP();
  }, [store]);

  return (
    <GameContext.Provider value={store}>
      {children}

      {/* Float XP text */}
      <XPFloat amount={floatXP} onDone={handleFloatDone} />

      {/* Level-up modal */}
      <LevelUpModal
        newLevel={levelUpDef}
        onClose={() => setLevelUpDef(null)}
      />
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
