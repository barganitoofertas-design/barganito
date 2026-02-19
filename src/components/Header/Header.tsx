import Link from 'next/link';
import styles from './Header.module.css';
import { auth } from '@/auth';
import SearchInput from './SearchInput';
import UserMenu from './UserMenu';
import NotificationBell from '../Notifications/NotificationBell';

export default async function Header() {
  const session = await auth();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <Link href="/" className={styles.logo}>
          Barganito<span>Ofertas</span>
        </Link>
        
        <SearchInput />

        <nav className={styles.nav}>
          {session ? (
            <>
              <NotificationBell />
              <UserMenu user={session.user as any} />
            </>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/auth/login" className={styles.loginBtn}>Entrar</Link>
              <Link href="/auth/register" className="btn btn-primary">Cadastrar</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
