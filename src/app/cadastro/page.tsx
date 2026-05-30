'use client';

import React, { useActionState, useState } from 'react';
import Logo from '@/components/Logo';
import styles from '../login/auth.module.css';
import { signUp } from '@/app/actions/auth';

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signUp, null);
  const [senha, setSenha] = useState(''); // Only keeping state for strength indicator

  return (
    <div className={styles.authPage}>
      {/* Painel decorativo */}
      <div className={styles.authPanel} aria-hidden="true">
        <div className={styles.panelContent}>
          <Logo size="lg" variant="icon" className={styles.panelIcon} />
          <h2 className={styles.panelTitle}>Acrópole</h2>
          <p className={styles.panelQuote}>
            &ldquo;Educação não é o enchimento de um balde, mas o acender de uma chama.&rdquo;
          </p>
          <p className={styles.panelQuoteAuthor}>— William Butler Yeats</p>
          <div className={styles.panelFeatures}>
            {['Acesso gratuito durante a fundação', 'Sem cartão de crédito necessário', 'Suporte via comunidade', 'Cancele quando quiser'].map((f, i) => (
              <div key={i} className={styles.panelFeature}>
                <span className={styles.panelFeatureIcon}>✦</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className={styles.authFormWrapper}>
        <div className={styles.authFormCard}>
          <div className={styles.formHeader}>
            <Logo size="sm" variant="full" />
          </div>

          <h1 className={styles.formTitle}>Crie sua conta</h1>
          <p className={styles.formSubtitle}>Entre no templo do saber. É gratuito.</p>

          {state?.error && <div className={styles.formError} role="alert">{state.error}</div>}

          <form action={action} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="cadastro-nome" className={styles.label}>Nome completo</label>
              <input
                id="cadastro-nome"
                name="nome"
                type="text"
                className={styles.input}
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
              {state?.fieldErrors?.nome && <span style={{ color: 'var(--terra)', fontSize: '12px' }}>{state.fieldErrors.nome}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cadastro-email" className={styles.label}>E-mail</label>
              <input
                id="cadastro-email"
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
              <label htmlFor="cadastro-senha" className={styles.label}>Senha <span className={styles.labelHint}>(mín. 8 caracteres)</span></label>
              <input
                id="cadastro-senha"
                name="senha"
                type="password"
                className={styles.input}
                placeholder="Escolha uma senha forte"
                autoComplete="new-password"
                required
                minLength={8}
                onChange={(e) => setSenha(e.target.value)}
              />
              {state?.fieldErrors?.senha && <span style={{ color: 'var(--terra)', fontSize: '12px' }}>{state.fieldErrors.senha}</span>}
              {/* Barra de força de senha */}
              {senha.length > 0 && (
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${Math.min(100, (senha.length / 12) * 100)}%`,
                      background: senha.length < 8 ? 'var(--terra)' : senha.length < 12 ? 'var(--gold)' : 'var(--laurel)',
                    }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={pending}
              id="btn-cadastrar"
            >
              {pending ? <span className={styles.spinner} /> : null}
              {pending ? 'Criando conta…' : 'Criar conta gratuitamente →'}
            </button>
          </form>

          <div className={styles.terms}>
            Ao se cadastrar, você concorda com os{' '}
            <a href="/termos" className={styles.switchLink}>Termos de Uso</a>{' '}
            e{' '}
            <a href="/privacidade" className={styles.switchLink}>Política de Privacidade</a>.
          </div>

          <div className={styles.divider}><span>ou</span></div>

          <p className={styles.switchText}>
            Já tem uma conta?{' '}
            <a href="/login" className={styles.switchLink}>Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
