import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  BookOpen,
  FlameIcon,
  Zap,
  Sparkles,
  X,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agenda")({ component: Agenda });

// ─── Types ─────────────────────────────────────────────────────────────────

type ActivityType = "leitura" | "revisao" | "aula" | "debate" | "escrita" | "outro";
type CalView = "semana" | "mes" | "dia";

interface StudyEvent {
  id: string;
  title: string;
  type: ActivityType;
  bgColor: string;
  textColor: string;
  notes: string; // JSON tiptap
  date: string; // ISO YYYY-MM-DD
  startHour: number; // 0-23
  durationH: number; // hours
  planId?: string;
}

interface WeekGoal {
  label: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  color: string;
  unit: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ActivityType, { bg: string; text: string; label: string }> = {
  leitura: { bg: "#3b82f6", text: "#fff", label: "Leitura / Pesquisa" },
  revisao: { bg: "#22c55e", text: "#fff", label: "Revisão / Prática" },
  aula: { bg: "#ef4444", text: "#fff", label: "Aula / Vídeo" },
  debate: { bg: "#eab308", text: "#1a1a1a", label: "Debate / Discussão" },
  escrita: { bg: "#a855f7", text: "#fff", label: "Escrita / Síntese" },
  outro: { bg: "#6b7280", text: "#fff", label: "Outro" },
};

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06-23
const HOUR_H = 56; // px per hour

function genId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function weekStart(d: Date) {
  const r = new Date(d);
  const day = r.getDay(); // 0=Dom
  r.setDate(r.getDate() - day);
  return r;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function Agenda() {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<CalView>("semana");
  const [anchor, setAnchor] = useState(today); // reference date
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [modal, setModal] = useState<{
    open: boolean;
    date: string;
    startHour: number;
    editing: StudyEvent | null;
  }>({ open: false, date: toIso(today), startHour: 9, editing: null });

  // Próximas sessões (sorted)
  const upcomingEvents = useMemo(() => {
    const todayIso = toIso(today);
    return [...events]
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour)
      .slice(0, 5);
  }, [events, today]);

  // Goals (computed from events this week)
  const ws = weekStart(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => toIso(addDays(ws, i)));
  const weekEvents = events.filter((e) => weekDays.includes(e.date));
  const horasEstudo = weekEvents.reduce((s, e) => s + e.durationH, 0);
  const flashcards = weekEvents.filter((e) => e.type === "revisao").length * 25;
  const paginasLidas = weekEvents.filter((e) => e.type === "leitura").length * 40;

  const goals: WeekGoal[] = [
    {
      label: "Horas de Estudo",
      icon: <Clock className="h-4 w-4" />,
      current: Math.round(horasEstudo),
      target: 20,
      color: "#3b82f6",
      unit: "h",
    },
    {
      label: "Flashcards Revisados",
      icon: <FlameIcon className="h-4 w-4" />,
      current: flashcards,
      target: 150,
      color: "#22c55e",
      unit: "",
    },
    {
      label: "Páginas Lidas",
      icon: <BookOpen className="h-4 w-4" />,
      current: paginasLidas,
      target: 200,
      color: "#a855f7",
      unit: "",
    },
  ];

  const openCreate = useCallback((date: string, startHour: number) => {
    setModal({ open: true, date, startHour, editing: null });
  }, []);

  const openEdit = useCallback((ev: StudyEvent) => {
    setModal({ open: true, date: ev.date, startHour: ev.startHour, editing: ev });
  }, []);

  const saveEvent = useCallback((ev: StudyEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === ev.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = ev;
        return copy;
      }
      return [...prev, ev];
    });
    setModal((m) => ({ ...m, open: false }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setModal((m) => ({ ...m, open: false }));
    toast.success("Sessão removida");
  }, []);

  const deletePlan = useCallback((planId: string) => {
    setEvents((prev) => prev.filter((e) => e.planId !== planId));
    setModal((m) => ({ ...m, open: false }));
    toast.success("Plano removido");
  }, []);

