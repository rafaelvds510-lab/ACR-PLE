'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createDebateRoom(title: string, categoryId?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  const { data, error } = await supabase
    .from('debate_rooms')
    .insert({
      title,
      category_id: categoryId || null,
      creator_id: user.id,
      status: 'open'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating debate room:', error);
    return { error: 'Falha ao criar sala de debate.' };
  }

  revalidatePath('/dashboard/debate');
  return { success: true, room: data };
}

export async function getRooms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('debate_rooms')
    .select('*, author:profiles(full_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }

  return data || [];
}

export async function deleteRoom(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('debate_rooms')
    .delete()
    .eq('id', id)
    .eq('creator_id', user.id);

  if (error) {
    console.error('Error deleting room:', error);
    return { error: 'Falha ao excluir sala.' };
  }

  revalidatePath('/dashboard/debate');
  return { success: true };
}

export async function saveArgument(roomId: string, side: string, content: string, citation?: { docTitle: string; quote: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('debate_arguments')
    .insert({
      room_id: roomId,
      author_id: user.id,
      side,
      content,
      document_quote: citation?.quote,
      // Metadados adicionais podem ser expandidos aqui
    });

  if (error) {
    console.error('Error saving argument:', error);
    return { error: 'Falha ao salvar argumento.' };
  }

  revalidatePath(`/dashboard/debate/arena/${roomId}`);
  return { success: true };
}

export async function getArguments(roomId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('debate_arguments')
    .select('*, author:profiles(full_name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching arguments:', error);
    return [];
  }

  return data || [];
}
