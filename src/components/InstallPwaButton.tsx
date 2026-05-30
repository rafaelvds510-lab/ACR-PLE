'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPwaButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setPrompt(null);
    }
  };

  // Não exibe nada se já instalado ou se o navegador não suporta
  if (installed || !prompt) return null;

  return (
    <button
      onClick={handleInstall}
      title="Instalar Acrópole como aplicativo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '7px 16px',
        background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)',
        border: '1px solid rgba(201,168,76,0.6)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'var(--font-cinzel), serif',
        fontSize: '12px',
        fontWeight: '600',
        color: '#1A1208',
        letterSpacing: '0.05em',
        boxShadow: '0 2px 8px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(201,168,76,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
      }}
    >
      <DownloadIcon />
      Instalar App
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
