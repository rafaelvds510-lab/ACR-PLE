import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Sparkles, Trash2, MessageSquare } from "lucide-react";
import { AcropoleLogo } from "@/components/acropole-logo";
import { listThreads, createThread, deleteThread, getThreadMessages } from "@/lib/tutor.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tutor/$threadId")({
  component: TutorChat,
});

function TutorChat() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const getMsgs = useServerFn(getThreadMessages);

  const { data: threads = [] } = useQuery({ queryKey: ["tutor-threads"], queryFn: () => list() });
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ["tutor-msgs", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
  });

  const newThread = useMutation({
    mutationFn: () => create(),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["tutor-threads"] });
      navigate({ to: "/tutor/$threadId", params: { threadId: row.id } });
    },
  });

  const removeThread = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["tutor-threads"] });
      if (id === threadId) {
        const remaining = threads.filter((t) => t.id !== id);
        if (remaining.length > 0)
          navigate({ to: "/tutor/$threadId", params: { threadId: remaining[0].id } });
        else navigate({ to: "/tutor" });
      }
    },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Threads list */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="border-b border-border p-3">
          <Button
            onClick={() => newThread.mutate()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova conversa
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {threads.map((t) => (
              <div key={t.id} className="group flex items-center">
                <Link
                  to="/tutor/$threadId"
                  params={{ threadId: t.id }}
                  className={`flex-1 truncate rounded-md px-3 py-2 text-sm transition-colors ${
                    t.id === threadId
                      ? "bg-accent text-accent-foreground border-l-2 border-gold"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <MessageSquare className="mr-2 inline h-3.5 w-3.5 opacity-60" />
                  {t.title}
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => removeThread.mutate(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
            {threads.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhuma conversa ainda.
              </p>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat */}
      <section className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Carregando conversa…
          </div>
        ) : (
          <ChatSurface
            key={threadId}
            threadId={threadId}
            initialMessages={(initialMessages ?? []) as UIMessage[]}
            onAfterSend={() => qc.invalidateQueries({ queryKey: ["tutor-threads"] })}
          />
        )}
      </section>
    </div>
  );
}

function ChatSurface({
  threadId,
  initialMessages,
  onAfterSend,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onAfterSend: () => void;
}) {
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: { threadId },
    }),
  ).current;

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Erro ao chamar o tutor"),
    onFinish: () => onAfterSend(),
  });

  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = async () => {
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setInput("");
    await sendMessage({ text });
    inputRef.current?.focus();
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center pt-16 text-center">
              <AcropoleLogo className="h-12 w-12 text-foreground" />
              <h2 className="mt-4 font-display text-3xl">Tutor IA</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Pergunte sobre filosofia, história, literatura, escrita acadêmica — ou peça ajuda
                para estruturar um argumento.
              </p>
              <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {[
                  "Explique o conceito de panóptico em Foucault.",
                  "Como estruturar a introdução de um ensaio?",
                  "Diferença entre Kant e Hume sobre causalidade.",
                  "Sugira leituras sobre modernidade líquida.",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-md border border-border p-3 text-left text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse text-gold" />
                <span className="animate-pulse">Pensando…</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background/80 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-xl border border-border bg-card focus-within:border-gold/50">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Pergunte ao Tutor IA…"
              rows={2}
              className="min-h-[60px] resize-none border-0 bg-transparent pr-14 focus-visible:ring-0"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={submit}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-2 right-2 h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            O Tutor IA pode errar. Verifique afirmações factuais e bibliografia.
          </p>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/5">
        <Sparkles className="h-4 w-4 text-gold" />
      </div>
      <div className="flex-1 pt-1">
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
          {text}
        </div>
      </div>
    </div>
  );
}
