import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Busca todos os eventos que pertencem a um plano
  const { data: events, error } = await supabase
    .from('study_events')
    .select('plan_id, plan_name, concluida, color')
    .not('plan_id', 'is', null)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Agrupa por plano e calcula progresso
  const plansMap: Record<string, any> = {};
  
  events.forEach(event => {
    if (!plansMap[event.plan_id]) {
      plansMap[event.plan_id] = {
        id: event.plan_id,
        name: event.plan_name,
        color: event.color,
        total: 0,
        completed: 0
      };
    }
    plansMap[event.plan_id].total++;
    if (event.concluida) plansMap[event.plan_id].completed++;
  });

  return NextResponse.json(Object.values(plansMap));
}
