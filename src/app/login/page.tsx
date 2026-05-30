'use client';

import React, { useActionState } from 'react';
import Logo from '@/components/Logo';
import styles from './auth.module.css';
import { signIn } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <div className={styles.authPage}>
      {/* Painel decorativo esquerdo */}
      <div className={styles.authPanel} aria-hidden="true">
        <div className={styles.panelContent}>
          <Logo size="lg" variant="icon" className={styles.panelIcon} />
          <h2 className={styles.panelTitle}>Acrópole</h2>
          <p className={styles.panelQuote}>
            &ldquo;A educação é a melhor provisão para a jornada em direção à velhice.&rdquo;
          </p>
          <p className={styles.panelQuoteAuthor}>— Aristóteles</p>
          <div className={styles.panelFeatures}>
            {['Biblioteca de PDFs inteligente', 'Flashcards com revisão espaçada', 'Tutor IA socrático', 'Mapas mentais colaborativos'].map((f, i) => (
              <div key={i} className={styles.panelFeature}>
                <span className={styles.panelFeatureIcon}>✦</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.panelColumns} aria-hidden="true">
          {[80, 64, 64, 80].map((h, i) => (
            <MiniColumn key={i} height={h} />
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className={styles.authFormWrapper}>
        <div className={styles.authFormCard}>
          <div className={styles.formHeader}>
            <Logo size="sm" variant="full" />
          </div>

          <h1 className={styles.formTitle}>Bem-vindo de volta</h1>
          <p className={styles.formSubtitle}>Entre na sua conta para continuar estudando</p>

          {state?.error && <div className={styles.formError} role="alert">{state.error}</div>}

          <form action={action} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="login-email" className={styles.label}>E-mail</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className={styles.input}
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
              {state?.fieldErrors?.email && <span style={{ color: 'var(--terra)', fontSize: '12px' }}>{state.fieldErrors.email}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="login-senha" className={styles.label}>Senha</label>
                <a href="/recuperar-senha" className={styles.forgotLink}>Esqueceu?</a>
              </div>
              <input
                id="login-senha"
                name="senha"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              {state?.fieldErrors?.senha && <span style={{ color: 'var(--terra)', fontSize: '12px' }}>{state.fieldErrors.senha}</span>}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={pending}
              id="btn-entrar"
            >
              {pending ? <span className={styles.spinner} /> : null}
              {pending ? 'Entrando…' : 'Entrar no Painel →'}
            </button>
          </form>

          <div className={styles.divider}><span>ou</span></div>

          <p className={styles.switchText}>
            Ainda não tem conta?{' '}
            <a href="/cadastro" className={styles.switchLink}>Cadastre-se gratuitamente</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const MiniColumn: React.FC<{ height: number }> = ({ height }) => (
  <svg width={Math.round(height * 0.45)} height={height} viewBox={`0 0 ${Math.round(height * 0.45)} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.2 }}>
    <rect x="10%" y={height - 8} width="80%" height="4" rx="0.5" fill="#5C4A2A"/>
    <rect x="18%" y={height - 14} width="64%" height="6" rx="0.5" fill="#6B5742"/>
    <path d={`M28% ${height-14} Q24% 55% 26% 25% L74% 25% Q76% 55% 72% ${height-14}Z`} fill="#8B7355"/>
    <ellipse cx="50%" cy="25%" rx="28%" ry="6%" fill="#5C4A2A"/>
    <rect x="8%" y="12%" width="84%" height="12%" rx="0.5" fill="#4A3A20"/>
    <rect x="0%" y="2%" width="100%" height="10%" rx="0.5" fill="#5C4A2A"/>
  </svg>
);
