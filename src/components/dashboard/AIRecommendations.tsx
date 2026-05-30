'use client';

// ═══════════════════════════════════════════════
//  AIRecommendations — Widget "O Oráculo"
//  Recomendações inteligentes baseadas em SRS e histórico
// ═══════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recommendation } from '@/app/api/recommendations/route';
import styles from './AIRecommendations.module.css';

const PRIORITY_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'URGENTE',  color: '#C4622D', bg: 'rgba(196,98,45,0.08)',  border: 'rgba(196,98,45,0.3)' },
  high:   { label: 'HOJE',     color: '#C9A84C', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)' },
  normal: { label: 'SUGERIDO', color: '#4A7AB5', bg: 'rgba(74,122,181,0.08)', border: 'rgba(74,122,181,0.3)' },
  bonus:  { label: 'DICA',     color: '#7AAB6D', bg: 'rgba(122,171,109,0.08)',border: 'rgba(122,171,109,0.3)' },
};

export default function AIRecommendations() {
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecs(data.recommendations ?? []);
        setGeneratedAt(data.generatedAt);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visible = recs.filter(r => !dismissed.has(r.id));

  return (
    <div className={styles.widget}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🔮</span>
          <div>
            <h2 className={styles.headerTitle}>O Oráculo</h2>
            <p className={styles.headerSub}>
              {generatedAt
                ? `Atualizado às ${new Date(generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Consultando dados de estudo...'}
            </p>
          </div>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={fetchRecs}
          title="Atualizar recomendações"
          disabled={loading}
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Body */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingDots}>
            {[0, 1, 2].map(i => (
              <span key={i} className={styles.dot} style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className={styles.loadingText}>Consultando o oráculo...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>✦</span>
          <p className={styles.emptyText}>O Olimpo está satisfeito.<br />Todas as recomendações foram atendidas.</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className={styles.list}>
            {visible.map((rec, idx) => {
              const pStyle = PRIORITY_STYLES[rec.priority];
              return (
                <motion.div
                  key={rec.id}
                  className={styles.card}
                  style={{ borderColor: pStyle.border, background: pStyle.bg }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.06 }}
                  layout
                >
                  {/* Priority badge + dismiss */}
                  <div className={styles.cardTop}>
                    <span
                      className={styles.priorityBadge}
                      style={{ color: pStyle.color, background: `${pStyle.color}18`, borderColor: `${pStyle.color}40` }}
                    >
                      {pStyle.label}
                    </span>
                    <button
                      className={styles.dismissBtn}
                      onClick={() => dismiss(rec.id)}
                      title="Dispensar"
                    >
                      ×
                    </button>
                  </div>

                  {/* Content */}
                  <div className={styles.cardBody}>
                    <span className={styles.cardIcon}>{rec.icon}</span>
                    <div className={styles.cardText}>
                      <div className={styles.cardTitle}>{rec.title}</div>
                      <div className={styles.cardSub}>{rec.subtitle}</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={styles.cardFooter}>
                    {rec.xpReward > 0 && (
                      <span className={styles.xpTag}>+{rec.xpReward} XP</span>
                    )}
                    <button
                      className={styles.actionBtn}
                      style={{ background: pStyle.color }}
                      onClick={() => router.push(rec.actionUrl)}
                    >
                      {rec.actionLabel} →
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
