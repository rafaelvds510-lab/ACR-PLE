import { createClient } from '@/lib/supabase/server';

export default async function ClearEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Não autorizado</div>;

  const { error } = await supabase
    .from('study_events')
    .delete()
    .eq('user_id', user.id);

  return (
    <div style={{ padding: 40, color: 'white' }}>
      <h1>{error ? 'Erro ao limpar' : 'Agenda limpa com sucesso!'}</h1>
      <p>{error?.message}</p>
      <a href="/dashboard" style={{ color: 'gold' }}>Voltar para Ágora</a>
    </div>
  );
}
