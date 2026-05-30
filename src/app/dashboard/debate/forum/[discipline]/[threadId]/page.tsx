'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  IconChat, 
  IconUsers, 
  IconQuote
} from '@/components/icons/AcropoleIcons';
import { ArrowLeft, ThumbsUp, MessageSquare, CornerDownRight, Send } from 'lucide-react';
import styles from './thread.module.css';

interface Reply {
  id: string;
  author: string;
  content: string;
  votes: number;
  timestamp: string;
  replies?: Reply[];
}

export default function ThreadPage() {
  const params = useParams();
  const { discipline, threadId } = params;
  
  const [replies, setReplies] = useState<Reply[]>([
    {
      id: '1',
      author: 'Profa. Helena',
      content: 'Excelente questionamento! Na verdade, Agostinho faz uma "batismo" das ideias platônicas, transformando o Mundo das Ideias no intelecto divino.',
      votes: 12,
      timestamp: '1 hora atrás',
      replies: [
        {
          id: '1-1',
          author: 'Estudante_Carlos',
          content: 'Isso explicaria a teoria da iluminação divina como um paralelo à alegoria da caverna?',
          votes: 5,
          timestamp: '45 min atrás'
        }
      ]
    },
    {
      id: '2',
      author: 'Mestre_Jonas',
      content: 'Recomendo a leitura da obra "A Cidade de Deus" para aprofundar nessa transição metafísica.',
      votes: 3,
      timestamp: '30 min atrás'
    }
  ]);

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href={`/dashboard/debate/forum/${discipline}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Voltar para {decodeURIComponent(discipline as string)}
        </Link>
      </nav>

      {/* Main Thread Post */}
      <article className={styles.mainPost}>
        <header className={styles.postHeader}>
          <div className={styles.authorAvatar}>S</div>
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>Dr. Silveira</span>
            <span className={styles.postDate}>Postado em 11 de Maio, 2026</span>
          </div>
        </header>
        
        <h1 className={styles.postTitle}>A influência do Platonismo no pensamento Agostiniano</h1>
        
        <div className={styles.postContent}>
          <p>Gostaria de iniciar uma discussão sobre como a dualidade platônica (mundo sensível vs. mundo inteligível) foi reapropriada por Santo Agostinho para fundamentar a distinção entre a Cidade dos Homens e a Cidade de Deus.</p>
          <p>Seria correto afirmar que o neoplatonismo de Plotino foi a ponte necessária para essa síntese teológica?</p>
        </div>

        <footer className={styles.postFooter}>
          <button className={styles.actionBtn}>
            <ThumbsUp size={16} /> 42
          </button>
          <button className={styles.actionBtn}>
            <MessageSquare size={16} /> {replies.length} Respostas
          </button>
        </footer>
      </article>

      {/* Replies Section */}
      <section className={styles.repliesSection}>
        <h2 className={styles.sectionTitle}>Discussão</h2>
        
        <div className={styles.replyList}>
          {replies.map(reply => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>

        {/* New Reply Box */}
        <div className={styles.replyBox}>
          <textarea placeholder="Adicione sua contribuição à discussão..." className={styles.textarea} />
          <button className={styles.sendBtn}>
            <Send size={18} /> Responder
          </button>
        </div>
      </section>
    </div>
  );
}

function ReplyItem({ reply, depth = 0 }: { reply: Reply, depth?: number }) {
  return (
    <div className={styles.replyWrapper} style={{ marginLeft: depth > 0 ? '40px' : '0' }}>
      <div className={styles.replyCard}>
        <header className={styles.replyHeader}>
          <span className={styles.replyAuthor}>{reply.author}</span>
          <span className={styles.replyDate}>{reply.timestamp}</span>
        </header>
        <div className={styles.replyContent}>
          {reply.content}
        </div>
        <footer className={styles.replyFooter}>
          <button className={styles.smallActionBtn}><ThumbsUp size={12} /> {reply.votes}</button>
          <button className={styles.smallActionBtn}>Responder</button>
        </footer>
      </div>
      
      {reply.replies && reply.replies.map(subReply => (
        <ReplyItem key={subReply.id} reply={subReply} depth={depth + 1} />
      ))}
    </div>
  );
}
