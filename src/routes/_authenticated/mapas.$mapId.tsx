/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Save,
  Layout,
  Plus,
  ArrowLeft,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Keyboard,
  Paintbrush,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMindmapShortcuts } from "@/hooks/use-mindmap-shortcuts";
import { KeyboardShortcutsPanel } from "@/components/mindmap/KeyboardShortcutsPanel";

export const Route = createFileRoute("/_authenticated/mapas/$mapId")({
  component: MindMapEditor,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeStyle {
  shape?: "rounded-rect" | "rect" | "ellipse";
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  isRoot?: boolean;
  style?: NodeStyle;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface MapState {
  nodes: Node[];
  edges: Edge[];
}

interface MindMap {
  id: string;
  title: string;
  updated_at: string;
  state: MapState;
}

const LOCAL_STORAGE_KEY = "acropole_mindmaps";
const MAX_HISTORY = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clona profunda de nós+arestas para guardar snapshot */
function cloneState(nodes: Node[], edges: Edge[]): MapState {
  return {
    nodes: nodes.map((n) => ({ ...n })),
    edges: edges.map((e) => ({ ...e })),
  };
}

/** Retorna todos os descendentes (filhos, netos, …) de um nó */
function getDescendants(nodeId: string, edges: Edge[]): string[] {
  const result: string[] = [];
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = edges.filter((e) => e.source === current).map((e) => e.target);
    result.push(...children);
    queue.push(...children);
  }
  return result;
}

function MindMapEditor() {
  const { mapId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selected & Editing state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState("");

  // Multi-select (Ctrl+A)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // Collapsed nodes (+ / - expand/collapse)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);

  // Shortcuts panel visibility
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);

  // Style Sidebar visibility
  const [showStyleSidebar, setShowStyleSidebar] = useState(false);

  // Canvas Transform (Pan & Zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Dragging Node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Container ref for viewport calculations
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Undo/Redo History ────────────────────────────────────────────────────────
  const undoStack = useRef<MapState[]>([]);
  const redoStack = useRef<MapState[]>([]);

  const pushHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    undoStack.current.push(cloneState(currentNodes, currentEdges));
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
  }, []);

  // Helper to update style of selected nodes
  const updateSelectedNodesStyle = useCallback(
    (styleUpdate: Partial<NodeStyle>) => {
      pushHistory(nodes, edges);
      const targets =
        selectedNodeIds.size > 0
          ? selectedNodeIds
          : new Set(selectedNodeId ? [selectedNodeId] : []);

      if (targets.size === 0) return;

      setNodes((nds) =>
        nds.map((n) => {
          if (targets.has(n.id)) {
            return {
              ...n,
              style: {
                ...(n.style || {}),
                ...styleUpdate,
              },
            };
          }
          return n;
        }),
      );
    },
    [nodes, edges, selectedNodeId, selectedNodeIds, pushHistory],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) {
      toast.info("Nada para desfazer.");
      return;
    }
    redoStack.current.push(cloneState(nodes, edges));
    const prev = undoStack.current.pop()!;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setSelectedNodeId(null);
    toast.success("Desfeito.");
  }, [nodes, edges]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) {
      toast.info("Nada para refazer.");
      return;
    }
    undoStack.current.push(cloneState(nodes, edges));
    const next = redoStack.current.pop()!;
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    toast.success("Refeito.");
  }, [nodes, edges]);

  // ── Fetch Map Details (Stale-While-Revalidate) ─────────────────────────────
  const fetchMap = useCallback(async () => {
    // 1) Carrega do LocalStorage instantaneamente (0ms de delay)
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    let foundLocally = false;
    if (local) {
      try {
        const allMaps: MindMap[] = JSON.parse(local);
        const currentMap = allMaps.find((m) => m.id === mapId);
        if (currentMap) {
          setTitle(currentMap.title);
          setNodes(currentMap.state?.nodes || []);
          setEdges(currentMap.state?.edges || []);
          foundLocally = true;
        }
      } catch {
        // ignorar erros de parse
      }
    }

    // Mostrar loading só se não há dados locais
    if (!foundLocally) setLoading(true);
    else setLoading(false);

    // 2) Sincroniza com Supabase em background (sem bloquear UI)
    try {
      const { data, error } = await supabase
        .from("mindmaps" as any)
        .select("*")
        .eq("id", mapId)
        .single();

      if (!error && data) {
        setTitle((data as any).title);
        setNodes((data as any).state?.nodes || []);
        setEdges((data as any).state?.edges || []);
      } else if (!foundLocally) {
        toast.error("Mapa não encontrado.");
        navigate({ to: "/mapas" });
      }
    } catch (err) {
      if (!foundLocally) {
        console.error(err);
        toast.error("Mapa não encontrado.");
        navigate({ to: "/mapas" });
      }
    } finally {
      setLoading(false);
    }
  }, [mapId, navigate]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  // ── Save Map ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (showToast = true) => {
      setSaving(true);
      const updatedMap = {
        title,
        state: { nodes, edges },
        updated_at: new Date().toISOString(),
      };

      try {
        const { error } = await supabase
          .from("mindmaps" as any)
          .update(updatedMap)
          .eq("id", mapId);

        if (error) throw error;
        if (showToast) toast.success("Mapa salvo com sucesso!");
      } catch {
        // Local fallback
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const allMaps: MindMap[] = JSON.parse(local);
          const updated = allMaps.map((m) => (m.id === mapId ? { ...m, ...updatedMap } : m));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          if (showToast) toast.success("Mapa salvo localmente!");
        }
      } finally {
        setSaving(false);
      }
    },
    [title, nodes, edges, mapId],
  );

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (nodes.length > 0) {
        const updatedMap = {
          title,
          state: { nodes, edges },
          updated_at: new Date().toISOString(),
        };
        supabase
          .from("mindmaps" as any)
          .update(updatedMap)
          .eq("id", mapId)
          .then(({ error }) => {
            if (error) {
              const local = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (local) {
                const allMaps: MindMap[] = JSON.parse(local);
                const updated = allMaps.map((m) => (m.id === mapId ? { ...m, ...updatedMap } : m));
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
              }
            }
          });
      }
    };
  }, [nodes, edges, title, mapId]);

  // ── Canvas Interaction Handlers ────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedNodeId(null);
      setSelectedNodeIds(new Set());
      setEditingNodeId(null);
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    } else if (draggingNodeId) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const spaceX = (clientX - pan.x) / zoom - dragOffset.current.x;
      const spaceY = (clientY - pan.y) / zoom - dragOffset.current.y;
      setNodes((nds) =>
        nds.map((n) => (n.id === draggingNodeId ? { ...n, x: spaceX, y: spaceY } : n)),
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) {
      setIsPanning(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  // ── Node Handlers ──────────────────────────────────────────────────────────

  const handleNodePointerDown = (e: React.PointerEvent<SVGGElement>, node: Node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);

    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const spaceX = (clientX - pan.x) / zoom;
    const spaceY = (clientY - pan.y) / zoom;

    setDraggingNodeId(node.id);
    dragOffset.current = { x: spaceX - node.x, y: spaceY - node.y };
  };

  const handleNodeDoubleClick = (node: Node) => {
    setEditingNodeId(node.id);
    setEditLabelText(node.label);
  };

  const handleRenameNode = (nodeId: string) => {
    if (!editLabelText.trim()) return;
    pushHistory(nodes, edges);
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, label: editLabelText.trim() } : n)),
    );
    setEditingNodeId(null);
  };

  // ── Viewport Helpers ────────────────────────────────────────────────────────

  const getViewportCenter = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = (rect.width / 2 - pan.x) / zoom;
      const centerY = (rect.height / 2 - pan.y) / zoom;
      return { x: centerX, y: centerY };
    }
    return { x: 400, y: 300 };
  }, [pan, zoom]);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // ── Node & Edge Management ─────────────────────────────────────────────────

  const addFreeNode = useCallback(() => {
    pushHistory(nodes, edges);
    const newId = `node-${Date.now()}`;
    const viewportCenter = getViewportCenter();
    const newNode: Node = {
      id: newId,
      label: "Nova Ideia",
      x: viewportCenter.x,
      y: viewportCenter.y,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    // Auto-enter edit mode
    setTimeout(() => {
      setEditingNodeId(newId);
      setEditLabelText("Nova Ideia");
    }, 50);
  }, [nodes, edges, getViewportCenter, pushHistory]);

  const addChildNode = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) return;
      pushHistory(nodes, edges);

      const newId = `node-${Date.now()}`;
      const childNode: Node = {
        id: newId,
        label: "Nova Subideia",
        x: parent.x + 200,
        y: parent.y + (Math.random() - 0.5) * 80,
      };
      const newEdge: Edge = { id: `edge-${parentId}-${newId}`, source: parentId, target: newId };

      setNodes((nds) => [...nds, childNode]);
      setEdges((eds) => [...eds, newEdge]);
      setSelectedNodeId(newId);
      setTimeout(() => {
        setEditingNodeId(newId);
        setEditLabelText("Nova Subideia");
      }, 50);
    },
    [nodes, edges, pushHistory],
  );

  const addSiblingNode = useCallback(
    (anchorId: string, above = false) => {
      const anchorEdge = edges.find((e) => e.target === anchorId);
      const anchor = nodes.find((n) => n.id === anchorId);
      if (!anchor) return;
      pushHistory(nodes, edges);

      const newId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newId,
        label: "Nova Ideia",
        x: anchor.x,
        y: anchor.y + (above ? -80 : 80),
      };
      const newEdges = anchorEdge
        ? [{ id: `edge-${anchorEdge.source}-${newId}`, source: anchorEdge.source, target: newId }]
        : [];

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, ...newEdges]);
      setSelectedNodeId(newId);
      setTimeout(() => {
        setEditingNodeId(newId);
        setEditLabelText("Nova Ideia");
      }, 50);
    },
    [nodes, edges, pushHistory],
  );

  const promoteNode = useCallback(
    (nodeId: string) => {
      // Promove: move para nível do pai (conecta ao avô)
      const parentEdge = edges.find((e) => e.target === nodeId);
      if (!parentEdge) return;
      const grandparentEdge = edges.find((e) => e.target === parentEdge.source);
      if (!grandparentEdge) return;

      pushHistory(nodes, edges);
      setEdges((eds) =>
        eds
          .filter((e) => e.id !== parentEdge.id)
          .map((e) =>
            e.id === grandparentEdge.id
              ? e
              : e.source === parentEdge.source && e.target === nodeId
                ? { ...e, source: grandparentEdge.source }
                : e,
          )
          .concat({
            id: `edge-${grandparentEdge.source}-${nodeId}`,
            source: grandparentEdge.source,
            target: nodeId,
          })
          .filter(
            (e) =>
              !(
                e.source === parentEdge.source &&
                e.target === nodeId &&
                e.id !== `edge-${grandparentEdge.source}-${nodeId}`
              ),
          ),
      );
      toast.success("Nó promovido.");
    },
    [nodes, edges, pushHistory],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.isRoot) {
        toast.error("O nó central não pode ser excluído.");
        return;
      }
      pushHistory(nodes, edges);
      // Delete node and all descendants
      const descendants = getDescendants(nodeId, edges);
      const toDelete = new Set([nodeId, ...descendants]);
      setNodes((nds) => nds.filter((n) => !toDelete.has(n.id)));
      setEdges((eds) => eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)));
      setSelectedNodeId(null);
      setEditingNodeId(null);
    },
    [nodes, edges, pushHistory],
  );

  // ── Copy / Paste ────────────────────────────────────────────────────────────

  const copySubtree = useCallback(
    (nodeId: string) => {
      const subtreeNodeIds = new Set([nodeId, ...getDescendants(nodeId, edges)]);
      const copiedNodes = nodes.filter((n) => subtreeNodeIds.has(n.id));
      const copiedEdges = edges.filter(
        (e) => subtreeNodeIds.has(e.source) && subtreeNodeIds.has(e.target),
      );
      setClipboard({ nodes: copiedNodes, edges: copiedEdges });
      toast.success(`${copiedNodes.length} nó(s) copiado(s).`);
    },
    [nodes, edges],
  );

  const pasteSubtree = useCallback(() => {
    if (!clipboard) {
      toast.info("Área de transferência vazia.");
      return;
    }
    pushHistory(nodes, edges);

    const offset = { x: 40, y: 40 };
    const idMap = new Map<string, string>();
    clipboard.nodes.forEach((n) => {
      idMap.set(n.id, `node-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    });

    const newNodes: Node[] = clipboard.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      x: n.x + offset.x,
      y: n.y + offset.y,
      isRoot: false,
    }));
    const newEdges: Edge[] = clipboard.edges.map((e) => ({
      id: `edge-${idMap.get(e.source)}-${idMap.get(e.target)}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    const rootId = idMap.get(clipboard.nodes[0]?.id);
    if (rootId) setSelectedNodeId(rootId);
    toast.success("Colado!");
  }, [clipboard, nodes, edges, pushHistory]);

  // ── Expand / Collapse ────────────────────────────────────────────────────────

  const toggleCollapse = useCallback((nodeId: string, forceCollapse?: boolean) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (forceCollapse !== undefined) {
        if (forceCollapse) next.add(nodeId);
        else next.delete(nodeId);
      } else {
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsedNodes(new Set()), []);
  const collapseAll = useCallback(() => {
    // Colapsa todos os nós que têm filhos, exceto raiz
    const parents = new Set(edges.map((e) => e.source));
    const root = nodes.find((n) => n.isRoot);
    parents.delete(root?.id ?? "");
    setCollapsedNodes(new Set(parents));
  }, [nodes, edges]);

  // ── Nodes visíveis (respeitando colapso) ────────────────────────────────────

  const visibleNodeIds = useCallback((): Set<string> => {
    const visible = new Set<string>();
    const root = nodes.find((n) => n.isRoot) || nodes[0];
    if (!root) return visible;

    const queue = [root.id];
    while (queue.length) {
      const curr = queue.shift()!;
      visible.add(curr);
      if (!collapsedNodes.has(curr)) {
        const children = edges.filter((e) => e.source === curr).map((e) => e.target);
        queue.push(...children);
      }
    }
    return visible;
  }, [nodes, edges, collapsedNodes]);

  // ── Layout ────────────────────────────────────────────────────────────────

  const autoLayout = useCallback(() => {
    const root = nodes.find((n) => n.isRoot) || nodes[0];
    if (!root) return;
    pushHistory(nodes, edges);

    const visited = new Set<string>();
    const layout = (nodeId: string, depth: number, angleStart: number, angleRange: number) => {
      visited.add(nodeId);
      const childEdges = edges.filter((e) => e.source === nodeId);
      const childIds = childEdges.map((e) => e.target).filter((id) => !visited.has(id));
      if (childIds.length === 0) return;
      const angleStep = angleRange / childIds.length;
      childIds.forEach((childId, index) => {
        const angle = angleStart + index * angleStep + angleStep / 2;
        const radius = 180 + depth * 50;
        const newX = root.x + radius * Math.cos(angle);
        const newY = root.y + radius * Math.sin(angle);
        setNodes((nds) => nds.map((n) => (n.id === childId ? { ...n, x: newX, y: newY } : n)));
        layout(childId, depth + 1, angle - angleStep / 2, angleStep);
      });
    };
    layout(root.id, 1, -Math.PI, Math.PI * 2);
    toast.success("Layout automático aplicado!");
  }, [nodes, edges, pushHistory]);

  // ── Move Up/Down among siblings ────────────────────────────────────────────

  const moveSibling = useCallback(
    (nodeId: string, direction: "up" | "down") => {
      const parentEdge = edges.find((e) => e.target === nodeId);
      if (!parentEdge) return;
      const siblings = nodes.filter((n) =>
        edges.some((e) => e.source === parentEdge.source && e.target === n.id),
      );
      const idx = siblings.findIndex((n) => n.id === nodeId);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return;

      pushHistory(nodes, edges);
      const dy = siblings[swapIdx].y - siblings[idx].y;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) return { ...n, y: n.y + dy };
          if (n.id === siblings[swapIdx].id) return { ...n, y: n.y - dy };
          return n;
        }),
      );
    },
    [nodes, edges, pushHistory],
  );

  // ── Center on Root ─────────────────────────────────────────────────────────

  const centerOnRoot = useCallback(() => {
    const root = nodes.find((n) => n.isRoot) || nodes[0];
    if (!root || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: rect.width / 2 - root.x * zoom,
      y: rect.height / 2 - root.y * zoom,
    });
  }, [nodes, zoom]);

  // ── useMindmapShortcuts integration ────────────────────────────────────────

  useMindmapShortcuts(
    {
      addSiblingBelow: () => selectedNodeId && addSiblingNode(selectedNodeId, false),
      addSiblingAbove: () => selectedNodeId && addSiblingNode(selectedNodeId, true),
      addChild: () => selectedNodeId && addChildNode(selectedNodeId),
      promoteNode: () => selectedNodeId && promoteNode(selectedNodeId),
      addParent: () => {
        // Ctrl+Enter: adiciona nó pai (insere entre raiz e selecionado)
        toast.info("Funcionalidade em breve: Inserir nó pai.");
      },
      startEditSelected: () => {
        if (selectedNodeId) {
          const node = nodes.find((n) => n.id === selectedNodeId);
          if (node) {
            setEditingNodeId(node.id);
            setEditLabelText(node.label);
          }
        }
      },
      deleteSelected: () => selectedNodeId && deleteNode(selectedNodeId),
      undo: handleUndo,
      redo: handleRedo,
      copySelected: () => selectedNodeId && copySubtree(selectedNodeId),
      cutSelected: () => {
        if (selectedNodeId) {
          copySubtree(selectedNodeId);
          deleteNode(selectedNodeId);
        }
      },
      pasteClipboard: pasteSubtree,
      save: () => handleSave(true),
      selectAll: () => {
        const allIds = new Set(nodes.map((n) => n.id));
        setSelectedNodeIds(allIds);
        toast.info(`${allIds.size} nó(s) selecionado(s).`);
      },
      selectSiblings: () => {
        if (!selectedNodeId) return;
        const parentEdge = edges.find((e) => e.target === selectedNodeId);
        if (!parentEdge) return;
        const siblings = edges.filter((e) => e.source === parentEdge.source).map((e) => e.target);
        setSelectedNodeIds(new Set(siblings));
        toast.info(`${siblings.length} irmão(s) selecionado(s).`);
      },
      expandSelected: () => selectedNodeId && toggleCollapse(selectedNodeId, false),
      collapseSelected: () => selectedNodeId && toggleCollapse(selectedNodeId, true),
      expandAll,
      collapseAll,
      moveUp: () => selectedNodeId && moveSibling(selectedNodeId, "up"),
      moveDown: () => selectedNodeId && moveSibling(selectedNodeId, "down"),
      zoomIn: () => setZoom((z) => Math.min(2.5, z + 0.15)),
      zoomOut: () => setZoom((z) => Math.max(0.3, z - 0.15)),
      zoomReset: () => setZoom(1),
      goHome: centerOnRoot,
      toggleShortcutsPanel: () => setShowShortcutsPanel((v) => !v),
      clearSelection: () => {
        setSelectedNodeId(null);
        setSelectedNodeIds(new Set());
      },
      commitEditEsc: () => setEditingNodeId(null),
    },
    !!editingNodeId,
    !!selectedNodeId,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
        Carregando Canvas…
      </div>
    );
  }

  const visible = visibleNodeIds();

  return (
    <div className="relative flex h-screen flex-col bg-background" ref={containerRef}>
      {/* ── Keyboard Shortcuts Panel ─────────────────────────────────────── */}
      {showShortcutsPanel && (
        <KeyboardShortcutsPanel onClose={() => setShowShortcutsPanel(false)} />
      )}

      {/* ── Top Toolbar ─────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/mapas" })}
            className="hover:bg-muted"
            title="Voltar para lista"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 w-64 border-none bg-transparent font-display text-lg font-bold focus-visible:ring-1 focus-visible:ring-gold"
            placeholder="Título do Mapa"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addFreeNode}
            className="border-border/60 hover:bg-muted"
            title="Adicionar nó livre"
          >
            <Plus className="mr-2 h-4 w-4 text-gold" />
            Adicionar Nó
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={autoLayout}
            className="border-border/60 hover:bg-muted"
            title="Auto Layout radial"
          >
            <Layout className="mr-2 h-4 w-4 text-blue-500" />
            Auto Layout
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsPanel(true)}
            className="border-border/60 hover:bg-muted"
            title="Atalhos de teclado (Ctrl+Shift+L)"
          >
            <Keyboard className="mr-2 h-4 w-4 text-muted-foreground" />
            Atalhos
          </Button>
          <Button
            variant={showStyleSidebar ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowStyleSidebar((v) => !v)}
            className={`border-border/60 hover:bg-muted ${showStyleSidebar ? "bg-muted text-primary" : ""}`}
            title="Estilizar nós selecionados"
          >
            <Paintbrush className="mr-2 h-4 w-4 text-gold" />
            Estilo
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            title="Salvar mapa (Ctrl+S)"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* ── Canvas & Sidebar Wrapper ───────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── SVG Canvas Viewport ──────────────────────────── */}
        <div className="relative flex-1 overflow-hidden select-none">
          <svg
            className="h-full w-full bg-background/50 cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={(e) => {
              e.preventDefault();
              setPan((p) => ({ ...p, y: p.y - e.deltaY }));
            }}
          >
            {/* Grid Background */}
            <defs>
              <pattern
                id="grid"
                width={40}
                height={40}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
              >
                <circle cx={20} cy={20} r={1} fill="rgba(212,175,55,0.15)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Transformed Content Group */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges / Connections */}
              <g className="edges-group">
                {edges.map((edge) => {
                  const sourceNode = nodes.find((n) => n.id === edge.source);
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  if (!visible.has(edge.source) || !visible.has(edge.target)) return null;

                  const dx = targetNode.x - sourceNode.x;
                  const dy = targetNode.y - sourceNode.y;
                  const path = `M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x + dx / 2} ${sourceNode.y}, ${sourceNode.x + dx / 2} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`;

                  return (
                    <path
                      key={edge.id}
                      d={path}
                      fill="none"
                      stroke="rgba(212,175,55,0.4)"
                      strokeWidth={2}
                      className="transition-all"
                    />
                  );
                })}
              </g>

              {/* Nodes */}
              <g className="nodes-group">
                {nodes.map((node) => {
                  if (!visible.has(node.id)) return null;

                  const isSelected = selectedNodeId === node.id || selectedNodeIds.has(node.id);
                  const isEditing = editingNodeId === node.id;
                  const hasChildren = edges.some((e) => e.source === node.id);
                  const isCollapsed = collapsedNodes.has(node.id);

                  // Dynamic styles with fallbacks
                  const shape = node.style?.shape || "rounded-rect";
                  const w = node.style?.width || 150;
                  const h = node.style?.height || 44;
                  const fontFamily = node.style?.fontFamily || "inherit";
                  const fontSize = node.style?.fontSize || 12;
                  const bold = node.style?.bold ?? true;

                  const rectClass = `transition-colors duration-200 stroke-[1.5] ${
                    node.isRoot
                      ? "fill-primary text-primary-foreground stroke-gold"
                      : isSelected
                        ? "fill-card stroke-gold/90 shadow-md"
                        : "fill-card/90 stroke-border hover:stroke-gold/50"
                  }`;

                  let shapeElement;
                  if (shape === "rect") {
                    shapeElement = (
                      <rect
                        x={-w / 2}
                        y={-h / 2}
                        width={w}
                        height={h}
                        rx={0}
                        className={rectClass}
                      />
                    );
                  } else if (shape === "ellipse") {
                    shapeElement = (
                      <ellipse cx={0} cy={0} rx={w / 2} ry={h / 2} className={rectClass} />
                    );
                  } else {
                    // rounded-rect (default)
                    shapeElement = (
                      <rect
                        x={-w / 2}
                        y={-h / 2}
                        width={w}
                        height={h}
                        rx={h / 2}
                        className={rectClass}
                      />
                    );
                  }

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onPointerDown={(e) => handleNodePointerDown(e, node)}
                      onDoubleClick={() => handleNodeDoubleClick(node)}
                      className="cursor-pointer group"
                    >
                      {/* Render shape */}
                      {shapeElement}

                      {/* Node Text Label */}
                      {!isEditing ? (
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          y={2}
                          className={`select-none pointer-events-none ${
                            node.isRoot ? "fill-primary-foreground" : "fill-foreground"
                          }`}
                          style={{
                            fontFamily,
                            fontSize: `${fontSize}px`,
                            fontWeight: bold ? "bold" : "normal",
                          }}
                        >
                          {node.label}
                        </text>
                      ) : (
                        <foreignObject
                          x={-w / 2 + 5}
                          y={-h / 2 + 4}
                          width={w - 10}
                          height={h - 8}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            value={editLabelText}
                            onChange={(e) => setEditLabelText(e.target.value)}
                            onBlur={() => handleRenameNode(node.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameNode(node.id);
                              if (e.key === "Escape") setEditingNodeId(null);
                            }}
                            className={`w-full h-full text-center border border-primary/50 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary px-2 ${
                              shape === "ellipse" || shape === "rounded-rect"
                                ? "rounded-full"
                                : "rounded"
                            }`}
                            style={{
                              fontFamily,
                              fontSize: `${fontSize}px`,
                              fontWeight: bold ? "bold" : "normal",
                            }}
                          />
                        </foreignObject>
                      )}

                      {/* Collapse indicator */}
                      {hasChildren && (
                        <g
                          transform={`translate(0, ${h / 2 + 6})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCollapse(node.id);
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            r={7}
                            className="fill-card stroke-border stroke-1 hover:stroke-gold/70 transition-colors"
                          />
                          <text
                            textAnchor="middle"
                            dominantBaseline="middle"
                            y={1}
                            fontSize={10}
                            className="fill-muted-foreground select-none pointer-events-none font-bold"
                          >
                            {isCollapsed ? "+" : "−"}
                          </text>
                        </g>
                      )}

                      {/* Action handles shown on selected node */}
                      {isSelected && !isEditing && (
                        <g className="action-handles">
                          {/* Plus Handle to add sub-nodes */}
                          <g
                            transform={`translate(${w / 2 + 10}, 0)`}
                            onClick={(e) => {
                              e.stopPropagation();
                              addChildNode(node.id);
                            }}
                            className="hover:scale-110 transition-transform"
                          >
                            <circle r={10} className="fill-primary stroke-gold stroke-1" />
                            <path d="M -4 0 L 4 0 M 0 -4 L 0 4" stroke="white" strokeWidth={1.5} />
                          </g>

                          {/* Trash Handle to delete node (if not root) */}
                          {!node.isRoot && (
                            <g
                              transform={`translate(${-w / 2 - 10}, 0)`}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              className="hover:scale-110 transition-transform cursor-pointer"
                            >
                              <circle
                                r={10}
                                className="fill-destructive stroke-destructive-foreground stroke-1"
                              />
                              <path
                                d="M -3.5 -3.5 L 3.5 3.5 M 3.5 -3.5 L -3.5 3.5"
                                stroke="white"
                                strokeWidth={1.5}
                              />
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* ── Floating Control Panel ───────────────────────── */}
          <div className="absolute bottom-6 right-6 flex items-center gap-1 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-1.5 shadow-lg backdrop-blur-md z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              title="Aumentar Zoom (Ctrl++)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              title="Diminuir Zoom (Ctrl+-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetView}
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              title="Redefinir Visualização (Ctrl+0)"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Help Tip overlay */}
          <div className="absolute bottom-6 left-6 text-xs text-muted-foreground bg-card/60 px-3 py-1.5 rounded-lg border border-border/40 backdrop-blur-sm pointer-events-none">
            💡 <strong>Tab</strong> = filho · <strong>Enter</strong> = irmão · <strong>F2</strong> =
            editar · <strong>Ctrl+Shift+L</strong> = atalhos
          </div>

          {/* Undo/Redo quick buttons */}
          <div className="absolute top-4 right-6 flex items-center gap-1 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted"
              title="Desfazer (Ctrl+Z)"
              disabled={undoStack.current.length === 0}
            >
              ↩ Desfazer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted"
              title="Refazer (Ctrl+Y)"
              disabled={redoStack.current.length === 0}
            >
              ↪ Refazer
            </Button>
          </div>
        </div>

        {/* Style Sidebar */}
        {showStyleSidebar && (
          <div className="w-80 border-l border-border bg-card/90 p-6 backdrop-blur-md overflow-y-auto z-20 flex flex-col gap-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-gold" />
                Estilo do Nó
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStyleSidebar(false)}
                className="h-8 w-8 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {(() => {
              // Gather active selections
              const activeIds =
                selectedNodeIds.size > 0
                  ? Array.from(selectedNodeIds)
                  : selectedNodeId
                    ? [selectedNodeId]
                    : [];

              if (activeIds.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                    <div className="rounded-full bg-muted p-4 text-gold/60">
                      <Paintbrush className="h-8 w-8" />
                    </div>
                    <p className="text-sm px-4">
                      Selecione um ou mais nós no mapa mental para alterar sua aparência e fontes.
                    </p>
                  </div>
                );
              }

              // Read representative styles (from the first selected node)
              const firstNode = nodes.find((n) => n.id === activeIds[0]);
              const style = firstNode?.style || {};
              const shape = style.shape || "rounded-rect";
              const width = style.width || 150;
              const height = style.height || 44;
              const fontFamily = style.fontFamily || "inherit";
              const fontSize = style.fontSize || 12;
              const bold = style.bold ?? true;

              return (
                <div className="flex flex-col gap-6 text-sm">
                  {/* Selected count info badge */}
                  <div className="bg-muted/50 text-xs px-3 py-1.5 rounded-lg text-muted-foreground text-center">
                    {activeIds.length === 1
                      ? "1 nó selecionado"
                      : `${activeIds.length} nós selecionados`}
                  </div>

                  {/* Formato dos Quadros */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-foreground">Formato do Quadro</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { value: "rounded-rect", label: "Pílula" },
                          { value: "rect", label: "Retângulo" },
                          { value: "ellipse", label: "Elipse" },
                        ] as const
                      ).map((item) => (
                        <Button
                          key={item.value}
                          variant={shape === item.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSelectedNodesStyle({ shape: item.value })}
                          className={`text-xs ${
                            shape === item.value
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Ajuste de Tamanho */}
                  <div className="flex flex-col gap-4">
                    <label className="font-semibold text-foreground">Tamanho do Quadro</label>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Largura</span>
                        <span className="font-mono">{width}px</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[width]}
                          min={100}
                          max={250}
                          step={5}
                          onValueChange={(val) => updateSelectedNodesStyle({ width: val[0] })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Altura</span>
                        <span className="font-mono">{height}px</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[height]}
                          min={30}
                          max={80}
                          step={2}
                          onValueChange={(val) => updateSelectedNodesStyle({ height: val[0] })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Texto Section */}
                  <div className="border-t border-border/40 my-2"></div>

                  {/* Fonte */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-foreground">Fonte</label>
                    <Select
                      value={fontFamily}
                      onValueChange={(val) => updateSelectedNodesStyle({ fontFamily: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial" className="font-sans">
                          Arial
                        </SelectItem>
                        <SelectItem value="Arial Black" className="font-sans font-black">
                          Arial Black
                        </SelectItem>
                        <SelectItem value="Calibri" className="font-sans">
                          Calibri
                        </SelectItem>
                        <SelectItem value="Candara" className="font-sans">
                          Candara
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tamanho do texto */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-foreground">Tamanho da Fonte</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[8, 10, 12, 14, 16, 18, 20].map((sz) => (
                        <Button
                          key={sz}
                          variant={fontSize === sz ? "default" : "outline"}
                          size="icon"
                          onClick={() => updateSelectedNodesStyle({ fontSize: sz })}
                          className={`h-8 w-8 text-xs font-semibold ${
                            fontSize === sz
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {sz}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Estilo (Negrito) */}
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/40">
                    <span className="font-semibold text-foreground">Negrito</span>
                    <Button
                      variant={bold ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSelectedNodesStyle({ bold: !bold })}
                      className={`h-8 px-4 text-xs font-bold ${
                        bold ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {bold ? "Ativado" : "Desativado"}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
