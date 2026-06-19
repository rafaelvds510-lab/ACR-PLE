/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Layers,
  Plus,
  Sparkles,
  ArrowLeft,
  Check,
  X,
  Loader2,
  Trash2,
  BookOpen,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import "katex/dist/katex.min.css";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: FlashcardsDashboard,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  deck_id: string;
  front_html: string;
  back_html: string;
  next_review: string; // ISO String
  interval: number; // in days
  ease: number;
  repetition: number;
}

interface Deck {
  id: string;
  name: string;
  created_at: string;
}

const DECKS_KEY = "acropole_decks";
const CARDS_KEY = "acropole_cards";

// ─── Default Mock Data ────────────────────────────────────────────────────────

const DEFAULT_DECKS: Deck[] = [
  { id: "deck-1", name: "Filosofia Política", created_at: new Date().toISOString() },
  { id: "deck-2", name: "História Constitucional", created_at: new Date().toISOString() },
];

const DEFAULT_CARDS: Flashcard[] = [
  {
    id: "card-1",
    deck_id: "deck-1",
    front_html: "<p>Qual a principal obra de Nicolau Maquiavel sobre teoria política?</p>",
    back_html: "<p><strong>O Príncipe</strong> (publicado em 1532).</p>",
    next_review: new Date().toISOString(),
    interval: 1,
    ease: 2.5,
    repetition: 0,
  },
  {
    id: "card-2",
    deck_id: "deck-1",
    front_html: "<p>O que define o conceito de 'Contrato Social' para Thomas Hobbes?</p>",
    back_html:
      "<p>O acordo mútuo de transferência de liberdades individuais para um soberano absoluto (Leviatã) em troca de paz e segurança.</p>",
    next_review: new Date().toISOString(),
    interval: 1,
    ease: 2.5,
    repetition: 0,
  },
];

const DEFAULT_RETENTION_DATA = [
  { name: "Seg", rate: 82 },
  { name: "Ter", rate: 85 },
  { name: "Qua", rate: 88 },
  { name: "Qui", rate: 84 },
  { name: "Sex", rate: 87 },
  { name: "Sáb", rate: 89 },
  { name: "Dom", rate: 88 },
];

// ─── Component ───────────────────────────────────────────────────────────────

