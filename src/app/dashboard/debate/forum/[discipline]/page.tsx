import React from 'react';
import ForumListClient from './ForumListClient';
import { getThreads } from '@/app/actions/forum';

export default async function ForumDisciplinePage(props: { params: Promise<{ discipline: string }> }) {
  const params = await props.params;
  const discipline = params.discipline;

  const threads = await getThreads(discipline);

  // Mapear para o formato esperado pelo componente
  const initialThreads = (threads || []).map(t => ({
    id: t.id,
    title: t.title,
    author: (t.author as any)?.full_name || 'Estudante',
    replies: 0, 
    votes: 0,
    lastActivity: (t as any).created_at ? new Date((t as any).created_at).toLocaleDateString() : 'N/A'
  }));

  return (
    <ForumListClient 
      discipline={discipline} 
      initialThreads={initialThreads} 
    />
  );
}
