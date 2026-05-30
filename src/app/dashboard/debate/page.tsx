'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  IconScales, 
  IconChat, 
  IconSword, 
  IconQuote, 
  IconUsers,
  IconOwl
} from '@/components/icons/AcropoleIcons';
import styles from './debate.module.css';
import { createDebateRoom, getRooms, deleteRoom } from '@/app/actions/debate';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';

export default function DebatePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const data = await getRooms();
    setRooms(data);
    setLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    const res = await createDebateRoom(newTitle);
    setIsSubmitting(false);
    
    if (res.success && res.room) {
      setCreateModalOpen(false);
      setNewTitle('');
      fetchRooms();
      router.push(`/dashboard/debate/arena/${res.room.id}`);
    } else {
      alert(res.error || 'Erro ao criar sala. Verifique sua conexão.');
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Deseja excluir permanentemente esta sala de debate?')) return;
    const res = await deleteRoom(id);
    if (res.success) {
      fetchRooms();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className={styles.debateHub}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <IconScales size={40} color="var(--gold)" />
          <h1 className={styles.title}>Debates & Fórum Socrático</h1>
          <p className={styles.subtitle}>Onde a dialética encontra a erudição. Explore temas, refute argumentos e aprimore sua retórica.</p>
        </div>
        
        <div className={styles.quickActions}>
          <button className={styles.primaryBtn} onClick={() => setCreateModalOpen(true)}>
            <IconSword size={18} />
            Criar Sala de Debate
          </button>
          <Link href="/dashboard/debate/arena/ai-practice" className={styles.secondaryBtn}>
            <IconOwl size={18} />
            Praticar com IA
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Active Debates Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <IconSword size={20} color="var(--gold)" />
            <h2>Salas de Debate Ativas</h2>
          </div>
          
          <div className={styles.debateGrid}>
            {loading ? (
              <p style={{ color: 'var(--stone-medium)' }}>Carregando arenas...</p>
            ) : rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1', background: 'var(--marble-light)', borderRadius: 16 }}>
                <p style={{ color: 'var(--stone-medium)' }}>Nenhuma sala ativa no momento.</p>
              </div>
            ) : rooms.map(debate => (
              <div key={debate.id} className={styles.debateCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.categoryBadge}>{debate.category || 'Geral'}</span>
                  <div className={styles.stats}>
                    <IconUsers size={14} /> {debate.participant_count || 0}
                    <button 
                      className={styles.deleteBtn} 
                      onClick={(e) => handleDeleteRoom(e, debate.id)}
                      title="Excluir Arena"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{debate.title}</h3>
                <Link href={`/dashboard/debate/arena/${debate.id}`} className={styles.cardBtnLink}>
                  Entrar na Arena
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Forum Threads Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <IconChat size={20} color="var(--azure)" />
            <h2>Fórum por Disciplina</h2>
          </div>

          <div className={styles.forumList}>
            {[
              { discipline: "Filosofia", threads: 124, lastActivity: "2 min atrás" },
              { discipline: "História", threads: 89, lastActivity: "1 hora atrás" },
              { discipline: "Direito", threads: 56, lastActivity: "3 horas atrás" },
              { discipline: "Literatura", threads: 34, lastActivity: "5 horas atrás" }
            ].map(forum => (
              <div key={forum.discipline} className={styles.forumItem}>
                <div className={styles.forumIcon}>
                  <IconChat size={20} />
                </div>
                <div className={styles.forumInfo}>
                  <h4 className={styles.forumTitle}>{forum.discipline}</h4>
                  <p className={styles.forumMeta}>{forum.threads} discussões · Última atividade {forum.lastActivity}</p>
                </div>
                <Link href={`/dashboard/debate/forum/${forum.discipline}`} className={styles.viewBtn}>
                  Ver Threads
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create Debate Modal - Placeholder for now but functional UI */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Novo Debate</h2>
            <div className={styles.modalBody}>
              <input 
                type="text" 
                placeholder="Título do Debate (ex: A Ética em Platão)" 
                className={styles.modalInput} 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setCreateModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
              <button 
                className={styles.primaryBtn} 
                onClick={handleCreateRoom}
                disabled={isSubmitting || !newTitle.trim()}
              >
                {isSubmitting ? 'Criando...' : 'Criar Sala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
