/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Plus, Upload, Pencil, Trash2, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/mapas/")({
  component: Mapas,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface MindMap {
  id: string;
  title: string;
  updated_at: string;
  state: {
    nodes: any[];
    edges: any[];
  };
  colorIndex?: number;
}

const LOCAL_STORAGE_KEY = "acropole_mindmaps";

// ─── Paleta de thumbnails ─────────────────────────────────────────────────────
// Tons que usam as variáveis do design system (primary=navy, gold, bronze, muted)
const THUMBNAIL_PALETTE: { bgClass: string; fgClass: string }[] = [
  {
    bgClass: "bg-primary/8 dark:bg-primary/20",
    fgClass: "text-primary dark:text-primary-foreground",
  },
  { bgClass: "bg-gold/10 dark:bg-gold/15", fgClass: "text-gold dark:text-gold-foreground" },
  { bgClass: "bg-bronze/8 dark:bg-bronze/18", fgClass: "text-bronze dark:text-bronze" },
  { bgClass: "bg-primary/6 dark:bg-primary/30", fgClass: "text-primary/70 dark:text-gold" },
  { bgClass: "bg-gold/8 dark:bg-gold/12", fgClass: "text-gold dark:text-gold" },
  { bgClass: "bg-muted dark:bg-muted/40", fgClass: "text-muted-foreground dark:text-gold" },
];

// ─── Glifo SVG de mapa mental ─────────────────────────────────────────────────

function MindMapGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M27 27 L16 18 M37 27 L48 16 M27 38 L14 44 M38 37 L50 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="32" cy="32" r="7" fill="currentColor" />
      <circle cx="14" cy="16" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="50" cy="14" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="46" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="52" cy="48" r="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// ─── XMind Import Helper ──────────────────────────────────────────────────────

function xmindToNodes(rootTopic: any): { nodes: any[]; edges: any[] } {
  const nodes: any[] = [];
  const edges: any[] = [];
  const traverse = (
    topic: any,
    parentId: string | null,
    depth: number,
    index: number,
    total: number,
  ) => {
    const nodeId = topic.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isRoot = parentId === null;
    const angle = isRoot ? 0 : (index - (total - 1) / 2) * (Math.PI / 4);
    const dist = depth * 200;
    nodes.push({
      id: nodeId,
      label: topic.title || "Tópico",
      x: (isRoot ? 0 : dist * Math.cos(angle)) + 400,
      y: (isRoot ? 0 : dist * Math.sin(angle)) + 300,
      isRoot,
    });
    if (parentId) edges.push({ id: `e-${parentId}-${nodeId}`, source: parentId, target: nodeId });
    if (topic.children?.attached) {
      const ch = topic.children.attached;
      ch.forEach((c: any, i: number) => traverse(c, nodeId, depth + 1, i, ch.length));
    }
  };
  traverse(rootTopic, null, 0, 0, 1);
  return { nodes, edges };
}

// ─── Component ───────────────────────────────────────────────────────────────

