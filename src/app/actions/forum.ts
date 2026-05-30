'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createThread(discipline: string, title: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  // Verifica ou cria a categoria para a disciplina
  let { data: category } = await supabase
    .from('forum_categories')
    .select('id')
    .eq('name', discipline)
    .single();

  if (!category) {
    const { data: newCat, error: catError } = await supabase
      .from('forum_categories')
      .insert({ name: discipline, slug: discipline.toLowerCase().replace(/\s+/g, '-') })
      .select()
      .single();
    
    if (catError) {
      console.error('Error creating category:', catError);
      return { error: 'Falha ao criar categoria do fórum.' };
    }
    category = newCat;
  }
  if (!category) {
    return { error: 'Falha ao processar categoria do fórum.' };
  }

  const { data, error } = await supabase
    .from('forum_threads')
    .insert({
      category_id: category.id,
      title,
      content,
      author_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating thread:', error);
    return { error: 'Falha ao criar tópico no fórum.' };
  }

  revalidatePath(`/dashboard/debate/forum/${discipline}`);
  return { success: true, thread: data };
}

export async function getThreads(discipline: string) {
  const supabase = await createClient();
  
  const { data: category } = await supabase
    .from('forum_categories')
    .select('id')
    .eq('name', discipline)
    .single();

  if (!category) return [];

  const { data, error } = await supabase
    .from('forum_threads')
    .select('*, author:profiles(full_name)')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching threads:', error);
    return [];
  }

  return data.map((t: any) => ({
    id: t.id,
    title: t.title,
    author: t.author?.full_name || 'Usuário',
    replies: 0,
    votes: 0,
    lastActivity: 'Agora'
  }));
}
