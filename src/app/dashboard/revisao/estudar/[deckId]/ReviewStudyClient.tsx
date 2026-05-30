'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import styles from './estudar.module.css';
import 'katex/dist/katex.min.css';

interface Card {
  id: string;
  front_html: string;
  back_html: string;
}

interface ReviewStudyClientProps {
  deckId: string;
}

export default function ReviewStudyClient({ deckId }: ReviewStudyClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, [deckId]);

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/cards?deck_id=${deckId}`);
      if (res.ok) {
        const data = await res.json();
        // Filter only due cards
        const now = new Date();
        const due = data.filter((c: any) => new Date(c.next_review) <= now);
        setCards(due);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = useCallback(async (quality: number) => {
    if (cards.length === 0) return;
    const cardId = cards[currentIndex].id;

    // Move to next card immediately for UX
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowBack(false);
    } else {
      // Done
      setCards([]);
    }

    const payload = { card_id: cardId, quality };

    if (!navigator.onLine) {
      // Offline mode: queue action
      const { queueOfflineAction } = await import('@/lib/offlineSync');
      await queueOfflineAction('/api/cards/review', 'POST', payload);
    } else {
      // Online mode: send directly
      try {
        await fetch('/api/cards/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Failed to save review:', error);
        // Fallback to queue if fetch fails despite being "online"
        const { queueOfflineAction } = await import('@/lib/offlineSync');
        await queueOfflineAction('/api/cards/review', 'POST', payload);
      }
    }
  }, [cards, currentIndex]);

  // Sync Queue when coming online
  useEffect(() => {
    const handleOnline = async () => {
      const { processSyncQueue } = await import('@/lib/offlineSync');
      await processSyncQueue();
    };
    window.addEventListener('online', handleOnline);
    // Try to sync on mount if online
    if (navigator.onLine) {
      handleOnline();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;

      if (!showBack && e.code === 'Space') {
        setShowBack(true);
        e.preventDefault();
      } else if (showBack) {
        if (e.key === '1') handleReview(1); // Hard
        if (e.key === '2') handleReview(2); // Good
        if (e.key === '3') handleReview(3); // Easy
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBack, cards.length, handleReview]);

  if (loading) return <div className={styles.container}>Carregando...</div>;

  if (cards.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Tudo Feito! 🎉</h2>
          <p>Você não tem mais cartões pendentes neste baralho para hoje.</p>
          <button 
            className={styles.showBtn} 
            style={{ marginTop: 24, width: 'auto' }}
            onClick={() => router.push('/dashboard/revisao')}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleDragEnd = (event: any, info: any) => {
    if (!showBack) return;
    const offset = info.offset.x;
    if (offset > 100) {
      handleReview(3); // Swipe Right -> Easy
    } else if (offset < -100) {
      handleReview(1); // Swipe Left -> Hard
    }
  };

  return (
    <>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/revisao')}>
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className={styles.progress}>
          {currentIndex + 1} / {cards.length}
        </div>
      </header>

      <div className={styles.cardContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            className={styles.flashcard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            drag={showBack ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
          >
            <div 
              className={styles.cardHtml} 
              dangerouslySetInnerHTML={{ __html: currentCard.front_html }} 
            />
            
            {showBack && (
              <>
                <div className={styles.divider} />
                <div 
                  className={styles.cardHtml} 
                  dangerouslySetInnerHTML={{ __html: currentCard.back_html }} 
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.controls}>
        {!showBack ? (
          <button className={styles.showBtn} onClick={() => setShowBack(true)}>
            Mostrar Resposta <span className={styles.shortcut}>(Espaço)</span>
          </button>
        ) : (
          <div className={styles.actionBtns}>
            <button className={`${styles.actionBtn} ${styles.btnHard}`} onClick={() => handleReview(1)}>
              Difícil <span className={styles.shortcut}>(1)</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.btnGood}`} onClick={() => handleReview(2)}>
              Bom <span className={styles.shortcut}>(2)</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.btnEasy}`} onClick={() => handleReview(3)}>
              Fácil <span className={styles.shortcut}>(3)</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
