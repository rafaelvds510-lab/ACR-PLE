import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { MindNodeData } from '../hooks/useMindMap';

type SubNodeProps = NodeProps<Node<MindNodeData>>;

const SubNode = ({ id, data, selected }: SubNodeProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = data.branchColor || '#4ECDC4';

  useEffect(() => {
    if (selected && inputRef.current) inputRef.current.focus();
  }, [selected]);

  return (
    <div
      style={{
        background: 'transparent',
        padding: '4px 12px',
        borderBottom: `2px solid ${accent}`,
        borderRadius: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
        outline: selected ? `2px dashed ${accent}` : 'none',
        outlineOffset: 3,
        cursor: 'default',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: accent, border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: accent, border: 'none', width: 6, height: 6 }} />

      <input
        ref={inputRef}
        value={data.label}
        onChange={e => data.onChange?.(id, e.target.value)}
        className="nodrag"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: data.fontSize || 13,
          fontWeight: data.fontBold ? 700 : 400,
          fontStyle: data.fontItalic ? 'italic' : 'normal',
          color: data.textColor || '#2c2c2c',
          textAlign: 'center',
          width: '100%',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      />
    </div>
  );
};

export default memo(SubNode);
