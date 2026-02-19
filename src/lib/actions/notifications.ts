'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    return await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function getAllNotifications(page = 1, perPage = 20) {
  const session = await auth();
  if (!session?.user?.id) return { items: [], total: 0 };

  const offset = (page - 1) * perPage;

  try {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: perPage,
      }),
      prisma.notification.count({
        where: { userId: session.user.id },
      }),
    ]);
    return { items, total };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return { items: [], total: 0 };
  }
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  try {
    return await prisma.notification.count({
      where: { 
        userId: session.user.id,
        isRead: false 
      },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.update({
      where: { 
        id,
        userId: session.user.id 
      },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { 
        userId: session.user.id,
        isRead: false 
      },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}
