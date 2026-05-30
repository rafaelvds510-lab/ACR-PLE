export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('study_events')
    .delete()
    .eq('plan_id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// Para finalizar sem completar (apenas encerra as futuras ou marca todas como ok?)
// O usuário pediu "finalizar sem ter completado" - talvez apenas deletar as que não foram feitas?
// Ou marcar o plano como inativo?
// Para manter simples: vamos permitir deletar o plano inteiro (limpar agenda) 
// ou deletar apenas os eventos futuros do plano.
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
    // Deleta apenas eventos não concluídos do plano
    const { error } = await supabase
      .from('study_events')
      .delete()
      .eq('plan_id', params.id)
      .eq('concluida', false)
      .eq('user_id', user.id);
  
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
    return NextResponse.json({ success: true });
  }
