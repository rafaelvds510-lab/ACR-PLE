'use client';

import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { 
  Play, 
  RotateCcw, 
  RotateCw,
  Zap,
  BookOpen,
  MessageSquare,
  Tag,
  Link as LinkIcon
} from 'lucide-react';
import styles from './videoaulas.module.css';

interface VideoNote {
  id?: string;
  timestamp: number;
  content: string;
}

export default function VideoaulasClient() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Extrair ID do vídeo do YouTube
  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAssistir = () => {
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
    } else {
      alert('URL do YouTube inválida');
    }
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    const savedPos = localStorage.getItem(`video-pos-${videoId}`);
    if (savedPos) event.target.seekTo(parseFloat(savedPos));
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (videoId) localStorage.setItem(`video-pos-${videoId}`, event.target.getCurrentTime().toString());
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? h : null, m, s].filter(x => x !== null).map(x => x!.toString().padStart(2, '0')).join(':');
  };

  const handleAddNote = () => {
    if (!player || !currentNote.trim()) return;
    const timestamp = Math.floor(player.getCurrentTime());
    const newNote: VideoNote = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      content: currentNote
    };
    setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
    setCurrentNote('');
  };

  const seekTo = (seconds: number) => {
    if (player) {
      player.seekTo(seconds);
      player.playVideo();
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (player) player.setPlaybackRate(speed);
  };

  const skip = (seconds: number) => {
    if (player) player.seekTo(player.getCurrentTime() + seconds);
  };

  const handleGenerateFlashcards = async () => {
    if (notes.length === 0) {
      alert('Adicione algumas anotações primeiro!');
      return;
    }
    alert('Gerando Flashcards via IA...');
  };

  return (
    <div className={styles.container}>
      {/* Header Reorganizado */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.inputGroup} style={{ flex: 1.5 }}>
            <label className={styles.headerLabel}><BookOpen size={12} /> TÍTULO DA AULA</label>
            <input 
              className={styles.headerInput} 
              placeholder="Ex: Fundamentos de React"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className={styles.inputGroup} style={{ flex: 2 }}>
            <label className={styles.headerLabel}><LinkIcon size={12} /> LINK DO YOUTUBE</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                className={styles.headerInput}
                placeholder="Cole o link aqui..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAssistir()}
              />
              <button className={styles.assistirBtn} onClick={handleAssistir}>
                <Play size={16} fill="currentColor" /> Assistir
              </button>
            </div>
          </div>
        </div>

        <div className={styles.headerBottom}>
          <div className={styles.inputGroup} style={{ maxWidth: '400px' }}>
            <label className={styles.headerLabel}><Tag size={12} /> TEMA (CATEGORIA DA BIBLIOTECA)</label>
            <input 
              className={styles.headerInput} 
              placeholder="Ex: Desenvolvimento, Finanças..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <main className={styles.main}>
        {/* Lado Esquerdo: Player */}
        <section className={styles.playerSection}>
          <div className={styles.playerWrapper}>
            {videoId ? (
              <YouTube
                videoId={videoId}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: { autoplay: 1, modestbranding: 1, rel: 0 },
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>🎥</div>
                <p>Insira a URL do vídeo acima para começar</p>
              </div>
            )}
          </div>

          {/* Controles Customizados */}
          {videoId && (
            <div className={styles.videoControls}>
              <button className={styles.controlBtn} onClick={() => skip(-10)} title="Voltar 10s">
                <RotateCcw size={20} />
              </button>
              <button className={styles.controlBtn} onClick={() => skip(10)} title="Avançar 10s">
                <RotateCw size={20} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.05em' }}>VELOCIDADE</span>
                <select 
                  className={styles.speedSelect}
                  value={playbackSpeed}
                  onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3].map(s => (
                    <option key={s} value={s}>{s}x</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Lado Direito: Anotações (Aumentado) */}
        <aside className={styles.sidePanel}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitle}>
              <MessageSquare size={18} />
              Anotações de Estudo
            </div>
          </div>

          <div className={styles.scrollArea}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} style={{ color: '#666' }}>NOTAS DA AULA</label>
              <textarea 
                className={styles.textarea}
                placeholder="Escreva seus insights aqui..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <button className={styles.saveAIBtn} onClick={handleGenerateFlashcards} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                <Zap size={14} fill="currentColor" /> Salvar (Cards Automáticos)
              </button>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 10, textAlign: 'center' }}>
                Dica: Pressione <b>Enter</b> para salvar com o tempo atual.
              </p>
            </div>

            {/* Lista de Notas Salvas */}
            {notes.length > 0 && (
              <div className={styles.notesList}>
                <div className={styles.fieldLabel} style={{ marginBottom: 12 }}>LINHA DO TEMPO</div>
                {notes.map((note) => (
                  <div key={note.id} className={styles.noteItem} onClick={() => seekTo(note.timestamp)}>
                    <span className={styles.noteTime}>{formatTime(note.timestamp)}</span>
                    <p className={styles.noteText}>{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
