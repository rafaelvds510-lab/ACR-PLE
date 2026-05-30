'use client';

import React, { useState } from 'react';
import UploadArea from '@/components/biblioteca/UploadArea';
import DocumentCard, { DocumentType } from '@/components/biblioteca/DocumentCard';
import { deleteDocument } from '@/app/actions/library';
import { useRouter } from 'next/navigation';
import AddUrlModal from '@/components/biblioteca/AddUrlModal';

interface BibliotecaClientProps {
  initialDocuments: DocumentType[];
}

export default function BibliotecaClient({ initialDocuments }: BibliotecaClientProps) {
  const [documents, setDocuments] = useState<DocumentType[]>(initialDocuments);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async (id: string, filePath: string | null) => {
    setIsDeleting(id);
    try {
      const res = await deleteDocument(id, filePath || '');
      if (res.error) {
        alert(res.error);
      } else {
        setDocuments(docs => docs.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao excluir o documento.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRead = (id: string) => {
    router.push(`/dashboard/biblioteca/ler/${id}`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '32px', marginBottom: '8px', color: 'var(--ink)' }}>
            A Biblioteca
          </h1>
          <p style={{ fontFamily: 'var(--font-eb-garamond), serif', fontSize: '18px', color: 'var(--stone)', fontStyle: 'italic', margin: 0 }}>
            Armazene e consulte seus pergaminhos de conhecimento.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'var(--gold)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-deep)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gold)'}
        >
          + Adicionar Artigo (URL)
        </button>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <UploadArea onUploadSuccess={() => {
          router.refresh();
        }} />
      </div>

      <AddUrlModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => router.refresh()} 
      />

      <div>
        <h2 style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '20px', marginBottom: '24px', color: 'var(--ink)' }}>
          Meus Pergaminhos ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center', 
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px dashed var(--marble-deep)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p style={{ color: 'var(--stone)' }}>A biblioteca está vazia. Envie seu primeiro PDF acima.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ opacity: isDeleting === doc.id ? 0.5 : 1 }}>
                <DocumentCard 
                  document={doc} 
                  onDelete={handleDelete}
                  onRead={handleRead}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

