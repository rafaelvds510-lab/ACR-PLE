'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { signOut } from '@/app/actions/auth';
import {
  IconTemple,
  IconScroll,
  IconFlame,
  IconMap,
  IconOwl,
  IconUsers,
  IconSettings,
  IconLogout,
  IconMenu,
  IconCalendar,
  IconPen,
  IconVideo,
  IconScales,
  IconLaurel,
  IconBell,
} from '@/components/icons/AcropoleIcons';
import { GameProvider, useGame } from '@/lib/GameContext';
import SidebarXPCard from '@/components/gamification/SidebarXPCard';
import styles from './layout.module.css';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
  };
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarOpen(false);
    }
  }, [pathname, isSidebarOpen]);

  const navItems = [
    { label: 'A Ágora', path: '/dashboard', icon: <IconTemple size={18} /> },
    { label: 'Agenda', path: '/dashboard/agenda', icon: <IconCalendar size={18} /> },
    { label: 'Biblioteca', path: '/dashboard/biblioteca', icon: <IconScroll size={18} /> },
    { label: 'Escrita', path: '/dashboard/escrita', icon: <IconPen size={18} /> },
    { label: 'Videoaulas', path: '/dashboard/videoaulas', icon: <IconVideo size={18} /> },
    { label: 'Revisão', path: '/dashboard/revisao', icon: <IconFlame size={18} /> },
    { label: 'Mapas Mentais', path: '/dashboard/mapas', icon: <IconMap size={18} /> },
    { label: 'Debates & Fórum', path: '/dashboard/debate', icon: <IconScales size={18} /> },
    { label: 'Conquistas', path: '/dashboard/conquistas', icon: <IconLaurel size={18} /> },
  ];

  return (
    <GameProvider>
    <div className={styles.dashboardLayout}>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Logo size="sm" variant="full" />
        </div>

        <nav className={styles.nav}>
          <div className={styles.navGroupLabel}>Módulos</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}


          <div className={styles.navGroupLabel} style={{ marginTop: '32px' }}>Pessoal</div>
          <Link 
            href="/dashboard/configuracoes"
            className={`${styles.navItem} ${pathname === '/dashboard/configuracoes' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><IconSettings size={18} /></span>
            Configurações
          </Link>
        </nav>

        {/* XP Card — acima do footer */}
        <SidebarXPCardWrapper />

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name || user.email}</div>
              <div className={styles.userRole}>Estudante</div>
            </div>
          </div>
          
          <form action={signOut}>
            <button type="submit" className={styles.logoutBtn}>
              <span className={styles.navIcon}><IconLogout size={18} /></span>
              Sair do Templo
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Mobile Topbar */}
        <header className={styles.mobileTopbar}>
          <Logo size="sm" variant="icon" />
          <button 
            className={styles.menuBtn} 
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <IconMenu size={24} color="var(--stone-dark)" />
          </button>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
    </GameProvider>
  );
}

// Componente filho que consome o contexto
function SidebarXPCardWrapper() {
  const { state } = useGame();
  return <SidebarXPCard state={state} />;
}
