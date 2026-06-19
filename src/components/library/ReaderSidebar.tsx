import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { HL_COLORS, HL, StickyNoteRow } from "./types";

export function ReaderSidebar({
  sideTab,
  notes,
  highlights,
  setPage,
  deleteHighlight,
}: {
  sideTab: "index" | "notes";
  notes: StickyNoteRow[];
  highlights: HL[];
  setPage: (p: number) => void;
  deleteHighlight: (id: string) => void;
}) {
  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-border/60 bg-card">
      <ScrollArea className="h-full">
        {sideTab === "index" ? (
          <p className="p-3 text-xs italic text-muted-foreground">
            Sumário indisponível para este pergaminho.
          </p>
        ) : notes.length === 0 && highlights.length === 0 ? (
          <p className="p-3 text-xs italic text-muted-foreground">Nenhuma nota criada ainda.</p>
        ) : (
          <div className="space-y-1 p-2">
            {notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.page)}
                className="block w-full rounded-md border border-border/60 bg-background/60 p-2 text-left hover:border-gold/40"
              >
                <p className="text-[10px] uppercase tracking-wider text-gold">Página {n.page}</p>
                <p className="mt-0.5 line-clamp-2 text-xs">{n.content || "(sem conteúdo)"}</p>
              </button>
            ))}
            {highlights.map((h) => (
              <div key={h.id} className="rounded-md border border-border/60 bg-background/60 p-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPage(h.page)}
                    className="text-[10px] uppercase tracking-wider text-gold"
                  >
                    Pág. {h.page}
                  </button>
                  <button
                    onClick={() => deleteHighlight(h.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p
                  className="mt-0.5 line-clamp-2 rounded px-1 text-[11px]"
                  style={{ background: HL_COLORS[h.color] }}
                >
                  {h.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
