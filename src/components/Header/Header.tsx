import Link from 'next/link';
import styles from './Header.module.css';
import { auth } from '@/auth';

export default async function Header() {
  const session = await auth();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <Link href="/" className={styles.logo}>
          Barganito<span>Ofertas</span>
        </Link>
        
        <div className={styles.searchBar}>
          <input type="text" placeholder="Buscar promoções..." />
          <button className="btn btn-primary">Buscar</button>
        </div>

        <nav className={styles.nav}>
          {session ? (
            <div className={styles.userMenu}>
              <span>Olá, {session.user?.name || 'Usuário'}</span>
              <Link href="/settings" className="btn btn-primary">Alertas</Link>
            </div>
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
