'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Map as MapIcon, Trash2, Pencil, Check, X, Upload } from 'lucide-react';
import styles from './mapas.module.css';

interface MindMap {
  id: string;
  title: string;
  updated_at: string;
}

// Translate XMind tree back to React Flow nodes/edges
function xmindToReactFlow(rootTopic: any): { nodes: any[]; edges: any[] } {
  const nodes: any[] = [];
  const edges: any[] = [];

  const traverse = (topic: any, parentId: string | null, depth: number, index: number, totalSiblings: number) => {
    const nodeId = topic.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const label = topic.title || 'Tópico';
    const isRoot = parentId === null;

    let x = 0;
    let y = 0;
    
    if (!isRoot) {
      // Basic branch layout for newly imported maps
      const angle = (index - (totalSiblings - 1) / 2) * (Math.PI / 4);
      const distance = depth * 220;
      x = distance * Math.cos(angle);
      y = distance * Math.sin(angle);
    }

    const nodeType = isRoot ? 'central' : (depth === 1 ? 'main' : 'sub');
    
    nodes.push({
      id: nodeId,
      type: nodeType,
      data: {
        label,
        nodeType,
        shape: 'pill'
      },
      position: { x, y }
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'branch'
      });
    }

    if (topic.children && topic.children.attached) {
      const children = topic.children.attached;
      children.forEach((child: any, idx: number) => {
        traverse(child, nodeId, depth + 1, idx, children.length);
      });
    }
  };

  traverse(rootTopic, null, 0, 0, 1);
  return { nodes, edges };
}

export default function MapasClient() {
  const router = useRouter();
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchMaps(); }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  const fetchMaps = async () => {
    try {
      const res = await fetch('/api/mindmaps');
      if (res.ok) setMaps(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const createNewMap = async () => {
    const res = await fetch('/api/mindmaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo Mapa Mental' }),
    });
    if (res.ok) {
      const newMap = await res.json();
      router.push(`/dashboard/mapas/editor/${newMap.id}`);
    }
  };

  const importXMindMap = async (file: File) => {
    setLoading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const contentFile = zip.file('content.json');
      
      if (!contentFile) {
        alert('Arquivo .xmind inválido ou em formato legado (content.json não encontrado).');
        return;
      }
      
      const text = await contentFile.async('text');
      const xmindData = JSON.parse(text);
      const sheet = xmindData[0];
      
      if (!sheet || !sheet.rootTopic) {
        alert('Estrutura de mapa mental do XMind vazia ou inválida.');
        return;
      }

      const mapTitle = file.name.replace('.xmind', '') || sheet.title || 'Mapa Importado';
      const { nodes, edges } = xmindToReactFlow(sheet.rootTopic);

      const res = await fetch('/api/mindmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: mapTitle, 
          state: { nodes, edges } 
        }),
      });

      if (res.ok) {
        const newMap = await res.json();
        router.push(`/dashboard/mapas/editor/${newMap.id}`);
      } else {
        alert('Erro ao salvar o mapa mental importado no servidor.');
      }
    } catch (err) {
      console.error('Failed to import xmind file:', err);
      alert('Falha ao processar e ler o arquivo .xmind.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (e: React.MouseEvent, map: MindMap) => {
    e.stopPropagation();
    setEditingId(map.id);
    setEditTitle(map.title);
  };

  const confirmRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    await fetch(`/api/mindmaps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    setMaps(maps.map(m => m.id === id ? { ...m, title: trimmed } : m));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const deleteMap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir permanentemente este mapa mental?')) return;
    const res = await fetch(`/api/mindmaps/${id}`, { method: 'DELETE' });
    if (res.ok) setMaps(maps.filter(m => m.id !== id));
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mapas Mentais</h1>
          <p style={{ color: 'var(--stone-medium)', marginTop: 4 }}>
            Organize e visualize suas ideias.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className={styles.createBtn} 
            onClick={() => fileInputRef.current?.click()} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.65)', 
              color: 'var(--gold-deep)', 
              border: '1px solid var(--gold-light)' 
            }}
          >
            <Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Importar .xmind
          </button>
          <button className={styles.createBtn} onClick={createNewMap}>
            <Plus size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Novo Mapa
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xmind"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) importXMindMap(file);
            }}
          />
        </div>
      </header>

      {loading ? (
        <p style={{ color: 'var(--stone-medium)' }}>Carregando...</p>
      ) : maps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--stone-medium)' }}>
          <MapIcon size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>Você ainda não criou nenhum mapa mental.</p>
          <button className={styles.createBtn} onClick={createNewMap} style={{ marginTop: 16 }}>
            Começar Agora
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {maps.map(map => (
            <div
              key={map.id}
              className={styles.mapCard}
              onClick={() => editingId !== map.id && router.push(`/dashboard/mapas/editor/${map.id}`)}
            >
              {/* Thumbnail placeholder */}
              <div className={styles.mapThumb}>
                <MapIcon size={32} style={{ opacity: 0.2, color: 'var(--stone-darker)' }} />
              </div>

              {/* Title row */}
              <div className={styles.mapMeta}>
                {editingId === map.id ? (
                  <div className={styles.renameRow} onClick={e => e.stopPropagation()}>
                    <input
                      ref={editInputRef}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmRename(map.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className={styles.renameInput}
                    />
                    <button className={styles.iconBtn} onClick={() => confirmRename(map.id)} title="Confirmar">
                      <Check size={14} color="#43AA8B" />
                    </button>
                    <button className={styles.iconBtn} onClick={cancelEdit} title="Cancelar">
                      <X size={14} color="#c62828" />
                    </button>
                  </div>
                ) : (
                  <div className={styles.cardBottom}>
                    <div>
                      <div className={styles.mapTitle}>{map.title}</div>
                      <div className={styles.mapDate}>
                        {new Date(map.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={e => startEdit(e, map)}
                        title="Renomear"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={e => deleteMap(map.id, e)}
                        title="Excluir"
                        style={{ color: '#c62828' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
