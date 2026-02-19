'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Workaround: Use raw SQL because the Prisma Client is out of sync
  try {
    return await prisma.$queryRawUnsafe(
      `SELECT * FROM "Notification" 
       WHERE "userId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT 10`,
      session.user.id
    );
  } catch (error) {
    console.error('Error fetching notifications via raw SQL:', error);
    return [];
  }
}

export async function getAllNotifications(page = 1, perPage = 20) {
  const session = await auth();
  if (!session?.user?.id) return { items: [], total: 0 };

  const offset = (page - 1) * perPage;

  try {
    const [items, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "Notification" 
         WHERE "userId" = $1 
         ORDER BY "createdAt" DESC 
         LIMIT $2 OFFSET $3`,
        session.user.id,
        perPage,
        offset
      ),
      prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COUNT(*)::int as count FROM "Notification" WHERE "userId" = $1`,
        session.user.id
      ),
    ]);
    return { items, total: countResult[0]?.count || 0 };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return { items: [], total: 0 };
  }
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  try {
    const result = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int as count FROM "Notification" 
       WHERE "userId" = $1 AND "isRead" = false`,
      session.user.id
    );
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching unread count via raw SQL:', error);
    return 0;
  }
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Notification" SET "isRead" = true 
       WHERE "id" = $1 AND "userId" = $2`,
      id,
      session.user.id
    );
  } catch (error) {
    console.error('Error marking as read via raw SQL:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Notification" SET "isRead" = true 
       WHERE "userId" = $1 AND "isRead" = false`,
      session.user.id
    );
  } catch (error) {
    console.error('Error marking all as read via raw SQL:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}
