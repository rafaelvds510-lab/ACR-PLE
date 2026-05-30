'use client';

// ═══════════════════════════════════════════════
//  Acrópole — useGameStore v2.0
//  Estado de gamificação persistido em localStorage
//  Suporte a 30+ badges e stats expandidos
// ═══════════════════════════════════════════════

import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  XP_ACTIONS,
  XPAction,
  GameStats,
  BadgeDef,
  getLevelDef,
  getNewBadges,
  LevelDef,
} from '@/lib/gameEngine';

// ── Tipos ────────────────────────────────────────
export interface GameState extends GameStats {
  earnedBadgeIds: string[];
  lastStudyDate:  string | null;  // ISO date string (YYYY-MM-DD)
  lastXPGain:     number;         // para o float text
}

type Action =
  | { type: 'ADD_XP'; action: XPAction }
  | { type: 'EARN_BADGE'; id: string }
  | { type: 'UPDATE_STREAK' }
  | { type: 'INC_MAPS' }
  | { type: 'INC_FLASHCARDS'; count?: number }
  | { type: 'INC_FLASHCARDS_REVIEWED'; count?: number }
  | { type: 'INC_WRITINGS' }
  | { type: 'INC_DEBATE_ARGS' }
  | { type: 'INC_FORUM_POSTS' }
  | { type: 'INC_POMODOROS' }
  | { type: 'INC_BOOKS' }
  | { type: 'INC_VIDEOS' }
  | { type: 'HYDRATE'; state: GameState };

// ── Estado inicial expandido ──────────────────────
const INITIAL_STATE: GameState = {
  totalXP:                  0,
  streakDays:               0,
  totalDaysStudied:         0,
  totalFlashcardsCreated:   0,
  totalFlashcardsReviewed:  0,
  totalMapsCreated:         0,
  totalWritings:            0,
  totalDebateArgs:          0,
  totalForumPosts:          0,
  totalPomodoros:           0,
  totalBooksFinished:       0,
  totalVideoLessons:        0,
  earnedBadgeIds:           [],
  lastStudyDate:            null,
  lastXPGain:               0,
};

const STORAGE_KEY = 'acropole_game_v2';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Reducer ──────────────────────────────────────
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...INITIAL_STATE, ...action.state };

    case 'ADD_XP': {
      const xpGain = XP_ACTIONS[action.action];
      return { ...state, totalXP: state.totalXP + xpGain, lastXPGain: xpGain, lastStudyDate: todayISO() };
    }

    case 'EARN_BADGE':
      if (state.earnedBadgeIds.includes(action.id)) return state;
      return { ...state, earnedBadgeIds: [...state.earnedBadgeIds, action.id] };

    case 'UPDATE_STREAK': {
      const today = todayISO();
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
      if (state.lastStudyDate === today) return state;
      const newStreak = state.lastStudyDate === yesterday ? state.streakDays + 1 : 1;
      const newDays = (state.totalDaysStudied ?? 0) + 1;
      return { ...state, streakDays: newStreak, totalDaysStudied: newDays, lastStudyDate: today };
    }

    case 'INC_MAPS':
      return { ...state, totalMapsCreated: state.totalMapsCreated + 1 };

    case 'INC_FLASHCARDS':
      return { ...state, totalFlashcardsCreated: state.totalFlashcardsCreated + (action.count ?? 1) };

    case 'INC_FLASHCARDS_REVIEWED':
      return { ...state, totalFlashcardsReviewed: (state.totalFlashcardsReviewed ?? 0) + (action.count ?? 1) };

    case 'INC_WRITINGS':
      return { ...state, totalWritings: (state.totalWritings ?? 0) + 1 };

    case 'INC_DEBATE_ARGS':
      return { ...state, totalDebateArgs: (state.totalDebateArgs ?? 0) + 1 };

    case 'INC_FORUM_POSTS':
      return { ...state, totalForumPosts: (state.totalForumPosts ?? 0) + 1 };

    case 'INC_POMODOROS':
      return { ...state, totalPomodoros: (state.totalPomodoros ?? 0) + 1 };

    case 'INC_BOOKS':
      return { ...state, totalBooksFinished: (state.totalBooksFinished ?? 0) + 1 };

    case 'INC_VIDEOS':
      return { ...state, totalVideoLessons: (state.totalVideoLessons ?? 0) + 1 };

    default:
      return state;
  }
}

