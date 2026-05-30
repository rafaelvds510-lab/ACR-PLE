'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  IconChat, 
  IconUsers, 
  IconPen
} from '@/components/icons/AcropoleIcons';
import { ArrowLeft, MessageSquare, ThumbsUp, Search, Plus } from 'lucide-react';
import styles from './forum-list.module.css';
import { createThread, getThreads } from '@/app/actions/forum';
import { useEffect } from 'react';

interface Thread {
  id: string;
  title: string;
  author: string;
  replies: number;
  votes: number;
  lastActivity: string;
}

export default function ForumListClient({ 
  discipline, 
  initialThreads 
}: { 
  discipline: string; 
  initialThreads: Thread[] 
}) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchThreads = async () => {
    const data = await getThreads(discipline);
    setThreads(data);
  };

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    const res = await createThread(discipline, newTitle, newContent);
    setIsSubmitting(false);
    if (res.success) {
      setModalOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchThreads();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className={styles.forumContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard/debate" className={styles.backBtn}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className={styles.title}>Fórum de {decodeURIComponent(discipline)}</h1>
        </div>
        <button className={styles.newThreadBtn} onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Novo Tópico
        </button>
      </header>

      {/* Search and Filters */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar discussões..." className={styles.searchInput} />
        </div>
        <div className={styles.filters}>
          <button className={`${styles.filterBtn} ${styles.active}`}>Recentes</button>
          <button className={styles.filterBtn}>Populares</button>
        </div>
      </div>

      {/* Thread List */}
      <div className={styles.threadList}>
        {threads.length > 0 ? threads.map(thread => (
          <Link key={thread.id} href={`/dashboard/debate/forum/${discipline}/${thread.id}`} className={styles.threadItem}>
            <div className={styles.voteColumn}>
              <ThumbsUp size={16} />
              <span>{thread.votes}</span>
            </div>
            <div className={styles.mainInfo}>
              <h3 className={styles.threadTitle}>{thread.title}</h3>
              <div className={styles.threadMeta}>
                <span>Postado por <strong>{thread.author}</strong></span>
                <span className={styles.dot}>•</span>
                <span>{thread.lastActivity}</span>
              </div>
            </div>
            <div className={styles.repliesCount}>
              <MessageSquare size={16} />
              <span>{thread.replies}</span>
            </div>
          </Link>
        )) : (
          <div className={styles.empty}>Nenhum tópico encontrado nesta disciplina. Seja o primeiro a iniciar a discussão!</div>
        )}
      </div>

      {/* Modal Novo Tópico */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Novo Tópico: {decodeURIComponent(discipline)}</h2>
            <div className={styles.modalBody}>
              <input 
                type="text" 
                placeholder="Título do Tópico" 
                className={styles.modalInput}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea 
                placeholder="Conteúdo do tópico (Markdown disponível)" 
                className={styles.modalTextarea} 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
              <button 
                className={styles.submitBtn} 
                onClick={handleCreateThread}
                disabled={isSubmitting || !newTitle.trim()}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
