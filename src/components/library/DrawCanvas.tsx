import { useEffect, useRef, useState } from "react";
import { ToolMode } from "./types";

type Stroke = {
  color: string;
  thickness: number;
  opacity: number;
  points: Array<[number, number]>;
};

export function DrawCanvas({
  docId,
  page,
  scale,
  tool,
  color,
  thickness,
  opacity,
  containerRef,
}: {
  docId: string;
  page: number;
  scale: number;
  tool: ToolMode;
  color: string;
  thickness: number;
  opacity: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const storageKey = `pdf_draw_${docId}_${page}`;
  const active = tool === "pen" || tool === "highlight" || tool === "eraser";

  // Match the rendered PDF page size
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const pdfPage = containerRef.current?.querySelector(".react-pdf__Page") as HTMLElement | null;
      if (pdfPage) {
        const w = pdfPage.clientWidth;
        const h = pdfPage.clientHeight;
        if (w > 0 && h > 0) setSize({ w, h });
      }
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [containerRef, page, scale]);

  // Load strokes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      strokesRef.current = raw ? (JSON.parse(raw) as Stroke[]) : [];
    } catch {
      strokesRef.current = [];
    }
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, size.w, size.h]);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { docId: string; page: number };
      if (d.docId === docId && d.page === page) {
        strokesRef.current = [];
        redraw();
      }
    };
    window.addEventListener("pdf-draw-clear", handler);
    return () => window.removeEventListener("pdf-draw-clear", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, page]);

  const redraw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of strokesRef.current) drawStroke(ctx, s, c.width, c.height);
    if (currentRef.current) drawStroke(ctx, currentRef.current, c.width, c.height);
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) => {
    if (s.points.length < 1) return;
    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const [x0, y0] = s.points[0];
    ctx.moveTo(x0 * w, y0 * h);
    for (let i = 1; i < s.points.length; i++) {
      const [x, y] = s.points[i];
      ctx.lineTo(x * w, y * h);
    }
    if (s.points.length === 1) {
      ctx.lineTo(x0 * w + 0.01, y0 * h + 0.01);
    }
    ctx.stroke();
    ctx.restore();
  };

  const point = (e: React.PointerEvent): [number, number] => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
  };

  const eraseAt = (p: [number, number]) => {
    const w = size.w;
    const h = size.h;
    if (w <= 0 || h <= 0) return;
    const thresholdSq = 225; // 15 pixels ao quadrado
    const initialLen = strokesRef.current.length;
    strokesRef.current = strokesRef.current.filter((s) => {
      const isNear = s.points.some((sp) => {
        const dx = (sp[0] - p[0]) * w;
        const dy = (sp[1] - p[1]) * h;
        return dx * dx + dy * dy < thresholdSq;
      });
      return !isNear;
    });
    if (strokesRef.current.length !== initialLen) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(strokesRef.current));
      } catch {
        /* noop */
      }
      redraw();
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (!active) return;
    e.preventDefault();
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    if (tool === "eraser") {
      eraseAt(point(e));
    } else {
      currentRef.current = { color, thickness, opacity, points: [point(e)] };
      redraw();
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    if (tool === "eraser") {
      eraseAt(point(e));
    } else if (currentRef.current) {
      currentRef.current.points.push(point(e));
      redraw();
    }
  };
  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (tool !== "eraser" && currentRef.current) {
      strokesRef.current = [...strokesRef.current, currentRef.current];
      currentRef.current = null;
      try {
        localStorage.setItem(storageKey, JSON.stringify(strokesRef.current));
      } catch {
        /* noop */
      }
    }
    redraw();
  };

  return (
    <canvas
      ref={canvasRef}
      width={size.w}
      height={size.h}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      className="absolute inset-0"
      style={{
        width: size.w,
        height: size.h,
        pointerEvents: active ? "auto" : "none",
        touchAction: active ? "none" : "auto",
        cursor: tool === "eraser" ? "cell" : active ? "crosshair" : "default",
        zIndex: 10,
      }}
    />
  );
}
