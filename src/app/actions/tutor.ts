'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTutorConversation(title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  const { data, error } = await supabase
    .from('tutor_conversations')
    .insert({
      title,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return { error: 'Falha ao criar conversa.' };
  }

  revalidatePath('/dashboard/tutor');
  return { success: true, conversation: data };
}

export async function getTutorConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tutor_conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

export async function saveTutorMessage(conversationId: string, role: string, content: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tutor_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content
    });

  if (error) {
    console.error('Error saving message:', error);
    return { error: 'Falha ao salvar mensagem.' };
  }

  return { success: true };
}

export async function deleteTutorConversation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('tutor_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting conversation:', error);
    return { error: 'Falha ao excluir conversa.' };
  }

  revalidatePath('/dashboard/tutor');
  return { success: true };
}
