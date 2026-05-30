'use client';

import React from 'react';
import Logo from '@/components/Logo';
import styles from '../login/auth.module.css'; // Reusing auth layout styles

export default function VerificarEmailPage() {
  return (
    <div className={styles.authPage}>
      {/* Painel decorativo esquerdo */}
      <div className={styles.authPanel} aria-hidden="true">
        <div className={styles.panelContent}>
          <Logo size="lg" variant="icon" className={styles.panelIcon} />
          <h2 className={styles.panelTitle}>Acrópole</h2>
          <p className={styles.panelQuote}>
            &ldquo;Sábio é aquele que conhece os limites da própria ignorância.&rdquo;
          </p>
          <p className={styles.panelQuoteAuthor}>— Sócrates</p>
        </div>
      </div>

      {/* Container principal */}
      <div className={styles.authFormWrapper}>
        <div className={styles.authFormCard} style={{ textAlign: 'center' }}>
          <div className={styles.formHeader} style={{ justifyContent: 'center', display: 'flex' }}>
            <Logo size="sm" variant="full" />
          </div>

          <h1 className={styles.formTitle}>Verifique seu E-mail</h1>
          <p className={styles.formSubtitle} style={{ marginBottom: '32px' }}>
            Enviamos um link de confirmação para a sua caixa de entrada.
            Por favor, clique nele para ativar sua conta e acessar a plataforma.
          </p>

          <div style={{
            background: 'var(--marble-light)',
            border: '1px solid var(--marble-deep)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: 'var(--stone)' }}>
              Se não encontrar o e-mail, verifique sua pasta de spam ou lixo eletrônico.
            </p>
          </div>

          <a 
            href="/login" 
            className={styles.submitBtn} 
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Voltar para o Login
          </a>
        </div>
      </div>
    </div>
  );
}
