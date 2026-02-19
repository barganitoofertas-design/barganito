import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UserPromotionForm from '@/components/Promotions/UserPromotionForm';

export default async function SubmitPromotionPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/promocoes/enviar');
  }

  const categories = await (prisma as any).category.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)' }}>Sugerir uma Oferta</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
        Encontrou uma promoção imperdível? Compartilhe com a comunidade! 
        Sua sugestão será revisada por um moderador antes de aparecer no site.
      </p>
      
      <UserPromotionForm categories={categories} />
    </div>
  );
}
