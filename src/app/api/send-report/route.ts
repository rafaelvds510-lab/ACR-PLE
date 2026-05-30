export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { WeeklyReportEmail } from '@/components/emails/WeeklyReportEmail';
import { LEVELS } from '@/lib/gameEngine';
import React from 'react';

// Se não houver chave real, simulamos o envio
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameState, nextSteps } = await request.json();

    if (!gameState) {
      return NextResponse.json({ error: 'Missing game state' }, { status: 400 });
    }

    // Calcula os dados do nível com base no estado recebido do cliente
    const totalXP = gameState.totalXP || 0;
    const currentLevel = LEVELS.slice().reverse().find(l => totalXP >= l.minXP) || LEVELS[0];

    const emailProps = {
      userName: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Herói',
      levelTitle: currentLevel.title,
      levelIcon: currentLevel.icon,
      totalXP: totalXP,
      streakDays: gameState.streakDays || 0,
      cardsCreated: gameState.totalFlashcardsCreated || 0,
      mapsCreated: gameState.totalMapsCreated || 0,
      nextSteps: nextSteps || [],
    };

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'Acropole <onboarding@resend.dev>', // Usando domínio de teste do Resend
        to: [user.email!],
        subject: '📜 Seu Progresso no Olimpo — Relatório Semanal',
        react: React.createElement(WeeklyReportEmail, emailProps),
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Modo Mock: Apenas retorna sucesso (útil para desenvolvimento local sem chave API)
      console.log('Mocking email send to:', user.email);
      console.log('Props:', emailProps);
      return NextResponse.json({ 
        success: true, 
        message: 'Email mocked. Add RESEND_API_KEY to send real emails.' 
      });
    }

  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
