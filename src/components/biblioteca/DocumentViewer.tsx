'use client';

import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import dynamic from 'next/dynamic';

const PdfRenderer = dynamic(() => import('./PdfRenderer'), { 
  ssr: false,
  loading: () => <div style={{ padding: '40px', color: 'var(--stone)' }}>Preparando Pergaminho...</div>
});
import ReaderToolbar, { ReaderMode, HighlightColor } from './ReaderToolbar';
import ReaderSidebar from './ReaderSidebar';
import { useAnnotations } from '@/hooks/useAnnotations';

interface DocumentViewerProps {
  documentId: string;
  signedUrl: string;
  fileExt: string;
  title: string;
}

export default function DocumentViewer({ documentId, signedUrl, fileExt, title }: DocumentViewerProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [mode, setMode] = useState<ReaderMode>('cursor');
  const [highlightColor, setHighlightColor] = useState<HighlightColor>('yellow');
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [targetPage, setTargetPage] = useState<number | any | null>(null);
  const [outline, setOutline] = useState<any[]>([]);
  const { bookmarks, stickyNotes, setStickyNotes, removeStickyNote } = useAnnotations(documentId);


  const editStickyNote = (id: string) => {
    const note = stickyNotes.find(n => n.id === id);
    if (!note) return;
    const newText = window.prompt('Editar nota:', note.text);
    if (newText === null) return;
    if (newText.trim() === '') {
      removeStickyNote(id);
    } else {
      setStickyNotes(stickyNotes.map(n => n.id === id ? { ...n, text: newText } : n));
    }
  };

  // Normalizar extensão
  const ext = fileExt.toLowerCase().replace('.', '');

  if (ext === 'pdf') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--marble-deep)', background: 'white' }}>
        <ReaderToolbar 
          mode={mode} 
          setMode={setMode} 
          highlightColor={highlightColor} 
          setHighlightColor={setHighlightColor} 
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
        />
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <ReaderSidebar 
            stickyNotes={stickyNotes}
            outline={outline}
            onJumpToPage={(p) => setTargetPage(p)} 
            onRemoveNote={removeStickyNote}
            onEditNote={editStickyNote}
          />
          <div style={{ flex: 1, position: 'relative', minWidth: 0, height: '100%' }}>
            <PdfRenderer 
              documentId={documentId}
              url={signedUrl} 
              title={title} 
              mode={mode}
              highlightColor={highlightColor}
              lineWidth={lineWidth}
              targetPage={targetPage}
              onPageHandled={() => setTargetPage(null)}
              onLoadSuccess={(_num, out) => out && setOutline(out)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (ext === 'epub') {
    return (
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 150px)' }}>
        <ReactReader
          url={signedUrl}
          title={title}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
        />
      </div>
    );
  }

  if (['doc', 'docx', 'rtf'].includes(ext)) {
    // Usar o Google Docs Viewer para arquivos de texto ricos
    // Outra opção seria: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`;
    
    return (
      <div style={{ width: '100%', height: 'calc(100vh - 150px)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
        <iframe 
          src={viewerUrl} 
          width="100%" 
          height="100%" 
          style={{ border: 'none' }}
          title={title}
        />
      </div>
    );
  }

  if (ext === 'url') {
    return (
      <div style={{ width: '100%', height: 'calc(100vh - 150px)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
        {/* Usando o próprio artigo via iframe. Muitos sites bloqueiam via X-Frame-Options, 
            caso bloqueiem, o usuário poderá ler no navegador e preencher a direita */}
        <iframe 
          src={signedUrl} 
          width="100%" 
          height="100%" 
          style={{ border: 'none' }}
          title={title}
        />
        <div style={{ padding: '8px', background: 'var(--marble-deep)', textAlign: 'center', fontSize: '12px' }}>
          Site não carregou? <a href={signedUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--aegean)', textDecoration: 'underline' }}>Abra em uma nova guia</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface-base)', borderRadius: '8px' }}>
      <p style={{ color: 'var(--stone)' }}>Formato não suportado para leitura nativa: <b>.{ext}</b></p>
      <a 
        href={signedUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: 'var(--gold)', textDecoration: 'underline' }}
      >
        Clique aqui para baixar o arquivo
      </a>
    </div>
  );
}