function Mapas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [maps, setMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [mapPendingDelete, setMapPendingDelete] = useState<MindMap | null>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ── Fetch (Stale-While-Revalidate) ──────────────────────────────────────────
  const fetchMaps = async () => {
    // 1) Mostrar dados do LocalStorage instantaneamente (0ms de delay)
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        setMaps(JSON.parse(local));
      } catch {
        // ignorar erros de parse
      }
    }
    setLoading(false);

    // 2) Sincronizar com Supabase em background sem bloquear a UI
    try {
      const { data, error } = await supabase
        .from("mindmaps" as any)
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setMaps(data as unknown as MindMap[]);
        // Sincronizar cache local com dados remotos
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // Falha silenciosa — dados locais já estão exibidos
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  const saveLocal = (updated: MindMap[]) => {
    setMaps(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Criar ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);
    const newId = `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const colorIndex = maps.length % THUMBNAIL_PALETTE.length;
    const newMap: MindMap = {
      id: newId,
      title: "Mapa sem título",
      updated_at: new Date().toISOString(),
      state: {
        nodes: [{ id: "root", label: "Ideia Central", x: 400, y: 300, isRoot: true }],
        edges: [],
      },
      colorIndex,
    };

    try {
      const { data, error } = await supabase
        .from("mindmaps" as any)
        .insert({
          id: newId,
          title: newMap.title,
          state: newMap.state,
          user_id: user.id,
          color_index: colorIndex,
        })
        .select()
        .single();

      const finalId = !error && data ? (data as any).id : newId;
      if (error) saveLocal([newMap, ...maps]);
      else await fetchMaps();

      startEdit(finalId, newMap.title);
      navigate({ to: `/mapas/$mapId`, params: { mapId: finalId } });
    } catch {
      saveLocal([newMap, ...maps]);
      startEdit(newId, newMap.title);
    } finally {
      setSaving(false);
    }
  };

  // ── Importar .xmind ────────────────────────────────────────────────────────
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const content = zip.file("content.json");
      if (!content) {
        toast.error("Arquivo .xmind inválido.");
        return;
      }
      const xmind = JSON.parse(await content.async("text"));
      const sheet = xmind[0];
      if (!sheet?.rootTopic) {
        toast.error("Estrutura XMind inválida.");
        return;
      }
      const { nodes, edges } = xmindToNodes(sheet.rootTopic);
      const newId = `map-${Date.now()}`;
      const title = file.name.replace(".xmind", "") || "Mapa Importado";
      const colorIndex = maps.length % THUMBNAIL_PALETTE.length;
      const newMap: MindMap = {
        id: newId,
        title,
        updated_at: new Date().toISOString(),
        state: { nodes, edges },
        colorIndex,
      };
      if (user) {
        const { error } = await supabase.from("mindmaps" as any).insert({
          id: newId,
          title,
          state: { nodes, edges },
          user_id: user.id,
          color_index: colorIndex,
        });
        if (!error) {
          toast.success("Mapa importado!");
          fetchMaps();
          return;
        }
      }
      saveLocal([newMap, ...maps]);
      toast.success("Mapa importado localmente!");
    } catch {
      toast.error("Erro ao processar arquivo .xmind");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // ── Edição de título ───────────────────────────────────────────────────────
  function startEdit(id: string, currentTitle: string, event?: React.MouseEvent) {
    event?.stopPropagation();
    setEditingId(id);
    setEditingValue(currentTitle);
  }

  const confirmEdit = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!editingId) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      await supabase
        .from("mindmaps" as any)
        .update({ title: trimmed, updated_at: new Date().toISOString() })
        .eq("id", editingId);
    } catch {
      /* silent */
    }
    setMaps((prev) =>
      prev.map((m) =>
        m.id === editingId ? { ...m, title: trimmed, updated_at: new Date().toISOString() } : m,
      ),
    );
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const all: MindMap[] = JSON.parse(local);
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(all.map((m) => (m.id === editingId ? { ...m, title: trimmed } : m))),
      );
    }
    setEditingId(null);
  };

  function cancelEdit(event?: React.MouseEvent) {
    event?.stopPropagation();
    setEditingId(null);
  }

  // ── Exclusão ───────────────────────────────────────────────────────────────
  function requestDelete(map: MindMap, event: React.MouseEvent) {
    event.stopPropagation();
    setMapPendingDelete(map);
  }

  const confirmDelete = async () => {
    if (!mapPendingDelete) return;
    try {
      await supabase
        .from("mindmaps" as any)
        .delete()
        .eq("id", mapPendingDelete.id);
    } catch {
      /* silent */
    }
    const updated = maps.filter((m) => m.id !== mapPendingDelete.id);
    saveLocal(updated);
    toast.success("Mapa excluído!");
    setMapPendingDelete(null);
  };

  const isEmpty = maps.length === 0;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold opacity-70">
              Conexões
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Mapas Mentais
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Organize e visualize suas ideias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-card hover:border-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <Upload size={16} />
              Importar .xmind
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xmind"
              className="hidden"
              onChange={handleFileSelected}
            />

            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Novo Mapa
            </button>
          </div>
        </div>

        {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
        <div className="mt-10">
          {loading ? (
            <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              Carregando mapas…
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/50 bg-card/40 px-6 py-24 text-center">
              <MindMapGlyph className="h-16 w-16 text-primary/25" />
              <p className="mt-6 text-lg font-semibold text-foreground">
                Você ainda não criou nenhum mapa mental.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece organizando suas ideias em um novo mapa.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <Plus size={16} />
                Começar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {maps.map((map) => {
                const palette = THUMBNAIL_PALETTE[(map.colorIndex ?? 0) % THUMBNAIL_PALETTE.length];
                const isEditing = editingId === map.id;

                return (
                  <div
                    key={map.id}
                    onClick={() =>
                      !isEditing && navigate({ to: `/mapas/$mapId`, params: { mapId: map.id } })
                    }
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg"
                  >
                    {/* Thumbnail */}
                    <div
                      className={`flex aspect-[4/3] items-center justify-center ${palette.bgClass}`}
                    >
                      <MindMapGlyph className={`h-14 w-14 ${palette.fgClass} opacity-75`} />
                    </div>

                    {/* Rodapé */}
                    <div className="flex items-start justify-between gap-3 p-4 bg-card border-t border-border/40">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="w-full border-b-2 border-gold bg-transparent pb-0.5 text-sm font-semibold text-foreground outline-none"
                          />
                        ) : (
                          <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {map.title}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(map.updated_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Ações rápidas */}
                      <div className="flex shrink-0 items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              aria-label="Confirmar nome"
                              onClick={confirmEdit}
                              className="rounded-lg p-1.5 text-foreground transition hover:bg-gold/15 hover:text-gold"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Cancelar edição"
                              onClick={cancelEdit}
                              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Editar nome"
                              onClick={(e) => startEdit(map.id, map.title, e)}
                              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Excluir mapa"
                              onClick={(e) => requestDelete(map, e)}
                              className="rounded-lg p-1.5 text-destructive/70 transition hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de confirmação de exclusão ────────────────────────────────── */}
      {mapPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
          onClick={() => setMapPendingDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border/60 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Excluir mapa mental?
              </h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Tem certeza que deseja excluir "{mapPendingDelete.title}"? Essa ação não pode ser
              desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMapPendingDelete(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
