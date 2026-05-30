'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Trash2, Pencil, Check, X, ChevronRight, ChevronDown } from 'lucide-react';
import { TEMPLATES, TemplateId } from './editor/[id]/components/templates';

interface Writing {
  id: string;
  title: string;
  template: TemplateId;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export default function EscritaClient() {
  const router = useRouter();
  const [writings, setWritings] = useState<Writing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchWritings(); }, []);

  const fetchWritings = async () => {
    try {
      const res = await fetch('/api/writings');
      if (res.ok) setWritings(await res.json());
    } finally { setLoading(false); }
  };

  const createWriting = async (templateId: TemplateId) => {
    setShowNewModal(false);
    const tpl = TEMPLATES[templateId];
    const res = await fetch('/api/writings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Novo ${tpl.label}`, content: tpl.content, template: templateId }),
    });
    if (res.ok) {
      const w = await res.json();
      router.push(`/dashboard/escrita/editor/${w.id}`);
    }
  };

  const deleteWriting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir este documento permanentemente?')) return;
    await fetch(`/api/writings/${id}`, { method: 'DELETE' });
    setWritings(ws => ws.filter(w => w.id !== id));
  };

  const confirmRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    await fetch(`/api/writings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    setWritings(ws => ws.map(w => w.id === id ? { ...w, title: trimmed } : w));
    setEditingId(null);
  };

  const groupedWritings = useMemo(() => {
    const groups: Record<TemplateId, Writing[]> = {} as any;
    writings.forEach(w => {
      if (!groups[w.template]) groups[w.template] = [];
      groups[w.template].push(w);
    });
    return groups;
  }, [writings]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.02em' }}>✍️ Editor de Escrita</h1>
          <p style={{ color: '#666', fontSize: 15, fontWeight: 500 }}>Organize suas produções acadêmicas e literárias por categorias.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} /> Novo Documento
        </button>
      </div>

      {/* Document list grouped by template */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#aaa' }}>
          <div className="spinner" style={{ width: 16, height: 16, border: '2px solid #eee', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Carregando seus textos...</span>
        </div>
      ) : writings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '2px dashed #eee', borderRadius: 24, color: '#aaa' }}>
          <div style={{ background: '#f8f8f8', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText size={32} style={{ opacity: 0.3 }} />
          </div>
          <h3 style={{ color: '#1a1a1a', marginBottom: 8, fontSize: 18 }}>Nenhum documento ainda</h3>
          <p style={{ marginBottom: 24, fontSize: 14 }}>Escolha um template e comece sua jornada de escrita.</p>
          <button onClick={() => setShowNewModal(true)} style={{ padding: '12px 32px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Criar Primeiro Texto
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {(Object.entries(groupedWritings) as [TemplateId, Writing[]][]).map(([tplId, ws]) => {
            const tpl = TEMPLATES[tplId] || TEMPLATES.essay;
            const isCollapsed = collapsedGroups[tplId];
            
            return (
              <div key={tplId} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                {/* Group Header */}
                <div 
                  onClick={() => toggleGroup(tplId)}
                  style={{ padding: '16px 24px', background: '#fcfcfc', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
                >
                  {isCollapsed ? <ChevronRight size={18} color="#aaa" /> : <ChevronDown size={18} color="#aaa" />}
                  <span style={{ fontSize: 22 }}>{tpl.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{tpl.label}</h2>
                    <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>{ws.length} {ws.length === 1 ? 'documento' : 'documentos'}</span>
                  </div>
                </div>

                {/* Group Content */}
                {!isCollapsed && (
                  <div style={{ padding: '8px' }}>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {ws.map(w => (
                        <div
                          key={w.id}
                          onClick={() => editingId !== w.id && router.push(`/dashboard/escrita/editor/${w.id}`)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                            border: '1px solid transparent'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#f9f9f9';
                            e.currentTarget.style.borderColor = '#eee';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          <div style={{ width: 36, height: 36, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                            <FileText size={18} />
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingId === w.id ? (
                              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={editTitle}
                                  onChange={e => setEditTitle(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') confirmRename(w.id); if (e.key === 'Escape') setEditingId(null); }}
                                  style={{ flex: 1, fontSize: 15, fontWeight: 600, border: '2px solid #4285F4', borderRadius: 8, padding: '6px 12px', outline: 'none', background: '#fff' }}
                                />
                                <button onClick={() => confirmRename(w.id)} style={{ width: 32, height: 32, background: '#43AA8B', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                                <button onClick={() => setEditingId(null)} style={{ width: 32, height: 32, background: '#f5f5f5', border: 'none', borderRadius: 6, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                              </div>
                            ) : (
                              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.title}</div>
                            )}
                            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4, display: 'flex', gap: 12 }}>
                              <span><b>{w.word_count}</b> palavras</span>
                              <span>Criado em: <b>{formatDate(w.created_at)}</b></span>
                              <span>Editado em: <b>{formatDate(w.updated_at)}</b></span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={e => { e.stopPropagation(); setEditingId(w.id); setEditTitle(w.title); }} style={{ width: 34, height: 34, background: '#fff', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', transition: 'all 0.2s' }} title="Renomear">
                              <Pencil size={14} />
                            </button>
                            <button onClick={e => deleteWriting(w.id, e)} style={{ width: 34, height: 34, background: '#fff', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d', transition: 'all 0.2s' }} title="Excluir">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Template selection modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 600, width: '95%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>Novo Documento</h2>
                <p style={{ fontSize: 14, color: '#888' }}>Escolha um ponto de partida para sua escrita.</p>
              </div>
              <button onClick={() => setShowNewModal(false)} style={{ background: '#f5f5f5', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {(Object.entries(TEMPLATES) as [TemplateId, typeof TEMPLATES[TemplateId]][]).map(([id, tpl]) => (
                <button
                  key={id}
                  onClick={() => createWriting(id)}
                  style={{ border: '2px solid #f0f0f0', borderRadius: 16, padding: '20px', cursor: 'pointer', textAlign: 'left', background: '#fff', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.background = '#fcfcfc'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#fff'; }}
                >
                  <span style={{ fontSize: 32 }}>{tpl.emoji}</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{tpl.label}</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, fontWeight: 500 }}>{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
