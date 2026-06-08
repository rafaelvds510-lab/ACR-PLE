import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WritingEditor from './WritingEditorNoSSR';
import { TemplateId } from './components/templates';

export const metadata = { title: 'Editor de Escrita | Acrópole' };

export default async function WritingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('writings')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!data) redirect('/dashboard/escrita');

  return (
    <WritingEditor
      writingId={data.id}
      initialTitle={data.title}
      initialContent={data.content}
      initialTemplate={data.template as TemplateId}
    />
  );
}
