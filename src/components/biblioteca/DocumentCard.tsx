'use client';

import React from 'react';
import { IconScroll, IconMap } from '@/components/icons/AcropoleIcons';

export interface DocumentType {
  id: string;
  title: string;
  size_bytes: number | null;
  created_at: string;
  file_path: string | null;
  type: string;
  source_url: string | null;
  category: string | null;
  notes: string | null;
  current_page: number;
  total_pages: number;
  status: string;
}

interface DocumentCardProps {
  document: DocumentType;
  onDelete?: (id: string, filePath: string | null) => void;
  onRead?: (id: string) => void;
}

export default function DocumentCard({ document, onDelete, onRead }: DocumentCardProps) {
  // Format bytes to MB/KB
  const formatBytes = (bytes: number | null, decimals = 1) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formattedDate = new Date(document.created_at).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const progress = document.total_pages > 0 
    ? Math.round((document.current_page / document.total_pages) * 100) 
    : 0;

  const isFinished = document.status === 'finished';

  return (
    <div style={{
      background: 'var(--surface-base)',
      border: `1px solid ${isFinished ? 'var(--gold)' : 'var(--marble-deep)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'all var(--transition-fast)',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--gold)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = isFinished ? 'var(--gold)' : 'var(--marble-deep)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* Top Badges */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {document.category && (
          <span style={{ 
            fontSize: '11px', 
            background: 'var(--marble-deep)', 
            color: 'var(--ink)', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {document.category}
          </span>
        )}
        <span style={{ 
            fontSize: '11px', 
            background: isFinished ? 'rgba(201, 168, 76, 0.2)' : 'rgba(150, 150, 150, 0.1)', 
            color: isFinished ? 'var(--gold-deep)' : 'var(--stone)', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {isFinished ? 'Encerrado' : 'Em Leitura'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-xs)',
          background: document.type === 'url' ? 'rgba(110, 142, 171, 0.1)' : 'rgba(201, 168, 76, 0.1)',
          color: document.type === 'url' ? 'var(--aegean)' : 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {document.type === 'url' ? <IconMap size={24} /> : <IconScroll size={24} />}
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <h3 style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 4px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }} title={document.title}>
            {document.title}
          </h3>
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            color: 'var(--stone)',
            margin: 0,
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {document.size_bytes ? <span>{formatBytes(document.size_bytes)}</span> : <span>Artigo Web</span>}
            <span>•</span>
            <span>{formattedDate}</span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {!isFinished && document.total_pages > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--stone)', marginBottom: '4px', fontFamily: 'Inter' }}>
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--marble)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
        <button 
          onClick={() => onRead?.(document.id)}
          style={{
            flex: 1,
            background: 'var(--gold)',
            color: 'var(--marble)',
            border: 'none',
            padding: '8px',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-deep)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gold)'}
        >
          {isFinished ? 'Revisitar Fichamento' : 'Retomar Leitura'}
        </button>
        <button 
          onClick={() => {
            if (window.confirm('Tem certeza que deseja apagar este documento e suas anotações?')) {
              onDelete?.(document.id, document.file_path);
            }
          }}
          style={{
            background: 'transparent',
            color: 'var(--stone)',
            border: '1px solid var(--marble-deep)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--terra)';
            e.currentTarget.style.color = 'var(--terra)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--marble-deep)';
            e.currentTarget.style.color = 'var(--stone)';
          }}
          aria-label="Deletar documento"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
