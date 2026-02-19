'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/actions/notifications';
import { savePushSubscription } from '@/lib/actions/push';
import { formatDateTime, urlBase64ToUint8Array } from '@/lib/utils';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const [list, count] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      setNotifications(list as any[]);
      setUnreadCount(count as number);
      
      // Check push status
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações web push.');
      return;
    }

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error('Chave pública VAPID não configurada.');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await savePushSubscription({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth
          }
        });
        setIsSubscribed(true);
        alert('Notificações ativadas com sucesso!');
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      alert('Erro ao ativar notificações. Verifique se você permitiu o acesso no navegador.');
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    fetchStatus();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchStatus();
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.bellButton} 
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notificações</h3>
            <div className={styles.headerActions}>
              {!isSubscribed && (
                <button 
                  className={styles.subscribeBtn} 
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Ativando...' : '🔔 Ativar Push'}
                </button>
              )}
              {unreadCount > 0 && (
                <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                  Lidas
                </button>
              )}
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔔</div>
                <p>Nenhuma notificação por aqui.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <Link 
                  key={item.id} 
                  href={item.link || '#'} 
                  className={`${styles.notificationItem} ${!item.isRead ? styles.unreadItem : ''}`}
                  onClick={() => {
                    if (!item.isRead) handleMarkAsRead(item.id);
                    setIsOpen(false);
                  }}
                >
                  <div className={styles.iconWrapper}>
                    {item.type === 'alert' ? '🏷️' : item.type === 'promo' ? '🔥' : '⚙️'}
                  </div>
                  <div className={styles.content}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemMessage}>{item.message}</p>
                    <span className={styles.itemTime}>{formatDateTime(item.createdAt)}</span>
                  </div>
                  {!item.isRead && <div className={styles.unreadDot} />}
                </Link>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <Link href="/notificacoes" className={styles.viewAll} onClick={() => setIsOpen(false)}>
              Ver todas as notificações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
