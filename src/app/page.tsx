'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import SectionDivider from '@/components/SectionDivider';
import {
  IconOwl,
  IconScroll,
  IconFlame,
  IconLaurel,
  IconLyre,
  IconColumn,
} from '@/components/icons/AcropoleIcons';
import styles from './page.module.css';

export default function Home() {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: <IconScroll size={28} color="var(--gold)" />,
      title: 'Biblioteca & Leitor',
      desc: 'Faça upload de PDFs, leia com zoom e busca de texto, e anote inline com highlights coloridos.',
      badge: 'Core',
      badgeColor: '#185FA5',
    },
    {
      icon: <IconFlame size={28} color="var(--terra-light)" />,
      title: 'Flashcards SRS',
      desc: 'Crie flashcards com rich text e LaTeX. Algoritmo SM-2 adapta os intervalos ao seu ritmo.',
      badge: 'Core',
      badgeColor: '#185FA5',
    },
    {
      icon: <IconLyre size={28} color="var(--azure)" />,
      title: 'Mapas Mentais',
      desc: 'Canvas infinito com zoom e pan. Colabore em tempo real com outros estudantes via WebSockets.',
      badge: 'Advanced',
      badgeColor: '#854F0B',
    },
    {
      icon: <IconOwl size={28} color="var(--laurel)" />,
      title: 'Tutor IA Socrático',
      desc: 'IA contextualizada nos seus PDFs. Modo socrático: ela pergunta para você pensar, não apenas responde.',
      badge: 'AI',
      badgeColor: '#534AB7',
    },
    {
      icon: <IconLaurel size={28} color="var(--gold)" />,
      title: 'Conquistas & Progresso',
      desc: 'Trilha de aprendizado personalizada com metas, recompensas e relatórios de evolução.',
      badge: 'Gamification',
      badgeColor: '#3B6D11',
    },
    {
      icon: <IconColumn size={28} color="var(--stone)" />,
      title: 'Debates & Comunidade',
      desc: 'A Ágora digital: espaço para discussões, debates acadêmicos e troca de material entre estudantes.',
      badge: 'Community',
      badgeColor: '#993C1D',
    },
  ];


  return (
    <>
      <Header />

      <main>
        {/* ── HERO ── */}
        <section className={styles.hero} id="intro">
          <div className={styles.heroInner}>
            <div className={styles.heroTag}>Plataforma de Estudos Premium</div>
            <h1 className={styles.heroTitle}>
              O templo onde o saber<br />
              <span className={styles.heroTitleAccent}>encontra a tecnologia</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Biblioteca inteligente, flashcards adaptativos, mapas mentais colaborativos
              e um tutor com IA socrática — tudo em um ambiente inspirado na sabedoria clássica.
            </p>
            <div className={styles.heroCta}>
              <a href="/cadastro" className={styles.ctaPrimary}>
                Começar gratuitamente
                <span className={styles.ctaArrow}>→</span>
              </a>
              <a href="#features" className={styles.ctaSecondary}>
                Ver funcionalidades
              </a>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <div className={styles.statNum}>5</div>
                <div className={styles.statLabel}>Módulos principais</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <div className={styles.statNum}>IA</div>
                <div className={styles.statLabel}>Tutor socrático</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <div className={styles.statNum}>∞</div>
                <div className={styles.statLabel}>Canvas de mapas</div>
              </div>
            </div>
          </div>

          {/* ornamento decorativo */}
          <div className={styles.heroOrnament} aria-hidden="true">
            <div className={styles.heroOrnamentLine} />
            <span className={styles.heroOrnamentSym}>◆</span>
            <div className={styles.heroOrnamentLine} />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className={styles.featuresSection} id="features">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>O que você encontra</div>
            <h2 className={styles.sectionTitle}>As Colunas da Plataforma</h2>
            <p className={styles.sectionSubtitle}>
              Cada módulo foi projetado para cobrir uma dimensão essencial do estudo profundo.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feat, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feat.icon}</div>
                <div className={styles.featureMeta}>
                  <span
                    className={styles.featureBadge}
                    style={{ color: feat.badgeColor, borderColor: feat.badgeColor, background: `${feat.badgeColor}18` }}
                  >
                    {feat.badge}
                  </span>
                </div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureDesc}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>



        {/* ── CTA FINAL ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaCardOrnament}>✦ ✦ ✦</div>
            <h2 className={styles.ctaCardTitle}>Entre no Templo do Saber</h2>
            <p className={styles.ctaCardSubtitle}>
              Comece sua jornada hoje. Acesso gratuito durante o período de fundação.
            </p>
            <form
              className={styles.ctaForm}
              onSubmit={(e) => { e.preventDefault(); window.location.href = `/cadastro?email=${encodeURIComponent(email)}`; }}
            >
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.ctaInput}
                aria-label="Seu endereço de e-mail"
                required
              />
              <button type="submit" className={styles.ctaBtn}>
                Começar agora →
              </button>
            </form>
            <div className={styles.ctaNote}>
              Sem cartão de crédito · Acesso imediato · Cancele quando quiser
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerOrnament}>✦ ✦ ✦</div>
          <div className={styles.footerText}>Acrópole · Plataforma de Estudos · Roadmap v1.0 · 2025</div>
          <div className={styles.footerQuote}>
            &ldquo;O conhecimento é a única coisa que ninguém pode tirar de você.&rdquo; — Sócrates
          </div>
          <div className={styles.footerLinks}>
            <a href="/login" className={styles.footerLink}>Entrar</a>
            <span className={styles.footerDot}>·</span>
            <a href="/cadastro" className={styles.footerLink}>Cadastrar</a>
          </div>
        </div>
      </footer>
    </>
  );
}
