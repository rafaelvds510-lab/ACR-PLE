import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const IconSVG: React.FC<{ icon: number }> = ({ icon }) => (
  <svg
    width={icon}
    height={icon}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Acrópole — Ícone com coluna dórica e coruja de Atena"
  >
    {/* ── FOLHAS DE LOUROS (base) ── */}
    {/* Folhas esquerda */}
    <ellipse cx="14" cy="50" rx="7" ry="3.5" fill="#4A6741" transform="rotate(-30 14 50)" opacity="0.9"/>
    <ellipse cx="10" cy="44" rx="6" ry="3" fill="#4A6741" transform="rotate(-45 10 44)" opacity="0.8"/>
    <ellipse cx="8"  cy="37" rx="5" ry="2.5" fill="#4A6741" transform="rotate(-55 8 37)" opacity="0.7"/>
    {/* Folhas direita */}
    <ellipse cx="50" cy="50" rx="7" ry="3.5" fill="#4A6741" transform="rotate(30 50 50)" opacity="0.9"/>
    <ellipse cx="54" cy="44" rx="6" ry="3" fill="#4A6741" transform="rotate(45 54 44)" opacity="0.8"/>
    <ellipse cx="56" cy="37" rx="5" ry="2.5" fill="#4A6741" transform="rotate(55 56 37)" opacity="0.7"/>
    {/* Hastes dos louros */}
    <path d="M16 52 Q24 42 32 38" stroke="#4A6741" strokeWidth="1.2" fill="none" opacity="0.6"/>
    <path d="M48 52 Q40 42 32 38" stroke="#4A6741" strokeWidth="1.2" fill="none" opacity="0.6"/>

    {/* ── COLUNA DÓRICA ── */}
    {/* Estereóbata (base tripla) */}
    <rect x="12" y="57" width="40" height="3" rx="0.5" fill="#5C4A2A"/>
    <rect x="15" y="54" width="34" height="3" rx="0.5" fill="#6B5742"/>
    <rect x="18" y="51" width="28" height="3" rx="0.5" fill="#7A6450"/>
    {/* Fuste da coluna com entasis (curvatura) */}
    <path
      d="M24 51 Q22 40 23 32 Q22 24 24 18 L40 18 Q42 24 41 32 Q42 40 40 51 Z"
      fill="#8B7355"
    />
    {/* Caneluras verticais (fluted) */}
    <line x1="27" y1="18" x2="26" y2="51" stroke="rgba(26,18,8,0.12)" strokeWidth="1"/>
    <line x1="30" y1="18" x2="30" y2="51" stroke="rgba(26,18,8,0.12)" strokeWidth="1"/>
    <line x1="33" y1="18" x2="33" y2="51" stroke="rgba(26,18,8,0.12)" strokeWidth="1"/>
    <line x1="36" y1="18" x2="37" y2="51" stroke="rgba(26,18,8,0.12)" strokeWidth="1"/>
    {/* Colar (hypotrachelion) */}
    <rect x="22" y="20" width="20" height="2" fill="#7A6450"/>
    {/* Capitel Dórico — Equino */}
    <ellipse cx="32" cy="18" rx="12" ry="3" fill="#5C4A2A"/>
    {/* Ábaco (topo do capitel) */}
    <rect x="18" y="12" width="28" height="5" rx="0.5" fill="#4A3A20"/>
    {/* Friso (arquitrave) */}
    <rect x="14" y="7" width="36" height="5" rx="0.5" fill="#5C4A2A"/>
    {/* Friso dourado */}
    <rect x="14" y="7" width="36" height="1" fill="#C9A84C" opacity="0.6"/>

    {/* ── CORUJA DE ATENA (topo) ── */}
    {/* Corpo */}
    <ellipse cx="32" cy="4" rx="6" ry="5" fill="#C9A84C"/>
    {/* Orelhas / tufos */}
    <polygon points="27,1 29,4 25,4" fill="#A07C28"/>
    <polygon points="37,1 35,4 39,4" fill="#A07C28"/>
    {/* Olhos */}
    <circle cx="29.5" cy="4.5" r="2"   fill="#1A1208"/>
    <circle cx="34.5" cy="4.5" r="2"   fill="#1A1208"/>
    <circle cx="30"   cy="4"   r="0.8" fill="#C9A84C"/>
    <circle cx="35"   cy="4"   r="0.8" fill="#C9A84C"/>
    {/* Bico */}
    <polygon points="32,5.5 30.5,7 33.5,7" fill="#A07C28"/>
    {/* Asas */}
    <path d="M26 5 Q22 7 23 10 Q27 8 28 6Z" fill="#A07C28" opacity="0.8"/>
    <path d="M38 5 Q42 7 41 10 Q37 8 36 6Z" fill="#A07C28" opacity="0.8"/>
  </svg>
);

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const dimensions = {
    sm: { icon: 32, fontSize: '14px', gap: '8px' },
    md: { icon: 48, fontSize: '20px', gap: '12px' },
    lg: { icon: 64, fontSize: '28px', gap: '16px' },
  };

  const { icon, fontSize, gap } = dimensions[size];

  if (variant === 'icon') {
    return (
      <div className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <IconSVG icon={icon} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
      }}
    >
      <IconSVG icon={icon} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-cinzel-decorative), serif',
            fontSize,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          ACRÓPOLE
        </span>
        {size !== 'sm' && (
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '10px',
              fontWeight: 500,
              color: 'var(--stone)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              lineHeight: 1.4,
              marginTop: '3px',
            }}
          >
            Plataforma de Estudos
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
