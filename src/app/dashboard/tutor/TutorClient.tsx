'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  createTutorConversation,
  getTutorConversations,
  saveTutorMessage,
  deleteTutorConversation,
} from '@/app/actions/tutor';
import { IconOwl } from '@/components/icons/AcropoleIcons';
import { Send, Plus, Trash2, BookOpen } from 'lucide-react';
import styles from './tutor.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { id: string; title: string; page: number }[];
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function TutorClient() {
  const [history, setHistory] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [level, setLevel] = useState<'layman' | 'intermediate' | 'advanced'>('intermediate');
  const [isSocratic, setIsSocratic] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getTutorConversations();
      setHistory(data);
      if (data.length > 0) {
        setActiveId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    const res = await createTutorConversation('Nova Conversa');
    if (res.success && res.conversation) {
      setHistory(prev => [res.conversation!, ...prev]);
      setActiveId(res.conversation!.id);
      setMessages([]);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setMessages([]); // In production, load from DB here
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Excluir esta conversa permanentemente?')) return;
    const res = await deleteTutorConversation(id);
    if (res.success) {
      const next = history.filter(c => c.id !== id);
      setHistory(next);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
        setMessages([]);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    // If no active conversation, create one first
    let currentId = activeId;
    if (!currentId) {
      const res = await createTutorConversation(input.substring(0, 30) + '...');
      if (res.success && res.conversation) {
        setHistory(prev => [res.conversation!, ...prev]);
        currentId = res.conversation!.id;
        setActiveId(currentId);
      } else return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Persist user message
    saveTutorMessage(currentId!, 'user', currentInput);

    // Update conversation title on first message
    setHistory(prev => prev.map(c =>
      c.id === currentId && c.title === 'Nova Conversa'
        ? { ...c, title: currentInput.substring(0, 28) + (currentInput.length > 28 ? '…' : '') }
        : c
    ));

    try {
      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, history: messages, level, isSocratic }),
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response ?? 'O Tutor não conseguiu responder. Tente novamente.',
      };
      setMessages(prev => [...prev, aiMsg]);
      saveTutorMessage(currentId!, 'assistant', aiMsg.content);
    } catch (err) {
      console.error('Tutor AI Error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className={styles.tutorContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <Plus size={18} /> Nova Conversa
          </button>
        </div>
        <div className={styles.historyList}>
          {loading ? (
            <p style={{ color: 'var(--stone-medium)', padding: '16px', fontSize: 13 }}>Carregando...</p>
          ) : history.length === 0 ? (
            <p style={{ color: 'var(--stone-medium)', padding: '16px', fontSize: 13 }}>
              Nenhuma conversa ainda. Clique em "Nova Conversa".
            </p>
          ) : history.map(conv => (
            <div
              key={conv.id}
              className={`${styles.historyItem} ${activeId === conv.id ? styles.active : ''}`}
              onClick={() => handleSelectConversation(conv.id)}
            >
              <div className={styles.historyText}>
                <span className={styles.historyTitle}>{conv.title}</span>
                <span className={styles.historyMeta}>
                  {new Date(conv.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <button
                className={styles.deleteChatBtn}
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <main className={styles.chatArea}>
        <header className={styles.chatHeader}>
          <div className={styles.tutorIdentity}>
            <IconOwl size={32} color="var(--gold)" />
            <h2 className={styles.tutorName}>Tutor Socrático</h2>
          </div>

          <div className={styles.chatControls}>
            <div className={styles.controlGroup}>
              <span className={styles.label}>Nível</span>
              <div className={styles.levelToggle}>
                {(['layman', 'intermediate', 'advanced'] as const).map(l => (
                  <button
                    key={l}
                    className={`${styles.levelBtn} ${level === l ? styles.active : ''}`}
                    onClick={() => setLevel(l)}
                  >
                    {l === 'layman' ? 'LEIGO' : l === 'intermediate' ? 'INTERM.' : 'AVANÇADO'}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={styles.socraticMode}
              onClick={() => setIsSocratic(!isSocratic)}
              style={{ opacity: isSocratic ? 1 : 0.5 }}
            >
              <IconOwl size={16} color="var(--gold-dark)" />
              <span>MODO SOCRÁTICO</span>
            </div>
          </div>
        </header>

        <div className={styles.messagesList} ref={scrollRef}>
          {!activeId ? (
            <div className={styles.emptyState}>
              <IconOwl size={48} color="var(--gold)" />
              <p>Clique em "Nova Conversa" para iniciar um diálogo socrático.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Saudações, buscador da sabedoria. Sobre qual tema da sua biblioteca deseja dialetizar hoje?</p>
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
              <div className={styles.messageContent}>
                {msg.content}
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div className={styles.citations}>
                  {msg.citations.map(cite => (
                    <div key={cite.id} className={styles.citationTag}>
                      <BookOpen size={12} />
                      {cite.title} (p. {cite.page})
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isThinking && (
            <div className={styles.assistantMessage}>
              <div className={styles.messageContent} style={{ opacity: 0.6, fontStyle: 'italic' }}>
                O mentor está consultando seus pergaminhos...
              </div>
            </div>
          )}
        </div>

        <footer className={styles.inputArea}>
          <div className={styles.quickPrompts}>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => {
                const topic = prompt('Qual tópico você quer estudar do zero?');
                if (topic) {
                  setInput(`Eu me interesso por ${topic}. Crie uma trilha de aprendizado com 3 níveis: Iniciante (os 3 conceitos básicos), Intermediário (os 3 livros fundamentais) e Avançado (as 3 fronteiras de pesquisa atuais no tema).`);
                }
              }}
            >
              🧭 Trilha Autodidata
            </button>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => {
                const concept = prompt('Qual conceito complexo você quer entender?');
                if (concept) {
                  setInput(`Aja como o físico Richard Feynman. Explique o conceito de ${concept} da forma mais simples possível, usando uma analogia com objetos do dia a dia. Assuma que eu não sei nada sobre o assunto.`);
                }
              }}
            >
              🧠 Explicar como Feynman
            </button>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => {
                const theme = prompt('Qual tema você quer dominar?');
                if (theme) {
                  setInput(`Aja como um tutor socrático. Minha meta é entender melhor sobre ${theme}. Para começar, me faça a primeira pergunta fundamental sobre este tema que me obrigue a pensar na sua essência.`);
                }
              }}
            >
              🏛️ Diálogo Socrático
            </button>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => {
                const info = prompt('O que você precisa decorar?');
                if (info) {
                  setInput(`Aja como um especialista em técnicas de memorização. Eu preciso decorar estas informações: ${info}. Crie um mnemônico, uma história ou uma associação visual para me ajudar a fixar este conteúdo.`);
                }
              }}
            >
              🔗 Técnica de Memorização
            </button>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => {
                const topic = prompt('Qual tópico você está estudando agora?');
                if (topic) {
                  setInput(`Estou estudando ${topic}. Aja como um tutor e me faça 3 perguntas para garantir que eu realmente entendi o conceito.`);
                }
              }}
            >
              🏋️ Sessão de Treino
            </button>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => {
                const topic = prompt('Qual tema você quer testar?');
                if (topic) {
                  setInput(`Crie um quiz com 10 perguntas de múltipla escolha sobre ${topic} para eu testar meu conhecimento. Inclua o gabarito no final.`);
                }
              }}
            >
              📝 Teste de Estresse
            </button>
            <button 
              className={styles.quickPromptBtn}
              onClick={() => setInput('Resuma o texto/artigo a seguir em 5 pontos-chave fundamentais:\n\n[Cole seu texto aqui]')}
            >
              📄 Resumir em 5 Pontos
            </button>
          </div>
          <div className={styles.inputContainer}>
            <textarea
              className={styles.textarea}
              placeholder="Digite sua dúvida ou reflexão..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
