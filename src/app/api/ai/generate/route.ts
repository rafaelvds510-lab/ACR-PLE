export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { mode, text, options } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    if (!text) return NextResponse.json({ error: 'Texto necessário' }, { status: 400 });

    let systemPrompt = "Você é o Motor de Inteligência da Acrópole, especializado em processamento acadêmico de textos clássicos e eruditos.";
    
    switch (mode) {
      case 'flashcards':
        systemPrompt += `\nTAREFA: Extraia os conceitos-chave do texto e gere flashcards. 
        SAÍDA: Retorne um array JSON de objetos com {front: string, back: string}. 
        REGRAS: Use o método Active Recall. Perguntas provocativas no "front" e respostas sintéticas no "back".`;
        break;
      
      case 'mindmap':
        systemPrompt += `\nTAREFA: Resuma o texto em um mapa mental.
        SAÍDA: Retorne APENAS o código Mermaid.js para um 'mindmap'.
        REGRAS: Use uma hierarquia lógica clara partindo do tema central.`;
        break;

      case 'summary':
        const length = options?.length || 'medium'; // short, medium, long
        systemPrompt += `\nTAREFA: Crie um resumo adaptativo do texto.
        NÍVEL: ${length === 'short' ? 'Um parágrafo denso' : length === 'medium' ? 'Uma página estruturada' : 'Resumo detalhado com tópicos'}.
        REGRAS: Mantenha o rigor acadêmico e cite termos técnicos.`;
        break;

      case 'quiz':
        systemPrompt += `\nTAREFA: Gere um questionário de estudo.
        SAÍDA: Retorne um array JSON de questões com {question: string, options: string[], answer: number, type: 'multiple' | 'boolean' | 'essay'}.
        REGRAS: Misture níveis de dificuldade.`;
        break;

      case 'translate':
        const targetLang = options?.lang || 'Português';
        systemPrompt += `\nTAREFA: Tradução contextual erudita para ${targetLang}.
        REGRAS: Mantenha termos técnicos em latim/grego no original com a tradução em parênteses. Preserve a precisão terminológica.`;
        break;
    }

    // Simulando resposta da IA (Aguardando integração LLM real)
    // No ambiente real, aqui chamariamos o SDK do Gemini/OpenAI
    let result: any = null;

    if (mode === 'flashcards') {
      result = [
        { front: "O que é a 'Areté' segundo o texto?", back: "Excelência moral e funcional, atingida através do hábito e da razão." },
        { front: "Qual a distinção entre mundo sensível e inteligível?", back: "O sensível é o reino das sombras e mudanças; o inteligível é o das Formas eternas e perfeitas." }
      ];
    } else if (mode === 'mindmap') {
      result = `mindmap
  root((Dialética Platônica))
    Metodologia
      Ironia
      Maieutica
    Objetivo
      Areté
      Verdade
    Fases
      Mundo Sensível
      Mundo Inteligível`;
    } else if (mode === 'summary') {
      result = "Este texto aborda a ascensão da alma através do método dialético, partindo das opiniões (doxa) rumo ao conhecimento verdadeiro (episteme). A ênfase reside na purificação do intelecto para a visão das Formas.";
    } else if (mode === 'quiz') {
      result = [
        { type: 'multiple', question: "Quem é o autor central da teoria das formas?", options: ["Aristóteles", "Platão", "Sócrates", "Heráclito"], answer: 1 }
      ];
    } else if (mode === 'translate') {
      result = "A tradução mantém o rigor técnico necessário para a compreensão do texto original.";
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Generation AI Error:', error);
    return NextResponse.json({ error: 'Falha na geração via IA' }, { status: 500 });
  }
}
