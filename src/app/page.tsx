import Sidebar from "@/components/Sidebar/Sidebar";
import ProductCard from "@/components/ProductCard/ProductCard";
import Pagination from "@/components/Pagination/Pagination";

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) query.append(key, String(value));
  });

  const res = await fetch(`http://localhost:3000/api/products?${query.toString()}`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  return res.json();
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
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>{categoryName}</h1>
          <div className="filters">
            <select style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option>Mais Recentes</option>
              <option>Menor Preço</option>
              <option>Maior Desconto</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
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
