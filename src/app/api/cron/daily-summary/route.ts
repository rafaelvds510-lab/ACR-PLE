import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { DailySummaryEmail } from '@/components/emails/DailySummaryEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  // Verificação de segurança (API Key ou Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Aqui buscaríamos todos os usuários e seus progressos do dia no Supabase
    // Para o demo, enviaremos apenas para o usuário principal
    
    const { data, error } = await resend.emails.send({
      from: 'Acropole <onboarding@resend.dev>',
      to: 'rafaelvds510@gmail.com',
      subject: 'Seu Resumo Diário de Estudos - Acrópole',
      react: DailySummaryEmail({ 
        userName: 'Rafael', 
        date: new Date().toLocaleDateString('pt-BR'),
        stats: {
          studyHours: 4,
          flashcards: 25,
          arguments: 3,
          threads: 1
        }
      }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
