import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSignedDocumentUrl } from '@/app/actions/library';
import DocumentViewer from '@/components/biblioteca/DocumentViewer';
import FichamentoEditor from '@/components/biblioteca/FichamentoEditor';
import Link from 'next/link';

export default async function LeitorPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient();

  // Fetch document metadata
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (docError || !doc) {
    return (
      <div style={{ padding: '40px' }}>
        <h1 style={{ color: 'var(--terra)', fontFamily: 'var(--font-cinzel), serif' }}>Documento não encontrado</h1>
        <p style={{ color: 'var(--stone)' }}>O pergaminho solicitado não existe ou você não tem acesso.</p>
        <Link href="/dashboard/biblioteca" style={{ color: 'var(--gold)' }}>Voltar para Biblioteca</Link>
      </div>
    );
  }

  // Get signed URL for file types, or use source_url directly for URL types
  let viewerUrl = '';
  let fileExt = '';

  if (doc.type === 'url' && doc.source_url) {
    viewerUrl = doc.source_url;
    fileExt = 'url'; // Custom pseudo-extension for DocumentViewer
  } else if (doc.file_path) {
    const { signedUrl, error: urlError } = await getSignedDocumentUrl(doc.file_path);
    if (urlError || !signedUrl) {
      return (
        <div style={{ padding: '40px' }}>
          <h1 style={{ color: 'var(--terra)', fontFamily: 'var(--font-cinzel), serif' }}>Erro de Acesso</h1>
          <p style={{ color: 'var(--stone)' }}>Não foi possível gerar a assinatura de acesso seguro.</p>
          <Link href="/dashboard/biblioteca" style={{ color: 'var(--gold)' }}>Voltar para Biblioteca</Link>
        </div>
      );
    }
    viewerUrl = signedUrl;
    fileExt = doc.file_path.split('.').pop() || '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header do Leitor */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--marble-deep)'
      }}>
        <div>
          <h1 style={{ 
            fontFamily: 'var(--font-cinzel), serif', 
            fontSize: '24px', 
            color: 'var(--ink)',
            margin: '0 0 4px 0'
          }}>
            {doc.title}
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: 'var(--stone)', margin: 0 }}>
            {doc.type === 'url' ? 'Artigo da Web' : `Arquivo .${fileExt.toUpperCase()}`}
          </p>
        </div>

        <Link 
          href="/dashboard/biblioteca"
          style={{
            padding: '8px 16px',
            background: 'var(--surface-base)',
            border: '1px solid var(--marble-deep)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--stone-dark)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            textDecoration: 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          &larr; Voltar
        </Link>
      </div>

      {/* Split Screen Viewport */}
      <div style={{ 
        display: 'flex', 
        gap: '32px', 
        flex: 1, 
        minHeight: 'calc(100vh - 180px)',
        width: '100%',
        margin: '0 auto'
      }}>
        
        {/* Document Viewer (Left Side) */}
        <div style={{ flex: '2', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
          <DocumentViewer documentId={doc.id} signedUrl={viewerUrl} fileExt={fileExt} title={doc.title} />
        </div>

        {/* Fichamento Editor (Right Side) */}
        <div style={{ flex: '1.2', minWidth: '450px', display: 'flex', flexDirection: 'column' }}>
          <FichamentoEditor document={doc} />
        </div>

      </div>
    </div>
  );
}
