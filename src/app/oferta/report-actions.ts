'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function reportPromotion(promotionId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Você precisa estar logado para denunciar.' };
  }

  try {
    // 1. Create the report (Raw SQL to avoid Prisma Client lock)
    // Using ON CONFLICT DO NOTHING to silently handle duplicate reports from the same user
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Report" ("id", "userId", "promotionId", "createdAt")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("userId", "promotionId") DO NOTHING
    `,
      `rep_${Math.random().toString(36).substr(2, 9)}`,
      session.user.id,
      promotionId,
      new Date()
    );

    // 2. Count reports for this promotion
    const result = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*)::int as count FROM "Report" WHERE "promotionId" = $1
    `, promotionId);

    const reportCount = result[0]?.count || 0;

    // 3. Auto-inactivate if >= 4 reports
    if (reportCount >= 4) {
      await (prisma as any).promotion.update({
        where: { id: promotionId },
        data: { isActive: false }
      });
      
      revalidatePath('/');
      return { 
        success: true, 
        message: 'Esta oferta recebeu muitas denúncias e foi removida automaticamente para revisão.' 
      };
    }

    revalidatePath(`/oferta/${promotionId}`);
    return { success: true, message: 'Obrigado por sua denúncia. Nossa equipe irá analisar esta oferta.' };
  } catch (error) {
    console.error('Error reporting promotion:', error);
    return { success: false, message: 'Erro ao registrar denúncia.' };
  }
}

export async function getReportStats(promotionId: string) {
  try {
    const result = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*)::int as count FROM "Report" WHERE "promotionId" = $1
    `, promotionId);
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting report stats:', error);
    return 0;
  }
}
