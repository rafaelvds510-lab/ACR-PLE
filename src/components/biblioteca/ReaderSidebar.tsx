'use client';

import React, { useState } from 'react';
import { StickyNote } from '@/hooks/useAnnotations';

interface ReaderSidebarProps {
  onJumpToPage: (page: number | any) => void;
  stickyNotes?: StickyNote[];
  outline?: any[];
  onRemoveNote?: (id: string) => void;
  onEditNote?: (id: string) => void;
}

type TabType = 'index' | 'bookmarks' | 'notes';

export default function ReaderSidebar({ onJumpToPage, stickyNotes = [], outline = [], onRemoveNote, onEditNote }: ReaderSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('index');

  return (
    <div style={{
      width: '280px',
      height: '100%',
      background: 'white',
      borderRight: '1px solid var(--marble-deep)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 5
    }}>
      {/* Tabs - Vertical Orientation or Compact */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--marble-deep)', background: 'var(--surface-base)' }}>
        {[
          { id: 'index', label: 'Índice', icon: '📜' },
          { id: 'notes', label: 'Notas', icon: '📌' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--gold-deep)' : 'var(--stone)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '14px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'index' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {outline.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--stone)', fontStyle: 'italic' }}>Sumário indisponível para este pergaminho.</p>
            ) : (
              <OutlineList items={outline} onJump={onJumpToPage} />
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {stickyNotes.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--stone)' }}>Nenhuma nota rápida fixada.</p>
            ) : (
              stickyNotes.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid var(--marble-deep)',
                    background: 'rgba(201, 168, 76, 0.05)',
                    marginBottom: '8px'
                  }}
                >
                  <button
                    onClick={() => onJumpToPage(n.page)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ color: 'var(--ink)', marginBottom: '4px' }}>&quot;{n.text}&quot;</div>
                    <div style={{ fontSize: '11px', color: 'var(--gold-deep)', fontWeight: 600 }}>Pág {n.page}</div>
                  </button>
                  <button 
                    onClick={() => onEditNote?.(n.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.6 }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Excluir esta nota?')) onRemoveNote?.(n.id); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.6 }}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OutlineList({ items, onJump, level = 0 }: { items: any[], onJump: (p: number | any) => void, level?: number }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => {
              if (item.dest) {
                onJump(item.dest);
              } else {
                alert(`Este item não possui um destino navegável válido.`);
              }
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '6px 8px',
              paddingLeft: `${8 + (level * 16)}px`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--ink)',
              borderRadius: '4px',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '10px', opacity: 0.5 }}>{item.items && item.items.length > 0 ? '▼' : '○'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
          </button>
          {item.items && item.items.length > 0 && (
            <OutlineList items={item.items} onJump={onJump} level={level + 1} />
          )}
        </div>
      ))}
    </>
  );
}
