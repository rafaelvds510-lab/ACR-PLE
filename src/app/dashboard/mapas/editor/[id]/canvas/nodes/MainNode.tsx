import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { MindNodeData } from '../../hooks/useMindMap';

type MainNodeProps = NodeProps<Node<MindNodeData>>;

// ─── Shape clip-paths ────────────────────────────────────────────────────────
const CLIP_PATHS: Record<string, string | undefined> = {
  parallelogram: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)',
  hexagon:       'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  pentagon:      'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  octagon:       'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
  arrow:         'polygon(0% 20%, 70% 20%, 70% 0%, 100% 50%, 70% 100%, 70% 80%, 0% 80%)',
  ribbon:        'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
};

function getNodeStyle(shape: string | undefined, bg: string, selected: boolean, textColor: string, fontSize: number, fontBold: boolean, fontItalic: boolean) {
  const base: React.CSSProperties = {
    background: bg,
    color: textColor,
    fontSize,
    fontWeight: fontBold ? 700 : 400,
    fontStyle: fontItalic ? 'italic' : 'normal',
    border: `2px solid ${selected ? '#4285F4' : 'transparent'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 20px',
    minWidth: 120,
    minHeight: 40,
    position: 'relative' as const,
    boxShadow: selected
      ? `0 0 0 3px rgba(66,133,244,0.3), 0 3px 10px ${bg}50`
      : `0 3px 10px ${bg}50`,
    transition: 'all 0.15s',
  };

  switch (shape) {
    case 'pill':         return { ...base, borderRadius: '50px' };
    case 'circle':       return { ...base, borderRadius: '50%', minWidth: 100, minHeight: 100, padding: '8px' };
    case 'diamond':      return { ...base, transform: 'rotate(45deg)', minWidth: 100, minHeight: 100 };
    case 'ellipse':      return { ...base, borderRadius: '50%', minWidth: 140, minHeight: 60 };
    case 'parallelogram':
    case 'hexagon':
    case 'pentagon':
    case 'octagon':
    case 'arrow':
    case 'ribbon':       return { ...base, borderRadius: 0, clipPath: CLIP_PATHS[shape!] };
    default:             return { ...base, borderRadius: 8 }; // rectangle
  }
}

function getTextColor(bg: string): string {
  const hex = bg.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1a1a1a' : '#ffffff';
}

const MainNode = ({ id, data, selected }: MainNodeProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const bg = data.bgColor || data.branchColor || '#4ECDC4';
  const textColor = data.textColor || getTextColor(bg);
  const shape = data.shape || 'pill';
  const isDiamond = shape === 'diamond';

  useEffect(() => {
    if (selected && inputRef.current) inputRef.current.focus();
  }, [selected]);

  const nodeStyle = getNodeStyle(
    shape, bg, selected ?? false, textColor,
    data.fontSize || 14,
    data.fontBold !== false,
    !!data.fontItalic,
  );

  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Left}   style={{ background: bg, border: `2px solid ${bg}`, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right}  style={{ background: bg, border: `2px solid ${bg}`, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top}    style={{ background: bg, border: `2px solid ${bg}`, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: bg, border: `2px solid ${bg}`, width: 8, height: 8 }} />

      <input
        ref={inputRef}
        value={data.label}
        onChange={e => data.onChange?.(id, e.target.value)}
        className="nodrag"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          fontStyle: 'inherit',
          color: 'inherit',
          textAlign: 'center',
          width: '100%',
          fontFamily: 'Inter, system-ui, sans-serif',
          transform: isDiamond ? 'rotate(-45deg)' : undefined,
        }}
      />
    </div>
  );
};

export default memo(MainNode);
