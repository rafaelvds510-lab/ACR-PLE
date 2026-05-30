'use client';

import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';

export type LayoutMode = 'mindmap' | 'logical' | 'org' | 'radial';

// Adds CSS transition to all nodes so they animate smoothly to new positions
function withTransition(nodes: Node[]): Node[] {
  return nodes.map(n => ({
    ...n,
    style: { ...(n.style || {}), transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' },
  }));
}

const NODE_W = 180;
const NODE_H = 50;

function getDagreLayout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' | 'RL') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return nodes.map(n => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
  });
}

function getMindMapLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Radial-like: root in center, main topics fan left/right, subs cascade
  const root = nodes.find(n => n.id === 'root');
  if (!root) return getDagreLayout(nodes, edges, 'LR');

  const mainChildren = edges.filter(e => e.source === 'root').map(e => e.target);
  const halfCount = Math.ceil(mainChildren.length / 2);
  const HGAP = 300;
  const VGAP = 100;

  const posMap: Record<string, { x: number; y: number }> = {};
  posMap['root'] = { x: 0, y: 0 };

  mainChildren.forEach((childId, i) => {
    const isRight = i < halfCount;
    const idx = isRight ? i : i - halfCount;
    const total = isRight ? halfCount : mainChildren.length - halfCount;
    const offsetY = (idx - (total - 1) / 2) * VGAP;
    posMap[childId] = { x: isRight ? HGAP : -HGAP, y: offsetY };

    // Sub-nodes of this main
    const subs = edges.filter(e => e.source === childId).map(e => e.target);
    subs.forEach((subId, si) => {
      const subOffsetY = (si - (subs.length - 1) / 2) * 60;
      posMap[subId] = {
        x: isRight ? HGAP + 240 : -HGAP - 240,
        y: offsetY + subOffsetY,
      };

      // Sub-sub nodes
      const subsubs = edges.filter(e => e.source === subId).map(e => e.target);
      subsubs.forEach((ssId, ssi) => {
        posMap[ssId] = {
          x: isRight ? HGAP + 480 : -HGAP - 480,
          y: offsetY + subOffsetY + (ssi - (subsubs.length - 1) / 2) * 50,
        };
      });
    });
  });

  return nodes.map(n => ({
    ...n,
    position: posMap[n.id] || n.position,
  }));
}

function getRadialLayout(nodes: Node[], edges: Edge[]): Node[] {
  const root = nodes.find(n => n.id === 'root');
  if (!root) return getDagreLayout(nodes, edges, 'LR');

  const mainChildren = edges.filter(e => e.source === 'root').map(e => e.target);
  const posMap: Record<string, { x: number; y: number }> = {};
  posMap['root'] = { x: 0, y: 0 };

  const RADIUS1 = 280;
  const RADIUS2 = 500;

  mainChildren.forEach((childId, i) => {
    const angle = (2 * Math.PI * i) / mainChildren.length - Math.PI / 2;
    posMap[childId] = {
      x: Math.cos(angle) * RADIUS1,
      y: Math.sin(angle) * RADIUS1,
    };

    const subs = edges.filter(e => e.source === childId).map(e => e.target);
    subs.forEach((subId, si) => {
      const spread = (subs.length - 1) * 0.15;
      const subAngle = angle - spread / 2 + (si / Math.max(subs.length - 1, 1)) * spread;
      posMap[subId] = {
        x: Math.cos(subAngle) * RADIUS2,
        y: Math.sin(subAngle) * RADIUS2,
      };
    });
  });

  return nodes.map(n => ({
    ...n,
    position: posMap[n.id] || n.position,
  }));
}

export function useAutoLayout() {
  const applyLayout = (nodes: Node[], edges: Edge[], mode: LayoutMode): Node[] => {
    let result: Node[];
    switch (mode) {
      case 'mindmap': result = getMindMapLayout(nodes, edges); break;
      case 'logical': result = getDagreLayout(nodes, edges, 'LR'); break;
      case 'org': result = getDagreLayout(nodes, edges, 'TB'); break;
      case 'radial': result = getRadialLayout(nodes, edges); break;
      default: result = getMindMapLayout(nodes, edges);
    }
    return withTransition(result);
  };

  return { applyLayout };
}
