import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const now = new Date();

    // BATCH: 1 query - Get all active alerts
    const alerts = await prisma.notificationConfig.findMany({
      include: { category: true }
    }) as any[];

    if (alerts.length === 0) {
      return NextResponse.json({ success: true, results: { checked: 0, triggered: 0, errors: 0 } });
    }

    // BATCH: 1 query - Get all active, non-expired promotions with their products
    const activePromotions = await (prisma as any).promotion.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
      },
      include: { product: { include: { category: true } } },
    });

    if (activePromotions.length === 0) {
      return NextResponse.json({ success: true, results: { checked: alerts.length, triggered: 0, errors: 0 } });
    }

    // BATCH: 1 query - Get all notification links already sent to alert users (dedup)
    const userIds = [...new Set(alerts.map((a: any) => a.userId))];
    const promoLinks = activePromotions.map((p: any) => `/oferta/${p.id}`);

    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        link: { in: promoLinks }
      },
      select: { userId: true, link: true }
    });

    // Build a lookup Set for O(1) dedup checks: "userId|link"
    const sentSet = new Set(existingNotifications.map(n => `${n.userId}|${n.link}`));

    const results = { checked: alerts.length, triggered: 0, errors: 0 };

    // Match alerts to promotions IN MEMORY (no more per-alert queries)
    for (const alert of alerts) {
      const { id: alertId, userId, categoryId, productNamePattern, targetPrice, targetDiscount } = alert;

      const matches = activePromotions.filter((promo: any) => {
        const product = promo.product;

        // Category filter
        if (categoryId && product.categoryId !== categoryId) return false;

        // Name pattern filter
        if (productNamePattern && !product.name.toLowerCase().includes(productNamePattern.toLowerCase())) return false;

        // Price filter
        if (targetPrice && product.currentPrice > targetPrice) return false;

        // Discount filter
        if (targetDiscount && (!promo.discountPercentage || promo.discountPercentage < targetDiscount)) return false;

        return true;
      });

      for (const promo of matches) {
        const promoLink = `/oferta/${promo.id}`;
        const dedupKey = `${userId}|${promoLink}`;

        // Skip if already notified (O(1) lookup)
        if (sentSet.has(dedupKey)) continue;

        try {
          await sendNotification({
            userId,
            title: `Alerta de Preço: ${promo.product.name}`,
            message: `O produto que você está monitorando atingiu R$ ${promo.product.currentPrice.toFixed(2)}${promo.discountPercentage ? ` (${promo.discountPercentage}% OFF)` : ''}!`,
            link: promoLink,
            type: 'alert',
          });

          // Mark as sent in memory to avoid sending again within the same run
          sentSet.add(dedupKey);
          results.triggered++;
        } catch (e) {
          console.error(`Error sending notification for alert ${alertId}:`, e);
          results.errors++;
        }
      }

      // Update lastAlertSentAt only if there were matches
      if (matches.length > 0) {
        await prisma.notificationConfig.update({
          where: { id: alertId },
          data: { lastAlertSentAt: now }
        });
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), results });

  } catch (error: any) {
    console.error('Alert cron failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
