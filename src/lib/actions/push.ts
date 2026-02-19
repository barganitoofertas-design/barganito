'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function savePushSubscription(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Não autorizado' };

  try {
    // We use a workaround with raw SQL because PushSubscription model might be out of sync in Prisma Client
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PushSubscription" ("id", "userId", "endpoint", "p256dh", "auth", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("endpoint") 
       DO UPDATE SET "userId" = $2, "p256dh" = $4, "auth" = $5`,
      `sub_${Math.random().toString(36).substr(2, 9)}`,
      session.user.id,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      new Date()
    );

    return { success: true };
  } catch (error) {
    console.error('Error saving push subscription via raw SQL:', error);
    return { success: false, error: 'Erro ao salvar inscrição' };
  }
}
