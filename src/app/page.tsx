import Sidebar from "@/components/Sidebar/Sidebar";
import ProductCard from "@/components/ProductCard/ProductCard";
import Pagination from "@/components/Pagination/Pagination";
import { prisma } from "@/lib/prisma";

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  const category = searchParams.category as string | undefined;
  const search = searchParams.search as string | undefined;
  const page = parseInt((searchParams.page as string) || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const now = new Date();

  // Lazy Update: Inativar promoções que já expiraram no banco
  try {
    await prisma.promotion.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() }
      },
      data: {
        isActive: false
      }
    });
  } catch (error) {
    console.error('Failed to auto-expire promotions on home:', error);
  }

  const where: any = {
    promotions: {
      some: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now }
      }
    }
  };

  if (category && category !== 'all' && category !== 'best') {
    where.category = { slug: category };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    let products: any[], total: number;

    if (category === 'best') {
      const productsRaw = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.*, c.name as "categoryName", c.slug as "categorySlug",
               promo.id as "promoId", promo."discountPercentage", promo."description" as "promoDescription",
               sub.avg_rating, sub.vote_count
        FROM "Product" p
        JOIN "Category" c ON p."categoryId" = c.id
        JOIN "Promotion" promo ON p.id = promo."productId"
        JOIN (
            SELECT "promotionId", AVG(value)::float as avg_rating, COUNT(*)::int as vote_count
            FROM "Vote"
            GROUP BY "promotionId"
            HAVING AVG(value) >= 3.5
        ) sub ON promo.id = sub."promotionId"
        WHERE promo."isActive" = true 
          AND (promo."startsAt" IS NULL OR promo."startsAt" <= $1)
          AND (promo."expiresAt" IS NULL OR promo."expiresAt" >= $1)
        ORDER BY 
          CASE WHEN sub.avg_rating >= 4.5 THEN 2 ELSE 1 END DESC,
          sub.vote_count DESC
        OFFSET $2 LIMIT $3
      `, now, skip, limit);

      const totalResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`
        SELECT COUNT(*)::int as count
        FROM "Promotion" promo
        JOIN (
            SELECT "promotionId"
            FROM "Vote"
            GROUP BY "promotionId"
            HAVING AVG(value) >= 3.5
        ) sub ON promo.id = sub."promotionId"
        WHERE promo."isActive" = true
          AND (promo."startsAt" IS NULL OR promo."startsAt" <= $1)
          AND (promo."expiresAt" IS NULL OR promo."expiresAt" >= $1)
      `, now);

      total = totalResult[0]?.count || 0;
      
      products = productsRaw.map(r => ({
        id: r.id,
        name: r.name,
        currentPrice: r.currentPrice,
        imageUrl: r.imageUrl,
        category: { name: r.categoryName, slug: r.categorySlug },
        promotions: [{
          id: r.promoId,
          discountPercentage: r.discountPercentage,
          description: r.promoDescription
        }],
        rating: {
          average: r.avg_rating,
          count: r.vote_count,
          level: r.avg_rating >= 4.5 ? 'TOP' : 'Muito Bom'
        }
      }));
    } else {
      const [productsData, totalData] = await Promise.all([
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
      products = productsData;
      total = totalData;
    }

    // Fetch ratings using raw SQL since Prisma Client is out of sync
    // Skip if we already have it from the 'best' category custom query
    let ratingsMap: Record<string, { average: number, count: number }> = {};

    if (category !== 'best') {
      const promoIds = products
        .map((p: any) => p.promotions[0]?.id)
        .filter(Boolean);

      if (promoIds.length > 0) {
        try {
          const ratings = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "promotionId", AVG("value")::float as avg, COUNT(*)::int as count 
             FROM "Vote" 
             WHERE "promotionId" IN (${promoIds.map((_: string, i: number) => `$${i + 1}`).join(',')})
             GROUP BY "promotionId"`,
            ...promoIds
          );
          
          ratings.forEach(r => {
            ratingsMap[r.promotionId] = { average: r.avg, count: r.count };
          });
        } catch (e) {
          console.error('Failed to fetch ratings:', e);
        }
      }
    }

    const productsWithRatings = products.map((product: any) => {
      const promo = product.promotions[0];
      if (!promo) return product;

      // Use pre-calculated rating if available (for 'best' category)
      if (product.rating) return product;

      const stats = ratingsMap[promo.id] || { average: 2.0, count: 0 };
      const average = stats.average;

      let level = 'OK';
      if (average >= 4.5) level = 'TOP';
      else if (average >= 3.5) level = 'Muito Bom';
      else if (average >= 2.5) level = 'Bom';
      else if (average >= 1.5) level = 'OK';
      else if (average >= 0.5) level = 'Nheee';
      else level = 'Ruim';

      return {
        ...product,
        rating: { average, count: stats.count, level }
      };
    });

    return {
      data: productsWithRatings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const { data: products, pagination } = await getProducts(params);

  const categoryName = params.search
    ? `Resultados para: ${params.search}`
    : params.category 
      ? String(params.category).charAt(0).toUpperCase() + String(params.category).slice(1)
      : params.recent === 'true' ? 'Produtos Recentes' : 'Todos os Produtos';

  return (
    <>
      <Sidebar />
      <section className="feed">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1>{categoryName}</h1>
          <div className="filters">
            <select style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option>Mais Recentes</option>
              <option>Menor Preço</option>
              <option>Maior Desconto</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: 'var(--radius)' }}>
              <h3>Nenhuma oferta encontrada</h3>
              <p>Volte mais tarde ou mude os filtros.</p>
            </div>
          )}
        </div>

        <Pagination pagination={pagination} />
      </section>
    </>
  );
}
