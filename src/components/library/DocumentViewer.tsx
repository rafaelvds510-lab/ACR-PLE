import { useState, useEffect, useRef, useCallback } from "react";
import { Document as PdfDocument, Page as PdfPage, pdfjs } from "react-pdf";
import { ReactReader } from "react-reader";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Pen,
  Eraser,
  BookMarked,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import {
  Doc,
  HL,
  StickyNoteRow,
  ToolMode,
  HighlightColor,
  Thickness,
  Status,
  HL_COLORS,
  PEN_COLORS,
  THICKNESSES,
} from "./types";
import { DrawCanvas } from "./DrawCanvas";
import { StickyNoteBubble } from "./StickyNoteBubble";
import { ReaderSidebar } from "./ReaderSidebar";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function DocumentViewer({
  doc,
  url,
  kind,
  onDocUpdate,
}: {
  doc: Doc;
  url: string | null;
  kind: "pdf" | "epub" | "url" | "docx" | null;
  onDocUpdate: (d: Doc) => void;
}) {
  const [tool, setTool] = useState<ToolMode>("cursor");
  const [hlColor, setHlColor] = useState<HighlightColor>("yellow");
  const [hlThickness, setHlThickness] = useState<Thickness>("1.0");
  const [penColor, setPenColor] = useState<HighlightColor>("black");
  const [penThickness, setPenThickness] = useState<Thickness>("1.0");
  const [sideTab, setSideTab] = useState<"index" | "notes">("index");
  const [page, setPage] = useState(Math.max(1, doc.current_page || 1));
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [highlights, setHighlights] = useState<HL[]>([]);
  const [notes, setNotes] = useState<StickyNoteRow[]>([]);
  const [epubLocation, setEpubLocation] = useState<string | number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: hls }, { data: ns }] = await Promise.all([
        supabase
          .from("document_highlights")
          .select("*")
          .eq("document_id", doc.id)
          .order("created_at"),
        supabase.from("document_notes").select("*").eq("document_id", doc.id).order("created_at"),
      ]);
      setHighlights((hls ?? []) as HL[]);
      setNotes((ns ?? []) as StickyNoteRow[]);
    })();
  }, [doc.id]);

  useEffect(() => {
    if (kind !== "pdf") return;
    const t = setTimeout(async () => {
      const total = numPages || doc.total_pages;
      const status: Status = page >= total && total > 0 ? "completed" : "reading";
      const { data } = await supabase
        .from("documents")
        .update({
          current_page: page,
          total_pages: total || doc.total_pages,
          status,
        })
        .eq("id", doc.id)
        .select()
        .single();
      if (data) onDocUpdate(data as Doc);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, numPages]);

  const saveHighlight = useCallback(
    async (text: string) => {
      const { data, error } = await supabase
        .from("document_highlights")
        .insert({
          document_id: doc.id,
          user_id: doc.user_id,
          page,
          color: hlColor,
          text,
          rects: [],
        })
        .select()
        .single();
      if (error) return toast.error(error.message);
      setHighlights((h) => [...h, data as HL]);
      toast.success("Trecho destacado");
    },
    [doc.id, doc.user_id, page, hlColor],
  );

  const handleTextSelection = useCallback(() => {
    if (tool !== "cursor") return;
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) return;
    saveHighlight(text);
    sel?.removeAllRanges();
  }, [tool, saveHighlight]);

  const handlePageClick = useCallback(
    async (e: React.MouseEvent) => {
      if (tool !== "note" || !pageRef.current) return;
      const rect = pageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const { data, error } = await supabase
        .from("document_notes")
        .insert({
          document_id: doc.id,
          user_id: doc.user_id,
          page,
          x,
          y,
          content: "",
        })
        .select()
        .single();
      if (error) return toast.error(error.message);
      setNotes((n) => [...n, data as StickyNoteRow]);
    },
    [tool, doc.id, doc.user_id, page],
  );

  const deleteNote = async (id: string) => {
    await supabase.from("document_notes").delete().eq("id", id);
    setNotes((n) => n.filter((x) => x.id !== id));
  };
  const updateNote = async (id: string, content: string) => {
    setNotes((n) => n.map((x) => (x.id === id ? { ...x, content } : x)));
    await supabase.from("document_notes").update({ content }).eq("id", id);
  };
  const deleteHighlight = async (id: string) => {
    await supabase.from("document_highlights").delete().eq("id", id);
    setHighlights((h) => h.filter((x) => x.id !== id));
  };

  const eraseAllOnPage = async () => {
    const pageHls = highlights.filter((h) => h.page === page);
    const pageNs = notes.filter((n) => n.page === page);
    await Promise.all([
      ...pageHls.map((h) => supabase.from("document_highlights").delete().eq("id", h.id)),
      ...pageNs.map((n) => supabase.from("document_notes").delete().eq("id", n.id)),
    ]);
    setHighlights((h) => h.filter((x) => x.page !== page));
    setNotes((n) => n.filter((x) => x.page !== page));
    try {
      localStorage.removeItem(`pdf_draw_${doc.id}_${page}`);
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent("pdf-draw-clear", { detail: { docId: doc.id, page } }));
    toast.success("Marcações desta página removidas");
  };

  const pageNotes = notes.filter((n) => n.page === page);

  return (
    <section className="flex flex-1 min-w-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
      {/* Toolbar superior — ferramentas */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
        <ToolBtn
          active={tool === "note"}
          onClick={() => setTool(tool === "note" ? "cursor" : "note")}
          icon={StickyNote}
          label="Nota"
          color="text-amber-600"
        />
        <ToolBtn
          active={tool === "highlight"}
          onClick={() => setTool(tool === "highlight" ? "cursor" : "highlight")}
          icon={Highlighter}
          label="Realce"
          color="text-rose-500"
        />
        <ToolBtn
          active={tool === "pen"}
          onClick={() => setTool(tool === "pen" ? "cursor" : "pen")}
          icon={Pen}
          label="Caneta"
          color="text-sky-600"
        />
        <ToolBtn
          active={tool === "eraser"}
          onClick={() => setTool(tool === "eraser" ? "cursor" : "eraser")}
          icon={Eraser}
          label="Borracha"
          color="text-emerald-600"
        />
        {(tool === "highlight" || tool === "pen") && (
          <div className="ml-2 flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1">
            <div className="flex items-center gap-1">
              {THICKNESSES.map((t) => {
                const active = tool === "highlight" ? hlThickness === t : penThickness === t;
                return (
                  <button
                    key={t}
                    onClick={() => (tool === "highlight" ? setHlThickness(t) : setPenThickness(t))}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t} mm
                  </button>
                );
              })}
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1">
              {(Object.keys(HL_COLORS) as HighlightColor[]).map((c) => {
                const palette = tool === "highlight" ? HL_COLORS : PEN_COLORS;
                const active = tool === "highlight" ? hlColor === c : penColor === c;
                return (
                  <button
                    key={c}
                    onClick={() => (tool === "highlight" ? setHlColor(c) : setPenColor(c))}
                    className={`h-5 w-5 rounded-full border-2 ${
                      active ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ background: palette[c] }}
                    title={c}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Second row — sidebar tabs + page nav + zoom */}
      <div className="grid grid-cols-[12rem_1fr_auto] items-center gap-2 border-b border-border/60 bg-muted/20 px-2 py-1.5 text-sm">
        <div className="flex">
          <button
            onClick={() => setSideTab("index")}
            className={`flex-1 rounded-l-md border border-border/60 px-2 py-1 text-xs font-medium ${
              sideTab === "index" ? "bg-card" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <BookMarked className="mr-1 inline h-3 w-3" /> Índice
          </button>
          <button
            onClick={() => setSideTab("notes")}
            className={`flex-1 rounded-r-md border border-l-0 border-border/60 px-2 py-1 text-xs font-medium ${
              sideTab === "notes" ? "bg-card" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <StickyNote className="mr-1 inline h-3 w-3" /> Notas
          </button>
        </div>

        {kind === "pdf" ? (
          <div className="flex items-center justify-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs tabular-nums">
              Página {page} de {numPages || "—"}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={page >= numPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div />
        )}

        {kind === "pdf" ? (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Conteúdo: sidebar interna + visualizador */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ReaderSidebar
          sideTab={sideTab}
          notes={notes}
          highlights={highlights}
          setPage={setPage}
          deleteHighlight={deleteHighlight}
        />

        <div className="flex-1 overflow-auto bg-muted/40" onMouseUp={handleTextSelection}>
          {!url ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando documento…
            </div>
          ) : kind === "pdf" ? (
            <div className="flex justify-center p-6">
              <div
                ref={pageRef}
                className="relative inline-block shadow-elegant"
                onClick={handlePageClick}
                style={{
                  cursor:
                    tool === "note"
                      ? "crosshair"
                      : tool === "highlight"
                        ? "text"
                        : tool === "pen"
                          ? "crosshair"
                          : "default",
                }}
              >
                <PdfDocument
                  file={url}
                  onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                  onLoadError={(e) => toast.error("Não foi possível abrir o PDF: " + e.message)}
                  loading={<Skeleton className="h-[800px] w-[600px]" />}
                >
                  <PdfPage pageNumber={page} scale={scale} renderAnnotationLayer renderTextLayer />
                </PdfDocument>
                <DrawCanvas
                  docId={doc.id}
                  page={page}
                  scale={scale}
                  tool={tool}
                  color={tool === "highlight" ? HL_COLORS[hlColor] : PEN_COLORS[penColor]}
                  thickness={
                    tool === "highlight" ? Number(hlThickness) * 6 : Number(penThickness) * 2
                  }
                  opacity={tool === "highlight" ? 0.45 : 1}
                  containerRef={pageRef}
                />
                {pageNotes.map((n) => (
                  <StickyNoteBubble
                    key={n.id}
                    note={n}
                    onChange={(c) => updateNote(n.id, c)}
                    onDelete={() => deleteNote(n.id)}
                  />
                ))}
              </div>
            </div>
          ) : kind === "epub" ? (
            <div className="h-full">
              <ReactReader
                url={url}
                location={epubLocation}
                locationChanged={(l) => setEpubLocation(l)}
              />
            </div>
          ) : (
            <iframe
              src={
                kind === "docx"
                  ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
                  : url
              }
              title={doc.title}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function ToolBtn({
  active,
  onClick,
  icon: Icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border/60 bg-background hover:bg-muted"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? "" : (color ?? "")}`} />
      {label}
    </button>
  );
}
