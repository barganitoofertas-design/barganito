import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAllNotifications, markAllAsRead } from '@/lib/actions/notifications';
import NotificationsClient from './NotificationsClient';

export const metadata = {
  title: 'Notificações - Barganito',
  description: 'Veja todas as suas notificações de alertas de preço.',
};

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10);

  const { items, total } = await getAllNotifications(page, 20);
  const totalPages = Math.ceil(total / 20);

  return (
    <NotificationsClient
      notifications={items}
      total={total}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
