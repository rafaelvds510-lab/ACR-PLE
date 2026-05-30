'use client';

import React, { useCallback, useReducer } from 'react';
import { Node, Edge, addEdge, Connection } from '@xyflow/react';

// Branch colors – each main topic gets one
export const BRANCH_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FF8C42', '#95E1D3',
  '#F38181', '#6C63FF', '#FFC107', '#43AA8B',
];

export type NodeType = 'central' | 'main' | 'sub';

export interface MindNodeData {
  label: string;
  nodeType: NodeType;
  branchColor?: string;
  shape?: 'rectangle' | 'pill' | 'diamond' | 'circle';
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  onChange?: (id: string, label: string) => void;
  onAddChild?: (id: string) => void;
  [key: string]: unknown;
}

interface MindMapState {
  nodes: Node[];
  edges: Edge[];
  history: Array<{ nodes: Node[]; edges: Edge[] }>;
  future: Array<{ nodes: Node[]; edges: Edge[] }>;
}

type Action =
  | { type: 'SET'; nodes: Node[]; edges: Edge[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY' };

function reducer(state: MindMapState, action: Action): MindMapState {
  switch (action.type) {
    case 'SET':
      return {
        ...state,
        nodes: action.nodes,
        edges: action.edges,
        history: [...state.history.slice(-20), { nodes: state.nodes, edges: state.edges }],
        future: [],
      };
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        nodes: prev.nodes,
        edges: prev.edges,
        history: state.history.slice(0, -1),
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        nodes: next.nodes,
        edges: next.edges,
        history: [...state.history, { nodes: state.nodes, edges: state.edges }],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

const initialRootNode = (): Node => ({
  id: 'root',
  type: 'central',
  data: { label: 'Tópico Central', nodeType: 'central' },
  position: { x: 0, y: 0 },
  draggable: true,
});

export function useMindMap(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  const [state, dispatch] = useReducer(reducer, {
    nodes: initialNodes.length > 0 ? initialNodes : [initialRootNode()],
    edges: initialEdges,
    history: [],
    future: [],
  });

  const { nodes, edges } = state;

  // ─── Node label update ────────────────────────────────────────────────
  const setNodes = useCallback((updater: (nds: Node[]) => Node[]) => {
    dispatch({ type: 'SET', nodes: updater(nodes), edges });
  }, [nodes, edges]);

  const setEdges = useCallback((updater: (eds: Edge[]) => Edge[]) => {
    dispatch({ type: 'SET', nodes, edges: updater(edges) });
  }, [nodes, edges]);

  const onLabelChange = useCallback((id: string, label: string) => {
    dispatch({
      type: 'SET',
      nodes: nodes.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n),
      edges,
    });
  }, [nodes, edges]);

  // ─── Add child node ───────────────────────────────────────────────────
  const addChildNode = useCallback((parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const parentData = parent.data as MindNodeData;
    const isRoot = parentData.nodeType === 'central';
    const isMain = parentData.nodeType === 'main';

    // Determine branch color
    const mainChildren = edges.filter(e => e.source === 'root').length;
    const branchColor = isRoot
      ? BRANCH_COLORS[mainChildren % BRANCH_COLORS.length]
      : (parentData.branchColor || BRANCH_COLORS[0]);

    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: isRoot ? 'main' : 'sub',
      data: {
        label: isRoot ? 'Novo Tópico' : 'Subtópico',
        nodeType: isRoot ? 'main' : 'sub',
        branchColor,
        shape: 'pill',
      },
      position: {
        x: parent.position.x + (isRoot ? 300 : 250),
        y: parent.position.y + (mainChildren * 80),
      },
    };

    const newEdge: Edge = {
      id: `e-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'branch',
      data: { branchColor },
      animated: false,
    };

    dispatch({
      type: 'SET',
      nodes: [...nodes, newNode],
      edges: [...edges, newEdge],
    });
  }, [nodes, edges]);

  // ─── Add sibling node ─────────────────────────────────────────────────
  const addSiblingNode = useCallback((nodeId: string) => {
    const parentEdge = edges.find(e => e.target === nodeId);
    if (!parentEdge) return;
    addChildNode(parentEdge.source);
  }, [edges, addChildNode]);

  // ─── Delete node (and all descendants) ───────────────────────────────
  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'root') return; // Can't delete root

    const toDelete = new Set<string>([nodeId]);
    // BFS to find all descendants
    let queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = edges.filter(e => e.source === current).map(e => e.target);
      children.forEach(c => { toDelete.add(c); queue.push(c); });
    }

    dispatch({
      type: 'SET',
      nodes: nodes.filter(n => !toDelete.has(n.id)),
      edges: edges.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)),
    });
  }, [nodes, edges]);

  // ─── Update node style ────────────────────────────────────────────────
  const updateNodeStyle = useCallback((nodeId: string, patch: Partial<MindNodeData>) => {
    dispatch({
      type: 'SET',
      nodes: nodes.map(n => {
        if (n.id !== nodeId) return n;
        const newData = { ...n.data, ...patch };
        // If branchColor changes on a main node, cascade to all its descendants
        if (patch.branchColor && (n.data as MindNodeData).nodeType === 'main') {
          const updateDescendants = (nid: string, allNodes: Node[]): Node[] => {
            return allNodes.map(nd => {
              if (edges.some(e => e.source === nid && e.target === nd.id)) {
                return { ...nd, data: { ...nd.data, branchColor: patch.branchColor } };
              }
              return nd;
            });
          };
          // Simple 2-level cascade
          const updated = updateDescendants(nodeId, nodes.map(nd => nd.id === nodeId ? { ...nd, data: newData } : nd));
          dispatch({ type: 'SET', nodes: updated, edges });
          return n; // Will be handled above
        }
        return { ...n, data: newData };
      }),
      edges: patch.branchColor
        ? edges.map(e => e.source === nodeId || e.target === nodeId
            ? { ...e, data: { ...e.data, branchColor: patch.branchColor } }
            : e)
        : edges,
    });
  }, [nodes, edges]);

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, type: 'branch' }, eds));
  }, [setEdges]);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const canUndo = state.history.length > 0;
  const canRedo = state.future.length > 0;

  return {
    nodes, edges, setNodes, setEdges,
    onLabelChange, addChildNode, addSiblingNode,
    deleteNode, updateNodeStyle, onConnect,
    undo, redo, canUndo, canRedo,
  };
}
