export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { GeminiAgent } from '@/lib/ai/geminiClient';

export const maxDuration = 60; // Aumenta o timeout para 60 segundos (útil para planos longos no Vercel)

const SYSTEM_PROMPT = `Você é um planejador de estudos avançado.
Sua tarefa é receber um tema ou um material de referência (texto/arquivo) e retornar um plano de estudos COMPLETO em JSON.

### REGRAS CRÍTICAS DE EXTRAÇÃO:
1. SE o usuário fornecer material de referência (texto ou arquivo), sua função é de CONVERSOR DE DADOS. Extraia CADA tópico, CADA data e CADA tarefa exatamente como descritos.
2. PROIBIDO criar conteúdo genérico se houver material de referência.
3. PROIBIDO resumir ou agrupar dias. Se o cronograma original tem 21 dias, o JSON deve ter EXATAMENTE 21 objetos.
4. SE o material de referência acabar antes de completar o número de dias solicitado, você DEVE preencher os dias restantes com sessões de revisão, simulados e exercícios práticos baseados no conteúdo anterior.
5. RESPONDA APENAS COM O JSON. Nunca inclua explicações, introduções ou conclusões.
6. Seja conciso nas descrições para garantir que o plano completo caiba na resposta.

### FORMATO DO JSON (OBRIGATÓRIO):
[
  {
    "day": 1,
    "title": "Título fiel ao material",
    "type": "reading" | "video" | "flashcards" | "writing",
    "durationMinutes": 60,
    "description": "Descrição curta extraída fielmente"
  }
]

### EXEMPLO DE SAÍDA (Siga este rigor):
Usuário pede 3 dias de 'Matemática' de um edital:
[
  { "day": 1, "title": "Aritmética Básica", "type": "reading", "durationMinutes": 60, "description": "Estudar soma e subtração conforme pág 12 do edital." },
  { "day": 2, "title": "Frações", "type": "video", "durationMinutes": 90, "description": "Assistir aula de frações equivalentes." },
  { "day": 3, "title": "Exercícios de Fixação", "type": "writing", "durationMinutes": 120, "description": "Resolver lista de 50 exercícios do capítulo 2." }
]`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jsonBody = await request.json();
    const { topic, hoursPerDay, days, startDate, fileData, referenceText } = jsonBody;

    if ((!topic && !fileData && !referenceText) || !hoursPerDay || !days || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const method = jsonBody.method || 'flight_plan';

    const start = new Date(startDate);
    const eventsToInsert = [];

    let userPrompt = '';
    
    if (fileData || referenceText) {
      userPrompt = `AJA COMO UM EXTRATOR DE DADOS DE ALTA PRECISÃO.
O material de referência (cronograma) está anexado.

Siga este processo passo a passo:
1. Identifique no material TODOS os dias de estudo (ex: Dia 1 ao Dia ${days}).
2. Para cada dia identificado, extraia o título exato e a descrição/tarefa.
3. Formate como o array JSON solicitado.
4. Se o material for longo, NÃO RESUMA. Liste cada dia individualmente.

CRÍTICO: Se o usuário solicitou ${days} dias, você deve retornar EXATAMENTE ${days} objetos no JSON.`;
    } else {
      userPrompt = `CRIE um plano de estudos do zero sobre o tema "${topic}" para ${days} dias. Divida do básico ao avançado.`;
    }

    let aiResponse = '';
    try {
      // Usando gemini-1.5-pro para planos de estudo para maior precisão em sequências longas
      const agent = new GeminiAgent(SYSTEM_PROMPT, 'gemini-1.5-pro');
      
      let finalMessage: string | any[] = userPrompt;
      
      const combinedContext = referenceText 
        ? `${userPrompt}\n\nTEXTO DE REFERÊNCIA:\n${referenceText}`
        : userPrompt;

      if (fileData) {
        finalMessage = [
          {
            text: combinedContext + "\n\nCRÍTICO: Extraia as informações do arquivo anexo com 100% de fidelidade."
          },
          {
            inlineData: {
              data: fileData.data,
              mimeType: fileData.mimeType
            }
          }
        ];
      } else {
        finalMessage = combinedContext;
      }
      
      aiResponse = await agent.sendMessage(finalMessage);
    } catch (apiError: any) {
      console.warn('Gemini API Error, using empty fallback. Error:', apiError.message);
      aiResponse = `[]`;
    }

    // Extração robusta de JSON: Procura o primeiro '[' e o último ']'
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    } else {
      // Log de depuração para análise
      console.error('AI Response does not contain a JSON array:', aiResponse);

      aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    let planData;
    try {
      planData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({ 
        error: 'Falha ao processar o plano gerado pela IA. O material pode ser complexo demais ou o formato é inválido.',
        debug: aiResponse.substring(0, 200) + '...'
      }, { status: 500 });
    }

    console.log(`AI generated ${planData.length} events for a requested ${days} days plan.`);

    // Processa os eventos gerados e agenda-os
    let currentDayIndex = 1;
    let currentHour = 18; // Inicia às 18h

    for (const item of planData) {
      const dayOffset = (item.day || currentDayIndex) - 1;
      const currentDay = new Date(start);
      currentDay.setDate(currentDay.getDate() + dayOffset);
      
      const eventStart = new Date(currentDay);
      eventStart.setHours(currentHour, 0, 0, 0);
      
      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + (item.durationMinutes || 60));

      eventsToInsert.push({
        user_id: user.id,
        title: item.title,
        description: item.description,
        type: item.type || 'reading',
        start_time: eventStart.toISOString(),
        end_time: eventEnd.toISOString(),
        is_all_day: false
      });

      // Se houver mais de um evento no mesmo dia, incrementa a hora
      if (item.day === currentDayIndex) {
        currentHour += Math.ceil((item.durationMinutes || 60) / 60);
      } else {
        currentDayIndex = item.day;
        currentHour = 18;
      }
    }

    if (eventsToInsert.length === 0) {
      return NextResponse.json({ error: 'A IA não conseguiu extrair nenhum evento do material fornecido. Verifique o conteúdo do arquivo/texto.' }, { status: 422 });
    }

    if (jsonBody.previewOnly) {
      return NextResponse.json({ success: true, events: eventsToInsert });
    }

    const { data, error } = await supabase
      .from('study_events')
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error('Insert events error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, events: data });

  } catch (err: any) {
    console.error('Study Plan Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