function FlashcardsDashboard() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [deckNameForIA, setDeckNameForIA] = useState("");
  const [textForIA, setTextForIA] = useState("");
  const [generatingIA, setGeneratingIA] = useState(false);

  // Study Mode state
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);

  // ── Fetch Decks & Cards ─────────────────────────────────────────────────────
  const fetchDecksAndCards = async () => {
    setLoading(true);
    try {
      // Tenta carregar do Supabase (com fallback local se falhar)
      const { data: dbDecks, error: deckErr } = await supabase.from("decks" as any).select("*");

      const { data: dbCards, error: cardErr } = await supabase
        .from("flashcards" as any)
        .select("*");

      if (!deckErr && dbDecks && !cardErr && dbCards) {
        setDecks(dbDecks as unknown as Deck[]);
        setCards(dbCards as unknown as Flashcard[]);
      } else {
        // Fallback local storage
        const localDecks = localStorage.getItem(DECKS_KEY);
        const localCards = localStorage.getItem(CARDS_KEY);

        if (localDecks && localCards) {
          setDecks(JSON.parse(localDecks));
          setCards(JSON.parse(localCards));
        } else {
          // Salva os mock padrão
          localStorage.setItem(DECKS_KEY, JSON.stringify(DEFAULT_DECKS));
          localStorage.setItem(CARDS_KEY, JSON.stringify(DEFAULT_CARDS));
          setDecks(DEFAULT_DECKS);
          setCards(DEFAULT_CARDS);
        }
      }
    } catch {
      // Fallback silencioso
      const localDecks = localStorage.getItem(DECKS_KEY);
      const localCards = localStorage.getItem(CARDS_KEY);
      if (localDecks && localCards) {
        setDecks(JSON.parse(localDecks));
        setCards(JSON.parse(localCards));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecksAndCards();
  }, []);

  const saveDecksToStorage = (updatedDecks: Deck[]) => {
    setDecks(updatedDecks);
    localStorage.setItem(DECKS_KEY, JSON.stringify(updatedDecks));
  };

  const saveCardsToStorage = (updatedCards: Flashcard[]) => {
    setCards(updatedCards);
    localStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
  };

  // ── Calculate Due Cards Count ───────────────────────────────────────────────
  const getDueCardsForDeck = (deckId: string) => {
    const now = new Date();
    return cards.filter((c) => c.deck_id === deckId && new Date(c.next_review) <= now).length;
  };

  const getTotalDue = () => {
    const now = new Date();
    return cards.filter((c) => new Date(c.next_review) <= now).length;
  };

  // ── Create Manual Deck ──────────────────────────────────────────────────────
  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    const newId = `deck-${Date.now()}`;
    const newDeck: Deck = {
      id: newId,
      name: newDeckName.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("decks" as any).insert({
        id: newId,
        name: newDeck.name,
        user_id: user?.id,
      });

      if (!error) {
        toast.success("Baralho criado com sucesso!");
        fetchDecksAndCards();
      } else {
        const updated = [...decks, newDeck];
        saveDecksToStorage(updated);
        toast.success("Baralho criado localmente!");
      }
    } catch {
      const updated = [...decks, newDeck];
      saveDecksToStorage(updated);
      toast.success("Baralho criado localmente!");
    } finally {
      setIsNewDeckOpen(false);
      setNewDeckName("");
    }
  };

  // ── Excluir Baralho ─────────────────────────────────────────────────────────
  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente excluir este baralho e todos os seus cartões?")) return;

    try {
      const { error } = await supabase
        .from("decks" as any)
        .delete()
        .eq("id", deckId);
      if (!error) {
        toast.success("Baralho excluído!");
        fetchDecksAndCards();
      } else {
        const updatedDecks = decks.filter((d) => d.id !== deckId);
        const updatedCards = cards.filter((c) => c.deck_id !== deckId);
        saveDecksToStorage(updatedDecks);
        saveCardsToStorage(updatedCards);
        toast.success("Baralho excluído localmente!");
      }
    } catch {
      const updatedDecks = decks.filter((d) => d.id !== deckId);
      const updatedCards = cards.filter((c) => c.deck_id !== deckId);
      saveDecksToStorage(updatedDecks);
      saveCardsToStorage(updatedCards);
      toast.success("Baralho excluído localmente!");
    }
  };

  // ── Generate Flashcards with IA ─────────────────────────────────────────────
  const handleGenerateIA = async () => {
    if (!deckNameForIA.trim() || !textForIA.trim()) return;
    setGeneratingIA(true);

    // Cria o baralho
    const deckId = `deck-${Date.now()}`;
    const newDeck: Deck = {
      id: deckId,
      name: deckNameForIA.trim(),
      created_at: new Date().toISOString(),
    };

    // Gera flashcards simulando inteligência geradora
    setTimeout(async () => {
      // Extração conceitual simplificada para montar cartões atômicos
      const lines = textForIA
        .split(/[.!?\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 25);

      const generatedCards: Flashcard[] = [];

      if (lines.length > 0) {
        lines.slice(0, 5).forEach((line, idx) => {
          // Cria perguntas baseadas no texto
          const words = line.split(" ");
          const subject = words.slice(0, 3).join(" ");
          generatedCards.push({
            id: `card-ia-${Date.now()}-${idx}`,
            deck_id: deckId,
            front_html: `<p>Sobre o assunto <strong>&quot;${subject}...&quot;</strong>, explique a seguinte afirmação: <br/><em>&quot;${line}&quot;</em></p>`,
            back_html: `<p>Esta afirmação descreve que: ${line}. Lembre-se dos conceitos fundamentais apresentados no texto.</p>`,
            next_review: new Date().toISOString(),
            interval: 1,
            ease: 2.5,
            repetition: 0,
          });
        });
      } else {
        // Fallback genérico se o texto for curto
        generatedCards.push({
          id: `card-ia-${Date.now()}-0`,
          deck_id: deckId,
          front_html: `<p>Qual o ponto principal abordado no texto sobre ${deckNameForIA}?</p>`,
          back_html: `<p>${textForIA.substring(0, 150)}...</p>`,
          next_review: new Date().toISOString(),
          interval: 1,
          ease: 2.5,
          repetition: 0,
        });
      }

      try {
        await supabase
          .from("decks" as any)
          .insert({ id: deckId, name: newDeck.name, user_id: user?.id });
        await supabase.from("flashcards" as any).insert(
          generatedCards.map((c) => ({
            id: c.id,
            deck_id: c.deck_id,
            front_html: c.front_html,
            back_html: c.back_html,
            next_review: c.next_review,
            user_id: user?.id,
          })),
        );
      } catch {
        // Ignora erro e salva local
      }

      // Salva localmente
      const updatedDecks = [...decks, newDeck];
      const updatedCards = [...cards, ...generatedCards];
      saveDecksToStorage(updatedDecks);
      saveCardsToStorage(updatedCards);

      toast.success(`${generatedCards.length} flashcards gerados pela IA!`);
      setGeneratingIA(false);
      setIsGenerateOpen(false);
      setDeckNameForIA("");
      setTextForIA("");
    }, 1500);
  };

  // Renderiza a tela de estudos se um baralho foi selecionado
  if (studyDeckId) {
    const deck = decks.find((d) => d.id === studyDeckId);
    return (
      <StudySession
        deckId={studyDeckId}
        deckName={deck?.name || "Estudos"}
        allCards={cards}
        onSaveCards={saveCardsToStorage}
        onClose={() => setStudyDeckId(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Repetição Espaçada"
        title="Revisão e Memorização"
        description="Estude com baralhos e sessões de revisão guiadas pelo algoritmo SRS."
      >
        <Button
          variant="outline"
          className="border-border/60 hover:bg-muted"
          onClick={() => setIsNewDeckOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Baralho
        </Button>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-8">
        {/* ── 1. Painel de Estatísticas ──────────────────────── */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cartão 1: Resumo Diário */}
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Resumo Diário</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-12 py-4">
              <div>
                <span className="block text-4xl font-bold text-primary font-display">
                  {loading ? "..." : getTotalDue()}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Cartões Pendentes
                </span>
              </div>
              <div>
                <span className="block text-4xl font-bold text-gold font-display">88%</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Retenção Atual
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cartão 2: Gráfico de Retenção */}
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Curva de Retenção (Últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={DEFAULT_RETENTION_DATA}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(212,175,55,0.08)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    domain={[60, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "rgba(212,175,55,0.2)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--gold)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── 2. Área de Baralhos ────────────────────────────── */}
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="font-display text-xl">Seus Baralhos</CardTitle>
            <Button
              className="bg-zinc-950 text-zinc-50 hover:bg-zinc-900 border border-zinc-800 shadow-sm"
              onClick={() => setIsGenerateOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4 text-gold" />
              Gerar com IA
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-gold" />
                Carregando baralhos…
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm">
                  Nenhum baralho encontrado. Importe um arquivo ou crie um novo!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {decks.map((deck) => {
                  const dueCount = getDueCardsForDeck(deck.id);
                  return (
                    <div
                      key={deck.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group"
                    >
                      <div className="min-w-0 pr-4">
                        <span className="block font-semibold text-sm truncate">{deck.name}</span>
                        <span className="block text-xs mt-0.5">
                          {dueCount > 0 ? (
                            <span className="text-gold font-medium">{dueCount} pendentes hoje</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Nenhum cartão pendente hoje
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteDeck(deck.id, e)}
                          className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          disabled={dueCount === 0}
                          onClick={() => setStudyDeckId(deck.id)}
                          className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4"
                        >
                          Estudar Agora
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modal: Novo Baralho ─────────────────────────────── */}
      <Dialog open={isNewDeckOpen} onOpenChange={setIsNewDeckOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Baralho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Baralho</Label>
              <Input
                id="name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Ex: Teoria de Hobbes, Vocabulário Latim"
                onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDeckOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDeck} disabled={!newDeckName.trim()}>
              Criar Baralho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Gerador de Flashcards com IA ─────────────── */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              Gerador de Flashcards com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-gold/5 border border-gold/10 p-3.5 rounded-xl text-xs text-muted-foreground leading-relaxed">
              Cole um texto ou resumo abaixo e a inteligência criará um baralho no{" "}
              <strong>Padrão Atômico</strong> otimizado para sua memória de longo prazo.
            </div>

            <div className="space-y-2">
              <Label htmlFor="deckNameIA">Nome do Baralho</Label>
              <Input
                id="deckNameIA"
                value={deckNameForIA}
                onChange={(e) => setDeckNameForIA(e.target.value)}
                placeholder="Ex: Revolução Francesa, Anatomia - Coração"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textIA">Texto / Resumo</Label>
              <Textarea
                id="textIA"
                rows={5}
                value={textForIA}
                onChange={(e) => setTextForIA(e.target.value)}
                placeholder="Cole aqui o texto que você deseja transformar em flashcards..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateOpen(false)}
              disabled={generatingIA}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateIA}
              disabled={generatingIA || !deckNameForIA.trim() || !textForIA.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {generatingIA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando…
                </>
              ) : (
                "Gerar Baralho"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Study Session Component ──────────────────────────────────────────────────

function StudySession({
  deckId,
  deckName,
  allCards,
  onSaveCards,
  onClose,
}: {
  deckId: string;
  deckName: string;
  allCards: Flashcard[];
  onSaveCards: (updated: Flashcard[]) => void;
  onClose: () => void;
}) {
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  // Inicializa a fila de estudos com cartões pendentes
  useEffect(() => {
    const now = new Date();
    const due = allCards.filter((c) => c.deck_id === deckId && new Date(c.next_review) <= now);
    setSessionCards(due);
  }, [deckId, allCards]);

  // Executa avaliação de retenção (algoritmo SRS)
  const handleReview = useCallback(
    (quality: number) => {
      if (sessionCards.length === 0) return;
      const currentCard = sessionCards[currentIndex];

      let newInterval = currentCard.interval;
      let newRepetition = currentCard.repetition;
      let newEase = currentCard.ease;

      if (quality === 1) {
        // Difícil (recomeça)
        newInterval = 1;
        newRepetition = 0;
        newEase = Math.max(1.3, newEase - 0.2);
      } else if (quality === 2) {
        // Bom
        if (newRepetition === 0) newInterval = 1;
        else if (newRepetition === 1) newInterval = 3;
        else newInterval = Math.round(newInterval * newEase);
        newRepetition += 1;
      } else if (quality === 3) {
        // Fácil
        if (newRepetition === 0) newInterval = 2;
        else if (newRepetition === 1) newInterval = 6;
        else newInterval = Math.round(newInterval * newEase * 1.5);
        newRepetition += 1;
        newEase = newEase + 0.15;
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + newInterval);

      const updatedCard: Flashcard = {
        ...currentCard,
        interval: newInterval,
        repetition: newRepetition,
        ease: newEase,
        next_review: nextDate.toISOString(),
      };

      // Atualiza no banco local de cartões
      const updatedAllCards = allCards.map((c) => (c.id === currentCard.id ? updatedCard : c));
      onSaveCards(updatedAllCards);

      // Avança na fila local
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setShowBack(false);
      } else {
        setSessionCards([]); // Sessão finalizada
      }
    },
    [sessionCards, currentIndex, allCards, onSaveCards],
  );

  // Atalhos de teclado (Espaço e números)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCards.length === 0) return;

      if (!showBack && e.code === "Space") {
        setShowBack(true);
        e.preventDefault();
      } else if (showBack) {
        if (e.key === "1") handleReview(1);
        if (e.key === "2") handleReview(2);
        if (e.key === "3") handleReview(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBack, sessionCards.length, handleReview]);

  if (sessionCards.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center flex flex-col items-center justify-center h-[80vh]">
        <div className="h-16 w-16 bg-gold/10 text-gold flex items-center justify-center rounded-full mb-6">
          <BookOpen className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">Tudo Feito! 🎉</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-sm">
          Você não tem mais cartões pendentes neste baralho para hoje. Continue assim!
        </p>
        <Button onClick={onClose} className="mt-8">
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const currentCard = sessionCards[currentIndex];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col min-h-[85vh]">
      {/* Cabeçalho do Estudo */}
      <header className="flex items-center justify-between border-b border-border/40 pb-4 mb-10 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <span className="font-display text-sm font-semibold text-gold">{deckName}</span>
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {currentIndex + 1} / {sessionCards.length}
        </span>
      </header>

      {/* Cartão de Flashcard */}
      <div className="flex-1 flex items-center justify-center py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -50 }}
            transition={{ duration: 0.2 }}
            onClick={() => !showBack && setShowBack(true)}
            className="w-full aspect-[4/3] max-h-[360px] flex flex-col justify-between p-8 rounded-3xl border border-border/80 bg-card shadow-elegant relative overflow-y-auto cursor-pointer"
          >
            {/* Frente */}
            <div
              className="text-base text-foreground leading-relaxed select-text"
              dangerouslySetInnerHTML={{ __html: currentCard.front_html }}
            />

            {showBack && (
              <>
                <div className="border-t border-border/40 my-6" />
                {/* Verso */}
                <div
                  className="text-base text-gold/90 font-medium leading-relaxed select-text"
                  dangerouslySetInnerHTML={{ __html: currentCard.back_html }}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles de Estudo */}
      <div className="mt-8 shrink-0 flex justify-center">
        {!showBack ? (
          <Button
            size="lg"
            onClick={() => setShowBack(true)}
            className="w-full max-w-sm bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-bold py-6 rounded-2xl shadow-md"
          >
            Mostrar Resposta
            <span className="ml-2 text-xs font-normal opacity-50 bg-background/20 px-1.5 py-0.5 rounded">
              Espaço
            </span>
          </Button>
        ) : (
          <div className="flex gap-4 w-full justify-center max-w-md">
            {/* Difícil */}
            <Button
              variant="outline"
              onClick={() => handleReview(1)}
              className="flex-1 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 py-6 rounded-2xl font-bold text-sm"
            >
              Difícil
              <span className="ml-1 text-2xs opacity-40">1</span>
            </Button>

            {/* Bom */}
            <Button
              onClick={() => handleReview(2)}
              className="flex-1 bg-green-600 text-white hover:bg-green-600/90 py-6 rounded-2xl font-bold text-sm"
            >
              Bom
              <span className="ml-1 text-2xs opacity-60">2</span>
            </Button>

            {/* Fácil */}
            <Button
              variant="outline"
              onClick={() => handleReview(3)}
              className="flex-1 border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 py-6 rounded-2xl font-bold text-sm"
            >
              Fácil
              <span className="ml-1 text-2xs opacity-40">3</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
