import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  Quote,
  Sigma,
  Save,
  ArrowLeft,
  Plus,
  BookMarked,
  FileText,
  CalendarDays,
  Type,
  Layers,
  Pencil,
  Trash2,
} from "lucide-react";
import { InlineMath, BlockMath } from "react-katex";
import { Link } from "@tanstack/react-router";

// ─── FontSize extension (Bug 2 fix: use setMark, not updateAttributes) ────────

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      // setMark applies inline mark to selected text — this is the correct approach
      setFontSize:
        (fontSize: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) => {
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    } as never;
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialTitle: string;
  initialContent: unknown;
  template: "caderno" | "diario";
  onSave: (title: string, content: unknown) => Promise<void>;
}

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

type TipTapDoc = { type: "doc"; content: TipTapNode[] };

interface SidebarChapter {
  label: string;
  chapterIdx: number;
  pages: Array<{ label: string; pageIdx: number }>;
}

// null = full document view; object = isolated page view
type ActiveSelection = { mode: "full" } | { mode: "page"; chapterIdx: number; pageIdx: number };

interface Heading {
  level: number;
  text: string;
  pos: number;
}

// ─── Font / Size options ──────────────────────────────────────────────────────

const FONTS = [
  { label: "Calibri", value: "Calibri, Candara, Segoe, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Candara", value: "Candara, Calibri, Segoe, sans-serif" },
  { label: "Cambria", value: "Cambria, Georgia, serif" },
];

const SIZES = [
  { label: "10", value: "10pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
];

// ─── Doc slice helpers (Bug 1 fix) ───────────────────────────────────────────

/**
 * Build sidebar chapter/page tree from editor headings (full-view mode).
 * We use the live headings extracted from the editor to keep the sidebar
 * in sync while the user types (without waiting for a save).
 */
function buildSidebarTreeFromHeadings(headings: Heading[]): SidebarChapter[] {
  const chapters: SidebarChapter[] = [];
  let currentChapter: SidebarChapter | null = null;
  let chapterIdx = -1;
  let pageIdx = -1;
  for (const h of headings) {
    if (h.level === 2) {
      chapterIdx++;
      pageIdx = -1;
      currentChapter = { label: h.text, chapterIdx, pages: [] };
      chapters.push(currentChapter);
    } else if (h.level === 3 && currentChapter) {
      pageIdx++;
      currentChapter.pages.push({ label: h.text, pageIdx });
    }
  }
  return chapters;
}

/** Build sidebar tree from a stored TipTapDoc JSON (page-view mode). */
function buildSidebarTreeFromDoc(doc: TipTapDoc): SidebarChapter[] {
  const chapters: SidebarChapter[] = [];
  let currentChapter: SidebarChapter | null = null;
  let chapterIdx = -1;
  let pageIdx = -1;
  for (const node of doc.content ?? []) {
    if (node.type === "heading") {
      const level = (node.attrs?.level as number) ?? 0;
      const text = (node.content ?? []).map((n) => n.text ?? "").join("");
      if (level === 2) {
        chapterIdx++;
        pageIdx = -1;
        currentChapter = { label: text, chapterIdx, pages: [] };
        chapters.push(currentChapter);
      } else if (level === 3 && currentChapter) {
        pageIdx++;
        currentChapter.pages.push({ label: text, pageIdx });
      }
    }
  }
  return chapters;
}

/**
 * Extract the content slice of the chapterIdx-th H2 chapter from the doc.
 * Returns a valid TipTapDoc containing only that chapter's nodes.
 */
function extractChapterSlice(doc: TipTapDoc, chapterIdx: number): TipTapDoc {
  const nodes = doc.content ?? [];
  let count = -1;
  let start = -1;
  let end = nodes.length;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "heading" && (nodes[i].attrs?.level as number) === 2) {
      count++;
      if (count === chapterIdx) {
        start = i;
      } else if (count > chapterIdx && start !== -1) {
        end = i;
        break;
      }
    }
  }
  if (start === -1) return { type: "doc", content: [{ type: "paragraph" }] };
  return { type: "doc", content: nodes.slice(start, end) };
}

