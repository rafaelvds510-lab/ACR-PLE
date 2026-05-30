'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/* ════════════════════════════════════════════════
   Tipos de estado do formulário
   ════════════════════════════════════════════════ */
export type AuthState = {
  error?: string;
  fieldErrors?: {
    nome?: string;
    email?: string;
    senha?: string;
  };
} | null;

type AuthFieldErrors = NonNullable<AuthState>['fieldErrors'];

/* ════════════════════════════════════════════════
   SIGN IN — Login com email e senha
   ════════════════════════════════════════════════ */
export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const senha = formData.get('senha') as string;

  // Validação básica no servidor
  const fieldErrors: AuthFieldErrors = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = 'Informe um e-mail válido.';
  }
  if (!senha || senha.length < 6) {
    fieldErrors.senha = 'Informe sua senha.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    // Mensagens amigáveis em português
    const msg =
      error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message === 'Email not confirmed'
          ? 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
          : 'Erro ao entrar. Tente novamente.';
    return { error: msg };
  }

  redirect('/dashboard');
}

/* ════════════════════════════════════════════════
   SIGN UP — Cadastro com nome, email e senha
   ════════════════════════════════════════════════ */
export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nome  = (formData.get('nome') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const senha = formData.get('senha') as string;

  // Validação no servidor
  const fieldErrors: AuthFieldErrors = {};
  if (!nome || nome.length < 2) {
    fieldErrors.nome = 'Informe seu nome completo (mín. 2 caracteres).';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = 'Informe um e-mail válido.';
  }
  if (!senha || senha.length < 8) {
    fieldErrors.senha = 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { full_name: nome },
      // URL de callback para confirmação de e-mail
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    const msg =
      error.message.includes('already registered') || error.message.includes('User already registered')
        ? 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.'
        : 'Erro ao criar conta. Tente novamente.';
    return { error: msg };
  }

  // Redirecionar para página de verificação de e-mail
  redirect('/verificar-email');
}

/* ════════════════════════════════════════════════
   SIGN OUT — Logout
   ════════════════════════════════════════════════ */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
