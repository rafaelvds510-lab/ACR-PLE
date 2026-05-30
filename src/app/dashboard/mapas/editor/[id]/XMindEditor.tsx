'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import MindCanvas from './canvas/MindCanvas';
import TopToolbar from './panels/TopToolbar';
import StylePanel from './panels/StylePanel';
import { useMindMap, MindNodeData } from './hooks/useMindMap';
import { useAutoLayout, LayoutMode } from './hooks/useAutoLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import styles from './xmind.module.css';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

interface XMindEditorProps {
  mapId: string;
  initialTitle: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

function XMindEditorInner({ mapId, initialTitle, initialNodes, initialEdges }: XMindEditorProps) {
  const { fitView } = useReactFlow();

  const {
    nodes, edges, setNodes, setEdges,
    onLabelChange, addChildNode, addSiblingNode,
    deleteNode, updateNodeStyle, onConnect,
    undo, redo, canUndo, canRedo,
  } = useMindMap(initialNodes, initialEdges);

  const { applyLayout } = useAutoLayout();

  const [title, setTitle] = useState(initialTitle);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutMode>('mindmap');
  const [zenMode, setZenMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ─── Handle node/edge changes from React Flow ────────────────────────
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  // ─── Layout ──────────────────────────────────────────────────────────
  const handleLayout = useCallback((mode: LayoutMode) => {
    setCurrentLayout(mode);
    const layouted = applyLayout(nodes, edges, mode);
    setNodes(() => layouted);
    // After layout animation, fit the view
    setTimeout(() => fitView({ padding: 0.25, duration: 500 }), 500);
  }, [nodes, edges, applyLayout, setNodes, fitView]);

  // ─── Save ────────────────────────────────────────────────────────────
  const saveMap = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const nodesToSave = nodes.map(({ data, style, ...rest }) => {
        const { onChange, onAddChild, ...cleanData } = data as any;
        return { ...rest, data: cleanData, style: {} };
      });
      await fetch(`/api/mindmaps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, state: { nodes: nodesToSave, edges } }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('idle');
    }
  }, [nodes, edges, title, mapId]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────
  useKeyboardShortcuts({
    onTab: () => selectedNode && addChildNode(selectedNode.id),
    onEnter: () => selectedNode && addSiblingNode(selectedNode.id),
    onDelete: () => selectedNode && deleteNode(selectedNode.id),
    onUndo: undo,
    onRedo: redo,
    onCenter: () => fitView({ padding: 0.25, duration: 400 }),
    onZenToggle: () => setZenMode(z => !z),
  });

  // ─── Auto-save on Ctrl+S ─────────────────────────────────────────────
  React.useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveMap();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [saveMap]);

  return (
    <div className={styles.editorShell}>
      <div className={zenMode ? styles.zenHide : undefined}>
        <TopToolbar
          title={title}
          onTitleChange={setTitle}
          onSave={saveMap}
          onAddChild={addChildNode}
          selectedNodeId={selectedNode?.id || null}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onLayout={handleLayout}
          currentLayout={currentLayout}
          saveStatus={saveStatus}
          zenMode={zenMode}
          onZenToggle={() => setZenMode(z => !z)}
          nodes={nodes}
          edges={edges}
        />
      </div>

      <div className={styles.canvasArea}>
        <div className={styles.rfWrapper}>
          <MindCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeSelect={setSelectedNode}
            onLabelChange={onLabelChange}
            onAddChild={addChildNode}
          />
        </div>

        <div className={zenMode ? styles.zenHide : undefined}>
          <StylePanel
            selectedNode={selectedNode}
            onUpdateStyle={updateNodeStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default function XMindEditor(props: XMindEditorProps) {
  return (
    <ReactFlowProvider>
      <XMindEditorInner {...props} />
    </ReactFlowProvider>
  );
}