// ── Persistência ─────────────────────────────────
function persist(state: GameState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(): GameState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Tenta migrar da v1
    const legacyRaw = localStorage.getItem('acropole_game_v1');
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
    const saved = raw ? JSON.parse(raw) : legacy;
    if (!saved) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...saved };
  } catch {
    return INITIAL_STATE;
  }
}

// ── Interface do hook ─────────────────────────────
export interface UseGameStore {
  state:                   GameState;
  currentLevel:            LevelDef;
  addXP:                   (action: XPAction) => BadgeDef[];
  recordMapCreated:        () => BadgeDef[];
  recordFlashcardsCreated: (count?: number) => BadgeDef[];
  recordFlashcardReviewed: (count?: number) => BadgeDef[];
  recordWriting:           () => BadgeDef[];
  recordDebateArg:         () => BadgeDef[];
  recordForumPost:         () => BadgeDef[];
  recordPomodoro:          () => BadgeDef[];
  recordBook:              () => BadgeDef[];
  checkDailyStreak:        () => void;
  lastXPGain:              number;
  resetLastXP:             () => void;
}

export function useGameStore(): UseGameStore {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    dispatch({ type: 'HYDRATE', state: saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(state);
  }, [state, hydrated]);

  const currentLevel = getLevelDef(state.totalXP);

  const checkAndDispatchBadges = useCallback(
    (nextState: GameState): BadgeDef[] => {
      const newBadges = getNewBadges(nextState, nextState.earnedBadgeIds);
      newBadges.forEach(b => dispatch({ type: 'EARN_BADGE', id: b.id }));
      return newBadges;
    },
    []
  );

  const addXP = useCallback((action: XPAction): BadgeDef[] => {
    dispatch({ type: 'ADD_XP', action });
    const next: GameState = {
      ...state,
      totalXP: state.totalXP + XP_ACTIONS[action],
      lastStudyDate: todayISO(),
      lastXPGain: XP_ACTIONS[action],
    };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordMapCreated = useCallback((): BadgeDef[] => {
    dispatch({ type: 'INC_MAPS' });
    const next = { ...state, totalMapsCreated: state.totalMapsCreated + 1 };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordFlashcardsCreated = useCallback((count = 1): BadgeDef[] => {
    dispatch({ type: 'INC_FLASHCARDS', count });
    const next = { ...state, totalFlashcardsCreated: state.totalFlashcardsCreated + count };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordFlashcardReviewed = useCallback((count = 1): BadgeDef[] => {
    dispatch({ type: 'INC_FLASHCARDS_REVIEWED', count });
    const next = { ...state, totalFlashcardsReviewed: (state.totalFlashcardsReviewed ?? 0) + count };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordWriting = useCallback((): BadgeDef[] => {
    dispatch({ type: 'INC_WRITINGS' });
    const next = { ...state, totalWritings: (state.totalWritings ?? 0) + 1 };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordDebateArg = useCallback((): BadgeDef[] => {
    dispatch({ type: 'INC_DEBATE_ARGS' });
    const next = { ...state, totalDebateArgs: (state.totalDebateArgs ?? 0) + 1 };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordForumPost = useCallback((): BadgeDef[] => {
    dispatch({ type: 'INC_FORUM_POSTS' });
    const next = { ...state, totalForumPosts: (state.totalForumPosts ?? 0) + 1 };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordPomodoro = useCallback((): BadgeDef[] => {
    dispatch({ type: 'INC_POMODOROS' });
    const next = { ...state, totalPomodoros: (state.totalPomodoros ?? 0) + 1 };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const recordBook = useCallback((): BadgeDef[] => {
    dispatch({ type: 'INC_BOOKS' });
    const next = { ...state, totalBooksFinished: (state.totalBooksFinished ?? 0) + 1 };
    return checkAndDispatchBadges(next);
  }, [state, checkAndDispatchBadges]);

  const checkDailyStreak = useCallback(() => {
    dispatch({ type: 'UPDATE_STREAK' });
  }, []);

  const resetLastXP = useCallback(() => {
    dispatch({ type: 'HYDRATE', state: { ...state, lastXPGain: 0 } });
  }, [state]);

  return {
    state, currentLevel, addXP,
    recordMapCreated, recordFlashcardsCreated, recordFlashcardReviewed,
    recordWriting, recordDebateArg, recordForumPost, recordPomodoro, recordBook,
    checkDailyStreak, lastXPGain: state.lastXPGain, resetLastXP,
  };
}
