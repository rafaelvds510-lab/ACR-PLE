import React from 'react';
import { createClient } from '@/lib/supabase/server';
import DashboardHomeClient from './DashboardHomeClient';

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Busca contagens rápidas para os widgets de stats e eventos
  const [
    { count: docCount }, 
    { count: deckCount }, 
    { data: todayEvents },
    { data: upcomingEvents }
  ] = await Promise.all([
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('decks').select('*', { count: 'exact', head: true }),
    supabase.from('study_events')
      .select('*')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true }),
    supabase.from('study_events')
      .select('*')
      .gte('start_time', tomorrow.toISOString())
      .lt('start_time', nextWeek.toISOString())
      .order('start_time', { ascending: true })
      .limit(5)
  ]);

  return (
    <DashboardHomeClient
      docCount={docCount ?? 0}
      deckCount={deckCount ?? 0}
      todayEvents={todayEvents || []}
      upcomingEvents={upcomingEvents || []}
    />
  );
}
