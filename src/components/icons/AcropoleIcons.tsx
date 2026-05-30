import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

/* ── Coruja de Atena — IA / Tutor / Sabedoria ── */
export const IconOwl: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Coruja de Atena">
    <ellipse cx="12" cy="14" rx="7" ry="8" fill={color} opacity="0.15"/>
    <ellipse cx="12" cy="14" rx="7" ry="8" stroke={color} strokeWidth="1.5" fill="none"/>
    <polygon points="8,7 9.5,11 6,11" fill={color}/>
    <polygon points="16,7 14.5,11 18,11" fill={color}/>
    <circle cx="9.5" cy="13" r="2.5" fill={color} opacity="0.2"/>
    <circle cx="9.5" cy="13" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="14.5" cy="13" r="2.5" fill={color} opacity="0.2"/>
    <circle cx="14.5" cy="13" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="9.5" cy="13" r="1" fill={color}/>
    <circle cx="14.5" cy="13" r="1" fill={color}/>
    <polygon points="12,15 10.5,17 13.5,17" fill={color}/>
    <path d="M8 18 Q12 21 16 18" stroke={color} strokeWidth="1.2" fill="none" opacity="0.6"/>
  </svg>
);

/* ── Folha de Louros — Conquistas / Progresso ── */
export const IconLaurel: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Folha de louros">
    <path d="M12 20 Q8 14 7 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M12 20 Q16 14 17 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="8"  cy="11" rx="3" ry="1.5" fill={color} transform="rotate(-40 8 11)" opacity="0.85"/>
    <ellipse cx="7"  cy="8"  rx="2.5" ry="1.2" fill={color} transform="rotate(-55 7 8)" opacity="0.7"/>
    <ellipse cx="16" cy="11" rx="3" ry="1.5" fill={color} transform="rotate(40 16 11)" opacity="0.85"/>
    <ellipse cx="17" cy="8"  rx="2.5" ry="1.2" fill={color} transform="rotate(55 17 8)" opacity="0.7"/>
    <path d="M10 20 Q12 22 14 20" stroke={color} strokeWidth="1.2" fill="none"/>
  </svg>
);

/* ── Coluna Dórica — Fases / Estrutura ── */
export const IconColumn: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Coluna dórica">
    <rect x="3"  y="21" width="18" height="1.5" rx="0.5" fill={color}/>
    <rect x="5"  y="19.5" width="14" height="1.5" rx="0.5" fill={color} opacity="0.8"/>
    <path d="M8 19.5 Q7.5 14 8 9 Q7.5 7 8 5 L16 5 Q16.5 7 16 9 Q16.5 14 16 19.5Z" fill={color} opacity="0.2"/>
    <path d="M8 19.5 Q7.5 14 8 9 Q7.5 7 8 5 L16 5 Q16.5 7 16 9 Q16.5 14 16 19.5Z" stroke={color} strokeWidth="1.2" fill="none"/>
    <line x1="11" y1="5" x2="11" y2="19.5" stroke={color} strokeWidth="0.6" opacity="0.4"/>
    <line x1="13" y1="5" x2="13" y2="19.5" stroke={color} strokeWidth="0.6" opacity="0.4"/>
    <ellipse cx="12" cy="5" rx="5" ry="1.5" fill={color} opacity="0.6"/>
    <rect x="5" y="2.5" width="14" height="2.5" rx="0.5" fill={color} opacity="0.8"/>
  </svg>
);

/* ── Pergaminho — Biblioteca / PDFs ── */
export const IconScroll: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Pergaminho">
    <path d="M6 4 Q6 2 8 2 Q10 2 10 4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M14 4 Q14 2 16 2 Q18 2 18 4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <rect x="6" y="4" width="12" height="14" rx="1" fill={color} opacity="0.1"/>
    <rect x="6" y="4" width="12" height="14" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M6 18 Q6 20 8 20 Q10 20 10 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M14 18 Q14 20 16 20 Q18 20 18 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <line x1="9"  y1="8.5"  x2="15" y2="8.5"  stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <line x1="9"  y1="11"   x2="15" y2="11"   stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <line x1="9"  y1="13.5" x2="13" y2="13.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

/* ── Livro — Sugestões de Leitura ── */
export const IconBook: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Livro">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Lira — Ferramentas Avançadas / Arte ── */
export const IconLyre: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Lira">
    <path d="M7 6 Q5 10 5 14 Q5 18 8 20 Q10 21 12 21 Q14 21 16 20 Q19 18 19 14 Q19 10 17 6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M7 6 Q8 3 12 2 Q16 3 17 6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <line x1="7" y1="6" x2="17" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="6" x2="10" y2="19" stroke={color} strokeWidth="0.8" opacity="0.5" strokeLinecap="round"/>
    <line x1="12" y1="6" x2="12" y2="20" stroke={color} strokeWidth="0.8" opacity="0.5" strokeLinecap="round"/>
    <line x1="14" y1="6" x2="14" y2="19" stroke={color} strokeWidth="0.8" opacity="0.5" strokeLinecap="round"/>
  </svg>
);

/* ── Tocha — Missão / Iluminação ── */
export const IconFlame: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Tocha">
    <rect x="10.5" y="16" width="3" height="6" rx="1" fill={color} opacity="0.6"/>
    <rect x="9" y="14" width="6" height="3" rx="1" fill={color} opacity="0.8"/>
    <path d="M12 14 Q8 10 9 6 Q10 3 12 2 Q14 3 15 6 Q16 10 12 14Z" fill={color} opacity="0.25"/>
    <path d="M12 14 Q8 10 9 6 Q10 3 12 2 Q14 3 15 6 Q16 10 12 14Z" stroke={color} strokeWidth="1.2" fill="none"/>
    <path d="M12 13 Q10 10 11 7 Q12 5 13 7 Q14 10 12 13Z" fill={color} opacity="0.5"/>
  </svg>
);

