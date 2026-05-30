// ═══════════════════════════════════════════════════════════════
//  Acrópole — Game Engine v2.0 (pure functions)
//  Sistema de XP, Níveis Temáticos (1-1000 dias) e 30+ Badges
// ═══════════════════════════════════════════════════════════════

// ── XP por Ação ──────────────────────────────────────────────
export const XP_ACTIONS = {
  READ_PAGE:           2,
  CREATE_FLASHCARD:    5,
  REVIEW_FLASHCARD:    3,
  REVIEW_CORRECT:      4,   // Acertou no Leitner
  POMODORO:           15,
  MINDMAP:            30,
  SIMULADO:          100,
  DAILY_STREAK:       10,
  WRITING:            20,
  VIDEO_LESSON:        8,
  DEBATE_ARGUMENT:    12,
  FORUM_POST:          6,
  BOOK_FINISHED:     150,
} as const;

export type XPAction = keyof typeof XP_ACTIONS;

// ── Definição dos Níveis — Jornada de 1-1000 dias ────────────
export interface LevelDef {
  level:       number;
  title:       string;       // nome grego
  titlePt:     string;       // tradução
  icon:        string;
  reward:      string;
  rewardDesc:  string;
  challenge:   string;
  description: string;
  minXP:       number;
  days:        string;       // faixa de dias representativa
}

export const LEVELS: LevelDef[] = [
  {
    level: 1, days: '1–7',
    title: 'Mathētēs', titlePt: 'O Aprendiz', icon: '🏛️',
    reward: 'A Sandália de Hermes',
    rewardDesc: 'Agilidade para começar sem procrastinar.',
    challenge: 'Vencer a inércia e o Caos inicial.',
    description: 'Você é uma tábula rasa. Seu foco é a curiosidade pura e absorção inicial.',
    minXP: 0,
  },
  {
    level: 2, days: '8–30',
    title: 'Ephēbos', titlePt: 'O Iniciado', icon: '🛡️',
    reward: 'O Escudo de Bronze',
    rewardDesc: 'Proteção contra distrações externas.',
    challenge: 'Criar uma rotina inabalável.',
    description: 'O estudo deixa de ser passivo. É a fase da disciplina militar espartana.',
    minXP: 200,
  },
  {
    level: 3, days: '31–60',
    title: 'Meletētēs', titlePt: 'O Praticante', icon: '🏺',
    reward: 'A Coroa de Louros',
    rewardDesc: 'Reconhecimento de que você domina a base.',
    challenge: 'Consistência e autocorreção.',
    description: 'Você molda o conhecimento como Hefesto molda o ferro. A prática profunda começa.',
    minXP: 800,
  },
  {
    level: 4, days: '61–100',
    title: 'Philosophos', titlePt: 'O Filósofo', icon: '📜',
    reward: 'O Pergaminho de Platão',
    rewardDesc: 'A capacidade de questionar e conectar ideias.',
    challenge: 'Pensamento crítico e síntese do conhecimento.',
    description: 'As ideias começam a se conectar. Você vê padrões onde outros veem caos.',
    minXP: 2000,
  },
  {
    level: 5, days: '101–150',
    title: 'Rhetor', titlePt: 'O Orador', icon: '🎭',
    reward: 'A Lira de Apolo',
    rewardDesc: 'Eloquência e domínio da expressão.',
    challenge: 'Ensinar para solidificar o conhecimento.',
    description: 'Quem não consegue explicar, não entende. Você agora comunica com maestria.',
    minXP: 4200,
  },
  {
    level: 6, days: '151–250',
    title: 'Epistēmōn', titlePt: 'O Cientista', icon: '🔬',
    reward: 'O Compasso de Euclides',
    rewardDesc: 'Precisão lógica e método científico.',
    challenge: 'Aprofundamento rigoroso e originalidade.',
    description: 'Você não só aprende — você questiona, experimenta e produz conhecimento novo.',
    minXP: 8000,
  },
  {
    level: 7, days: '251–365',
    title: 'Hēgemōn', titlePt: 'O Estrategista', icon: '⚔️',
    reward: 'O Mapa de Alexandre',
    rewardDesc: 'Visão estratégica e planejamento de longo prazo.',
    challenge: 'Integrar todos os domínios em uma visão unificada.',
    description: 'Como Alexandre, você não vê batalhas isoladas — vê campanhas inteiras. Um ano completo.',
    minXP: 15000,
  },
  {
    level: 8, days: '366–500',
    title: 'Didaskalos', titlePt: 'O Mestre', icon: '🎓',
    reward: 'O Cetro de Zeus',
    rewardDesc: 'Autoridade reconhecida sobre seu domínio.',
    challenge: 'Retenção permanente e transmissão do conhecimento.',
    description: 'Um mestre grego só prova que sabe quando forma outros mestres. Você é referência.',
    minXP: 28000,
  },
  {
    level: 9, days: '501–750',
    title: 'Archōn', titlePt: 'O Arcontonte', icon: '🌟',
    reward: 'A Tocha de Prometeu',
    rewardDesc: 'O fogo do conhecimento que ilumina outros.',
    challenge: 'Legado e impacto no mundo ao redor.',
    description: 'Você governa seu próprio olimpo mental. Menos de 1% dos estudantes chegam aqui.',
    minXP: 55000,
  },
  {
    level: 10, days: '751–1000',
    title: 'Sophos', titlePt: 'O Sábio', icon: '⚡',
    reward: 'A Luz de Atena',
    rewardDesc: 'A clareza mental total de quem atingiu a transcendência.',
    challenge: 'A busca eterna pela verdade absoluta.',
    description: 'O cume do Olimpo. Mil dias de jornada. O conhecimento aqui é intuitivo e integrado. Você se tornou a lenda.',
    minXP: 100000,
  },
];

