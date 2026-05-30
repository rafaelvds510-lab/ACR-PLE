'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker - Native Next.js approach (avoids CDN/CORS and offline issues)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import { useAnnotations, Drawing } from '@/hooks/useAnnotations';
import { ReaderMode, HighlightColor, COLOR_MAP } from './ReaderToolbar';

interface PdfRendererProps {
  documentId: string;
  url: string;
  title: string;
  mode: ReaderMode;
  highlightColor: HighlightColor;
  lineWidth: number;
  targetPage?: number | any | null;
  onPageHandled?: () => void;
  onLoadSuccess?: (numPages: number, outline?: unknown[]) => void;
}

export default function PdfRenderer({ 
  documentId, 
  url, 
  mode, 
  highlightColor, 
  lineWidth,
  targetPage,
  onPageHandled,
  onLoadSuccess 
}: PdfRendererProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`reader_page_${documentId}`);
      return saved ? Number(saved) : 1;
    }
    return 1;
  });
  const [scale, setScale] = useState<number>(1.2);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(1);

  // Detecta e monitora o DPR do dispositivo para renderização nítida
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    setDevicePixelRatio(dpr);

    const mediaQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
    const handler = () => setDevicePixelRatio(window.devicePixelRatio || 1);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  
  const { stickyNotes, setStickyNotes, addStickyNote, removeStickyNote, drawings, setDrawings } = useAnnotations(documentId);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [outline, setOutline] = useState<any[]>([]);

  // Using local CMaps and Fonts copied to the public folder to guarantee 100% load reliability and fix encoding issues.
  const options = useMemo(() => ({
    cMapUrl: `/pdfjs/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `/pdfjs/standard_fonts/`,
  }), []);

  // Save pageNumber to localStorage and Sync with Server
  useEffect(() => {
    localStorage.setItem(`reader_page_${documentId}`, pageNumber.toString());
    
    // Sync with server (debounced)
    const timeout = setTimeout(async () => {
      try {
        await fetch('/api/docs/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId, currentPage: pageNumber })
        });
      } catch (e) {
        console.error('Failed to sync progress', e);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [pageNumber, documentId]);

  const editStickyNote = (id: string) => {
    const note = stickyNotes.find(n => n.id === id);
    if (!note) return;
    const newText = window.prompt('Editar nota:', note.text);
    if (newText === null) return;
    if (newText.trim() === '') {
      removeStickyNote(id);
    } else {
      setStickyNotes(stickyNotes.map(n => n.id === id ? { ...n, text: newText } : n));
    }
  };

  // Jump to target page if provided
  useEffect(() => {
    if (targetPage && targetPage !== pageNumber) {
      if (typeof targetPage === 'number') {
        setPageNumber(targetPage);
        if (onPageHandled) onPageHandled();
      } else if (pdfInstance) {
        // Assume targetPage is a destination object/array/string from the outline
        const resolveDest = async () => {
          try {
            let dest = targetPage;
            if (typeof dest === 'string') {
              dest = await pdfInstance.getDestination(dest);
            }
            if (dest) {
              // The first element of dest is the page reference
              const pageRef = typeof dest[0] === 'object' ? dest[0] : dest;
              const pageIndex = await pdfInstance.getPageIndex(pageRef);
              if (pageIndex >= 0) {
                setPageNumber(pageIndex + 1); // getPageIndex is 0-based
              }
            }
          } catch (err) {
            console.error("Failed to resolve destination:", err);
          } finally {
            if (onPageHandled) onPageHandled();
          }
        };
        resolveDest();
      }
    }
  }, [targetPage, pageNumber, onPageHandled, pdfInstance]);

  const [pdfSource, setPdfSource] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const loadPdf = async () => {
      try {
        const { getCachedPdf, cachePdfOffline } = await import('@/lib/offlineSync');
        const cached = await getCachedPdf(url);
        
        let sourceUrl = url;
        if (cached) {
          console.log('[OfflineSync] Using cached PDF');
          sourceUrl = URL.createObjectURL(cached);
        } else if (navigator.onLine) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              await cachePdfOffline(url, blob);
              sourceUrl = URL.createObjectURL(blob);
            }
          } catch (e) {
            console.warn('Failed to fetch/cache PDF', e);
          }
        }
        
        setPdfSource(sourceUrl);

        // Extract outline for the index
        pdfjs.getDocument(sourceUrl).promise.then(pdf => {
          setPdfInstance(pdf);
          pdf.getOutline().then(out => {
            if (out && onLoadSuccess) {
              onLoadSuccess(pdf.numPages, out);
            }
          });
        }).catch(err => console.error("Error extracting outline:", err));
      } catch (err) {
        console.error('PDF load error:', err);
        setPdfSource(url);
      }
    };
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const canvasRef = React.useRef<SVGSVGElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    if (onLoadSuccess) onLoadSuccess(numPages);
  }

  const handlePageClick = (e: React.MouseEvent) => {
    if (mode === 'sticky') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Capture selection context
      const selection = window.getSelection()?.toString() || '';
      const promptText = selection 
        ? `Adicionar nota sobre "${selection.slice(0, 30)}${selection.length > 30 ? '...' : ''}":`
        : 'O que deseja anotar aqui?';

      const text = window.prompt(promptText);
      if (text) {
        addStickyNote({
          page: pageNumber,
          x,
          y,
          text: selection ? `[Ref: ${selection}] ${text}` : text
        });
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'draw' || mode === 'highlight' || mode === 'write') {
      setIsDrawing(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath(`M ${x} ${y}`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && (mode === 'draw' || mode === 'highlight' || mode === 'write')) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath(prev => `${prev} L ${x} ${y}`);
    }

    if (mode === 'eraser' && e.buttons === 1) {
      // Eraser while dragging
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath) {
        const newDrawing: Drawing = {
          id: crypto.randomUUID(),
          page: pageNumber,
          pathData: currentPath,
          color: COLOR_MAP[highlightColor] || COLOR_MAP.yellow,
          width: mode === 'highlight' ? Math.max(lineWidth, 12) : lineWidth,
          type: mode === 'highlight' ? 'highlight' : 'draw'
        };
        setDrawings([...drawings, newDrawing]);
        setCurrentPath('');
      }
    }

    // Sticky Note via Selection logic
    if (mode === 'sticky' && !isDrawing) {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        
        if (selectedText && selectedText.length > 0) {
          const range = selection?.getRangeAt(0);
          const rects = range?.getClientRects();
          const lastRect = rects?.[rects.length - 1];
          const containerRect = canvasRef.current?.parentElement?.getBoundingClientRect();

          if (lastRect && containerRect) {
            const x = ((lastRect.right - containerRect.left) / containerRect.width) * 100;
            const y = ((lastRect.bottom - containerRect.top) / containerRect.height) * 100;

            const promptText = `Adicionar nota sobre "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}":`;
            const text = window.prompt(promptText);

            if (text) {
              addStickyNote({
                page: pageNumber,
                x,
                y,
                text: `[Ref: ${selectedText}] ${text}`
              });
              selection?.removeAllRanges();
            }
          }
        }
      }, 50);
    }
  };

  const eraseAt = (id: string) => {
    if (mode !== 'eraser') return;
    setDrawings(drawings.filter(d => d.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Internal Nav */}
      <div style={{ 
        padding: '8px 16px', 
        background: 'var(--surface-base)', 
        borderBottom: '1px solid var(--marble-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--marble-deep)', cursor: 'pointer' }}>&larr;</button>
          <span style={{ fontSize: '13px', fontFamily: 'Inter', color: 'var(--stone-dark)' }}>Página {pageNumber} de {numPages}</span>
          <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--marble-deep)', cursor: 'pointer' }}>&rarr;</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '1px', height: '20px', background: 'var(--marble-deep)' }} />
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>-</button>
          <span style={{ fontSize: '13px', fontFamily: 'Inter', minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))} style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Viewport */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '40px 20px', 
        background: 'var(--marble-deep)',
        display: 'flex',
        justifyContent: 'center',
        cursor: mode === 'cursor' || mode === 'sticky' ? 'default' : 'crosshair'
      }}>
        {pdfSource && (
          <Document
            file={pdfSource}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ padding: '40px', color: 'var(--stone)' }}>Lendo Pergaminho...</div>}
            options={options}
          >
          <div 
            style={{ 
              position: 'relative', 
              boxShadow: 'var(--shadow-lg)', 
              userSelect: (mode === 'cursor' || mode === 'sticky') ? 'text' : 'none' 
            }}
            onClick={mode === 'sticky' ? undefined : handlePageClick}
            onMouseUp={handleMouseUp}
          >
            {/* 
              Renderiza o canvas com resolução nativa (DPR) para nitidez máxima.
              O scale real = escala do usuário × devicePixelRatio.
              O CSS compensa reduzindo ao tamanho visual original via transform.
            */}
            <div
              style={{
                transform: `scale(${1 / devicePixelRatio})`,
                transformOrigin: 'top left',
                width: `${800 * devicePixelRatio}px`,
                height: 'auto',
              }}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale * devicePixelRatio} 
                width={800 * devicePixelRatio}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                canvasBackground="white"
              />
            </div>
            
            {/* Annotation Overlay Layer */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              pointerEvents: (mode === 'cursor' || mode === 'sticky') ? 'none' : 'auto',
              zIndex: (mode === 'cursor' || mode === 'sticky') ? 0 : 20
            }}>
              
              {/* Sticky Notes */}
              {stickyNotes.filter(n => n.page === pageNumber).map(note => (
                <div
                  key={note.id}
                  style={{
                    position: 'absolute',
                    left: `${note.x}%`,
                    top: `${note.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 30,
                    pointerEvents: 'auto'
                  }}
                  title={note.text}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    editStickyNote(note.id);
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: 'var(--gold)',
                    borderRadius: '50% 50% 50% 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    color: 'white',
                    border: '2px solid white'
                  }}>
                    📌
                  </div>
                </div>
              ))}
              
              {/* Drawing/Highlighting Canvas */}
              <svg
                ref={canvasRef}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  touchAction: 'none',
                  pointerEvents: (mode === 'cursor' || mode === 'sticky') ? 'none' : 'auto'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {drawings.filter(d => d.page === pageNumber).map(d => (
                  <g key={d.id}>
                    {/* Hit area for eraser */}
                    <path 
                      d={d.pathData} 
                      fill="none" 
                      stroke="rgba(0,0,0,0)" 
                      strokeWidth="24" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      style={{ cursor: mode === 'eraser' ? 'pointer' : 'inherit', pointerEvents: mode === 'eraser' ? 'stroke' : 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        eraseAt(d.id);
                      }}
                    />
                    {/* Visible path */}
                    <path 
                      d={d.pathData} 
                      fill="none" 
                      stroke={d.color || '#eab308'} 
                      strokeWidth={d.width || (d.type === 'highlight' ? '20' : '4')} 
                      strokeOpacity={d.type === 'highlight' ? '0.35' : '1'}
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      pointerEvents="none"
                    />
                  </g>
                ))}
                {currentPath && (
                  <path 
                    d={currentPath} 
                    fill="none" 
                    stroke={COLOR_MAP[highlightColor]} 
                    strokeWidth={mode === 'highlight' ? Math.max(lineWidth, 12) : lineWidth} 
                    strokeOpacity={mode === 'highlight' ? '0.3' : '1'}
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                  />
                )}
              </svg>

            </div>
          </div>
        </Document>
        )}
      </div>
    </div>
  );
}

