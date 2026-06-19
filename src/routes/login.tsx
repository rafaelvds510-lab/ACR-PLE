import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AcropoleLogo } from "@/components/acropole-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Entrar" subtitle="Continue sua jornada na Acrópole.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "Entrando…" : "Entrar"}
        </Button>
        <p className="pt-2 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-gold hover:underline">
            Crie uma agora
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 acropole-grid opacity-10" />
        <div className="absolute right-[-20%] top-[-20%] h-[40vh] w-[40vh] rounded-full bg-gold/20 blur-3xl" />
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <AcropoleLogo className="h-8 w-8" />
          <span className="font-display text-xl">Acrópole Platform</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl leading-snug">
            “A educação é o ponto em que decidimos se amamos o mundo o bastante para assumir a
            responsabilidade por ele.”
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-gold">— Hannah Arendt</p>
        </div>
      </aside>
      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <AcropoleLogo className="h-7 w-7" />
            <span className="font-display text-lg">Acrópole</span>
          </Link>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 mb-8 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
