import { useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNoteRow } from "./types";

export function StickyNoteBubble({
  note,
  onChange,
  onDelete,
}: {
  note: StickyNoteRow;
  onChange: (c: string) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(!note.content);
  const [val, setVal] = useState(note.content);

  return (
    <div
      className="absolute z-20"
      style={{ left: `${note.x}%`, top: `${note.y}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-primary shadow ring-1 ring-background"
      >
        <StickyNote className="h-2 w-2" />
      </button>

      {open && (
        <div className="absolute left-4 top-2 w-60 rounded-md border border-border bg-popover p-2 shadow-elegant">
          <Textarea
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => onChange(val)}
            placeholder="Escreva sua nota…"
            className="min-h-[80px] resize-none text-xs"
          />
          <div className="mt-1 flex justify-end">
            <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
