import React from 'react';
import Logo from './Logo';
import styles from './Header.module.css';
import InstallPwaButton from './InstallPwaButton';

const Header: React.FC = () => {
  return (
    <header className={styles.pageHeader}>
      {/* Ornamento topo */}
      <div className={styles.topOrnament}>
        <div className={styles.ornamentLine} />
        <span className={styles.ornamentSymbol}>✦</span>
        <div className={styles.ornamentLine} />
      </div>

      {/* Barra de navegação */}
      <nav className={styles.navbar} aria-label="Navegação principal">
        <div className={styles.navLinks}>
          {/* Menu esquerdo agora vazio conforme solicitado */}
        </div>

        <div className={styles.navActions} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <InstallPwaButton />
          <a href="/" className={styles.navLink}>Início</a>
          <a href="/login" className={styles.btnSecondary}>Entrar</a>
          <a href="/cadastro" className={styles.btnPrimary}>Começar</a>
        </div>
      </nav>

      {/* Hero do cabeçalho */}
      <div className={styles.heroContent}>
        {/* Colunas decorativas esquerda */}
        <div className={`${styles.columnsDeco} ${styles.columnsLeft}`} aria-hidden="true">
          <ColumnSVG height={90} opacity={0.18} />
          <ColumnSVG height={70} opacity={0.13} />
        </div>

        {/* Logo central */}
        <div className={styles.logoWrapper}>
          <Logo size="lg" variant="icon" className={styles.logoIcon} />
          <div className={styles.siteName}>ACRÓPOLE</div>
          <div className={styles.siteTagline}>Plataforma de Estudos &amp; Conhecimento</div>
          <div className={styles.docTitle}>Templo do Saber · 2025 – 2026</div>
        </div>

        {/* Colunas decorativas direita */}
        <div className={`${styles.columnsDeco} ${styles.columnsRight}`} aria-hidden="true">
          <ColumnSVG height={70} opacity={0.13} />
          <ColumnSVG height={90} opacity={0.18} />
        </div>
      </div>

      {/* Divisor dourado inferior */}
      <div className={styles.bottomDivider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerGem}>◆</span>
        <div className={styles.dividerLine} />
      </div>
    </header>
  );
};

/* Coluna dórica inline para decoração */
const ColumnSVG: React.FC<{ height?: number; opacity?: number }> = ({
  height = 80,
  opacity = 0.15,
}) => {
  const w = Math.round(height * 0.55);
  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      {/* base */}
      <rect x={w * 0.05} y={height - 6}  width={w * 0.9} height={3} rx="0.5" fill="#5C4A2A" />
      <rect x={w * 0.12} y={height - 10} width={w * 0.76} height={4} rx="0.5" fill="#6B5742" />
      {/* fuste */}
      <path
        d={`M${w*0.28} ${height-10} Q${w*0.22} ${height*0.55} ${w*0.25} ${height*0.28} L${w*0.75} ${height*0.28} Q${w*0.78} ${height*0.55} ${w*0.72} ${height-10}Z`}
        fill="#8B7355"
      />
      {/* caneluras */}
      <line x1={w*0.42} y1={height*0.28} x2={w*0.40} y2={height-10} stroke="rgba(26,18,8,0.15)" strokeWidth="1"/>
      <line x1={w*0.55} y1={height*0.28} x2={w*0.55} y2={height-10} stroke="rgba(26,18,8,0.15)" strokeWidth="1"/>
      {/* capitel */}
      <ellipse cx={w*0.5} cy={height*0.28} rx={w*0.3} ry={height*0.04} fill="#5C4A2A"/>
      {/* ábaco */}
      <rect x={w*0.1} y={height*0.18} width={w*0.8} height={height*0.09} rx="0.5" fill="#4A3A20"/>
      {/* friso */}
      <rect x={w*0.0} y={height*0.08} width={w} height={height*0.1} rx="0.5" fill="#5C4A2A"/>
      <rect x={w*0.0} y={height*0.08} width={w} height="2" fill="#C9A84C" opacity="0.5"/>
    </svg>
  );
};

export default Header;
