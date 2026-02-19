import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const recent = searchParams.get("recent") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  try {
    const now = new Date();
    const where: any = {
      promotions: {
        some: {
          isActive: true,
          startsAt: { lte: now },
          expiresAt: { gte: now }
        }
      }
    };

    if (category && category !== 'all') {
      where.category = {
        slug: category
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      (prisma as any).product.findMany({
        where,
        include: {
          category: true,
          promotions: {
            where: { 
              isActive: true,
              startsAt: { lte: now },
              expiresAt: { gte: now }
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
