/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Sparkles,
  Flame,
  CalendarCheck,
  BookOpen,
  Layers,
  Zap,
  Award,
  CheckCircle2,
  Circle,
  Trophy,
  Loader2,
  Brain,
  Scroll,
  Flag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: AgoraPersonal,
});

// ─── Gamification Engine ──────────────────────────────────────────────────────

const LEVELS = [
  {
    level: 1,
    title: "Noviço",
    titleEn: "Novice",
    icon: "🪨",
    maxXP: 200,
    challenge: "Leia seu primeiro texto e crie 5 flashcards para consolidar o aprendizado.",
  },
  {
    level: 2,
    title: "Aprendiz",
    titleEn: "Apprentice",
    icon: "📖",
    maxXP: 600,
    challenge: "Complete 3 sessões de revisão e escreva um ensaio curto sobre um tema estudado.",
  },
  {
    level: 3,
    title: "Estudioso",
    titleEn: "Scholar",
    icon: "🏛️",
    maxXP: 1400,
    challenge: "Mantenha 7 dias de ofensiva e crie um mapa mental de um assunto complexo.",
  },
  {
    level: 4,
    title: "Erudito",
    titleEn: "Erudite",
    icon: "🔱",
    maxXP: 3000,
    challenge: "Participe de 5 debates e alcance 80% de retenção nos seus baralhos.",
  },
  {
    level: 5,
    title: "Sábio",
    titleEn: "Sage",
    icon: "⚡",
    maxXP: Infinity,
    challenge: "Você chegou ao ápice do conhecimento. Continue cultivando a sabedoria.",
  },
];

function getLevel(xp: number) {
  for (const lvl of LEVELS) {
    if (xp < lvl.maxXP) return lvl;
  }
  return LEVELS[LEVELS.length - 1];
}

function getXPProgress(xp: number) {
  const current = getLevel(xp);
  const prevMax = current.level === 1 ? 0 : LEVELS[current.level - 2].maxXP;
  const range = current.maxXP === Infinity ? 99999 : current.maxXP - prevMax;
  const earned = xp - prevMax;
  const pct = Math.min(Math.round((earned / range) * 100), 100);
  const remaining = current.maxXP === Infinity ? 0 : current.maxXP - xp;
  return { pct, remaining, earned, range };
}

// ─── Oracle Messages ──────────────────────────────────────────────────────────

