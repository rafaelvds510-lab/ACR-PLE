import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

import { Doc } from "./types";
import { DocumentViewer } from "./DocumentViewer";
import { FichamentoEditor } from "./FichamentoEditor";

export default function ReaderLayout() {
  const { id } = useParams({ from: "/_authenticated/biblioteca/ler/$id" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"pdf" | "epub" | "url" | "docx" | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (error || !data) {
        toast.error("Documento não encontrado");
        navigate({ to: "/biblioteca" });
        return;
      }
      setDoc(data as Doc);

      let url: string | null = null;
      const nameOrUrl = data.external_url ?? data.file_path ?? "";
      if (data.source_type === "url" && data.external_url) {
        url = data.external_url;
      } else if (data.file_path) {
        const { data: s } = await supabase.storage
          .from("library")
          .createSignedUrl(data.file_path, 60 * 60);
        url = s?.signedUrl ?? null;
      }
      const lower = nameOrUrl.toLowerCase();
      const kind: "pdf" | "epub" | "url" | "docx" = lower.endsWith(".epub")
        ? "epub"
        : lower.endsWith(".docx") ||
            lower.endsWith(".doc") ||
            lower.endsWith(".pptx") ||
            lower.endsWith(".xlsx")
          ? "docx"
          : lower.endsWith(".pdf") || data.source_type === "upload"
            ? "pdf"
            : "url";
      setFileKind(kind);
      setViewerUrl(url);
    })();
  }, [id, user, navigate]);

  if (!doc) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fileLabel =
    fileKind === "pdf"
      ? "Arquivo .PDF"
      : fileKind === "epub"
        ? "Arquivo .EPUB"
        : fileKind === "docx"
          ? "Documento"
          : "Link externo";

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-3 shadow-sm">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold uppercase tracking-wide truncate">
            {doc.title}
          </h1>
          <p className="text-xs text-muted-foreground">{fileLabel}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/biblioteca">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </header>

      {/* MAIN — split-screen */}
      <main className="flex flex-1 min-h-0 gap-4 overflow-hidden p-4">
        <DocumentViewer doc={doc} url={viewerUrl} kind={fileKind} onDocUpdate={setDoc} />
        <FichamentoEditor doc={doc} onDocUpdate={setDoc} />
      </main>
    </div>
  );
}
