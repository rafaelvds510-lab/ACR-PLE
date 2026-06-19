import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AcropoleLogo } from "@/components/acropole-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Network, PenLine, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        window.location.replace("/dashboard");
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 acropole-grid opacity-60" />
      <div className="absolute right-[-10%] top-[-20%] h-[60vh] w-[60vh] rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-10%] h-[60vh] w-[60vh] rounded-full bg-primary/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <AcropoleLogo className="h-9 w-9 text-foreground" />
          <div className="leading-tight">
            <div className="font-display text-xl">Acrópole</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/cadastro">
              Criar conta <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
          <span className="h-1 w-1 rounded-full bg-gold" /> Sapere aude · ouse saber
        </span>
        <h1 className="mt-8 font-display text-5xl leading-tight md:text-7xl">
          A ágora moderna do
          <br />
          <span className="text-gold">pensamento acadêmico</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Escreva monografias, organize fichamentos, debata ideias e estude com um tutor de IA — em
          um único ambiente premium, minimalista e desenhado para a vida intelectual.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/cadastro">Começar agora</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-gold/40 hover:bg-gold/5">
            <Link to="/login">Já tenho conta</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-4 text-left md:grid-cols-4">
          {[
            {
              icon: PenLine,
              t: "Escrita Acadêmica",
              d: "Editor rich-text com modelos de ensaio e LaTeX.",
            },
            { icon: BookOpen, t: "Biblioteca", d: "PDFs, EPUBs e fichamentos em um só lugar." },
            { icon: Network, t: "Mapas Mentais", d: "Canvas infinito para conectar ideias." },
            { icon: Sparkles, t: "Tutor IA", d: "Tire dúvidas com inteligência artificial." },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-lg border border-border bg-card/60 p-5 backdrop-blur transition-colors hover:border-gold/40"
            >
              <f.icon className="h-5 w-5 text-gold" />
              <div className="mt-3 font-display text-lg">{f.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-10 text-center text-xs text-muted-foreground">
        Acrópole Platform · Construída para a vida acadêmica
      </footer>
    </div>
  );
}
