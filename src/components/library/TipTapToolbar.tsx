import { Editor } from "@tiptap/react";
import { Bold, Italic, UnderlineIcon, Highlighter, List, ListOrdered } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function TipTapToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const fonts = ["Inter", "Arial", "Georgia", "Times New Roman"];
  const sizes = ["10px", "12px", "14px", "16px", "18px", "24px", "32px"];
  const colors = ["#0b1020", "#ffffff", "#dc2626", "#16a34a", "#2563eb", "#eab308", "#000000"];

  return (
    <div className="space-y-1.5 border-b border-border/60 bg-muted/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1">
        <Select onValueChange={(v) => editor.chain().focus().setFontFamily(v).run()}>
          <SelectTrigger className="h-7 w-[110px] text-xs">
            <SelectValue placeholder="Inter" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((f) => (
              <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(v) =>
            (
              editor.chain().focus() as never as {
                setFontSize: (s: string) => { run: () => void };
              }
            )
              .setFontSize(v)
              .run()
          }
        >
          <SelectTrigger className="h-7 w-[64px] text-xs">
            <SelectValue placeholder="16" />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <TBtn
          on={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={Bold}
        />
        <TBtn
          on={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={Italic}
        />
        <TBtn
          on={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={UnderlineIcon}
        />
        <TBtn
          on={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde68a" }).run()}
          icon={Highlighter}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => editor.chain().focus().setColor(c).run()}
              className="h-4 w-4 rounded-full border border-border/60"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TBtn
          on={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={List}
        />
        <TBtn
          on={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={ListOrdered}
        />
      </div>
    </div>
  );
}

function TBtn({
  on,
  onClick,
  icon: Icon,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <Button size="icon" variant={on ? "default" : "ghost"} className="h-7 w-7" onClick={onClick}>
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
