export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GeminiAgent } from '@/lib/ai/geminiClient';

const SYSTEM_INSTRUCTION = `Contexto: Você é um especialista em Ciência da Aprendizagem e Engenharia de Prompt. Sua tarefa é transformar o texto abaixo em um baralho de flashcards otimizados para o Anki/Flashcards.

Diretrizes de Criação:
Atomicidade: Cada card deve conter apenas uma ideia ou conceito. Não crie listas longas no verso.
Tipos de Cards: Misture "Pergunta e Resposta" (para conceitos) e "Cloze Deletion" (Omissão de Palavras) para definições e processos.
Conexão: Sempre que possível, inclua o "Porquê" ou a lógica por trás do conceito, não apenas a definição seca.

Formato de Saída: Markdown estruturado.
Estrutura do Card:
Frente: [Pergunta Clara ou Termo com Contexto]
Verso: [Resposta Direta] + [Exemplo Curto ou Mnemônico, se aplicável]
Tags: [Assunto_Principal], [Subtópico]`;

function parseFlashcardsMarkdown(markdown: string) {
  const cards = [];
  const cardBlocks = markdown.split(/(?=Frente:)/ig);
  for (const block of cardBlocks) {
    if (!block.trim() || !block.toLowerCase().includes('verso:')) continue;
    
    const frontMatch = block.match(/Frente:\s*(.+)/i);
    const versoMatch = block.match(/Verso:\s*([\s\S]+?)(?=Tags:|$)/i);
    const tagsMatch = block.match(/Tags:\s*(.+)/i);
    
    if (frontMatch && versoMatch) {
      cards.push({
        front: frontMatch[1].trim(),
        back: versoMatch[1].trim(),
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/^\[|\]$/g, '')) : []
      });
    }
  }
  return cards;
}

export async function POST(req: Request) {
  try {
    const { text, deckName } = await req.json();
    
    if (!text || !deckName) {
      return NextResponse.json({ error: 'Texto e nome do baralho são obrigatórios.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Gerar flashcards com a IA
    const agent = new GeminiAgent(SYSTEM_INSTRUCTION);
    const responseMarkdown = await agent.sendMessage(text);
    
    const parsedCards = parseFlashcardsMarkdown(responseMarkdown);

    if (parsedCards.length === 0) {
      return NextResponse.json({ error: 'Não foi possível gerar os flashcards. Tente outro texto.' }, { status: 500 });
    }

    // Salvar no banco
    // 1. Criar o baralho
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name: deckName,
        description: 'Gerado automaticamente por IA.',
      })
      .select()
      .single();

    if (deckError) throw deckError;

    // 2. Inserir os cards
    const cardsToInsert = parsedCards.map(card => ({
      deck_id: deck.id,
      front: card.front,
      back: card.back,
      tags: card.tags,
      box: 1, // Sistema Leitner
      next_review: new Date().toISOString()
    }));

    const { error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert);

    if (cardsError) throw cardsError;

    return NextResponse.json({ success: true, deckId: deck.id, count: parsedCards.length });
  } catch (error: any) {
    console.error('Generate Flashcards Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao gerar flashcards.' }, { status: 500 });
  }
}
