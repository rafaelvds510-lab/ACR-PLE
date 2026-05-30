'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './revisao.module.css';
import GenerateFlashcardsModal from '@/components/revisao/GenerateFlashcardsModal';

interface RevisaoClientProps {
  userId: string;
}

export default function RevisaoClient({ userId }: RevisaoClientProps) {
  const router = useRouter();
  const [decks, setDecks] = useState<any[]>([]);
  const [dueCardsByDeck, setDueCardsByDeck] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Real-time data will be fetched from the database
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [retentionRate, setRetentionRate] = useState<number>(0);

  useEffect(() => {
    fetchDecksAndDueCards();
  }, []);

  const fetchDecksAndDueCards = async () => {
    try {
      const [decksRes, cardsRes] = await Promise.all([
        fetch('/api/decks'),
        fetch('/api/cards')
      ]);

      if (decksRes.ok && cardsRes.ok) {
        const fetchedDecks = await decksRes.json();
        const fetchedCards = await cardsRes.json();

        const now = new Date();
        const dueCounts: Record<string, number> = {};

        fetchedCards.forEach((card: any) => {
          if (new Date(card.next_review) <= now) {
            dueCounts[card.deck_id] = (dueCounts[card.deck_id] || 0) + 1;
          }
        });

        setDecks(fetchedDecks);
        setDueCardsByDeck(dueCounts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalDue = Object.values(dueCardsByDeck).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.content}>
      <div className={styles.dashboardGrid}>
        
        {/* Resumo */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Resumo Diário</h2>
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{loading ? '...' : totalDue}</div>
              <div className={styles.statLabel}>Cartões Pendentes</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{loading ? '...' : `${retentionRate}%`}</div>
              <div className={styles.statLabel}>Retenção Atual</div>
            </div>
          </div>
        </div>

        {/* Gráfico de Retenção */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Curva de Retenção (Últimos 7 dias)</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-accent)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--neon-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stone-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--stone-medium)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--stone-medium)' }} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" stroke="var(--neon-accent)" fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Baralhos */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>Seus Baralhos</h2>
          <button 
            className={styles.studyBtn}
            onClick={() => setIsGenerateModalOpen(true)}
            style={{ padding: '8px 16px', fontSize: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ✨ Gerar com IA
          </button>
        </div>
        {loading ? (
          <p>Carregando baralhos...</p>
        ) : decks.length === 0 ? (
          <p>Nenhum baralho encontrado. Importe um arquivo .apkg ou crie um novo!</p>
        ) : (
          <div className={styles.decksList}>
            {decks.map(deck => {
              const dueCount = dueCardsByDeck[deck.id] || 0;
              return (
                <div key={deck.id} className={styles.deckItem}>
                  <div>
                    <div className={styles.deckName}>{deck.name}</div>
                    <div className={styles.deckInfo}>
                      {dueCount > 0 ? (
                        <span style={{ color: 'var(--neon-accent)', fontWeight: 600 }}>{dueCount} pendentes</span>
                      ) : (
                        <span>Nenhum cartão pendente hoje</span>
                      )}
                    </div>
                  </div>
                  <button 
                    className={styles.studyBtn} 
                    disabled={dueCount === 0}
                    onClick={() => router.push(`/dashboard/revisao/estudar/${deck.id}`)}
                  >
                    Estudar Agora
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isGenerateModalOpen && (
        <GenerateFlashcardsModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          onSuccess={(count) => {
            setIsGenerateModalOpen(false);
            alert(`${count} flashcards gerados com sucesso!`);
            fetchDecksAndDueCards();
          }}
        />
      )}
    </div>
  );
}
