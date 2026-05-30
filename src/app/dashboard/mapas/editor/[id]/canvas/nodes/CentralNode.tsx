import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { MindNodeData } from '../../hooks/useMindMap';

type CentralNodeProps = NodeProps<Node<MindNodeData>>;

const CentralNode = ({ id, data, selected }: CentralNodeProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected && inputRef.current) inputRef.current.focus();
  }, [selected]);

  return (
    <div
      style={{
        background: '#ffffff',
        border: `2.5px solid ${selected ? '#4285F4' : '#2c2c2c'}`,
        borderRadius: 8,
        padding: '12px 32px',
        minWidth: 200,
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected
          ? '0 0 0 3px rgba(66,133,244,0.25), 0 4px 16px rgba(0,0,0,0.12)'
          : '0 4px 16px rgba(0,0,0,0.10)',
        cursor: 'default',
      }}
    >
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#2c2c2c', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: '#2c2c2c', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="top" style={{ background: '#2c2c2c', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#2c2c2c', width: 8, height: 8 }} />

      <input
        ref={inputRef}
        value={data.label}
        onChange={e => data.onChange?.(id, e.target.value)}
        className="nodrag"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 22,
          fontWeight: 700,
          color: '#1a1a1a',
          textAlign: 'center',
          width: '100%',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.3px',
        }}
      />
    </div>
  );
};

export default memo(CentralNode);
