'use client';

// ═══════════════════════════════════════════════
//  XPFloat — texto flutuante "+X XP"
//  Aparece e sobe suavemente ao ganhar XP
// ═══════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface XPFloatProps {
  amount: number;       // XP ganho (0 = nada para mostrar)
  onDone: () => void;  // callback após animação
}

export default function XPFloat({ amount, onDone }: XPFloatProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (amount > 0) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 400); // aguarda saída da animação
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [amount, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={amount + Date.now()}
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -48, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.9 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 9999,
            pointerEvents: 'none',
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: '20px',
            fontWeight: 700,
            color: '#C9A84C',
            textShadow: '0 0 12px rgba(201,168,76,0.6), 0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '0.05em',
            userSelect: 'none',
          }}
        >
          +{amount} XP ✦
        </motion.div>
      )}
    </AnimatePresence>
  );
}
