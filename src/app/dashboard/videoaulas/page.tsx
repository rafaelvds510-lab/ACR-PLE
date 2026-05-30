import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VideoaulasClient from './VideoaulasClient';

export const metadata = {
  title: 'Vídeo Aulas | Acrópole Platform',
  description: 'Assista suas aulas e faça anotações inteligentes com timestamps.',
};

export default async function VideoaulasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <VideoaulasClient />;
}
