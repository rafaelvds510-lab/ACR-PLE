'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  IconSword, 
  IconShield, 
  IconQuote, 
  IconScroll, 
  IconOwl,
  IconScales
} from '@/components/icons/AcropoleIcons';
import { ArrowLeft, Send, X, FileText } from 'lucide-react';
import styles from './arena.module.css';
import CitationModal from '@/components/debate/CitationModal';
import { saveArgument } from '@/app/actions/debate';

interface Message {
  id: string;
  author: string;
  content: string;
  side: 'pro' | 'contra';
  timestamp: string;
  isAI?: boolean;
  citation?: {
    docTitle: string;
    quote: string;
  };
}

export default function ArenaClient({ 
  debateTitle, 
  isAIPractice, 
  initialMessages = [],
  roomId
}: { 
  debateTitle: string; 
  isAIPractice?: boolean;
  initialMessages?: Message[];
  roomId: string;
}) {
  const [argument, setArgument] = useState('');
  const [side, setSide] = useState<'pro' | 'contra'>(isAIPractice ? 'pro' : 'pro');
  const [isCitationModalOpen, setCitationModalOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingCitation, setPendingCitation] = useState<{ docTitle: string; quote: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : [
    {
      id: '1',
      author: '@marcus_aurelius',
      content: 'A tecnologia digital é apenas uma ferramenta neutra; a virtude (Arete) reside no uso que o agente faz dela, não na ferramenta em si.',
      side: 'pro',
      timestamp: '5min atrás',
      citation: { docTitle: 'Ética a Nicômaco, Livro II', quote: 'A virtude moral é fruto do hábito...' }
    }
  ]);

  // Se for prática com IA e não houver mensagens ainda, poderíamos disparar uma inicial
  // (Neste mock, já temos mensagens iniciais para visualização)

  const handleSendMessage = async () => {
    if (!argument.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      author: 'Você (Estudante)',
      content: argument,
      side: side,
      timestamp: 'Agora',
      citation: pendingCitation || undefined
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setArgument('');
    setPendingCitation(null);

    // Save to Database
    saveArgument(roomId, side, argument, pendingCitation || undefined);

    // AI Response Logic
    setIsThinking(true);
    try {
      const response = await fetch('/api/ai/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          history: updatedMessages,
          lastArgument: argument,
          side: side 
        })
      });
      
      const aiData = await response.json();
      if (!aiData.error) {
        setMessages(prev => [...prev, {
          ...aiData,
          id: Date.now().toString() + '-ai'
        }]);
      }
    } catch (err) {
      console.error('AI Error:', err);
      alert('O Oponente Socrático está meditando (Erro na IA). Tente novamente em breve.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className={styles.arenaContainer}>
      {/* Top Header */}
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/dashboard/debate" className={styles.backBtn}>
            <ArrowLeft size={16} /> Voltar ao Hub
          </Link>
          <div className={styles.separator} />
          <h1 className={styles.arenaTitle}>{debateTitle}</h1>
        </div>
        
        <div className={styles.navRight}>
          <div className={styles.participants}>
            <div className={styles.avatars}>
              <div className={styles.avatar}>V</div>
              <div className={`${styles.avatar} ${styles.aiAvatar}`}><IconOwl size={14} /></div>
            </div>
            <span>2 Presentes</span>
          </div>
        </div>
      </nav>

      {/* Main Arena Grid */}
      <main className={styles.mainGrid}>
        {/* Pro Column */}
        <div className={`${styles.column} ${styles.proColumn}`}>
          <div className={styles.columnHeader}>
            <IconSword size={20} color="var(--gold)" />
            <h2>Tese (Pró)</h2>
          </div>
          
          <div className={styles.argumentList}>
            {messages.filter(m => m.side === 'pro').map(msg => (
              <div key={msg.id} className={styles.argumentCard}>
                <div className={styles.argMeta}>{msg.author} · {msg.timestamp}</div>
                <p>{msg.content}</p>
                {msg.citation && (
                  <div className={styles.citation}>
                    <IconScroll size={12} /> 
                    <span>{msg.citation.docTitle}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contra Column */}
        <div className={`${styles.column} ${styles.contraColumn}`}>
          <div className={styles.columnHeader}>
            <IconShield size={20} color="var(--azure)" />
            <h2>Antítese (Contra)</h2>
          </div>
          
          <div className={styles.argumentList}>
            {messages.filter(m => m.side === 'contra').map(msg => (
              <div key={msg.id} className={`${styles.argumentCard} ${msg.isAI ? styles.aiCard : ''}`}>
                <div className={styles.argMeta}>{msg.author} · {msg.timestamp}</div>
                <p>{msg.content}</p>
                {msg.citation && (
                  <div className={styles.citation}>
                    {msg.isAI ? <IconOwl size={12} /> : <IconScroll size={12} />}
                    <span>{msg.citation.docTitle}</span>
                  </div>
                )}
              </div>
            ))}

            {isThinking && side === 'pro' && (
              <div className={`${styles.argumentCard} ${styles.aiCard} ${styles.thinking}`}>
                <div className={styles.argMeta}>Oponente Socrático (IA) · Pensando...</div>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className={styles.footer}>
        <div className={styles.inputWrapper}>
          {/* Pending Citation Badge */}
          {pendingCitation && (
            <div className={styles.pendingCitation}>
              <IconQuote size={14} />
              <span className={styles.citationText}>
                Citando: <strong>{pendingCitation.docTitle}</strong>
              </span>
              <button onClick={() => setPendingCitation(null)} className={styles.removeCite}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className={styles.sideToggle}>
            <button 
              className={`${styles.toggleBtn} ${side === 'pro' ? styles.proActive : ''}`}
              onClick={() => setSide('pro')}
            >
              PRÓ
            </button>
            <button 
              className={`${styles.toggleBtn} ${side === 'contra' ? styles.contraActive : ''}`}
              onClick={() => setSide('contra')}
            >
              CONTRA
            </button>
          </div>
          
          <div className={styles.inputRow}>
            <button 
              className={`${styles.citeBtn} ${pendingCitation ? styles.citeBtnActive : ''}`} 
              onClick={() => setCitationModalOpen(true)}
              title="Citar da Biblioteca"
            >
              <IconQuote size={18} />
              <span>Citar</span>
            </button>
            <textarea 
              className={styles.textarea}
              placeholder="Digite seu argumento..."
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button 
              className={styles.sendBtn}
              onClick={handleSendMessage}
              disabled={!argument.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isCitationModalOpen && (
        <CitationModal 
          onClose={() => setCitationModalOpen(false)}
          onSelect={(cite) => setPendingCitation({ docTitle: cite.docTitle, quote: cite.quote })}
        />
      )}
    </div>
  );
}
