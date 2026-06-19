import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Loader2,
  BookOpen,
  BookMarked,
  CalendarDays,
  Star,
  BookText,
  Layers,
} from "lucide-react";
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
import { listEssays, createEssay, updateEssay } from "@/lib/essays.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/escrita/")({ component: EscritaIndex });

// ─── Templates ───────────────────────────────────────────────────────────────

type TemplateId = "caderno" | "diario";

const TEMPLATES: Record<
  TemplateId,
  { label: string; emoji: string; description: string; icon: React.ElementType; content: unknown }
> = {
  caderno: {
    label: "Caderno de Estudos",
    emoji: "📓",
    description: "Organize seu conhecimento em Capítulos e Páginas estruturadas.",
    icon: BookOpen,
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Caderno de Estudos" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Capítulo 1" }],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Página 1" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "Escreva aqui seu conteúdo." }] },
      ],
    },
  },
  diario: {
    label: "Diário Pessoal",
    emoji: "📔",
    description: "Salve coisas importantes organizadas por data. Seu registro pessoal diário.",
    icon: CalendarDays,
    content: (() => {
      const today = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Meu Diário" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: cap(today) }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "⭐ Importante: escreva aqui o que foi importante hoje…" },
            ],
          },
        ],
      };
    })(),
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Essay {
  id: string;
  title: string;
  template: TemplateId;
  updated_at: string;
  created_at?: string;
  word_count?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Caderno hierarchy parser ─────────────────────────────────────────────────

interface CadernoNode {
  type: "caderno" | "capitulo" | "pagina";
  label: string;
  children?: CadernoNode[];
}

function parseCadernoHierarchy(content: unknown): CadernoNode[] {
  // Extract headings from tiptap doc to build tree
  const nodes: Array<{ level: number; text: string }> = [];
  const doc = content as {
    content?: Array<{
      type: string;
      attrs?: { level: number };
      content?: Array<{ text?: string }>;
    }>;
  };
  if (!doc?.content) return [];
  for (const node of doc.content) {
    if (node.type === "heading" && node.attrs) {
      const text = node.content?.map((c) => c.text ?? "").join("") ?? "";
      nodes.push({ level: node.attrs.level, text });
    }
  }
  // Group: h1 = caderno, h2 = capitulo, h3 = pagina
  const result: CadernoNode[] = [];
  let curCap: CadernoNode | null = null;
  for (const n of nodes) {
    if (n.level === 1) {
      // skip caderno root heading (already shown as doc title)
    } else if (n.level === 2) {
      curCap = { type: "capitulo", label: n.text, children: [] };
      result.push(curCap);
    } else if (n.level === 3) {
      if (curCap) {
        curCap.children?.push({ type: "pagina", label: n.text });
      }
    }
  }
  return result;
}

// ─── Component ───────────────────────────────────────────────────────────────

function EscritaIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listFn = useServerFn(listEssays);
  const createFn = useServerFn(createEssay);
  const updateFn = useServerFn(updateEssay);

  const { data: essays, isLoading } = useQuery<Essay[]>({
    queryKey: ["essays"],
    queryFn: () => listFn() as Promise<Essay[]>,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});

  // Create
  const createMutation = useMutation({
    mutationFn: async (tplId: TemplateId) => {
      const tpl = TEMPLATES[tplId];
      return createFn({
        data: { title: `Novo ${tpl.label}`, template: tplId, content: tpl.content },
      });
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["essays"] });
      setShowModal(false);
      navigate({ to: "/escrita/$essayId", params: { essayId: row.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Rename
  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) =>
      updateFn({ data: { id, title } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["essays"] });
      setEditingId(null);
      toast.success("Documento renomeado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("essays").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["essays"] });
      setDeletingId(null);
      toast.success("Documento excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groupedEssays = useMemo(() => {
    const groups: Record<TemplateId, Essay[]> = { caderno: [], diario: [] };
    (essays ?? []).forEach((e) => {
      const tplId =
        (e.template as TemplateId) in TEMPLATES ? (e.template as TemplateId) : "caderno";
      groups[tplId].push(e);
    });
    return groups;
  }, [essays]);

  const toggleGroup = (id: string) => setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleDoc = (id: string) => setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));

  const confirmRename = () => {
    const trimmed = editTitle.trim();
    if (!trimmed || !editingId) return;
    renameMutation.mutate({ id: editingId, title: trimmed });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">📚 Cadernos & Diário</h1>
          <p className="mt-2 text-muted-foreground">
            Cadernos organizados por Capítulos e Páginas · Diário pessoal com registros por data.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:-translate-y-0.5 hover:shadow-elegant"
        >
          <Plus className="h-4 w-4" /> Novo Documento
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando seus textos…
        </div>
      ) : (essays ?? []).length === 0 ? (
        /* Empty state */
        <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card px-10 py-20 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold">Nenhum documento ainda</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Escolha um template e comece sua jornada de escrita.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:-translate-y-0.5 hover:shadow-elegant"
          >
            Criar Primeiro Texto
          </button>
        </div>
      ) : (
        /* Grouped list */
        <div className="grid gap-6">
          {(Object.entries(groupedEssays) as [TemplateId, Essay[]][])
            .filter(([, ws]) => ws.length > 0)
            .map(([tplId, ws]) => {
              const tpl = TEMPLATES[tplId];
              const isCollapsed = collapsedGroups[tplId];
              const GroupIcon = tpl.icon;
              return (
                <div
                  key={tplId}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
                >
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(tplId)}
                    className="flex w-full items-center gap-3 border-b border-border/40 bg-muted/30 px-6 py-4 text-left transition hover:bg-muted/50"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-2xl">{tpl.emoji}</span>
                    <div className="flex-1">
                      <h2 className="font-display text-base font-bold">{tpl.label}</h2>
                      <span className="text-xs text-muted-foreground">
                        {ws.length} {ws.length === 1 ? "documento" : "documentos"}
                      </span>
                    </div>
                  </button>

                  {/* Group content */}
                  {!isCollapsed && (
                    <div className="p-2">
                      {ws.map((w) => {
                        const isCaderno = tplId === "caderno";
                        const isDiario = tplId === "diario";
                        const isExpanded = expandedDocs[w.id];
                        const hierarchy =
                          isCaderno && isExpanded ? parseCadernoHierarchy(null) : [];

                        return (
                          <div key={w.id}>
                            <div
                              className="group flex cursor-pointer items-center gap-4 rounded-xl border border-transparent px-4 py-3 transition hover:border-border/60 hover:bg-muted/40"
                              onClick={() =>
                                editingId !== w.id &&
                                navigate({ to: "/escrita/$essayId", params: { essayId: w.id } })
                              }
                            >
                              {/* Expand toggle for caderno */}
                              {isCaderno ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDoc(w.id);
                                  }}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                  <Star className="h-4 w-4" />
                                </div>
                              )}

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                {editingId === w.id ? (
                                  <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      autoFocus
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") confirmRename();
                                        if (e.key === "Escape") setEditingId(null);
                                      }}
                                      className="flex-1 rounded-lg border-2 border-primary bg-background px-3 py-1.5 text-sm font-semibold outline-none"
                                    />
                                    <button
                                      onClick={confirmRename}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <p className="truncate font-semibold">{w.title}</p>
                                )}
                                <div className="mt-0.5 flex gap-4 text-xs text-muted-foreground">
                                  {w.word_count !== undefined && (
                                    <span>
                                      <b>{w.word_count}</b> palavras
                                    </span>
                                  )}
                                  {w.created_at && (
                                    <span>
                                      Criado em: <b>{formatDate(w.created_at)}</b>
                                    </span>
                                  )}
                                  <span>
                                    Editado em: <b>{formatDate(w.updated_at)}</b>
                                  </span>
                                  {isDiario && (
                                    <span className="inline-flex items-center gap-1 text-amber-500">
                                      <Star className="h-3 w-3" /> registros pessoais
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div
                                className="flex gap-1.5 opacity-0 transition group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setEditingId(w.id);
                                    setEditTitle(w.title);
                                  }}
                                  title="Renomear"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition hover:bg-muted"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingId(w.id)}
                                  title="Excluir"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background text-destructive transition hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Caderno hierarchy: Capítulos → Páginas */}
                            {isCaderno && isExpanded && (
                              <div className="ml-12 mb-3 border-l-2 border-border/40 pl-4">
                                {/* Header */}
                                <div className="mb-2 flex items-center gap-1.5 py-1">
                                  <BookText className="h-3.5 w-3.5 text-primary/60" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-primary/60">
                                    Estrutura
                                  </span>
                                </div>

                                {hierarchy.length === 0 ? (
                                  <p className="py-2 text-xs italic text-muted-foreground">
                                    Abra o caderno para ver os capítulos.
                                  </p>
                                ) : (
                                  <div className="grid gap-2">
                                    {hierarchy.map((cap, ci) => (
                                      <div
                                        key={ci}
                                        className="overflow-hidden rounded-lg border border-border/50 bg-background/60"
                                      >
                                        {/* ── Capítulo tab ───────────────── */}
                                        <button
                                          onClick={() =>
                                            navigate({
                                              to: "/escrita/$essayId",
                                              params: { essayId: w.id },
                                            })
                                          }
                                          className="flex w-full items-center gap-2 bg-primary/8 px-3 py-2 text-left transition hover:bg-primary/15"
                                        >
                                          <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                            Cap {ci + 1}
                                          </span>
                                          <BookMarked className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                                          <span className="flex-1 truncate text-xs font-semibold text-foreground">
                                            {cap.label}
                                          </span>
                                        </button>

                                        {/* ── Páginas section ────────────── */}
                                        {(cap.children ?? []).length > 0 && (
                                          <div className="border-t border-border/40 bg-muted/20 px-2 py-1.5">
                                            <p className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                              Páginas
                                            </p>
                                            <div className="grid gap-0.5">
                                              {(cap.children ?? []).map((pg, pi) => (
                                                <button
                                                  key={pi}
                                                  onClick={() =>
                                                    navigate({
                                                      to: "/escrita/$essayId",
                                                      params: { essayId: w.id },
                                                    })
                                                  }
                                                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                                                >
                                                  <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    {pi + 1}
                                                  </span>
                                                  <FileText className="h-3 w-3 shrink-0" />
                                                  <span className="truncate">{pg.label}</span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ── Template Modal ───────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Novo Documento</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Caderno de estudos ou Diário pessoal?
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(TEMPLATES) as [TemplateId, (typeof TEMPLATES)[TemplateId]][]).map(
                ([id, tpl]) => {
                  const TplIcon = tpl.icon;
                  return (
                    <button
                      key={id}
                      onClick={() => createMutation.mutate(id)}
                      disabled={createMutation.isPending}
                      className="group flex flex-col gap-2 rounded-2xl border-2 border-border/60 p-5 text-left transition hover:border-primary hover:bg-muted/30 disabled:pointer-events-none disabled:opacity-60"
                    >
                      <span className="text-3xl">{tpl.emoji}</span>
                      <p className="font-display text-base font-bold group-hover:text-primary">
                        {tpl.label}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {tpl.description}
                      </p>
                    </button>
                  );
                },
              )}
            </div>

            {createMutation.isPending && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Criando documento…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────── */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
