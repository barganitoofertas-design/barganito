'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { markAllAsRead, markAsRead } from '@/lib/actions/notifications';
import { formatDateTime } from '@/lib/utils';
import styles from './Notifications.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

interface Props {
  notifications: Notification[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export default function NotificationsClient({ notifications, total, currentPage, totalPages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const handleMarkAsRead = (id: string) => {
    setLocalRead(prev => new Set(prev).add(id));
    startTransition(async () => {
      await markAsRead(id);
      router.refresh();
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead();
      router.refresh();
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead && !localRead.has(n.id)).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return '🔔';
      case 'promo': return '🏷️';
      case 'system': return '⚙️';
      default: return '📩';
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notificações</h1>
          <p className={styles.subtitle}>
            {total} notificações no total{unreadCount > 0 ? ` · ${unreadCount} não lidas` : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className={styles.markAllBtn}
            onClick={handleMarkAllAsRead}
            disabled={isPending}
          >
            ✅ Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔕</span>
          <p>Nenhuma notificação ainda.</p>
          <p className={styles.emptyHint}>
            Configure seus alertas de preço e você será notificado quando o preço baixar!
          </p>
          <Link href="/settings" className={styles.emptyLink}>
            Configurar Alertas →
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map(notification => {
            const isRead = notification.isRead || localRead.has(notification.id);
            return (
          <div
            key={notification.id}
            className={`${styles.item} ${!isRead ? styles.unread : ''}`}
            onClick={() => {
              if (!isRead) handleMarkAsRead(notification.id);
            }}
            style={{ cursor: !isRead ? 'pointer' : 'default' }}
          >
            <div className={styles.itemIcon}>
              {getTypeIcon(notification.type)}
            </div>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{notification.title}</span>
                {!isRead && <span className={styles.badge}>Novo</span>}
              </div>
              <p className={styles.itemMessage}>{notification.message}</p>
              <div className={styles.itemFooter}>
                <span className={styles.itemDate}>
                  {formatDateTime(notification.createdAt)}
                </span>
                <div className={styles.itemActions}>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className={styles.viewBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRead) handleMarkAsRead(notification.id);
                      }}
                    >
                      Ver oferta →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {currentPage > 1 && (
            <Link href={`/notificacoes?page=${currentPage - 1}`} className={styles.pageBtn}>
              ← Anterior
            </Link>
          )}
          <span className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={`/notificacoes?page=${currentPage + 1}`} className={styles.pageBtn}>
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
