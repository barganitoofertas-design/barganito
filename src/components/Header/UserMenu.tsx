'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { handleLogout } from '@/lib/actions/logout';
import styles from './Header.module.css';

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button 
        className={styles.userAvatar} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title={user.name || 'Conta'}
      >
        <span className={styles.avatarText}>{getInitials(user.name)}</span>
        <div className={`${styles.statusDot} ${isOpen ? styles.activeDot : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.premiumDropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.headerAvatar}>{getInitials(user.name)}</div>
            <div className={styles.headerInfo}>
              <p className={styles.headerName}>{user.name || 'Usuário'}</p>
              <p className={styles.headerEmail}>{user.email}</p>
            </div>
          </div>
          
          <div className={styles.menuGrid}>
            <Link href="/profile" className={styles.menuLink} onClick={() => setIsOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Dados da Conta</span>
            </Link>
            
            <Link href="/settings" className={styles.menuLink} onClick={() => setIsOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Meus Alertas</span>
            </Link>

            {user.role === 'admin' && (
              <Link href="/admin/promotions" className={styles.menuLinkAdmin} onClick={() => setIsOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><path d="m9.07 10.1 4.41 4.41"/><path d="M9 14.5l6-6"/></svg>
                <span>Administração</span>
              </Link>
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <form action={handleLogout} style={{ width: '100%' }}>
                <button type="submit" className={styles.premiumLogoutBtn}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  <span>Sair da Conta</span>
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
