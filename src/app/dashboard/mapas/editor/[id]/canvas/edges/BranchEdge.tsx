import React, { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

interface BranchEdgeData {
  branchColor?: string;
  label?: string;
  dashed?: boolean;
  thickness?: number;
}

const BranchEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd, selected,
}: EdgeProps) => {
  const edgeData = (data || {}) as BranchEdgeData;
  const color = edgeData.branchColor || '#999';
  const thickness = edgeData.thickness || 2;
  const dashed = edgeData.dashed;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={thickness}
        stroke={selected ? '#4285F4' : color}
        fill="none"
        strokeDasharray={dashed ? '6 3' : undefined}
        style={{ transition: 'stroke 0.2s' }}
        markerEnd={markerEnd}
      />

      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#fff',
              border: `1px solid ${color}`,
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
              color: color,
              fontWeight: 600,
              pointerEvents: 'all',
              cursor: 'default',
            }}
            className="nodrag nopan"
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(BranchEdge);
