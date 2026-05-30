'use client';

import React, { useRef, useState, useEffect } from 'react';

export interface Stroke {
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
}

interface DrawingCanvasProps {
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  isDrawingMode: boolean;
  isEraserMode: boolean;
  color: string;
  lineWidth: number;
  opacity: number;
}

export default function DrawingCanvas({
  strokes,
  onStrokesChange,
  isDrawingMode,
  isEraserMode,
  color,
  lineWidth,
  opacity,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Re-draw all strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.globalAlpha = stroke.opacity || 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1; // Reset
  }, [strokes, currentStroke]);

  // Handle resize to match parent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === canvas.parentElement) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
          // Trigger a re-draw (effect above will run when dimensions change due to state change, but to force we could use state for dimensions)
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }

    return () => resizeObserver.disconnect();
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode && !isEraserMode) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke({
      color: isEraserMode ? 'rgba(0,0,0,1)' : color,
      width: lineWidth,
      opacity: isEraserMode ? 1 : opacity,
      points: [{ x, y }],
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || (!isDrawingMode && !isEraserMode)) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (isEraserMode) {
      // Find and remove strokes that intersect with the eraser
      const eraserRadius = lineWidth * 2;
      const remainingStrokes = strokes.filter(stroke => {
        return !stroke.points.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < eraserRadius;
        });
      });
      if (remainingStrokes.length !== strokes.length) {
        onStrokesChange(remainingStrokes);
      }
    } else if (currentStroke) {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, { x, y }],
      });
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke && !isEraserMode) {
      onStrokesChange([...strokes, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: isDrawingMode || isEraserMode ? 'auto' : 'none',
        zIndex: 10,
        cursor: isEraserMode ? 'crosshair' : isDrawingMode ? 'crosshair' : 'default',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
