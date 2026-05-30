import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso em Client Components ('use client').
 * Gerencia a sessão no browser via cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
