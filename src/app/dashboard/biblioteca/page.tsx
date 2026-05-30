import React from 'react';
import { createClient } from '@/lib/supabase/server';
import BibliotecaClient from './BibliotecaClient';

export default async function BibliotecaPage() {
  const supabase = await createClient();

  // Fetch documents for the current user, ordered by most recent first
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (docError) {
    console.error('Error fetching documents:', docError);
  }

  return (
    <BibliotecaClient 
      initialDocuments={documents || []} 
    />
  );
}

