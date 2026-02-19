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
    where.category = { slug: category };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
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

    return {
      data: products,
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
