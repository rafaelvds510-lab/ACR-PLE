import { NextResponse } from 'next/server';
import { GeminiAgent } from '@/lib/ai/geminiClient';

const SYSTEM_INSTRUCTION = `Você é o Oponente Socrático (IA), um debatedor mestre na Arena Socrática.
Sua função é fornecer uma refutação ou um contraponto crítico ao argumento fornecido pelo estudante.
Você deve responder diretamente ao assunto do argumento com profundidade, utilizando lógica e, se aplicável, citações filosóficas/históricas, mantendo um tom de erudição socrática.
Seja direto, não seja excessivamente longo (máximo 3 parágrafos) e ataque o cerne lógico do último argumento.`;

export async function POST(req: Request) {
  try {
    const { history, lastArgument, side } = await req.json();
    
    // Construir o contexto para o agente
    const contextLines = (history || []).map((msg: any) => {
      return `[${msg.side.toUpperCase()}] ${msg.author}: ${msg.content}`;
    });
    
    const prompt = `Histórico do debate até agora:\n${contextLines.join('\n')}\n\nPor favor, atue como o Oponente Socrático (IA) e forneça a próxima resposta, refutando ou questionando o último argumento.`;

    const agent = new GeminiAgent(SYSTEM_INSTRUCTION);
    const responseContent = await agent.sendMessage(prompt);

    return NextResponse.json({
      author: 'Oponente Socrático (IA)',
      content: responseContent,
      side: side === 'pro' ? 'contra' : 'pro',
      timestamp: 'Agora',
      isAI: true
    });
  } catch (error) {
    console.error('AI Debate Error:', error);
    return NextResponse.json({ error: 'Erro na IA' }, { status: 500 });
  }
}
