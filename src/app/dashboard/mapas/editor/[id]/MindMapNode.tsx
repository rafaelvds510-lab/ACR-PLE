import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

export type NodeData = {
  label: string;
  type?: 'rectangle' | 'pill' | 'diamond' | 'circle';
};

const MindMapNode = ({ id, data, selected }: NodeProps<Node<NodeData & { onChange?: (id: string, label: string) => void, onAddChild?: (id: string) => void }>>) => {
  const shapeClass = data.type || 'rectangle';
  
  const getShapeStyles = () => {
    const base = {
      padding: '8px 12px',
      border: `2px solid ${selected ? 'var(--neon-accent)' : 'var(--stone-dark)'}`,
      backgroundColor: 'white',
      color: data.textColor || '#000000',
      fontSize: '14px',
      fontWeight: '600',
      minWidth: '120px',
      textAlign: 'center' as const,
      boxShadow: selected ? '0 0 10px rgba(66, 133, 244, 0.3)' : 'none',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
    };

    switch (shapeClass) {
      case 'pill':
        return { ...base, borderRadius: '25px' };
      case 'circle':
        return { ...base, borderRadius: '50%', width: '120px', height: '120px' };
      case 'diamond':
        return { ...base, transform: 'rotate(45deg)', width: '100px', height: '100px' };
      default:
        return { ...base, borderRadius: '4px' };
    }
  };

  const textStyle = shapeClass === 'diamond' ? { transform: 'rotate(-45deg)' } : {};

  return (
    <div style={getShapeStyles()}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--stone-dark)' }} />
      <div style={textStyle}>
        <input
          value={data.label}
          onChange={(e) => data.onChange?.(id, e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            textAlign: 'center',
            width: '100%',
            fontWeight: 'inherit',
            fontSize: 'inherit',
            color: 'inherit',
          }}
          className="nodrag"
        />
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--stone-dark)' }} />
      
      {selected && (
        <button
          onClick={() => data.onAddChild?.(id)}
          style={{
            position: 'absolute',
            bottom: -25,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--neon-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          className="nodrag"
        >
          +
        </button>
      )}
    </div>
  );
};

export default memo(MindMapNode);
