import React from 'react';
import ArenaClient from './ArenaClient';
import { getArguments } from '@/app/actions/debate';

export default async function ArenaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const dbArguments = await getArguments(id);

  // Mapear argumentos do banco para o formato do componente
  const initialMessages = (dbArguments || []).map(arg => ({
    id: arg.id,
    author: (arg.author as any)?.full_name || 'Estudante',
    content: arg.content,
    side: arg.side as 'pro' | 'contra',
    timestamp: arg.created_at ? new Date(arg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora',
    citation: arg.document_quote ? { docTitle: 'Documento', quote: arg.document_quote } : undefined
  }));

  let debateTitle = "A Ética de Aristóteles na Era Digital";
  let isAIPractice = id === 'ai-practice';

  if (isAIPractice) {
    debateTitle = "Arena de Retórica: Prática com IA";
  } else if (id === 'estado-economia') {
    debateTitle = "O Papel do Estado na Economia Global";
  } else if (id === 'livre-arbitrio') {
    debateTitle = "Livre Arbítrio vs Determinismo Biológico";
  }

  return (
    <ArenaClient 
      debateTitle={debateTitle} 
      isAIPractice={isAIPractice} 
      initialMessages={initialMessages}
      roomId={id}
    />
  );
}
