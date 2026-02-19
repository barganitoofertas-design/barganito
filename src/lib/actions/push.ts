'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function savePushSubscription(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: session.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving push subscription via raw SQL:', error);
    return { success: false, error: 'Erro ao salvar inscrição' };
  }
}
