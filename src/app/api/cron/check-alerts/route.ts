import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verification token to prevent unauthorized calls
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // 1. Get all active alerts using raw SQL
    // Join with Category to get category name if needed
    const alerts = await prisma.$queryRawUnsafe<any[]>(
      `SELECT nc.*, c.name as "categoryName" 
       FROM "NotificationConfig" nc
       LEFT JOIN "Category" c ON nc."categoryId" = c.id`
    );

    const results = {
      checked: alerts.length,
      triggered: 0,
      errors: 0,
    };

    // 2. For each alert, check for matching products/promotions
    for (const alert of alerts) {
      const {
        id: alertId,
        userId,
        categoryId,
        productNamePattern,
        targetPrice,
        targetDiscount,
        lastAlertSentAt,
        createdAt: alertCreatedAt
      } = alert;

      // Define time window (since last alert or last 15 mins)
      const lastCheck = lastAlertSentAt || new Date(Date.now() - 15 * 60 * 1000);
      
      const startTime = new Date(Math.max(
        new Date(alertCreatedAt).getTime(), 
        new Date(lastCheck).getTime()
      ));

      const now = new Date();

      // Search for ALL active promotions that match the alert criteria
      // We DON'T filter by createdAt since the user wants to know about any matching deal
      const promotionWhere: any = {
        isActive: true,
        expiresAt: { gt: now }, // Must not be expired
        product: {},
      };

      // Category match
      if (categoryId) promotionWhere.product.categoryId = categoryId;

      // Pattern match
      if (productNamePattern) {
        promotionWhere.product.name = {
          contains: productNamePattern,
          mode: 'insensitive',
        };
      }

      // Price match
      if (targetPrice) promotionWhere.product.currentPrice = { lte: targetPrice };

      // Discount match 
      if (targetDiscount) promotionWhere.discountPercentage = { gte: targetDiscount };

      const matchingPromotions = await (prisma as any).promotion.findMany({
        where: promotionWhere,
        include: { product: true },
      });

      // 3. Trigger notifications for each match
      for (const promo of matchingPromotions) {
        try {
          const promoLink = `/oferta/${promo.id}`;

          // Check if a notification for this promo was already sent to this user
          const existing = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM "Notification" WHERE "userId" = $1 AND "link" = $2 LIMIT 1`,
            userId,
            promoLink
          );

          if (existing.length > 0) continue; // Skip - already notified

          await sendNotification({
            userId,
            title: `Alerta de Preço: ${promo.product.name}`,
            message: `O produto que você está monitorando atingiu R$ ${promo.product.currentPrice.toFixed(2)}${promo.discountPercentage ? ` (${promo.discountPercentage}% OFF)` : ''}!`,
            link: promoLink,
            type: 'alert',
          });
          results.triggered++;
        } catch (e) {
          console.error(`Error sending notification for alert ${alertId}:`, e);
          results.errors++;
        }
      }

      // 4. Update lastAlertSentAt if matches were found using raw SQL
      if (matchingPromotions.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE "NotificationConfig" SET "lastAlertSentAt" = $1 WHERE "id" = $2`,
          new Date(),
          alertId
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      results 
    });

  } catch (error: any) {
    console.error('Alert cron failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
