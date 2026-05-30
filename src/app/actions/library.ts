'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DocumentType } from '@/components/biblioteca/DocumentCard';

export async function deleteDocument(id: string, filePath: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Não autorizado' };
  }

  // Ensure the document belongs to the user
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('user_id')
    .eq('id', id)
    .single();

  if (docError || doc?.user_id !== user.id) {
    return { error: 'Documento não encontrado ou sem permissão' };
  }

  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('library')
    .remove([filePath]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    return { error: 'Falha ao deletar arquivo do armazenamento' };
  }

  // 2. Delete from Database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('DB delete error:', dbError);
    return { error: 'Falha ao remover registro do documento' };
  }

  revalidatePath('/dashboard/biblioteca');
  return { success: true };
}

export async function getSignedDocumentUrl(filePath: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Não autorizado' };
  }

  // Generate a signed URL valid for 60 minutes (3600 seconds)
  const { data, error } = await supabase.storage
    .from('library')
    .createSignedUrl(filePath, 3600);

  if (error || !data) {
    console.error('Error generating signed URL:', error);
    return { error: 'Falha ao gerar URL de acesso seguro' };
  }

  return { signedUrl: data.signedUrl };
}

export async function addUrlDocument(title: string, url: string, category: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Não autorizado' };
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      title,
      source_url: url,
      type: 'url',
      category: category || null
    })
    .select()
    .single();

  if (error) {
    console.error('Add URL error:', error);
    return { error: 'Falha ao adicionar link.' };
  }

  revalidatePath('/dashboard/biblioteca');
  return { success: true, document: data };
}

export async function updateDocument(id: string, updates: Partial<DocumentType>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Não autorizado' };
  }

  const { error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns it

  if (error) {
    console.error('Update doc error:', error);
    return { error: 'Falha ao atualizar documento.' };
  }

  revalidatePath('/dashboard/biblioteca');
  revalidatePath(`/dashboard/biblioteca/ler/${id}`);
  return { success: true };
}

export async function getDocuments() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Não autorizado' };
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get docs error:', error);
    return { error: 'Falha ao buscar documentos.' };
  }

  return { documents: data };
}
