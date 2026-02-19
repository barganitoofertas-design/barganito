'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getMatchedProducts(page: number = 1, pageSize: number = 8) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Não autorizado", products: [], total: 0 };
  }

  try {
    const configs = await (prisma as any).notificationConfig.findMany({
      where: { userId: session.user.id },
    });

    if (configs.length === 0) {
      return { success: true, products: [], total: 0, totalPages: 0 };
    }

    const now = new Date();

    // Build the OR condition for each alert
    const orConditions = configs.map((config: any) => {
      const andConditions: any[] = [];

      if (config.productNamePattern) {
        andConditions.push({ name: { contains: config.productNamePattern, mode: 'insensitive' } });
      }

      if (config.categoryId) {
        andConditions.push({ categoryId: config.categoryId });
      }

      // Important: Only match promotions created AFTER the alert
      andConditions.push({
        promotions: {
          some: {
            isActive: true,
            createdAt: { gt: config.createdAt },
            expiresAt: { gt: now },
            startsAt: { lte: now },
            ...(config.targetPrice || config.targetDiscount ? {
              AND: [
                config.targetPrice ? { product: { currentPrice: { lte: config.targetPrice } } } : {},
                config.targetDiscount ? { discountPercentage: { gte: config.targetDiscount } } : {},
              ].filter(c => Object.keys(c).length > 0)
            } : {})
          }
        }
      });

      return { AND: andConditions };
    });

    const where = { OR: orConditions };

    const [total, products] = await Promise.all([
      (prisma as any).product.count({ where }),
      (prisma as any).product.findMany({
        where,
        include: {
          promotions: {
            where: {
              isActive: true,
              expiresAt: { gt: now },
              startsAt: { lte: now },
            } as any, // Cast to bypass out-of-sync types
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          category: true
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    return {
      success: true,
      products,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    };
  } catch (error: any) {
    console.error('Error fetching matched products:', error);
    return { success: false, message: "Erro ao buscar ofertas compatíveis", products: [], total: 0 };
  }
}

export async function getCategories() {
  try {
    return await (prisma as any).category.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
