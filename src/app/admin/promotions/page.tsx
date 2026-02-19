import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PromotionManager from './PromotionManager';

export default async function AdminPromotionsPage() {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  const categories = await (prisma as any).category.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Painel Administrativo</h1>
      <PromotionManager categories={categories} />
    </div>
  );
}