  const addPlanEvents = useCallback((evs: StudyEvent[]) => {
    setEvents((prev) => [...prev, ...evs]);
  }, []);

  // Navigation
  const navigate = (dir: -1 | 1) => {
    if (view === "semana") setAnchor((d) => addDays(d, dir * 7));
    else if (view === "dia") setAnchor((d) => addDays(d, dir));
    else {
      setAnchor((d) => {
        const r = new Date(d);
        r.setMonth(r.getMonth() + dir);
        return r;
      });
    }
  };

  const anchorLabel = () => {
    if (view === "semana") {
      const end = addDays(ws, 6);
      return `${ws.getDate()} ${ws.toLocaleDateString("pt-BR", { month: "short" })} – ${end.getDate()} ${end.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
    }
    if (view === "dia")
      return anchor.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    return anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col overflow-hidden bg-background">
      {/* ── Top Header ─────────────────────────────────── */}
      <header className="border-b border-border/60 bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Planejamento</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Agenda de Estudos</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Organize seu tempo e alcance suas metas semanais.
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => openCreate(toIso(today), 9)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Sessão
          </Button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border/60 bg-card p-4">
          {/* Goals */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Metas da Semana
            </p>
            <div className="space-y-4">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                return (
                  <div key={g.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span style={{ color: g.color }}>{g.icon}</span>
                        {g.label}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {g.current}
                        {g.unit} / {g.target}
                        {g.unit}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: g.color }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border/60" />

          {/* Upcoming */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Zap className="h-3.5 w-3.5" /> Próximas Sessões
            </p>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">Nenhuma sessão próxima.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((ev) => {
                  const d = new Date(ev.date + "T12:00:00");
                  return (
                    <button
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-background/60 p-2 text-left transition hover:border-gold/40"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md text-xs font-bold"
                        style={{
                          background: TYPE_COLORS[ev.type].bg,
                          color: TYPE_COLORS[ev.type].text,
                        }}
                      >
                        <span>{d.getDate()}</span>
                        <span className="text-[9px] uppercase opacity-80">
                          {d.toLocaleDateString("pt-BR", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {String(ev.startHour).padStart(2, "0")}:00 — {TYPE_COLORS[ev.type].label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── Calendar Area ─────────────────────────────── */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          {/* Cal toolbar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setAnchor(today)}
              >
                Hoje
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 text-sm font-medium capitalize">{anchorLabel()}</span>
            </div>
            <div className="flex gap-1 rounded-lg border border-border/60 bg-background p-0.5">
              {(["semana", "mes", "dia"] as CalView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar body */}
          <div className="flex-1 min-h-0 overflow-auto">
            {view === "semana" && (
              <WeekView
                anchor={anchor}
                today={today}
                events={events}
                onCellClick={openCreate}
                onEventClick={openEdit}
                onEventDrop={(id, date, startHour) => {
                  setEvents((prev) =>
                    prev.map((e) => (e.id === id ? { ...e, date, startHour } : e)),
                  );
                }}
              />
            )}
            {view === "dia" && (
              <DayView
                date={anchor}
                today={today}
                events={events}
                onCellClick={openCreate}
                onEventClick={openEdit}
              />
            )}
            {view === "mes" && (
              <MonthView
                anchor={anchor}
                today={today}
                events={events}
                onDayClick={(d) => {
                  setView("dia");
                  setAnchor(d);
                }}
                onEventClick={openEdit}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────── */}
      <SessionModal
        open={modal.open}
        date={modal.date}
        startHour={modal.startHour}
        editing={modal.editing}
        onSave={saveEvent}
        onDelete={deleteEvent}
        onDeletePlan={deletePlan}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onAddPlan={addPlanEvents}
      />
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────

function WeekView({
  anchor,
  today,
  events,
  onCellClick,
  onEventClick,
  onEventDrop,
}: {
  anchor: Date;
  today: Date;
  events: StudyEvent[];
  onCellClick: (date: string, hour: number) => void;
  onEventClick: (ev: StudyEvent) => void;
  onEventDrop: (id: string, date: string, startHour: number) => void;
}) {
  const ws = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const todayIso = toIso(today);
  const dragging = useRef<{ id: string; offsetY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string, offsetY: number) => {
    dragging.current = { id, offsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent, colDate: string) => {
    if (!dragging.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top - dragging.current.offsetY;
    const hour = Math.max(6, Math.min(23, Math.round(6 + relY / HOUR_H)));
    onEventDrop(dragging.current.id, colDate, hour);
    dragging.current = null;
  };

  return (
    <div className="flex min-w-[640px]">
      {/* Time gutter */}
      <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-border/60 bg-background">
        <div className="h-10 border-b border-border/40" />
        {HOURS.map((h) => (
          <div
            key={h}
            className="flex items-start justify-end pr-2 text-[10px] text-muted-foreground"
            style={{ height: HOUR_H }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day) => {
        const iso = toIso(day);
        const isToday = iso === todayIso;
        const dayEvents = events.filter((e) => e.date === iso);

        return (
          <div key={iso} className="flex flex-1 flex-col border-r border-border/40 last:border-r-0">
            {/* Header */}
            <div
              className={`sticky top-0 z-10 h-10 border-b border-border/40 bg-background px-1 py-1 text-center text-xs font-medium ${
                isToday ? "text-gold" : "text-muted-foreground"
              }`}
            >
              <span>{day.toLocaleDateString("pt-BR", { weekday: "short" })}</span>{" "}
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  isToday ? "bg-gold text-background" : ""
                }`}
              >
                {day.getDate()}
              </span>
            </div>

            {/* Hour cells */}
            <div
              className="relative"
              style={{ height: HOURS.length * HOUR_H }}
              onPointerUp={(e) => handlePointerUp(e, iso)}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full cursor-pointer border-b border-border/20 hover:bg-gold/5"
                  style={{ top: (h - 6) * HOUR_H, height: HOUR_H }}
                  onClick={() => onCellClick(iso, h)}
                />
              ))}

              {/* Events */}
              {dayEvents.map((ev) => {
                const top = (ev.startHour - 6) * HOUR_H;
                const height = Math.max(HOUR_H * 0.5, ev.durationH * HOUR_H - 2);
                return (
                  <div
                    key={ev.id}
                    className="absolute left-0.5 right-0.5 cursor-pointer select-none overflow-hidden rounded-md px-1.5 py-1 text-xs shadow-sm ring-1 ring-black/10 transition hover:ring-2"
                    style={{
                      top: top + 1,
                      height,
                      background: TYPE_COLORS[ev.type].bg,
                      color: TYPE_COLORS[ev.type].text,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(
                        e,
                        ev.id,
                        e.clientY - e.currentTarget.getBoundingClientRect().top,
                      );
                    }}
                  >
                    <p className="truncate font-semibold leading-tight">{ev.title}</p>
                    <p className="truncate opacity-80">
                      {String(ev.startHour).padStart(2, "0")}:00
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({
  date,
  today,
  events,
  onCellClick,
  onEventClick,
}: {
  date: Date;
  today: Date;
  events: StudyEvent[];
  onCellClick: (d: string, h: number) => void;
  onEventClick: (ev: StudyEvent) => void;
}) {
  const iso = toIso(date);
  const isToday = iso === toIso(today);
  const dayEvents = events.filter((e) => e.date === iso);

  return (
    <div className="flex">
      <div className="w-14 shrink-0 border-r border-border/60 bg-background">
        <div className="h-10 border-b border-border/40" />
        {HOURS.map((h) => (
          <div
            key={h}
            className="flex items-start justify-end pr-2 text-[10px] text-muted-foreground"
            style={{ height: HOUR_H }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div
          className={`sticky top-0 z-10 h-10 border-b border-border/40 bg-background px-3 py-2 text-sm font-semibold ${
            isToday ? "text-gold" : ""
          }`}
        >
          {date.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <div className="relative" style={{ height: HOURS.length * HOUR_H }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full cursor-pointer border-b border-border/20 hover:bg-gold/5"
              style={{ top: (h - 6) * HOUR_H, height: HOUR_H }}
              onClick={() => onCellClick(iso, h)}
            />
          ))}
          {dayEvents.map((ev) => {
            const top = (ev.startHour - 6) * HOUR_H;
            const height = Math.max(HOUR_H * 0.5, ev.durationH * HOUR_H - 2);
            return (
              <div
                key={ev.id}
                className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-lg px-3 py-1.5 text-sm shadow-md ring-1 ring-black/10 transition hover:ring-2"
                style={{
                  top: top + 1,
                  height,
                  background: TYPE_COLORS[ev.type].bg,
                  color: TYPE_COLORS[ev.type].text,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(ev);
                }}
              >
                <p className="font-semibold">{ev.title}</p>
                <p className="text-xs opacity-80">
                  {String(ev.startHour).padStart(2, "0")}:00 –{" "}
                  {String(ev.startHour + ev.durationH).padStart(2, "0")}:00
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  anchor,
  today,
  events,
  onDayClick,
  onEventClick,
}: {
  anchor: Date;
  today: Date;
  events: StudyEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (ev: StudyEvent) => void;
}) {
  const todayIso = toIso(today);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-px rounded-xl border border-border/60 overflow-hidden">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div
            key={d}
            className="bg-muted/40 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} className="bg-muted/20 min-h-[80px]" />;
          const cellDate = new Date(year, month, d);
          const iso = toIso(cellDate);
          const isToday = iso === todayIso;
          const cellEvents = events.filter((e) => e.date === iso).slice(0, 3);
          return (
            <div
              key={iso}
              onClick={() => onDayClick(cellDate)}
              className={`min-h-[80px] cursor-pointer bg-background p-1.5 transition hover:bg-muted/40 ${
                isToday ? "ring-2 ring-inset ring-gold" : ""
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? "bg-gold text-background" : "text-foreground"
                }`}
              >
                {d}
              </span>
              <div className="mt-1 space-y-0.5">
                {cellEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className="truncate rounded px-1 text-[10px] font-medium"
                    style={{
                      background: TYPE_COLORS[ev.type].bg,
                      color: TYPE_COLORS[ev.type].text,
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Session Modal ────────────────────────────────────────────────────────────

function SessionModal({
  open,
  date,
  startHour,
  editing,
  onSave,
  onDelete,
  onDeletePlan,
  onClose,
  onAddPlan,
}: {
  open: boolean;
  date: string;
  startHour: number;
  editing: StudyEvent | null;
  onSave: (ev: StudyEvent) => void;
  onDelete: (id: string) => void;
  onDeletePlan: (planId: string) => void;
  onClose: () => void;
  onAddPlan: (evs: StudyEvent[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ActivityType>("leitura");
  const [bgColor, setBgColor] = useState("#3b82f6");
  const [textColor, setTextColor] = useState("#ffffff");
  const [durationH, setDurationH] = useState(1.5);
  const [showPlanGen, setShowPlanGen] = useState(false);
  const [planDays, setPlanDays] = useState(7);
  const [planSessions, setPlanSessions] = useState(3);
  const [generating, setGenerating] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Anotações desta sessão..." })],
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3",
      },
    },
    content: "",
  });

  // Sync with editing
  useEffect(() => {
    if (!editor) return;
    if (editing) {
      setTitle(editing.title);
      setType(editing.type);
      setBgColor(editing.bgColor);
      setTextColor(editing.textColor);
      setDurationH(editing.durationH);
      try {
        editor.commands.setContent(editing.notes ? JSON.parse(editing.notes) : "");
      } catch {
        editor.commands.setContent("");
      }
    } else {
      setTitle("");
      setType("leitura");
      setBgColor(TYPE_COLORS["leitura"].bg);
      setTextColor(TYPE_COLORS["leitura"].text);
      setDurationH(1.5);
      editor.commands.setContent("");
    }
  }, [editing, editor, open]);

  // Auto-set color when type changes
  useEffect(() => {
    if (!editing) {
      setBgColor(TYPE_COLORS[type].bg);
      setTextColor(TYPE_COLORS[type].text);
    }
  }, [type, editing]);

  const handleSave = () => {
    if (!title.trim()) return toast.error("Informe um título");
    const notes = JSON.stringify(editor?.getJSON() ?? "");
    const ev: StudyEvent = {
      id: editing?.id ?? genId(),
      title: title.trim(),
      type,
      bgColor,
      textColor,
      notes,
      date: editing?.date ?? date,
      startHour: editing?.startHour ?? startHour,
      durationH,
      planId: editing?.planId,
    };
    onSave(ev);
    toast.success(editing ? "Sessão atualizada" : "Sessão adicionada");
  };

  const handleGeneratePlan = () => {
    if (!title.trim()) return toast.error("Informe um título primeiro");
    setGenerating(true);
    const planId = genId();
    const startDate = new Date(date + "T12:00:00");
    const interval = Math.max(1, Math.floor(planDays / planSessions));
    const newEvs: StudyEvent[] = Array.from({ length: planSessions }, (_, i) => {
      const evDate = addDays(startDate, i * interval);
      return {
        id: genId(),
        title: `${title} — Sessão ${i + 1}`,
        type,
        bgColor,
        textColor,
        notes: "{}",
        date: toIso(evDate),
        startHour: 9 + (i % 3) * 2,
        durationH,
        planId,
      };
    });
    onAddPlan(newEvs);
    setGenerating(false);
    onClose();
    toast.success(`Plano criado com ${planSessions} sessões!`);
  };

  const PRESET_BG = [
    "#3b82f6",
    "#22c55e",
    "#ef4444",
    "#eab308",
    "#a855f7",
    "#6b7280",
    "#f97316",
    "#ec4899",
  ];
  const PRESET_TEXT = ["#ffffff", "#1a1a1a", "#f0f4ff", "#fefce8"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editing ? "Editar Sessão de Estudo" : "Adicionar Sessão de Estudo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          {/* Title */}
          <div>
            <Label>Título do Evento</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: História Geral: Roma Antiga"
            />
          </div>

          {/* Type + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Atividade</Label>
              <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_COLORS) as [ActivityType, { label: string }][]).map(
                    ([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duração (horas)</Label>
              <Input
                type="number"
                min={0.5}
                max={8}
                step={0.5}
                value={durationH}
                onChange={(e) => setDurationH(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Cor de Fundo</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_BG.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${bgColor === c ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border-0 p-0"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Cor do Texto</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TEXT.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${textColor === c ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border-0 p-0"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{ background: bgColor, color: textColor }}
          >
            {title || "Prévia do Evento"}
          </div>

          {/* Rich text notes */}
          <div>
            <Label>Anotações da Sessão</Label>
            <div className="mt-1 rounded-md border border-border/60 bg-background">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Plan generator (only on create) */}
          {!editing && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <button
                onClick={() => setShowPlanGen((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" /> Gerador de Plano de Estudo
                </span>
                <span className="text-xs text-muted-foreground">
                  {showPlanGen ? "fechar" : "abrir"}
                </span>
              </button>
              {showPlanGen && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Gera automaticamente múltiplas sessões baseadas no título acima.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Total de dias</Label>
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        value={planDays}
                        onChange={(e) => setPlanDays(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Número de sessões</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={planSessions}
                        onChange={(e) => setPlanSessions(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleGeneratePlan}
                    disabled={generating}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {generating ? "Gerando…" : `Gerar ${planSessions} Sessões em ${planDays} dias`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Plan actions (on edit if has planId) */}
          {editing?.planId && (
            <div className="flex gap-2 border-t border-border/60 pt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // mark all plan events as finished (type=revisao as proxy)
                  toast.success("Plano finalizado");
                  onClose();
                }}
              >
                Finalizar Plano
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDeletePlan(editing.planId!)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir Plano Inteiro
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            {editing ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(editing.id)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Excluir Sessão
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSave}
              >
                {editing ? "Salvar Alterações" : "Adicionar Sessão"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