/* ── Templo — Início / Ágora ── */
export const IconTemple: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Templo">
    <path d="M3 10L12 3L21 10" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <line x1="6" y1="10" x2="6" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="10" x2="10" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="10" x2="14" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18" y1="10" x2="18" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="3" y1="19" x2="21" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2" y1="21" x2="22" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Mapa — Mapas Mentais ── */
export const IconMap: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Mapa">
    <path d="M3 6L9 3L15 6L21 3V18L15 21L9 18L3 21V6Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 3V18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 6V21" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Grupo / Debates — Comunidade ── */
export const IconUsers: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Usuários">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Engrenagem — Configurações ── */
export const IconSettings: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Configurações">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15A1.65 1.65 0 0 0 21 16.65V17.35A1.65 1.65 0 0 0 19.4 19H18.6A1.65 1.65 0 0 1 16.95 20.65L17.3 21.25A1.65 1.65 0 0 0 16.5 23H15.5A1.65 1.65 0 0 0 14.1 21.65L13.7 21.05A1.65 1.65 0 0 1 12 21.05L11.6 21.65A1.65 1.65 0 0 0 10.2 23H9.2A1.65 1.65 0 0 0 8.4 21.25L8.75 20.65A1.65 1.65 0 0 1 7.1 19H6.3A1.65 1.65 0 0 0 4.7 17.35V16.65A1.65 1.65 0 0 0 6.3 15H7.1A1.65 1.65 0 0 1 8.75 13.35L8.4 12.75A1.65 1.65 0 0 0 9.2 11H10.2A1.65 1.65 0 0 0 11.6 12.35L12 12.95A1.65 1.65 0 0 1 13.7 12.95L14.1 12.35A1.65 1.65 0 0 0 15.5 11H16.5A1.65 1.65 0 0 0 17.3 12.75L16.95 13.35A1.65 1.65 0 0 1 18.6 15H19.4Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Porta de Saída — Logout ── */
export const IconLogout: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Sair">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Calendário — Agenda ── */
export const IconCalendar: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Calendário">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Menu Hamburger ── */
export const IconMenu: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Menu">
    <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Pena / Editor de Escrita ── */
export const IconPen: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Editor de Escrita">
    <path d="M12 20H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Vídeo / Aula ── */
export const IconVideo: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Vídeo Aula">
    <rect x="2" y="3" width="20" height="18" rx="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8l6 4-6 4V8z" fill={color} opacity="0.3"/>
    <path d="M10 8l6 4-6 4V8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



/* ── Balança — Justiça / Dialética / Debate ── */
export const IconScales: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Balança de Debate">
    <path d="M12 3V21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 7L4 10M12 7L20 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 10L2 16C2 17 3 18 4 18C5 18 6 17 6 16L4 10Z" fill={color} opacity="0.2"/>
    <path d="M4 10L2 16C2 17 3 18 4 18C5 18 6 17 6 16L4 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M20 10L18 16C18 17 19 18 20 18C21 18 22 17 22 16L20 10Z" fill={color} opacity="0.2"/>
    <path d="M20 10L18 16C18 17 19 18 20 18C21 18 22 17 22 16L20 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 21H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Espada — Argumentação / Ataque ── */
export const IconSword: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Espada de Retórica">
    <path d="M14.5 17.5L3 6V3H6L17.5 14.5M14.5 17.5L13 19L15 21L21 15L19 13L17.5 14.5M14.5 17.5L17.5 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 19L21 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

/* ── Escudo — Defesa / Lógica ── */
export const IconShield: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Escudo de Lógica">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill={color} opacity="0.15"/>
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

/* ── Citação — Fontes Bibliográficas ── */
export const IconQuote: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Citação">
    <path d="M8 17H5V13H8V17ZM8 17C8 18.1046 7.10457 19 6 19C4.89543 19 4 18.1046 4 17L4 12C4 10.3431 5.34315 9 7 9H8V11H7C6.44772 11 6 11.4477 6 12V13H8V17Z" fill={color}/>
    <path d="M18 17H15V13H18V17ZM18 17C18 18.1046 17.1046 19 16 19C14.8954 19 14 18.1046 14 17L14 12C14 10.3431 15.3431 9 17 9H18V11H17C16.4477 11 16 11.4477 16 12V13H18V17Z" fill={color}/>
  </svg>
);

/* ── Chat — Fórum / Discussão ── */
export const IconChat: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Fórum">
    <path d="M21 15C21 16.1046 20.1046 17 19 17H7L3 21V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15Z" fill={color} opacity="0.1"/>
    <path d="M21 15C21 16.1046 20.1046 17 19 17H7L3 21V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="7" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <line x1="7" y1="12" x2="13" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

/* ── Sino — Notificações ── */
export const IconBell: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Sino de Notificação">
    <path d="M18 8A6 6 0 0 0 6 8C6 12 3 14 3 14H21C21 14 18 12 18 8Z" fill={color} opacity="0.15"/>
    <path d="M18 8A6 6 0 0 0 6 8C6 12 3 14 3 14H21C21 14 18 12 18 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Carta — E-mail ── */
export const IconMail: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="E-mail">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Gráfico — Progresso ── */
export const IconChartBar: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Gráfico de Barras">
    <path d="M12 20V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 20V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 20V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

