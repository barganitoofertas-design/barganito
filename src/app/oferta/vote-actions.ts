'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function votePromotion(promotionId: string, value: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Você precisa estar logado para votar.' };
  }

  // Ensure value is between 0 and 5
  if (value < 0 || value > 5) {
    return { success: false, message: 'Valor de voto inválido.' };
  }

  try {
    // Upsert vote using raw SQL
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Vote" ("id", "value", "userId", "promotionId", "updatedAt", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("userId", "promotionId") 
      DO UPDATE SET "value" = $2, "updatedAt" = $5
    `,
      `vt_${Math.random().toString(36).substr(2, 9)}`,
      value,
      session.user.id,
      promotionId,
      new Date(),
      new Date()
    );

    revalidatePath(`/oferta/${promotionId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error voting:', error);
    return { success: false, message: 'Erro ao registrar voto.' };
  }
}

export async function getPromotionRating(promotionId: string) {
  try {
    const result = await prisma.$queryRawUnsafe<{ avg: number, count: number }[]>(`
      SELECT AVG("value")::float as avg, COUNT(*)::int as count 
      FROM "Vote" 
      WHERE "promotionId" = $1
    `, promotionId);

    const stats = result[0];
    
    // Default starting point: OK (Value 2) if no votes
    if (!stats || stats.count === 0) {
      return { average: 2.0, count: 0, level: 'OK' };
    }

    const average = stats.avg;
    let level = 'OK';

    if (average >= 4.5) level = 'TOP';
    else if (average >= 3.5) level = 'Muito Bom';
    else if (average >= 2.5) level = 'Bom';
    else if (average >= 1.5) level = 'OK';
    else if (average >= 0.5) level = 'Nheee';
    else level = 'Ruim';

    return { average, count: stats.count, level };
  } catch (error) {
    console.error('Error getting rating:', error);
    return { average: 2.0, count: 0, level: 'OK' };
  }
}

export async function getUserVote(promotionId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT "value" FROM "Vote" 
      WHERE "userId" = $1 AND "promotionId" = $2
    `, session.user.id, promotionId);

    return result[0]?.value ?? null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}
