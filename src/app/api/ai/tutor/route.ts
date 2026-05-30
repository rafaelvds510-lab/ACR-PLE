import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSocraticDialectic } from '@/lib/ai/socratic';

export async function POST(req: Request) {
  try {
    const { messages, level, isSocratic } = await req.json();
    const supabase = await createClient();

    // 1. Identificar usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // 2. Simular RAG (Busca de documentos relevantes)
    // Em uma implementação real, usaríamos pgvector para busca semântica
    const { data: docs } = await supabase
      .from('documents')
      .select('title, description')
      .limit(3);

    const context = docs?.map(d => `Documento: ${d.title} - ${d.description || ''}`).join('\n') || '';

    // 3. Construir System Prompt com base no Nível e Modo Socrático
    let systemPrompt = `Você é o Tutor Socrático da Plataforma Acrópole, um mentor erudito e dialético. 
    Seu objetivo é guiar o estudante no desenvolvimento do raciocínio crítico.`;

    if (isSocratic) {
      systemPrompt += `\nMODO SOCRÁTICO ATIVO: Nunca dê respostas diretas. 
      Em vez disso, responda com perguntas que levem o usuário a descobrir a verdade por conta própria. 
      Use ironia socrática (maieutica) de forma pedagógica.`;
    }

    if (level === 'layman') {
      systemPrompt += `\nNÍVEL: LEIGO. Use analogias simples, evite termos técnicos complexos sem explicá-los. Seja extremamente acessível.`;
    } else if (level === 'intermediate') {
      systemPrompt += `\nNÍVEL: INTERMEDIÁRIO. Use terminologia acadêmica padrão, cite autores clássicos e assuma que o usuário já tem uma base de humanidades.`;
    } else if (level === 'advanced') {
      systemPrompt += `\nNÍVEL: AVANÇADO. Use latim/grego quando apropriado (com tradução), mergulhe em nuances metafísicas profundas e exija rigor lógico.`;
    }

    if (context) {
      systemPrompt += `\nCONTEXTO DA BIBLIOTECA DO USUÁRIO:\n${context}\nUse essas informações para contextualizar suas perguntas e respostas.`;
    }

    // 4. Chamar o Modelo (Simulando resposta de alta qualidade e menos genérica)
    const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : "";
    
    let responseContent = "";
    
    if (!lastUserMessage) {
      responseContent = "Como posso ajudá-lo em seus estudos hoje?";
    } else {
      const dialetic = getSocraticDialectic(lastUserMessage, level);
      responseContent = dialetic.content;
    }

    return NextResponse.json({
      role: 'assistant',
      content: responseContent,
      citations: docs?.slice(0, 1).map(d => ({ id: 'doc-1', title: d.title, page: 1 })) || []
    });

  } catch (error) {
    console.error('Tutor AI Error:', error);
    return NextResponse.json({ error: 'Falha no Tutor IA' }, { status: 500 });
  }
}
