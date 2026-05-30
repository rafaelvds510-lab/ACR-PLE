'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  NodeChange, EdgeChange, Node, Edge, SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CentralNode from './nodes/CentralNode';
import MainNode from './nodes/MainNode';
import SubNode from './nodes/SubNode';
import BranchEdge from './edges/BranchEdge';
import { MindNodeData } from '../hooks/useMindMap';

const nodeTypes = {
  central: CentralNode,
  main: MainNode,
  sub: SubNode,
  mindMap: MainNode, // backward-compat alias for old saved maps
};

const edgeTypes = {
  branch: BranchEdge,
};

interface MindCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (params: any) => void;
  onNodeSelect: (node: Node | null) => void;
  onLabelChange: (id: string, label: string) => void;
  onAddChild: (id: string) => void;
}

export default function MindCanvas({
  nodes, edges, onNodesChange, onEdgesChange,
  onConnect, onNodeSelect, onLabelChange, onAddChild,
}: MindCanvasProps) {
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: { ...n.data, onChange: onLabelChange, onAddChild },
  }));

  const handleSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    onNodeSelect(sel.length === 1 ? sel[0] : null);
  }, [onNodeSelect]);

  return (
    <ReactFlow
      nodes={nodesWithCallbacks}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={handleSelectionChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      snapToGrid
      snapGrid={[20, 20]}
      // Left-drag on empty = rubber-band box selection
      selectionOnDrag
      selectionMode={SelectionMode.Partial}
      // Pan only with middle (1) or right (2) mouse button
      panOnDrag={[1, 2]}
      // We handle Delete/Ctrl+Z ourselves — suppress ReactFlow defaults
      deleteKeyCode={null}
      multiSelectionKeyCode="Shift"
      style={{ background: '#F7F7F5' }}
    >
      <Background color="#C9C9C7" variant="dots" gap={24} size={1.5} />
      <Controls
        showInteractive={false}
        style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      />
      <MiniMap
        nodeColor={n => {
          const d = n.data as MindNodeData;
          return d.nodeType === 'central' ? '#2c2c2c' : (d.branchColor || '#4ECDC4');
        }}
        maskColor="rgba(247,247,245,0.7)"
        style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8 }}
      />
    </ReactFlow>
  );
}
