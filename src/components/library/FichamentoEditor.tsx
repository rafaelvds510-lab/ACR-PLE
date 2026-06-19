import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import { Mark, mergeAttributes } from "@tiptap/core";
import { BookMarked, Save, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Doc, Status } from "./types";
import { TipTapToolbar } from "./TipTapToolbar";

const FontSize = Mark.create({
  name: "fontSize",
  addOptions: () => ({ HTMLAttributes: {} }),
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => (attrs.size ? { style: `font-size: ${attrs.size}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{ style: "font-size" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ commands }: { commands: { setMark: (n: string, a: unknown) => boolean } }) =>
          commands.setMark(this.name, { size }),
      unsetFontSize:
        () =>
        ({ commands }: { commands: { unsetMark: (n: string) => boolean } }) =>
          commands.unsetMark(this.name),
    } as never;
  },
});

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s ? `<p>${s}</p>` : "<p></p>";
  }
}

export function FichamentoEditor({
  doc,
  onDocUpdate,
}: {
  doc: Doc;
  onDocUpdate: (d: Doc) => void;
}) {
  const lsKey = `fichamento_draft_${doc.id}`;
  const [title, setTitle] = useState(doc.fichamento_title ?? "");
  const [category, setCategory] = useState(doc.category ?? "");
  const [currentPage, setCurrentPage] = useState(doc.current_page || 0);
  const [totalPages, setTotalPages] = useState(doc.total_pages || 0);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      FontSize,
    ],

    content: (() => {
      try {
        const draft = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null;
        if (draft) return JSON.parse(draft);
      } catch {
        /* noop */
      }
      return doc.notes ? safeParse(doc.notes) : "<p></p>";
    })(),
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[480px] p-4",
        style: "font-family: Inter, sans-serif;",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      try {
        localStorage.setItem(lsKey, JSON.stringify(editor.getJSON()));
      } catch {
        /* noop */
      }
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, lsKey]);

  const pct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  const save = async (status: Status) => {
    if (!editor) return;
    setSaving(true);
    const json = editor.getJSON();
    const { data, error } = await supabase
      .from("documents")
      .update({
        fichamento_title: title || null,
        category: category || null,
        current_page: currentPage,
        total_pages: totalPages,
        notes: JSON.stringify(json),
        status,
      })
      .eq("id", doc.id)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    try {
      localStorage.removeItem(lsKey);
    } catch {
      /* noop */
    }
    if (data) onDocUpdate(data as Doc);
    toast.success(status === "finished" ? "Fichamento encerrado" : "Rascunho salvo");
  };

  return (
    <aside className="hidden w-[620px] xl:w-[720px] shrink-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm lg:flex">
      {/* Cabeçalho */}
      <div className="border-b border-border/60 bg-muted/40 p-4">
        <h2 className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide">
          <BookMarked className="h-4 w-4" /> Fichamento Estratégico
        </h2>
      </div>

      {/* Meta */}
      <div className="space-y-3 border-b border-border/60 p-4 text-xs">
        <div>
          <Label className="mb-1 block text-xs font-semibold">Título da Obra / Capítulo</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Capítulo 1 - O Início..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs font-semibold">Categoria / Tema</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Marketing..."
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold">Progresso (Páginas)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value) || 0)}
                className="text-center"
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                min={0}
                value={totalPages}
                onChange={(e) => setTotalPages(Number(e.target.value) || 0)}
                className="text-center"
              />
            </div>
          </div>
        </div>
        <Progress value={pct} className="h-1" />
      </div>

      {/* Toolbar rich text */}
      <TipTapToolbar editor={editor} />

      {/* Editor */}
      <div className="flex flex-1 min-h-0 flex-col p-4 pt-3">
        <Label className="mb-1 block text-xs font-semibold">Minhas Anotações</Label>
        <div className="flex-1 min-h-0 overflow-auto rounded-md border border-border/60 bg-background">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/40 p-3">
        <Button variant="outline" size="sm" onClick={() => save("reading")} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Rascunho
        </Button>
        <Button
          size="sm"
          onClick={() => save("finished")}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Encerrar Texto
        </Button>
      </div>
    </aside>
  );
}