/**
 * Extract the content slice of the pageIdx-th H3 page inside a given chapter.
 * Returns a valid TipTapDoc containing only that page's nodes (H3 + body).
 */
function extractPageSlice(doc: TipTapDoc, chapterIdx: number, pageIdx: number): TipTapDoc {
  const chapterSlice = extractChapterSlice(doc, chapterIdx);
  const nodes = chapterSlice.content ?? [];
  let count = -1;
  let start = -1;
  let end = nodes.length;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "heading" && (nodes[i].attrs?.level as number) === 3) {
      count++;
      if (count === pageIdx) {
        start = i;
      } else if (count > pageIdx && start !== -1) {
        end = i;
        break;
      }
    }
  }
  if (start === -1) return { type: "doc", content: [{ type: "paragraph" }] };
  return { type: "doc", content: nodes.slice(start, end) };
}

/**
 * Merge an edited page slice back into the full document JSON.
 * Replaces only the nodes of the specified chapter + page.
 */
function mergePageSlice(
  doc: TipTapDoc,
  chapterIdx: number,
  pageIdx: number,
  pageDoc: TipTapDoc,
): TipTapDoc {
  const nodes = [...(doc.content ?? [])];

  // 1. Find the chapter's node range [chapStart, chapEnd)
  let chapCount = -1;
  let chapStart = -1;
  let chapEnd = nodes.length;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "heading" && (nodes[i].attrs?.level as number) === 2) {
      chapCount++;
      if (chapCount === chapterIdx) chapStart = i;
      else if (chapCount > chapterIdx && chapStart !== -1) {
        chapEnd = i;
        break;
      }
    }
  }
  if (chapStart === -1) return doc;

  const chapterNodes = [...nodes.slice(chapStart, chapEnd)];

  // 2. Find the page's node range [pgStart, pgEnd) within the chapter
  let pgCount = -1;
  let pgStart = -1;
  let pgEnd = chapterNodes.length;
  for (let i = 0; i < chapterNodes.length; i++) {
    if (chapterNodes[i].type === "heading" && (chapterNodes[i].attrs?.level as number) === 3) {
      pgCount++;
      if (pgCount === pageIdx) pgStart = i;
      else if (pgCount > pageIdx && pgStart !== -1) {
        pgEnd = i;
        break;
      }
    }
  }
  if (pgStart === -1) return doc;

  // 3. Splice: replace only the edited page's nodes
  const newChapNodes = [
    ...chapterNodes.slice(0, pgStart),
    ...(pageDoc.content ?? []),
    ...chapterNodes.slice(pgEnd),
  ];

  return {
    type: "doc",
    content: [...nodes.slice(0, chapStart), ...newChapNodes, ...nodes.slice(chapEnd)],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractHeadings(editor: Editor): Heading[] {
  const headings: Heading[] = [];
  editor.state.doc.forEach((node, offset) => {
    if (node.type.name === "heading") {
      headings.push({
        level: node.attrs.level as number,
        text: node.textContent,
        pos: offset,
      });
    }
  });
  return headings;
}

function todayLabel() {
  const d = new Date();
  const label = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─── Sidebar: Caderno ─────────────────────────────────────────────────────────

function CadernoSidebar({
  chapters,
  activeSelection,
  onSelectPage,
  onAddPage,
  onViewFull,
  onEditChapterName,
  onDeleteChapter,
  onEditPageName,
  onDeletePage,
}: {
  chapters: SidebarChapter[];
  activeSelection: ActiveSelection;
  onSelectPage: (chapterIdx: number, pageIdx: number) => void;
  onAddPage: (chapterIdx: number) => void;
  onViewFull: () => void;
  onEditChapterName: (chapterIdx: number, oldName: string) => void;
  onDeleteChapter: (chapterIdx: number) => void;
  onEditPageName: (chapterIdx: number, pageIdx: number, oldName: string) => void;
  onDeletePage: (chapterIdx: number, pageIdx: number) => void;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Auto-expand the active chapter
  useEffect(() => {
    if (activeSelection.mode === "page") {
      setExpanded((prev) => ({ ...prev, [activeSelection.chapterIdx]: true }));
    }
  }, [activeSelection]);

  if (chapters.length === 0) {
    return (
      <div className="p-3">
        <p className="text-xs italic text-muted-foreground">
          Adicione um <strong>Capítulo</strong> para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {/* Return to full view */}
      {activeSelection.mode === "page" && (
        <button
          onClick={onViewFull}
          className="mb-2 flex w-full items-center gap-2 rounded-md border border-border/50 px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5" />
          Ver caderno completo
        </button>
      )}

      {chapters.map((cap) => {
        const isExpanded = expanded[cap.chapterIdx] ?? true;
        const isChapterActive =
          activeSelection.mode === "page" && activeSelection.chapterIdx === cap.chapterIdx;

        return (
          <div key={cap.chapterIdx} className="mb-1">
            {/* ── Chapter header ─────────────────────────── */}
            <div
              className={`group flex items-center gap-1 rounded-md transition ${isChapterActive ? "bg-primary/8" : ""}`}
            >
              <button
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [cap.chapterIdx]: !prev[cap.chapterIdx] }))
                }
                className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left"
              >
                <BookMarked
                  className={`h-3.5 w-3.5 shrink-0 ${isChapterActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`flex-1 truncate text-xs font-semibold ${isChapterActive ? "text-primary" : ""}`}
                >
                  {cap.label || `Capítulo ${cap.chapterIdx + 1}`}
                </span>
              </button>

              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 pr-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditChapterName(cap.chapterIdx, cap.label);
                  }}
                  title="Renomear Capítulo"
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChapter(cap.chapterIdx);
                  }}
                  title="Excluir Capítulo"
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPage(cap.chapterIdx);
                  }}
                  title="Nova Página"
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* ── Pages ──────────────────────────────────── */}
            {isExpanded && (
              <div className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l-2 border-border/30 pl-3">
                {/* Section label */}
                <p className="mb-0.5 pt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Páginas
                </p>
                {cap.pages.length === 0 ? (
                  <p className="py-1 text-[10px] italic text-muted-foreground">Nenhuma página</p>
                ) : (
                  cap.pages.map((pg) => {
                    const isPageActive =
                      activeSelection.mode === "page" &&
                      activeSelection.chapterIdx === cap.chapterIdx &&
                      activeSelection.pageIdx === pg.pageIdx;
                    return (
                      <div
                        key={pg.pageIdx}
                        className="group flex items-center justify-between gap-1 rounded-md transition hover:bg-muted/50"
                      >
                        <button
                          onClick={() => onSelectPage(cap.chapterIdx, pg.pageIdx)}
                          className={`flex flex-1 items-center gap-2 px-2 py-1 text-left text-xs
                            ${
                              isPageActive
                                ? "font-medium text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{pg.label || `Página ${pg.pageIdx + 1}`}</span>
                        </button>

                        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 pr-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPageName(cap.chapterIdx, pg.pageIdx, pg.label);
                            }}
                            title="Renomear Página"
                            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(cap.chapterIdx, pg.pageIdx);
                            }}
                            title="Excluir Página"
                            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sidebar: Diário ──────────────────────────────────────────────────────────

function DiarioSidebar({
  headings,
  onJump,
  onNewEntry,
  activePos,
}: {
  headings: Heading[];
  onJump: (pos: number) => void;
  onNewEntry: () => void;
  activePos: number;
}) {
  const entries = headings.filter((h) => h.level === 2);
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="px-2">
        <button
          onClick={onNewEntry}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Entrada Hoje
        </button>
      </div>
      <div className="px-2">
        <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Registros
        </p>
        <div className="flex flex-col gap-0.5">
          {entries.length === 0 ? (
            <p className="px-1 py-2 text-xs italic text-muted-foreground">Nenhuma entrada ainda.</p>
          ) : (
            entries.map((h, i) => (
              <button
                key={i}
                onClick={() => onJump(h.pos)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition
                  ${
                    activePos === h.pos
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{h.text || "Entrada"}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function EssayEditor({ initialTitle, initialContent, template, onSave }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [latex, setLatex] = useState("E = mc^2");
  const [showLatex, setShowLatex] = useState(false);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activePos, setActivePos] = useState(0);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [selectedSize, setSelectedSize] = useState(SIZES[1].value);

  /**
   * fullDocRef — always holds the complete document JSON.
   * In page-view mode the editor only has a slice of this; the rest lives here.
   * Using a ref avoids stale-closure issues inside callbacks.
   */
  const fullDocRef = useRef<TipTapDoc>(initialContent as TipTapDoc);
  /** fullDoc state mirrors the ref so that the sidebar re-renders when it changes. */
  const [fullDoc, setFullDoc] = useState<TipTapDoc>(initialContent as TipTapDoc);

  const [activeSelection, setActiveSelection] = useState<ActiveSelection>({ mode: "full" });

  const isCaderno = template === "caderno";
  const isDiario = template === "diario";

  // Build sidebar chapters:
  // • full view  → built from live editor headings (real-time as user types)
  // • page view  → built from fullDoc state (stable reference to whole doc)
  const sidebarChapters = useMemo<SidebarChapter[]>(() => {
    if (!isCaderno) return [];
    if (activeSelection.mode === "full") {
      return buildSidebarTreeFromHeadings(headings);
    }
    return buildSidebarTreeFromDoc(fullDoc);
  }, [isCaderno, activeSelection.mode, headings, fullDoc]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Comece a escrever…" }),
      TextStyle,
      FontFamily,
      FontSize,
    ],
    content: initialContent as never,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none font-display text-foreground",
      },
    },
    onUpdate({ editor: e }) {
      setHeadings(extractHeadings(e));
    },
    onSelectionUpdate({ editor: e }) {
      const pos = e.state.selection.$anchor.before(1);
      setActivePos(pos);
    },
  });

  // Initialise headings after mount
  useEffect(() => {
    if (editor) setHeadings(extractHeadings(editor));
  }, [editor]);

  /**
   * Return the up-to-date full document by merging the current editor content.
   * • full view  → editor content IS the full doc
   * • page view  → merge edited slice back into fullDocRef
   */
  const getMergedFullDoc = useCallback(
    (editorContent: TipTapDoc): TipTapDoc => {
      if (activeSelection.mode === "full") return editorContent;
      return mergePageSlice(
        fullDocRef.current,
        activeSelection.chapterIdx,
        activeSelection.pageIdx,
        editorContent,
      );
    },
    [activeSelection],
  );

  /** Persist to DB: always saves the complete document regardless of view mode. */
  const save = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const editorContent = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(editorContent);
      fullDocRef.current = merged;
      setFullDoc(merged);
      await onSave(title, merged);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }, [editor, title, onSave, getMergedFullDoc]);

  // Autosave 2.5 s after last keystroke
  useEffect(() => {
    if (!editor) return;
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 2500);
    };
    editor.on("update", handler);
    return () => {
      clearTimeout(timer);
      editor.off("update", handler);
    };
  }, [editor, save]);

  /**
   * BUG 1 FIX — switch to isolated page view.
   * 1. Merge current editor content back into fullDoc.
   * 2. Extract only the target page's JSON slice.
   * 3. Load that slice into the editor (replaces full doc).
   */
  const selectPage = useCallback(
    (chapterIdx: number, pageIdx: number) => {
      if (!editor) return;
      const current = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(current);
      fullDocRef.current = merged;
      setFullDoc(merged);

      const pageSlice = extractPageSlice(merged, chapterIdx, pageIdx);
      editor.commands.setContent(pageSlice as never);
      setActiveSelection({ mode: "page", chapterIdx, pageIdx });
    },
    [editor, getMergedFullDoc],
  );

  /** Return to full-document view. */
  const viewFull = useCallback(() => {
    if (!editor) return;
    const current = editor.getJSON() as TipTapDoc;
    const merged = getMergedFullDoc(current);
    fullDocRef.current = merged;
    setFullDoc(merged);
    editor.commands.setContent(merged as never);
    setActiveSelection({ mode: "full" });
  }, [editor, getMergedFullDoc]);

  // ── Diário helpers ────────────────────────────────────────────────────────

  const jumpTo = useCallback(
    (pos: number) => {
      if (!editor) return;
      editor.commands.focus();
      editor.commands.setTextSelection(pos + 1);
      const domAtPos = editor.view.domAtPos(pos + 1);
      const el = domAtPos.node.parentElement;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActivePos(pos);
    },
    [editor],
  );

  const addDiaryEntry = useCallback(() => {
    if (!editor) return;
    const label = todayLabel();
    const alreadyExists = headings.some((h) => h.level === 2 && h.text === label);
    if (alreadyExists) {
      const existing = headings.find((h) => h.level === 2 && h.text === label)!;
      jumpTo(existing.pos);
      return;
    }
    const end = editor.state.doc.content.size;
    editor
      .chain()
      .focus()
      .insertContentAt(end, [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: label }] },
        { type: "paragraph", content: [{ type: "text", text: "" }] },
      ])
      .run();
    setTimeout(() => {
      const updated = extractHeadings(editor);
      const entry = updated.find((h) => h.level === 2 && h.text === label);
      if (entry) jumpTo(entry.pos);
    }, 50);
  }, [editor, headings, jumpTo]);

  // ── Caderno helpers ───────────────────────────────────────────────────────

  /** Add a new chapter. Always operates on the full doc and returns to full view. */
  const addChapter = useCallback(() => {
    if (!editor) return;
    const current = editor.getJSON() as TipTapDoc;
    const merged = getMergedFullDoc(current);
    const chapterCount = buildSidebarTreeFromDoc(merged).length + 1;
    const newNodes: TipTapNode[] = [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: `Capítulo ${chapterCount}` }],
      },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Página 1" }] },
      { type: "paragraph" },
    ];
    const newFull: TipTapDoc = { type: "doc", content: [...(merged.content ?? []), ...newNodes] };
    fullDocRef.current = newFull;
    setFullDoc(newFull);
    editor.commands.setContent(newFull as never);
    setActiveSelection({ mode: "full" });
  }, [editor, getMergedFullDoc]);

  /** Add a new page to a given chapter and immediately open it in page view. */
  const addPage = useCallback(
    (chapterIdx: number) => {
      if (!editor) return;
      const current = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(current);
      const tree = buildSidebarTreeFromDoc(merged);
      const chapter = tree.find((c) => c.chapterIdx === chapterIdx);
      const newPageNum = (chapter?.pages.length ?? 0) + 1;
      const newPageIdx = chapter?.pages.length ?? 0;

      // Find where the chapter ends in the flat nodes array
      const nodes = merged.content ?? [];
      let chapCount = -1;
      let chapStart = -1;
      let chapEnd = nodes.length;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].type === "heading" && (nodes[i].attrs?.level as number) === 2) {
          chapCount++;
          if (chapCount === chapterIdx) chapStart = i;
          else if (chapCount > chapterIdx && chapStart !== -1) {
            chapEnd = i;
            break;
          }
        }
      }
      if (chapStart === -1) return;

      const newPageNode: TipTapNode = {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: `Página ${newPageNum}` }],
      };
      const newFull: TipTapDoc = {
        type: "doc",
        content: [
          ...nodes.slice(0, chapEnd),
          newPageNode,
          { type: "paragraph" },
          ...nodes.slice(chapEnd),
        ],
      };
      fullDocRef.current = newFull;
      setFullDoc(newFull);

      // Open the new page immediately
      const pageSlice = extractPageSlice(newFull, chapterIdx, newPageIdx);
      if (activeSelection.mode === "full") {
        editor.commands.setContent(newFull as never);
        setActiveSelection({ mode: "page", chapterIdx, pageIdx: newPageIdx });
      } else {
        editor.commands.setContent(pageSlice as never);
        setActiveSelection({ mode: "page", chapterIdx, pageIdx: newPageIdx });
      }
    },
    [editor, getMergedFullDoc, activeSelection.mode],
  );

  const editChapterName = useCallback(
    (chapterIdx: number, oldName: string) => {
      const newName = window.prompt("Nome do capítulo:", oldName);
      if (!newName || newName === oldName) return;
      if (!editor) return;
      const current = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(current);

      let chapCount = -1;
      const newNodes = (merged.content ?? []).map((node) => {
        if (node.type === "heading" && (node.attrs?.level as number) === 2) {
          chapCount++;
          if (chapCount === chapterIdx) {
            return { ...node, content: [{ type: "text", text: newName }] };
          }
        }
        return node;
      });

      const newFull: TipTapDoc = { type: "doc", content: newNodes };
      fullDocRef.current = newFull;
      setFullDoc(newFull);

      if (activeSelection.mode === "full") {
        editor.commands.setContent(newFull as never);
      }
    },
    [editor, getMergedFullDoc, activeSelection.mode],
  );

  const deleteChapter = useCallback(
    (chapterIdx: number) => {
      if (!window.confirm("Excluir este capítulo e todas as suas páginas?")) return;
      if (!editor) return;
      const current = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(current);

      const nodes = merged.content ?? [];
      let chapCount = -1;
      let chapStart = -1;
      let chapEnd = nodes.length;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].type === "heading" && (nodes[i].attrs?.level as number) === 2) {
          chapCount++;
          if (chapCount === chapterIdx) chapStart = i;
          else if (chapCount > chapterIdx && chapStart !== -1) {
            chapEnd = i;
            break;
          }
        }
      }
      if (chapStart === -1) return;

      const newNodes = [...nodes.slice(0, chapStart), ...nodes.slice(chapEnd)];
      const newFull: TipTapDoc = {
        type: "doc",
        content: newNodes.length ? newNodes : [{ type: "paragraph" }],
      };

      fullDocRef.current = newFull;
      setFullDoc(newFull);

      if (activeSelection.mode === "full") {
        editor.commands.setContent(newFull as never);
      } else if (activeSelection.mode === "page" && activeSelection.chapterIdx === chapterIdx) {
        editor.commands.setContent(newFull as never);
        setActiveSelection({ mode: "full" });
      } else if (activeSelection.mode === "page" && activeSelection.chapterIdx > chapterIdx) {
        setActiveSelection({
          mode: "page",
          chapterIdx: activeSelection.chapterIdx - 1,
          pageIdx: activeSelection.pageIdx,
        });
      }
    },
    [editor, getMergedFullDoc, activeSelection],
  );

  const editPageName = useCallback(
    (chapterIdx: number, pageIdx: number, oldName: string) => {
      const newName = window.prompt("Nome da página:", oldName);
      if (!newName || newName === oldName) return;
      if (!editor) return;
      const current = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(current);

      let chapCount = -1;
      let chapActive = false;
      let pgCount = -1;

      const newNodes = (merged.content ?? []).map((node) => {
        if (node.type === "heading" && (node.attrs?.level as number) === 2) {
          chapCount++;
          chapActive = chapCount === chapterIdx;
        }
        if (chapActive && node.type === "heading" && (node.attrs?.level as number) === 3) {
          pgCount++;
          if (pgCount === pageIdx) {
            return { ...node, content: [{ type: "text", text: newName }] };
          }
        }
        return node;
      });

      const newFull: TipTapDoc = { type: "doc", content: newNodes };
      fullDocRef.current = newFull;
      setFullDoc(newFull);

      if (activeSelection.mode === "full") {
        editor.commands.setContent(newFull as never);
      } else if (
        activeSelection.mode === "page" &&
        activeSelection.chapterIdx === chapterIdx &&
        activeSelection.pageIdx === pageIdx
      ) {
        const pageSlice = extractPageSlice(newFull, chapterIdx, pageIdx);
        editor.commands.setContent(pageSlice as never);
      }
    },
    [editor, getMergedFullDoc, activeSelection],
  );

  const deletePage = useCallback(
    (chapterIdx: number, pageIdx: number) => {
      if (!window.confirm("Excluir esta página?")) return;
      if (!editor) return;
      const current = editor.getJSON() as TipTapDoc;
      const merged = getMergedFullDoc(current);

      const nodes = merged.content ?? [];
      let chapCount = -1;
      let chapStart = -1;
      let chapEnd = nodes.length;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].type === "heading" && (nodes[i].attrs?.level as number) === 2) {
          chapCount++;
          if (chapCount === chapterIdx) chapStart = i;
          else if (chapCount > chapterIdx && chapStart !== -1) {
            chapEnd = i;
            break;
          }
        }
      }
      if (chapStart === -1) return;

      const chapterNodes = nodes.slice(chapStart, chapEnd);
      let pgCount = -1;
      let pgStart = -1;
      let pgEnd = chapterNodes.length;
      for (let i = 0; i < chapterNodes.length; i++) {
        if (chapterNodes[i].type === "heading" && (chapterNodes[i].attrs?.level as number) === 3) {
          pgCount++;
          if (pgCount === pageIdx) pgStart = i;
          else if (pgCount > pageIdx && pgStart !== -1) {
            pgEnd = i;
            break;
          }
        }
      }
      if (pgStart === -1) return;

      const newChapNodes = [...chapterNodes.slice(0, pgStart), ...chapterNodes.slice(pgEnd)];
      const newNodes = [...nodes.slice(0, chapStart), ...newChapNodes, ...nodes.slice(chapEnd)];
      const newFull: TipTapDoc = { type: "doc", content: newNodes };

      fullDocRef.current = newFull;
      setFullDoc(newFull);

      if (activeSelection.mode === "full") {
        editor.commands.setContent(newFull as never);
      } else if (
        activeSelection.mode === "page" &&
        activeSelection.chapterIdx === chapterIdx &&
        activeSelection.pageIdx === pageIdx
      ) {
        editor.commands.setContent(newFull as never);
        setActiveSelection({ mode: "full" });
      } else if (
        activeSelection.mode === "page" &&
        activeSelection.chapterIdx === chapterIdx &&
        activeSelection.pageIdx > pageIdx
      ) {
        setActiveSelection({ mode: "page", chapterIdx, pageIdx: activeSelection.pageIdx - 1 });
      }
    },
    [editor, getMergedFullDoc, activeSelection],
  );

  // ── Font helpers ──────────────────────────────────────────────────────────

  const applyFont = useCallback(
    (font: string) => {
      setSelectedFont(font);
      if (!editor) return;
      editor.chain().focus().setFontFamily(font).run();
    },
    [editor],
  );

  const applySize = useCallback(
    (size: string) => {
      setSelectedSize(size);
      if (!editor) return;
      (editor.chain().focus() as never as { setFontSize: (s: string) => { run: () => void } })
        .setFontSize(size)
        .run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Left Sidebar ─────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-card">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-3 py-3">
          <span className="text-lg">{isCaderno ? "📓" : "📔"}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {isCaderno ? "Caderno" : "Diário"}
            </p>
            {isCaderno && activeSelection.mode === "page" && (
              <p className="truncate text-[10px] text-primary">Página isolada</p>
            )}
          </div>
        </div>

        {/* Add chapter button */}
        {isCaderno && (
          <div className="px-2 pt-2">
            <button
              onClick={addChapter}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 py-1.5 text-xs font-medium transition hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Capítulo
            </button>
          </div>
        )}

        <ScrollArea className="flex-1">
          {isCaderno && (
            <CadernoSidebar
              chapters={sidebarChapters}
              activeSelection={activeSelection}
              onSelectPage={selectPage}
              onAddPage={addPage}
              onViewFull={viewFull}
              onEditChapterName={editChapterName}
              onDeleteChapter={deleteChapter}
              onEditPageName={editPageName}
              onDeletePage={deletePage}
            />
          )}
          {isDiario && (
            <DiarioSidebar
              headings={headings}
              onJump={jumpTo}
              onNewEntry={addDiaryEntry}
              activePos={activePos}
            />
          )}
        </ScrollArea>
      </aside>

      {/* ── Editor Area ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/40 bg-background/80 px-6 py-2.5 backdrop-blur">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild size="sm">
              <Link to="/escrita">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 border-transparent bg-transparent px-2 py-1 text-lg font-bold shadow-none focus-visible:ring-1 md:text-xl lg:w-[400px]"
                placeholder="Título sem nome"
              />
              <div className="mt-0.5 flex items-center px-2 text-[10px] text-muted-foreground/60 gap-2">
                {saving ? (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    Salvando...
                  </span>
                ) : savedAt ? (
                  <span>Salvo automaticamente {savedAt.toLocaleTimeString()}</span>
                ) : (
                  <span>Salvo automaticamente ao pausar a digitação</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={save} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="mb-6 h-auto border-0 bg-transparent px-0 py-2 font-display text-4xl shadow-none focus-visible:ring-0"
            />

            {/* ── Formatting toolbar ─────────────────────── */}
            <div className="sticky top-0 z-10 mb-4 -mx-2 flex flex-wrap items-center gap-1 rounded-md border border-border bg-background/90 p-1.5 backdrop-blur">
              {/* Font family */}
              <Select value={selectedFont} onValueChange={applyFont}>
                <SelectTrigger className="h-7 w-[110px] text-xs">
                  <Type className="mr-1 h-3 w-3 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Font size — Bug 2 fix: calls applySize → setMark via extension */}
              <Select value={selectedSize} onValueChange={applySize}>
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mx-1 h-5 w-px bg-border" />

              <Tool
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Negrito (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Tool>
              <Tool
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Itálico (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Tool>

              <div className="mx-1 h-5 w-px bg-border" />

              <Tool
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Título (H1)"
              >
                <Heading1 className="h-4 w-4" />
              </Tool>
              <Tool
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title={isCaderno ? "Capítulo (H2)" : "Data/Entrada (H2)"}
              >
                <Heading2 className="h-4 w-4" />
              </Tool>
              {isCaderno && (
                <Tool
                  active={editor.isActive("heading", { level: 3 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  title="Página (H3)"
                >
                  <Heading3 className="h-4 w-4" />
                </Tool>
              )}

              <div className="mx-1 h-5 w-px bg-border" />

              <Tool
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Tool>
              <Tool
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="Citação"
              >
                <Quote className="h-4 w-4" />
              </Tool>

              <div className="mx-1 h-5 w-px bg-border" />

              <Tool active={showLatex} onClick={() => setShowLatex((v) => !v)} title="LaTeX">
                <Sigma className="h-4 w-4 text-gold" />
              </Tool>
            </div>

            {/* LaTeX panel */}
            {showLatex && (
              <div className="mb-4 rounded-md border border-gold/30 bg-gold/5 p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gold">
                  Pré-visualização LaTeX
                </p>
                <Input
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  placeholder="\frac{a}{b}"
                  className="font-mono"
                />
                <div className="mt-3 overflow-x-auto rounded bg-background/60 p-4 text-center text-lg">
                  <BlockMath math={latex} errorColor="oklch(0.65 0.21 27)" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Inline: <InlineMath math={latex} />. Copie o LaTeX para o documento.
                </p>
              </div>
            )}

            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function Tool({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      className={`h-8 w-8 p-0 ${active ? "bg-accent text-gold ring-1 ring-gold/30" : ""}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
