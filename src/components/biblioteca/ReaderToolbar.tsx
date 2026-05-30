'use client';

import React from 'react';

export type ReaderMode = 'cursor' | 'sticky' | 'highlight' | 'draw' | 'write' | 'eraser';
export type HighlightColor = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange' | 'black';

export const COLOR_MAP: Record<HighlightColor, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  black: '#000000'
};

interface ReaderToolbarProps {
  mode: ReaderMode;
  setMode: (mode: ReaderMode) => void;
  highlightColor: HighlightColor;
  setHighlightColor: (color: HighlightColor) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
}

export default function ReaderToolbar({ mode, setMode, highlightColor, setHighlightColor, lineWidth, setLineWidth }: ReaderToolbarProps) {
  const tools: { id: ReaderMode, label: string, icon: string }[] = [
    { id: 'sticky', label: 'Nota', icon: '📌' },
    { id: 'highlight', label: 'Realce', icon: '🖍️' },
    { id: 'draw', label: 'Caneta', icon: '🖋️' },
    { id: 'eraser', label: 'Borracha', icon: '🧹' },
  ];

  const handleModeClick = (newMode: ReaderMode) => {
    if (mode === newMode) {
      setMode('cursor');
    } else {
      setMode(newMode);
      // Set default widths for modes
      if (newMode === 'highlight') setLineWidth(12);
      if (newMode === 'draw') setLineWidth(2);
    }
  };

  return (
    <div style={{
      padding: '8px 16px',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--marble-deep)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => handleModeClick(tool.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: mode === tool.id ? 'var(--gold)' : 'var(--marble-deep)',
              background: mode === tool.id ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: mode === tool.id ? 600 : 400,
              color: mode === tool.id ? 'var(--gold-deep)' : 'var(--stone-dark)',
              transition: 'all 0.2s'
            }}
          >
            <span>{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>

      {(mode === 'highlight' || mode === 'draw' || mode === 'write') && (
        <>
          <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--marble-deep)', paddingLeft: '24px' }}>
            {(Object.keys(COLOR_MAP) as HighlightColor[]).map(c => (
              <button
                key={c}
                onClick={() => setHighlightColor(c)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: COLOR_MAP[c],
                  border: highlightColor === c ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  boxShadow: highlightColor === c ? '0 0 4px rgba(0,0,0,0.2)' : 'none',
                  transition: 'transform 0.2s'
                }}
                title={c}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--marble-deep)', paddingLeft: '24px' }}>
            <button 
              onClick={() => setLineWidth(1)} 
              style={{ padding: '4px 8px', borderRadius: '4px', border: lineWidth === 1 ? '1px solid var(--gold)' : '1px solid var(--marble-deep)', background: lineWidth === 1 ? 'rgba(201,168,76,0.1)' : 'white', fontSize: '11px', cursor: 'pointer' }}
            >
              0.5mm
            </button>
            <button 
              onClick={() => setLineWidth(2)} 
              style={{ padding: '4px 8px', borderRadius: '4px', border: lineWidth === 2 ? '1px solid var(--gold)' : '1px solid var(--marble-deep)', background: lineWidth === 2 ? 'rgba(201,168,76,0.1)' : 'white', fontSize: '11px', cursor: 'pointer' }}
            >
              1.0mm
            </button>
            <button 
              onClick={() => setLineWidth(12)} 
              style={{ padding: '4px 8px', borderRadius: '4px', border: lineWidth === 12 ? '1px solid var(--gold)' : '1px solid var(--marble-deep)', background: lineWidth === 12 ? 'rgba(201,168,76,0.1)' : 'white', fontSize: '11px', cursor: 'pointer' }}
            >
              6mm
            </button>
          </div>
        </>
      )}

    </div>
  );
}
