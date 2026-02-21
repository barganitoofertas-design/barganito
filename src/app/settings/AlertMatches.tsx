"use client";

import { useState, useEffect } from "react";
import { getMatchedProducts } from "./alert-actions";
import { formatPrice } from "@/lib/utils";

export default function AlertMatches({ refreshKey }: { refreshKey: number }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const result = await getMatchedProducts(page);
      if (result.success) {
        setProducts(result.products);
        setTotalPages(result.totalPages || 0);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [page, refreshKey]);

  if (loading && products.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Buscando ofertas para seus alertas...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't show anything if no matches and not loading
  }

  return (
    <div className="card" style={{ marginTop: "2rem" }}>
      <h2
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>🔔</span> Ofertas que você pode gostar
      </h2>
      <p
        style={{
          color: "var(--text-light)",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
        }}
      >
        Produtos que combinam com seus alertas e foram postados recentemente.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {products.map((product) => {
          const promo = product.promotions[0];
          return (
            <div
              key={product.id}
              className="card"
              style={{
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
                border: "1px solid var(--border)",
                boxShadow: "none",
                transition: "transform 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-4px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {product.imageUrl && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "160px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#f8f8f8",
                  }}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  {promo?.discountPercentage && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "var(--primary)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                      }}
                    >
                      -{promo.discountPercentage}%
                    </div>
                  )}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--primary)",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {product.category?.name}
                </span>
                <h3
                  style={{
                    fontSize: "1rem",
                    margin: "0.3rem 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: "2.4rem",
                  }}
                >
                  {product.name}
                </h3>
                <div style={{ marginTop: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text)",
                    }}
                  >
                    {formatPrice(product.currentPrice)}
                  </span>
                </div>
              </div>

              <a
                href={product.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  padding: "0.6rem",
                }}
              >
                Ver Oferta
              </a>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "2rem",
            gap: "1rem",
          }}
        >
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "white",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Anterior
          </button>
          <span style={{ fontSize: "0.9rem" }}>
            {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "white",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
