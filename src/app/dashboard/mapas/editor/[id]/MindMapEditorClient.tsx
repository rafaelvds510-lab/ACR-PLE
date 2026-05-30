'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { Save, Layout, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import MindMapNode, { NodeData } from './MindMapNode';
import styles from '../../mapas.module.css';

const nodeTypes = {
  mindMap: MindMapNode,
};

interface MindMapEditorClientProps {
  mapId: string;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 150;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

function MindMapEditorContent({ mapId }: MindMapEditorClientProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const nodesRef = React.useRef(nodes);
  const edgesRef = React.useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const onLabelChange = useCallback((id: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const addChildNode = useCallback((parentId: string) => {
    const parentNode = nodesRef.current.find(n => n.id === parentId);
    if (!parentNode) {
      console.error('Parent node not found:', parentId);
      return;
    }

    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'mindMap',
      data: { 
        label: 'Nova Camada', 
        type: 'rectangle',
        onChange: onLabelChange,
        onAddChild: addChildNode
      },
      position: { x: parentNode.position.x, y: parentNode.position.y + 100 },
    };

    const newEdge: Edge = {
      id: `edge-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      animated: true,
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
  }, [onLabelChange, setEdges, setNodes]);

  const fetchMapData = useCallback(async () => {
    try {
      const res = await fetch(`/api/mindmaps/${mapId}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        if (data.state) {
          const loadedNodes = (data.state.nodes || []).map((n: any) => ({
            ...n,
            data: { ...n.data, onChange: onLabelChange, onAddChild: addChildNode }
          }));
          setNodes(loadedNodes);
          setEdges(data.state.edges || []);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [mapId, onLabelChange, addChildNode, setNodes, setEdges]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const saveMap = async () => {
    setSaving(true);
    try {
      // Strip callbacks before saving to JSON
      const nodesToSave = nodesRef.current.map(({ data, ...rest }) => {
        const { onChange, onAddChild, ...cleanData } = data as any;
        return { ...rest, data: cleanData };
      });

      await fetch(`/api/mindmaps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, state: { nodes: nodesToSave, edges: edgesRef.current } }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setSaving(false), 1000);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'mindMap',
      data: { 
        label: 'Nova Ideia', 
        type: 'rectangle',
        onChange: onLabelChange,
        onAddChild: addChildNode
      },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, onLabelChange, addChildNode]);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const exportImage = useCallback(() => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (element) {
      toPng(element, {
        backgroundColor: '#fff',
        filter: (node) => !node.classList?.contains('react-flow__controls') && !node.classList?.contains('react-flow__minimap'),
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${title}.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  }, [title]);

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          style={{fontSize: 18, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', marginRight: 20}}
        />
        <button className={styles.toolBtn} onClick={addNode}><Plus size={16} /> Adicionar Nó</button>
        <button className={styles.toolBtn} onClick={onLayout}><Layout size={16} /> Auto Layout</button>
        <button className={styles.toolBtn} onClick={exportImage}><ImageIcon size={16} /> Exportar PNG</button>
        <button className={styles.toolBtn} onClick={saveMap} style={{backgroundColor: 'var(--neon-accent)', color: 'white'}}>
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className={styles.rfContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
        >
          <Background color="#ccc" variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap />
        </ReactFlow>
        {saving && <div className={styles.saveIndicator}>Alterações salvas</div>}
      </div>
    </div>
  );
}

export default function MindMapEditorClient(props: MindMapEditorClientProps) {
  return (
    <ReactFlowProvider>
      <MindMapEditorContent {...props} />
    </ReactFlowProvider>
  );
}
