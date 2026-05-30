'use client';

import React, { useEffect, useState } from 'react';
import { X, Search, FileText, Globe, Loader2 } from 'lucide-react';
import { getDocuments } from '@/app/actions/library';
import styles from './citation-modal.module.css';

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'url' | 'doc';
  category?: string;
}

interface CitationModalProps {
  onClose: () => void;
  onSelect: (citation: { docId: string; docTitle: string; quote: string; page?: string }) => void;
}

export default function CitationModal({ onClose, onSelect }: CitationModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [quote, setQuote] = useState('');
  const [page, setPage] = useState('');

  useEffect(() => {
    async function loadDocs() {
      const res = await getDocuments();
      if (res.documents) {
        setDocuments(res.documents as Document[]);
      }
      setLoading(false);
    }
    loadDocs();
  }, []);

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (!selectedDoc || !quote.trim()) return;
    onSelect({
      docId: selectedDoc.id,
      docTitle: selectedDoc.title,
      quote: quote,
      page: page
    });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>Vincular Evidência</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <div className={styles.content}>
          {!selectedDoc ? (
            <>
              <div className={styles.searchBox}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Buscar na sua biblioteca..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.docList}>
                {loading ? (
                  <div className={styles.loading}><Loader2 className={styles.spin} /> Carregando biblioteca...</div>
                ) : filteredDocs.length > 0 ? (
                  filteredDocs.map(doc => (
                    <button key={doc.id} className={styles.docItem} onClick={() => setSelectedDoc(doc)}>
                      {doc.type === 'url' ? <Globe size={18} /> : <FileText size={18} />}
                      <div className={styles.docInfo}>
                        <span className={styles.docTitle}>{doc.title}</span>
                        <span className={styles.docMeta}>{doc.category || 'Sem categoria'}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={styles.empty}>Nenhum documento encontrado.</div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.form}>
              <div className={styles.selectedDocHeader}>
                <button className={styles.backLink} onClick={() => setSelectedDoc(null)}>&larr; Escolher outro</button>
                <h3>{selectedDoc.title}</h3>
              </div>

              <div className={styles.inputGroup}>
                <label>Trecho da Citação (Obrigatório)</label>
                <textarea 
                  placeholder="Cole aqui o trecho do documento que sustenta seu argumento..."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Página / Referência (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: p. 42 ou Cap. III" 
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className={styles.input}
                />
              </div>

              <button 
                className={styles.confirmBtn}
                disabled={!quote.trim()}
                onClick={handleConfirm}
              >
                Confirmar Citação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