const ORACLE_MESSAGES = [
  {
    icon: "🔮",
    title: "Insight do Dia",
    text: '"A repetição espaçada é a técnica mais poderosa para fixar conhecimento a longo prazo. Revise seus baralhos hoje."',
  },
  {
    icon: "🌌",
    title: "O Oráculo Fala",
    text: '"Feynman dizia: se você não consegue explicar algo simplesmente, é porque ainda não entendeu de verdade. Tente ensinar o que aprendeu hoje."',
  },
  {
    icon: "🏛️",
    title: "Sabedoria Antiga",
    text: '"Somente o conhecimento que você pratica se torna parte de quem você é. A leitura sem aplicação é esquecimento programado."',
  },
  {
    icon: "⚡",
    title: "Desafio de Hoje",
    text: '"Dedique 25 minutos ininterruptos de estudo profundo agora. Sem distrações. Um único Pomodoro bem feito supera horas dispersas."',
  },
  {
    icon: "🦉",
    title: "O Mentor Responde",
    text: '"Antes de criar mais flashcards, revise os pendentes. O backlog acumulado é o inimigo silencioso da retenção."',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function AgoraPersonal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const name =
    (user?.user_metadata?.display_name as string) ?? user?.email?.split("@")[0] ?? "Estudioso";

  // ── XP / Gamification state from localStorage ──
  const [totalXP, setTotalXP] = useState<number>(() => {
    const saved = localStorage.getItem("acropolis_xp");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem("acropolis_streak");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [badges, setBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem("acropolis_badges");
    return saved ? JSON.parse(saved) : [];
  });

  // ── Supabase data ──
  const [docCount, setDocCount] = useState(0);
  const [deckCount, setDeckCount] = useState(0);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Oracle ──
  const oracle = useMemo(() => {
    return ORACLE_MESSAGES[new Date().getDate() % ORACLE_MESSAGES.length];
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const currentLevel = useMemo(() => getLevel(totalXP), [totalXP]);
  const xpProgress = useMemo(() => getXPProgress(totalXP), [totalXP]);

  // ── Fetch real data from Supabase ──
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Doc count (books / essays)
        const [booksRes, essaysRes, decksRes, agendaRes] = await Promise.all([
          supabase
            .from("books")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("essays")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("decks")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("events")
            .select("*")
            .eq("user_id", user.id)
            .gte("start_time", new Date().toISOString().slice(0, 10))
            .lte("start_time", new Date().toISOString().slice(0, 10) + "T23:59:59")
            .order("start_time"),
        ]);

        setDocCount((booksRes.count ?? 0) + (essaysRes.count ?? 0));
        setDeckCount(decksRes.count ?? 0);
        setTodayEvents(agendaRes.data ?? []);

        // Load plans from localStorage (our local strategy)
        const savedPlans = localStorage.getItem("acropolis_plans");
        if (savedPlans) {
          try {
            setPlans(JSON.parse(savedPlans));
          } catch {
            /* ignore */
          }
        }
      } catch (_err) {
        /* ignore network errors gracefully */
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Track daily streak
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem("acropolis_last_visit");
    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastVisit === yesterday) {
        const newStreak = streakDays + 1;
        setStreakDays(newStreak);
        localStorage.setItem("acropolis_streak", newStreak.toString());
      } else if (!lastVisit) {
        setStreakDays(1);
        localStorage.setItem("acropolis_streak", "1");
      }
      localStorage.setItem("acropolis_last_visit", today);

      // Give XP for daily login
      const newXP = totalXP + 10;
      setTotalXP(newXP);
      localStorage.setItem("acropolis_xp", newXP.toString());
    }
  }, [user, streakDays, totalXP]);

  // ── Event helpers ──
  const toggleEvent = async (id: string, done: boolean) => {
    setTodayEvents((prev) => prev.map((e) => (e.id === id ? { ...e, concluida: !done } : e)));
    try {
      await supabase.from("events").update({ concluida: !done }).eq("id", id);
      if (!done) {
        const newXP = totalXP + 20;
        setTotalXP(newXP);
        localStorage.setItem("acropolis_xp", newXP.toString());
        toast.success("+20 XP — Sessão concluída!");
      }
    } catch {
      /* ignore */
    }
  };

  const deletePlan = (planId: string) => {
    if (!confirm("Excluir plano e limpar agenda?")) return;
    const updated = plans.filter((p) => p.id !== planId);
    setPlans(updated);
    localStorage.setItem("acropolis_plans", JSON.stringify(updated));
  };

  const finishPlan = (planId: string) => {
    if (!confirm("Finalizar plano agora? Isso excluirá as sessões futuras não concluídas.")) return;
    const updated = plans.filter((p) => p.id !== planId);
    setPlans(updated);
    localStorage.setItem("acropolis_plans", JSON.stringify(updated));
    const newXP = totalXP + 50;
    setTotalXP(newXP);
    localStorage.setItem("acropolis_xp", newXP.toString());
    toast.success("+50 XP — Plano finalizado!");
  };

  const typeColors: Record<string, string> = {
    leitura: "hsl(220 80% 55%)",
    revisão: "hsl(160 70% 45%)",
    escrita: "hsl(280 65% 58%)",
    debate: "hsl(35 90% 55%)",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-8">
        {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">
              A Ágora Pessoal
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight">
              {greeting},{" "}
              <span className="text-gold">
                {currentLevel.icon} {currentLevel.title}
              </span>{" "}
              {name}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Onde seu conhecimento é cultivado.</p>
          </div>

          {/* Streak Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold shadow-sm",
              streakDays > 0
                ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                : "border-border/60 bg-card/60 text-muted-foreground",
            )}
          >
            {streakDays > 0 ? (
              <>
                <Flame className="h-4 w-4 animate-pulse" />
                <span>
                  {streakDays} dia{streakDays !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <>
                <span className="text-gold">✦</span>
                <span>Comece hoje</span>
              </>
            )}
          </motion.div>
        </div>

        {/* ── Layout: Main + Sidebar ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* ══ COLUNA PRINCIPAL ════════════════════════════════════════════ */}
          <div className="space-y-6">
            {/* ─ Oráculo IA ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card to-card p-6 shadow-md"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-2xl">
                  {oracle.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-3.5 w-3.5 text-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80">
                      {oracle.title}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 italic">{oracle.text}</p>
                </div>
              </div>
            </motion.div>

            {/* ─ Sua Jornada de Hoje ────────────────────────────────────── */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border/50 bg-card/60 p-6 space-y-5"
            >
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Sua Jornada de Hoje
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Hoje */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                    Hoje
                  </h3>
                  {loading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Carregando...
                    </div>
                  ) : todayEvents.length > 0 ? (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {todayEvents.map((ev) => {
                          const color =
                            ev.color ?? typeColors[ev.type?.toLowerCase()] ?? "hsl(var(--primary))";
                          return (
                            <motion.div
                              key={ev.id}
                              layout
                              initial={{ opacity: 0, x: -8 }}
                              animate={{
                                opacity: ev.concluida ? 0.5 : 1,
                                x: 0,
                              }}
                              className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 p-3 transition-all"
                              style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                            >
                              <button
                                onClick={() => toggleEvent(ev.id, !!ev.concluida)}
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                                  ev.concluida
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-border/60 hover:border-primary hover:bg-primary/10",
                                )}
                              >
                                {ev.concluida && "✓"}
                              </button>

                              <div className="min-w-10 shrink-0">
                                <p className="text-[10px] font-mono font-bold text-muted-foreground">
                                  {new Date(ev.start_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-sm font-semibold truncate",
                                    ev.concluida && "line-through",
                                  )}
                                  style={{ color }}
                                >
                                  {ev.title}
                                </p>
                                {ev.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {ev.description}
                                  </p>
                                )}
                              </div>

                              {ev.type && (
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                                  style={{
                                    background: color + "22",
                                    color,
                                  }}
                                >
                                  {ev.type}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/50 py-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        Nenhum estudo agendado para hoje.
                      </p>
                    </div>
                  )}
                </div>

                {/* Planos Ativos */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold inline-block" />
                    Planos Ativos
                  </h3>
                  {plans.length > 0 ? (
                    <div className="space-y-2">
                      {plans.map((plan) => {
                        const pct = Math.round((plan.completed / plan.total) * 100);
                        return (
                          <div
                            key={plan.id}
                            className="rounded-xl border border-border/40 bg-background/50 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold truncate">{plan.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => finishPlan(plan.id)}
                                  title="Finalizar"
                                  className="h-6 w-6 rounded text-xs hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center justify-center"
                                >
                                  <Flag className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => deletePlan(plan.id)}
                                  title="Excluir"
                                  className="h-6 w-6 rounded text-xs hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: plan.color ?? "hsl(var(--primary))",
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {plan.completed} / {plan.total} sessões ({pct}%)
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/50 py-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        Nenhum plano de estudo em progresso.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA: Agendar */}
              {!loading && todayEvents.length === 0 && plans.length === 0 && (
                <div className="flex justify-center pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: "/agenda" })}
                    className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60 text-xs"
                  >
                    <CalendarCheck className="mr-2 h-3.5 w-3.5" />
                    Agendar agora na Agenda →
                  </Button>
                </div>
              )}
            </motion.div>

            {/* ─ Stats Row ──────────────────────────────────────────────── */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {[
                {
                  icon: "📜",
                  value: docCount,
                  label: "Pergaminhos",
                  url: "/biblioteca",
                  color: "hsl(220 80% 55%)",
                },
                {
                  icon: "🃏",
                  value: deckCount,
                  label: "Baralhos",
                  url: "/flashcards",
                  color: "hsl(160 70% 45%)",
                },
                {
                  icon: "⚡",
                  value: totalXP,
                  label: "XP Total",
                  url: "/dashboard",
                  color: "hsl(45 95% 55%)",
                },
                {
                  icon: "🏅",
                  value: badges.length,
                  label: "Badges",
                  url: "/dashboard",
                  color: "hsl(280 65% 58%)",
                },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() => navigate({ to: stat.url as any })}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-4 text-left transition-all hover:border-border hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at bottom right, ${stat.color}18, transparent 70%)`,
                    }}
                  />
                  <span className="text-2xl">{stat.icon}</span>
                  <div
                    className="mt-2 font-display text-2xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    {stat.label}
                  </div>
                </button>
              ))}
            </motion.div>
          </div>

          {/* ══ COLUNA LATERAL ═══════════════════════════════════════════════ */}
          <div className="space-y-5">
            {/* ─ Painel de Nível ────────────────────────────────────────── */}
            <motion.div
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/10 via-card to-card p-6 shadow-lg space-y-5"
            >
              {/* Decorative top line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-2xl">
                  {currentLevel.icon}
                </div>
                <div>
                  <p className="font-display font-bold text-lg leading-tight">
                    {currentLevel.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nível {currentLevel.level} · {currentLevel.titleEn}
                  </p>
                </div>
              </div>

              {/* XP Display */}
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-gold">
                  {totalXP.toLocaleString("pt-BR")}
                </span>
                <span className="text-sm font-bold text-gold/60">XP</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{xpProgress.pct}%</span>
                  {currentLevel.level < 5 && (
                    <span className="italic">
                      {xpProgress.remaining.toLocaleString("pt-BR")} XP para o próximo
                    </span>
                  )}
                </div>
              </div>

              {/* Desafio Atual */}
              <div className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-1">
                  <Scroll className="h-3 w-3" />
                  Desafio Atual
                </p>
                <p className="text-xs leading-relaxed text-foreground/75 italic">
                  {currentLevel.challenge}
                </p>
              </div>

              <Button
                onClick={() => navigate({ to: "/dashboard" })}
                variant="outline"
                className="w-full border-gold/25 text-gold hover:bg-gold/10 hover:border-gold/50 text-xs font-bold"
              >
                <Trophy className="mr-2 h-3.5 w-3.5" />
                Ver Olimpo Completo →
              </Button>
            </motion.div>

            {/* ─ Próximos Passos (onboarding) ───────────────────────────── */}
            {(docCount === 0 || deckCount === 0 || totalXP === 0) && (
              <motion.div
                initial={{ x: 16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-card/60 p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <h3 className="font-display font-bold text-sm">Próximos Passos</h3>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      done: docCount > 0,
                      label: "Faça upload de um PDF ou artigo",
                      url: "/biblioteca",
                      icon: BookOpen,
                    },
                    {
                      done: deckCount > 0,
                      label: "Crie seu primeiro baralho de flashcards",
                      url: "/flashcards",
                      icon: Layers,
                    },
                    {
                      done: totalXP > 10,
                      label: "Ganhe seu primeiro XP",
                      url: "/flashcards",
                      icon: Zap,
                    },
                  ].map((step) => (
                    <button
                      key={step.label}
                      disabled={step.done}
                      onClick={() => !step.done && navigate({ to: step.url as any })}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition-all",
                        step.done
                          ? "border-green-500/20 bg-green-500/5 text-muted-foreground cursor-default opacity-70"
                          : "border-border/50 bg-background/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
                      )}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={cn(step.done && "line-through")}>{step.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
