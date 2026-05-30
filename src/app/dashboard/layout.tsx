import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Obter nome (do metadata ou do perfil, dependendo da fase de sincronização)
  const name = user.user_metadata?.full_name || '';

  return (
    <DashboardLayoutClient user={{ name, email: user.email || '' }}>
      {children}
    </DashboardLayoutClient>
  );
}
