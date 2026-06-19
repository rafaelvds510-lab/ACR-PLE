import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Scale, Swords, Trash2, Bot, X, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/debate")({ component: Debate });

// ─── Types ────────────────────────────────────────────────────────────────────

interface DebateRoom {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  creator_id: string;
  status: string;
  is_ai_enabled: boolean;
  created_at: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

function Debate() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<DebateRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAiEnabled, setNewAiEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch rooms ─────────────────────────────────────────────────────────────
  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("debate_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRooms((data ?? []) as DebateRoom[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim() || !user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("debate_rooms")
      .insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        creator_id: user.id,
        status: "open",
        is_ai_enabled: newAiEnabled,
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRooms((prev) => [data as DebateRoom, ...prev]);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewAiEnabled(false);
    toast.success("Sala criada com sucesso!");
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const { error } = await supabase.from("debate_rooms").delete().eq("id", deletingId);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRooms((prev) => prev.filter((r) => r.id !== deletingId));
    setDeletingId(null);
    toast.success("Sala excluída");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
            <Scale className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Debates &amp; Fórum Socrático
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Onde a dialética encontra a erudição. Explore temas, refute argumentos e aprimore sua
              retórica.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition hover:-translate-y-0.5"
            onClick={() => setShowCreateModal(true)}
          >
            <Swords className="mr-2 h-4 w-4" />
            Criar Sala de Debate
          </Button>
        </div>
      </header>

      {/* ── Salas Ativas ──────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <Swords className="h-5 w-5 text-gold" />
          <h2 className="font-display text-xl font-bold">Salas de Debate Ativas</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando arenas…
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/40 px-6 py-14 text-center text-muted-foreground">
            <Swords className="h-8 w-8 opacity-40" />
            <p>Nenhuma sala ativa no momento.</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
              Criar a primeira sala
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <DebateCard
                key={room.id}
                room={room}
                isOwner={room.creator_id === user?.id}
                onDelete={() => setDeletingId(room.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Create Modal ─────────────────────────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Novo Debate</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título do Debate (ex: A Ética em Platão)"
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva o tema do debate (opcional)"
                rows={3}
                className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-4 py-3 transition hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={newAiEnabled}
                  onChange={(e) => setNewAiEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border/60"
                />
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Habilitar IA como participante do debate</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCreate}
                disabled={submitting || !newTitle.trim()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Swords className="mr-2 h-4 w-4" />
                )}
                Criar Sala
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────── */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sala de debate</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir permanentemente esta sala de debate e todos os seus argumentos? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Debate Card ─────────────────────────────────────────────────────────────

function DebateCard({
  room,
  isOwner,
  onDelete,
}: {
  room: DebateRoom;
  isOwner: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-gold/40 hover:shadow-elegant">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {room.status === "open" ? "Aberto" : room.status}
          </span>
          {room.is_ai_enabled && (
            <span className="flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <Sparkles className="h-3 w-3" />
              IA
            </span>
          )}
        </div>
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Excluir sala"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-bold leading-snug">{room.title}</h3>

      {/* Description */}
      {room.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{room.description}</p>
      )}

      {/* CTA */}
      <button className="mt-auto w-full rounded-xl border border-border/60 bg-muted/30 py-2.5 text-sm font-semibold transition hover:border-gold/40 hover:bg-gold/5 hover:text-gold">
        Entrar na Arena
      </button>
    </div>
  );
}
