import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EscritaClient from './EscritaClient';

export const metadata = { title: 'Editor de Escrita | Acrópole' };

export default async function EscritaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <EscritaClient />;
}