// ── Progressão ───────────────────────────────────────────────

export function getLevelDef(totalXP: number): LevelDef {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXPProgress(totalXP: number): { current: number; max: number; pct: number } {
  const lvl = getLevelDef(totalXP);
  if (lvl.level === 10) return { current: totalXP - lvl.minXP, max: totalXP - lvl.minXP, pct: 100 };
  const nextLvl = LEVELS[lvl.level]; // nível atual é 1-indexed; LEVELS[lvl.level] é o próximo
  const max = nextLvl.minXP - lvl.minXP;
  const current = totalXP - lvl.minXP;
  return { current, max, pct: Math.min(100, Math.round((current / max) * 100)) };
}

// ── Marcos de Dias (para trilha visual 1-1000) ───────────────
export const DAY_MILESTONES = [1, 7, 14, 30, 60, 100, 150, 200, 250, 365, 500, 600, 750, 900, 1000];

export interface MilestoneInfo {
  day: number;
  label: string;
  icon: string;
  xpBonus: number;
}

export const MILESTONE_MAP: Record<number, MilestoneInfo> = {
  1:    { day: 1,    label: 'Primeiro Passo',      icon: '👣',  xpBonus: 10   },
  7:    { day: 7,    label: 'Uma Semana',           icon: '🔥',  xpBonus: 50   },
  14:   { day: 14,   label: 'Duas Semanas',         icon: '✨',  xpBonus: 100  },
  30:   { day: 30,   label: 'Um Mês',               icon: '🌙',  xpBonus: 200  },
  60:   { day: 60,   label: 'Dois Meses',           icon: '🌿',  xpBonus: 350  },
  100:  { day: 100,  label: '100 Dias!',            icon: '💯',  xpBonus: 600  },
  150:  { day: 150,  label: 'Meio Ano',             icon: '🏆',  xpBonus: 900  },
  200:  { day: 200,  label: '200 Dias',             icon: '⚡',  xpBonus: 1200 },
  250:  { day: 250,  label: 'Trimestre III',        icon: '🌟',  xpBonus: 1500 },
  365:  { day: 365,  label: 'Um Ano Completo!',     icon: '🎖️', xpBonus: 3000 },
  500:  { day: 500,  label: '500 Dias de Glória',  icon: '👑',  xpBonus: 5000 },
  600:  { day: 600,  label: 'Seiscentos Dias',      icon: '🌠',  xpBonus: 6500 },
  750:  { day: 750,  label: 'Os Três Quartos',      icon: '🦅',  xpBonus: 9000 },
  900:  { day: 900,  label: 'A Véspera da Glória',  icon: '🌋',  xpBonus: 12000},
  1000: { day: 1000, label: '🏛️ Mil Dias no Olimpo', icon: '⚜️', xpBonus: 25000},
};

// ── Badges — 30+ Conquistas ───────────────────────────────────
export interface GameStats {
  totalXP:                 number;
  streakDays:              number;
  totalDaysStudied:        number;
  totalFlashcardsCreated:  number;
  totalFlashcardsReviewed: number;
  totalMapsCreated:        number;
  totalWritings:           number;
  totalDebateArgs:         number;
  totalForumPosts:         number;
  totalPomodoros:          number;
  totalBooksFinished:      number;
  totalVideoLessons:       number;
}

export interface BadgeDef {
  id:       string;
  name:     string;
  desc:     string;
  icon:     string;
  rarity:   'common' | 'rare' | 'epic' | 'legendary';
  category: 'streak' | 'flashcards' | 'maps' | 'writing' | 'debate' | 'xp' | 'days' | 'special';
  check:    (s: GameStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  // ── Streak / Dias ─────────────────────────────────────────
  { id: 'primeiro_passo',  name: 'O Primeiro Passo',     icon: '👣', rarity: 'common',    category: 'days',
    desc: '1 dia de estudo completo.',
    check: (s) => s.totalDaysStudied >= 1 },

  { id: 'chama_hestia',    name: 'Chama de Héstia',      icon: '🔥', rarity: 'common',    category: 'streak',
    desc: '7 dias consecutivos de estudo.',
    check: (s) => s.streakDays >= 7 },

  { id: 'disciplina_sparta', name: 'Disciplina Espartana', icon: '🛡️', rarity: 'rare',   category: 'streak',
    desc: '30 dias consecutivos.',
    check: (s) => s.streakDays >= 30 },

  { id: 'fogo_olimpico',   name: 'Fogo Olímpico',        icon: '🏅', rarity: 'epic',     category: 'streak',
    desc: '100 dias consecutivos — inquebrável.',
    check: (s) => s.streakDays >= 100 },

  { id: 'imortal',         name: 'O Imortal',            icon: '♾️', rarity: 'legendary', category: 'streak',
    desc: '365 dias consecutivos. Um ano inteiro sem parar.',
    check: (s) => s.streakDays >= 365 },

  // ── Flashcards ─────────────────────────────────────────────
  { id: 'primeiro_card',   name: 'O Primeiro Cartão',   icon: '🃏', rarity: 'common',    category: 'flashcards',
    desc: 'Criou seu primeiro flashcard.',
    check: (s) => s.totalFlashcardsCreated >= 1 },

  { id: 'aprendiz_cartas', name: 'Aprendiz das Cartas',  icon: '🎴', rarity: 'common',    category: 'flashcards',
    desc: '50 flashcards criados.',
    check: (s) => s.totalFlashcardsCreated >= 50 },

  { id: 'artesao_atena',   name: 'Artesão de Atena',     icon: '🏺', rarity: 'rare',     category: 'flashcards',
    desc: '500 flashcards criados.',
    check: (s) => s.totalFlashcardsCreated >= 500 },

  { id: 'biblioteca_cards', name: 'A Grande Biblioteca', icon: '📚', rarity: 'epic',     category: 'flashcards',
    desc: '2.000 flashcards criados.',
    check: (s) => s.totalFlashcardsCreated >= 2000 },

  { id: 'revisado_100',    name: 'Revisão Constante',    icon: '🔄', rarity: 'common',    category: 'flashcards',
    desc: '100 flashcards revisados.',
    check: (s) => s.totalFlashcardsReviewed >= 100 },

  { id: 'revisado_5000',   name: 'Memória de Elefante',  icon: '🐘', rarity: 'legendary', category: 'flashcards',
    desc: '5.000 flashcards revisados com sucesso.',
    check: (s) => s.totalFlashcardsReviewed >= 5000 },

  // ── Mapas Mentais ─────────────────────────────────────────
  { id: 'primeiro_mapa',   name: 'O Cartógrafo',         icon: '🗺️', rarity: 'common',  category: 'maps',
    desc: 'Criou seu primeiro mapa mental.',
    check: (s) => s.totalMapsCreated >= 1 },

  { id: 'mapeador_labirinto', name: 'Mapeador do Labirinto', icon: '🧭', rarity: 'rare', category: 'maps',
    desc: '10 mapas mentais salvos.',
    check: (s) => s.totalMapsCreated >= 10 },

  { id: 'atlas',           name: 'Atlas do Saber',        icon: '🌍', rarity: 'epic',     category: 'maps',
    desc: '50 mapas mentais — você mapeou um universo.',
    check: (s) => s.totalMapsCreated >= 50 },

  // ── Escrita ───────────────────────────────────────────────
  { id: 'primeiro_texto',  name: 'O Escriba',            icon: '✍️', rarity: 'common',  category: 'writing',
    desc: 'Criou seu primeiro texto nos Cadernos.',
    check: (s) => s.totalWritings >= 1 },

  { id: 'escritor_ativo',  name: 'Escritor Ativo',        icon: '📝', rarity: 'rare',    category: 'writing',
    desc: '20 textos escritos nos Cadernos.',
    check: (s) => s.totalWritings >= 20 },

  { id: 'filosofo_escrita', name: 'Filósofo da Pena',    icon: '🖊️', rarity: 'epic',    category: 'writing',
    desc: '100 textos produzidos — você é prolífico.',
    check: (s) => s.totalWritings >= 100 },

  // ── Debate ────────────────────────────────────────────────
  { id: 'primeiro_debate',  name: 'O Sofista',            icon: '💬', rarity: 'common',  category: 'debate',
    desc: 'Postou seu primeiro argumento no debate.',
    check: (s) => s.totalDebateArgs >= 1 },

  { id: 'retor_arena',      name: 'Rétor da Arena',       icon: '🏟️', rarity: 'rare',   category: 'debate',
    desc: '50 argumentos publicados em debates.',
    check: (s) => s.totalDebateArgs >= 50 },

  { id: 'forum_cidadao',    name: 'Cidadão do Fórum',     icon: '🏛️', rarity: 'common', category: 'debate',
    desc: '10 posts no Fórum Socrático.',
    check: (s) => s.totalForumPosts >= 10 },

  // ── Pomodoro / Foco ───────────────────────────────────────
  { id: 'primeiro_pomo',    name: 'O Cronista do Tempo', icon: '⏱️', rarity: 'common',  category: 'special',
    desc: 'Completou seu primeiro Pomodoro.',
    check: (s) => s.totalPomodoros >= 1 },

  { id: 'pomodoro_50',      name: 'Mestre do Foco',       icon: '🍅', rarity: 'rare',    category: 'special',
    desc: '50 sessões Pomodoro concluídas.',
    check: (s) => s.totalPomodoros >= 50 },

  { id: 'pomodoro_500',     name: 'Asceta do Tempo',      icon: '⌛', rarity: 'legendary', category: 'special',
    desc: '500 Pomodoros — centenas de horas de foco puro.',
    check: (s) => s.totalPomodoros >= 500 },

  // ── XP / Progressão ──────────────────────────────────────
  { id: 'xp_1000',          name: 'Centurião',            icon: '⚔️', rarity: 'common',  category: 'xp',
    desc: '1.000 XP acumulados.',
    check: (s) => s.totalXP >= 1000 },

  { id: 'xp_10000',         name: 'O Olimpiano',          icon: '🏆', rarity: 'rare',    category: 'xp',
    desc: '10.000 XP acumulados.',
    check: (s) => s.totalXP >= 10000 },

  { id: 'xp_50000',         name: 'Filho dos Deuses',     icon: '👑', rarity: 'epic',    category: 'xp',
    desc: '50.000 XP — você transcendeu.',
    check: (s) => s.totalXP >= 50000 },

  { id: 'xp_100000',        name: 'Imortal de Ouro',      icon: '⚜️', rarity: 'legendary', category: 'xp',
    desc: '100.000 XP — o cume absoluto do Olimpo.',
    check: (s) => s.totalXP >= 100000 },

  // ── Dias Estudados ────────────────────────────────────────
  { id: 'dias_30',          name: 'O Mês Olímpico',       icon: '🌙', rarity: 'common',  category: 'days',
    desc: '30 dias de estudo (consecutivos ou não).',
    check: (s) => s.totalDaysStudied >= 30 },

  { id: 'dias_100',         name: 'Centuriāo do Saber',   icon: '💯', rarity: 'rare',    category: 'days',
    desc: '100 dias de estudo acumulados.',
    check: (s) => s.totalDaysStudied >= 100 },

  { id: 'dias_365',         name: 'Um Ano no Olimpo',     icon: '🎖️', rarity: 'epic',   category: 'days',
    desc: '365 dias de estudo acumulados.',
    check: (s) => s.totalDaysStudied >= 365 },

  { id: 'dias_1000',        name: '🏛️ Mil Dias de Sabedoria', icon: '⚡', rarity: 'legendary', category: 'days',
    desc: '1.000 dias de estudo. Você é a lenda viva.',
    check: (s) => s.totalDaysStudied >= 1000 },

  // ── Livros / Vídeos ───────────────────────────────────────
  { id: 'primeiro_livro',   name: 'O Leitor',             icon: '📖', rarity: 'common',  category: 'special',
    desc: 'Terminou seu primeiro livro na Biblioteca.',
    check: (s) => s.totalBooksFinished >= 1 },

  { id: 'dez_livros',       name: 'A Biblioteca de Atenas', icon: '🏛️', rarity: 'epic', category: 'special',
    desc: '10 livros concluídos.',
    check: (s) => s.totalBooksFinished >= 10 },
];

export function getNewBadges(stats: GameStats, earned: string[]): BadgeDef[] {
  return BADGES.filter(b => !earned.includes(b.id) && b.check(stats));
}

export const RARITY_COLORS: Record<BadgeDef['rarity'], { bg: string; text: string; label: string }> = {
  common:    { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b',  label: 'Comum'     },
  rare:      { bg: 'rgba(59, 130, 246, 0.12)',  text: '#3b82f6',  label: 'Raro'      },
  epic:      { bg: 'rgba(168, 85, 247, 0.12)',  text: '#a855f7',  label: 'Épico'     },
  legendary: { bg: 'rgba(201, 168, 76, 0.15)',  text: 'var(--gold)', label: 'Lendário' },
};
