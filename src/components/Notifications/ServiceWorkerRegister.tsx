'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for existing subscription
          const subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            // We'll let the user subscribe via a button in settings or a prompt
            console.log('User is not yet subscribed to push notifications');
          } else {
            console.log('User is already subscribed:', subscription);
            // Optionally: Send subscription to backend to ensure it's up to date
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}
