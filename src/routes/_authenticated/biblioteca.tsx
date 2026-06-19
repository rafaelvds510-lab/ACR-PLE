import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Upload,
  Link2,
  Plus,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/biblioteca")({ component: Biblioteca });

type Status = "unread" | "reading" | "completed" | "finished";
type SourceType = "upload" | "url";

interface Document {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  category: string | null;
  status: Status;
  source_type: SourceType;
  file_path: string | null;
  external_url: string | null;
  notes: string;
  current_page: number;
  total_pages: number;
  fichamento_title: string | null;
  created_at: string;
  updated_at: string;
}

function Biblioteca() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [docs, setDocs] = useState<Document[] | null>(null);
  const [editing, setEditing] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState<Document | null>(null);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs((data ?? []) as Document[]);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  if (pathname.startsWith("/biblioteca/ler/")) {
    return <Outlet />;
  }

  const handleDelete = async () => {
    if (!deleting) return;
    if (deleting.file_path) {
      await supabase.storage.from("library").remove([deleting.file_path]);
    }
    const { error } = await supabase.from("documents").delete().eq("id", deleting.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Documento removido");
      refresh();
    }
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Acervo"
        title="Biblioteca"
        description="Envie PDFs, conecte links externos e mantenha seus fichamentos por obra."
      >
        <AddDocumentDialog onCreated={refresh} />
      </PageHeader>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {docs === null ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="py-16">
              <EmptyState
                icon={FileText}
                title="Sua biblioteca está vazia"
                description="Envie um PDF ou adicione um link externo para iniciar seus estudos e fichamentos."
                cta={<AddDocumentDialog onCreated={refresh} />}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                onOpen={() => navigate({ to: "/biblioteca/ler/$id", params: { id: d.id } })}
                onEdit={() => setEditing(d)}
                onDelete={() => setDeleting(d)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditDocumentDialog
          doc={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo, marca-textos, notas e fichamento serão
              removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DocCard({
  doc,
  onOpen,
  onEdit,
  onDelete,
}: {
  doc: Document;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct =
    doc.total_pages > 0 ? Math.min(100, Math.round((doc.current_page / doc.total_pages) * 100)) : 0;
  return (
    <Card className="group relative border-border/60 transition-all hover:border-gold/40 hover:shadow-elegant">
      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/80 backdrop-blur">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="cursor-pointer p-5" onClick={onOpen}>
        <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <BookOpen className="h-10 w-10 text-gold opacity-80" />
        </div>
        <div className="mt-4 space-y-2">
          <h3 className="font-display text-lg leading-tight line-clamp-2">{doc.title}</h3>
          {doc.author && <p className="text-sm text-muted-foreground line-clamp-1">{doc.author}</p>}
          {doc.category && (
            <span className="inline-flex rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
              {doc.category}
            </span>
          )}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {doc.total_pages > 0
                  ? `${doc.current_page} / ${doc.total_pages} páginas`
                  : "Páginas não definidas"}
              </span>
              <span className="font-medium text-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-1.5 h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddDocumentDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SourceType>("upload");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setAuthor("");
    setCategory("");
    setUrl("");
    setFile(null);
    setMode("upload");
    setTotalPages("");
  };

  const submit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Informe um título");
    if (mode === "upload" && !file) return toast.error("Selecione um arquivo");
    if (mode === "url" && !url.trim()) return toast.error("Informe a URL");

    setLoading(true);
    try {
      let file_path: string | null = null;
      if (mode === "upload" && file) {
        const uuid =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const path = `${user.id}/${uuid}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("library").upload(path, file, {
          contentType: file.type || "application/pdf",
        });
        if (upErr) throw upErr;
        file_path = path;
      }
      const { error } = await supabase.from("documents").insert({
        user_id: user.id,
        title: title.trim(),
        author: author.trim() || null,
        category: category.trim() || null,
        source_type: mode,
        file_path,
        external_url: mode === "url" ? url.trim() : null,
        total_pages: Number(totalPages) || 0,
      });
      if (error) throw error;
      toast.success("Documento adicionado");
      setOpen(false);
      reset();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo documento</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as SourceType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="mr-2 h-4 w-4" />
              URL externa
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <Label>Arquivo (PDF ou EPUB)</Label>
            <Input
              type="file"
              accept="application/pdf,application/epub+zip,.epub"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </TabsContent>
          <TabsContent value="url" className="pt-4">
            <Label>URL do documento ou site</Label>
            <Input
              placeholder="https://exemplo.com/artigo.pdf"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-3 pt-2">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Vigiar e Punir"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Autor</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Foucault"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Filosofia"
              />
            </div>
            <div>
              <Label>Total de páginas</Label>
              <Input
                type="number"
                min={0}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDocumentDialog({
  doc,
  open,
  onOpenChange,
  onSaved,
}: {
  doc: Document;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [author, setAuthor] = useState(doc.author ?? "");
  const [category, setCategory] = useState(doc.category ?? "");
  const [totalPages, setTotalPages] = useState(String(doc.total_pages ?? 0));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("documents")
      .update({
        title: title.trim(),
        author: author.trim() || null,
        category: category.trim() || null,
        total_pages: Number(totalPages) || 0,
      })
      .eq("id", doc.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Documento atualizado");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Editar documento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Autor</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <Label>Total de páginas</Label>
              <Input
                type="number"
                min={0}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
