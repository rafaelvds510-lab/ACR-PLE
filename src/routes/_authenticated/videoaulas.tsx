/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import {
  Play,
  RotateCcw,
  RotateCw,
  Zap,
  MessageSquare,
  Tag,
  Link as LinkIcon,
  BookOpen,
  Video,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/videoaulas")({
  component: VideoAulas,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoNote {
  id: string;
  timestamp: number;
  content: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

function VideoAulas() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Extract Video ID ────────────────────────────────────────────────────────
  const extractVideoId = (rawUrl: string): string | null => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = rawUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleAssistir = () => {
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
    } else {
      toast.error("URL do YouTube inválida. Por favor, verifique o link.");
    }
  };

  // ── Player Callbacks ────────────────────────────────────────────────────────
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    setPlayer(event.target);
    // Restaura posição salva
    const savedPos = localStorage.getItem(`video-pos-${videoId}`);
    if (savedPos) {
      event.target.seekTo(parseFloat(savedPos));
    }
    // Carrega notas salvas para este vídeo
    const savedNotes = localStorage.getItem(`video-notes-${videoId}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch {
        /* ignore */
      }
    }
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    if (videoId) {
      localStorage.setItem(`video-pos-${videoId}`, event.target.getCurrentTime().toString());
    }
  };

  // ── Utilities ───────────────────────────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? h : null, m, s]
      .filter((x) => x !== null)
      .map((x) => x!.toString().padStart(2, "0"))
      .join(":");
  };

  const seekTo = (seconds: number) => {
    if (player) {
      player.seekTo(seconds, true);
      player.playVideo();
    }
  };

  const skip = (seconds: number) => {
    if (player) {
      player.seekTo(player.getCurrentTime() + seconds, true);
    }
  };

  const changeSpeed = (speed: string) => {
    setPlaybackSpeed(speed);
    if (player) {
      player.setPlaybackRate(parseFloat(speed));
    }
  };

  // ── Note Management ─────────────────────────────────────────────────────────
  const handleAddNote = () => {
    if (!currentNote.trim()) {
      toast.error("Escreva uma anotação antes de salvar.");
      return;
    }
    const timestamp = player ? Math.floor(player.getCurrentTime()) : 0;
    const newNote: VideoNote = {
      id: `note-${Date.now()}`,
      timestamp,
      content: currentNote.trim(),
    };
    const updatedNotes = [...notes, newNote].sort((a, b) => a.timestamp - b.timestamp);
    setNotes(updatedNotes);
    setCurrentNote("");
    // Persiste no localStorage
    if (videoId) {
      localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(updatedNotes));
    }
    toast.success(`Anotação salva em ${formatTime(timestamp)}!`);
    textareaRef.current?.focus();
  };

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    if (videoId) {
      localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(updatedNotes));
    }
  };

  const handleGenerateCards = () => {
    if (notes.length === 0) {
      toast.error("Adicione anotações primeiro!");
      return;
    }
    toast.success(`${notes.length} anotações prontas! Acesse Revisão para estudar.`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* ── Cabeçalho de Configuração ──────────────────────────────────────── */}
      <header className="shrink-0 border-b border-border/60 bg-card/60 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-screen-2xl flex flex-col gap-4">
          {/* Linha 1: Título + Link */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Título da Aula */}
            <div className="flex-1 min-w-52 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Título da Aula
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Fundamentos de Filosofia Política"
                className="h-9 bg-background/60 border-border/60 text-sm"
              />
            </div>

            {/* Link do YouTube */}
            <div className="flex-[2] min-w-72 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                Link do YouTube
              </Label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAssistir()}
                  placeholder="Cole o link aqui..."
                  className="h-9 flex-1 bg-background/60 border-border/60 text-sm"
                />
                <Button
                  onClick={handleAssistir}
                  className="h-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                  Assistir
                </Button>
              </div>
            </div>
          </div>

          {/* Linha 2: Categoria */}
          <div className="max-w-xs space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tema / Categoria
            </Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Filosofia, Direito, Literatura..."
              className="h-9 bg-background/60 border-border/60 text-sm"
            />
          </div>
        </div>
      </header>

      {/* ── Área Principal (Colunas) ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-screen-2xl h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          {/* ── Coluna Esquerda: Player ──────────────────── */}
          <section className="flex flex-col border-r border-border/40 overflow-hidden">
            {/* Player Area */}
            <div className="relative flex-1 bg-black/90">
              {videoId ? (
                <YouTube
                  videoId={videoId}
                  opts={{
                    height: "100%",
                    width: "100%",
                    playerVars: { autoplay: 1, modestbranding: 1, rel: 0 },
                  }}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  className="absolute inset-0 w-full h-full"
                  iframeClassName="w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Nenhum vídeo carregado</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Insira a URL do vídeo acima para começar
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controles Customizados — visíveis somente com vídeo carregado */}
            {videoId && (
              <div className="shrink-0 flex items-center gap-3 border-t border-border/40 bg-card/80 px-5 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
                  title="Voltar 10 segundos"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-xs">-10s</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
                  title="Avançar 10 segundos"
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="text-xs">+10s</span>
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Velocidade
                  </span>
                  <Select value={playbackSpeed} onValueChange={changeSpeed}>
                    <SelectTrigger className="h-8 w-20 text-xs border-border/60 bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["0.5", "0.75", "1", "1.25", "1.5", "1.75", "2", "2.5"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </section>

          {/* ── Coluna Direita: Anotações ────────────────── */}
          <aside className="flex flex-col overflow-hidden bg-card/30">
            {/* Cabeçalho do Painel */}
            <div className="shrink-0 flex items-center gap-2 border-b border-border/40 px-5 py-4">
              <MessageSquare className="h-4.5 w-4.5 text-gold" />
              <h2 className="font-display font-bold text-base">Anotações de Estudo</h2>
              {notes.length > 0 && (
                <span className="ml-auto text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {notes.length}
                </span>
              )}
            </div>

            {/* Área Scrollável */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
              {/* Input de Nota */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Notas da Aula
                </Label>
                <Textarea
                  ref={textareaRef}
                  rows={5}
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  placeholder="Escreva seus insights aqui..."
                  className="bg-background/60 border-border/60 resize-none text-sm leading-relaxed"
                />

                <Button
                  onClick={handleGenerateCards}
                  className="w-full bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 font-bold text-sm"
                >
                  <Zap className="mr-2 h-4 w-4 fill-current" />
                  Salvar (Cards Automáticos)
                </Button>

                <p className="text-center text-xs text-muted-foreground/60">
                  Dica: Pressione{" "}
                  <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">Enter</kbd>{" "}
                  para salvar com o tempo atual do vídeo.
                </p>
              </div>

              {/* Linha do Tempo */}
              {notes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                      Linha do Tempo
                    </span>
                  </div>

                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => seekTo(note.timestamp)}
                        className="group flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-pointer hover:border-gold/30 hover:bg-gold/5 transition-all"
                      >
                        <span className="shrink-0 mt-0.5 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold font-mono text-primary">
                          {formatTime(note.timestamp)}
                        </span>
                        <p className="flex-1 text-xs leading-relaxed text-foreground/80 break-words">
                          {note.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="shrink-0 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Ação Flutuante na Base */}
            {currentNote.trim() && (
              <div className="shrink-0 border-t border-border/40 p-4">
                <Button
                  onClick={handleAddNote}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Salvar Anotação Agora
                </Button>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
