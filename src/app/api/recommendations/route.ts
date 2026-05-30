// ═══════════════════════════════════════════════
//  API: /api/recommendations
//  Motor de recomendações baseado em SRS, histórico
//  de leitura, streak e padrões de estudo
// ═══════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface Recommendation {
  id: string;
  priority: 'urgent' | 'high' | 'normal' | 'bonus';
  type: 'review' | 'reading' | 'mindmap' | 'streak' | 'start';
  icon: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionUrl: string;
  xpReward: number;
  meta?: Record<string, any>;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function hourNow() {
  return new Date().getHours();
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const recommendations: Recommendation[] = [];
    const now = new Date();

    // ── 1. SRS: Baralhos com cartas vencidas ────────────────────────────────
    const [decksRes, cardsRes, docsRes, mindmapsRes] = await Promise.all([
      supabase.from('decks').select('id, name').eq('user_id', user.id),
      supabase.from('cards').select('id, deck_id, next_review, ease_factor').eq('decks.user_id', user.id),
      supabase
        .from('documents')
        .select('id, title, current_page, total_pages, status, updated_at')
        .eq('user_id', user.id ?? '')
        .neq('status', 'finished')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('mindmaps')
        .select('id, title, updated_at')
        .eq('user_id', user.id ?? '')
        .order('updated_at', { ascending: false })
        .limit(3),
    ]);

    const decks = decksRes.data ?? [];
    // Cards: filtramos as vencidas
    const allCards = cardsRes.data ?? [];
    const dueCards = allCards.filter((c: any) => c.next_review && new Date(c.next_review) <= now);

    // Agrupar cartas vencidas por deck
    const dueCounts: Record<string, { count: number; deckName: string }> = {};
    decks.forEach((d: any) => { dueCounts[d.id] = { count: 0, deckName: d.name }; });
    dueCards.forEach((c: any) => {
      if (dueCounts[c.deck_id]) dueCounts[c.deck_id].count++;
    });

    // Baralho com mais cartas vencidas → urgente
    const topDeck = Object.entries(dueCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .find(([, v]) => v.count > 0);

    if (topDeck) {
      const [deckId, { count, deckName }] = topDeck;
      const isUrgent = count >= 20;
      recommendations.push({
        id: `srs-${deckId}`,
        priority: isUrgent ? 'urgent' : 'high',
        type: 'review',
        icon: isUrgent ? '🔥' : '🃏',
        title: isUrgent
          ? `${count} cartas esquecendo em "${deckName}"`
          : `${count} carta${count !== 1 ? 's' : ''} para revisar em "${deckName}"`,
        subtitle: isUrgent
          ? 'Perigo de regressão na memória de longo prazo. Revise agora!'
          : 'O algoritmo SM-2 indica que agora é o momento ideal de revisão.',
        actionLabel: 'Revisar Agora',
        actionUrl: `/dashboard/revisao/estudar/${deckId}`,
        xpReward: 3 * count,
        meta: { dueCount: count, deckName },
      });
    }

    // Outros baralhos vencidos (secundários)
    Object.entries(dueCounts)
      .filter(([id, v]) => v.count > 0 && id !== topDeck?.[0])
      .slice(0, 2)
      .forEach(([deckId, { count, deckName }]) => {
        recommendations.push({
          id: `srs-sec-${deckId}`,
          priority: 'normal',
          type: 'review',
          icon: '🃏',
          title: `"${deckName}" — ${count} carta${count !== 1 ? 's' : ''} pendente${count !== 1 ? 's' : ''}`,
          subtitle: 'Revise este baralho para manter a curva de retenção alta.',
          actionLabel: 'Revisar',
          actionUrl: `/dashboard/revisao/estudar/${deckId}`,
          xpReward: 3 * count,
          meta: { dueCount: count },
        });
      });

    // ── 2. Leitura em progresso ────────────────────────────────────────────
    const docs = docsRes.data ?? [];
    if (docs.length > 0) {
      const doc = docs[0] as any;
      const pct = doc.total_pages > 0
        ? Math.round((doc.current_page / doc.total_pages) * 100)
        : 0;

      const daysSinceRead = doc.updated_at
        ? Math.floor((now.getTime() - new Date(doc.updated_at).getTime()) / 86_400_000)
        : 0;

      let subtitle = '';
      if (daysSinceRead === 0) subtitle = `Você estava lendo hoje. Bom ritmo — continue!`;
      else if (daysSinceRead === 1) subtitle = `Ontem você parou na pág. ${doc.current_page}. Retome o fio do raciocínio.`;
      else subtitle = `Há ${daysSinceRead} dias sem abrir este pergaminho. A memória começa a esvair.`;

      recommendations.push({
        id: `read-${doc.id}`,
        priority: daysSinceRead >= 3 ? 'high' : 'normal',
        type: 'reading',
        icon: '📜',
        title: `Continuar: "${doc.title}"`,
        subtitle: pct > 0 ? `${pct}% concluído — ${subtitle}` : subtitle,
        actionLabel: 'Retomar Leitura',
        actionUrl: `/dashboard/biblioteca/ler/${doc.id}`,
        xpReward: 10,
        meta: { pct, currentPage: doc.current_page, totalPages: doc.total_pages },
      });
    }

    // ── 3. Mapa Mental não editado há muito tempo ─────────────────────────
    const maps = mindmapsRes.data ?? [];
    if (maps.length > 0) {
      const oldMap = (maps as any[]).find(m => {
        const days = Math.floor((now.getTime() - new Date(m.updated_at).getTime()) / 86_400_000);
        return days >= 7;
      });

      if (oldMap) {
        recommendations.push({
          id: `map-${oldMap.id}`,
          priority: 'normal',
          type: 'mindmap',
          icon: '🗺️',
          title: `Expandir: "${oldMap.title}"`,
          subtitle: 'Este mapa não é atualizado há mais de 7 dias. Novos conceitos aprendidos merecem novos nós.',
          actionLabel: 'Abrir Mapa',
          actionUrl: `/dashboard/mapas/editor/${oldMap.id}`,
          xpReward: 30,
        });
      }
    }

    // ── 4. Recomendação por hora do dia ──────────────────────────────────
    const hour = hourNow();
    if (hour >= 5 && hour < 12 && recommendations.length < 3) {
      recommendations.push({
        id: 'time-morning',
        priority: 'bonus',
        type: 'start',
        icon: '🌅',
        title: 'Sessão Matinal — Janela Cognitiva Ideal',
        subtitle: 'Estudos mostram que a memória consolida melhor nas primeiras 2h após o despertar. Aproveite agora.',
        actionLabel: 'Ir para Revisão',
        actionUrl: '/dashboard/revisao',
        xpReward: 15,
      });
    } else if (hour >= 22 || hour < 5) {
      recommendations.push({
        id: 'time-night',
        priority: 'bonus',
        type: 'review',
        icon: '🌙',
        title: 'Revisão Noturna — Consolide Antes de Dormir',
        subtitle: 'O sono consolida a memória de curto para longo prazo. Revise flashcards rápidos antes de descansar.',
        actionLabel: 'Revisão Rápida',
        actionUrl: '/dashboard/revisao',
        xpReward: 10,
      });
    }

    // ── 5. Início — sem dados ainda ───────────────────────────────────────
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'onboarding-library',
        priority: 'high',
        type: 'start',
        icon: '🏛️',
        title: 'Comece pela Biblioteca',
        subtitle: 'Faça upload do seu primeiro PDF ou adicione um artigo da web para iniciar sua jornada.',
        actionLabel: 'Ir para Biblioteca',
        actionUrl: '/dashboard/biblioteca',
        xpReward: 0,
      });
      recommendations.push({
        id: 'onboarding-flashcards',
        priority: 'normal',
        type: 'start',
        icon: '🃏',
        title: 'Crie seu Primeiro Baralho',
        subtitle: 'Flashcards com repetição espaçada são a forma mais eficiente de reter conhecimento a longo prazo.',
        actionLabel: 'Criar Flashcards',
        actionUrl: '/dashboard/revisao',
        xpReward: 0,
      });
    }

    // Ordenar: urgent > high > normal > bonus
    const order = { urgent: 0, high: 1, normal: 2, bonus: 3 };
    recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

    return NextResponse.json({ recommendations, generatedAt: now.toISOString() });

  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
