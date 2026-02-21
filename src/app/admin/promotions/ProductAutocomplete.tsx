"use client";

import { useState, useEffect, useRef } from "react";
import { searchProducts } from "./actions";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  imageUrl?: string | null;
  currentPrice: number;
}

interface ProductAutocompleteProps {
  initialProduct?: Product | null;
}

export default function ProductAutocomplete({
  initialProduct,
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState(initialProduct?.name || "");
  const [results, setResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    initialProduct || null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2 && !selectedProduct) {
        setLoading(true);
        try {
          const products = await searchProducts(query);
          setResults(products as any);
          setIsOpen(true);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        if (query.length === 0) {
          setIsOpen(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedProduct]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuery(product.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selectedProduct && e.target.value !== selectedProduct.name) {
      setSelectedProduct(null);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder="Digite o nome do produto..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        style={{
          width: "100%",
          padding: "0.6rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--background)",
          outline: "none",
        }}
      />

      {/* Hidden field for form submission */}
      <input
        type="hidden"
        name="productId"
        value={selectedProduct?.id || ""}
        required
      />

      {isOpen && (results.length > 0 || loading) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            marginTop: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "0.8rem",
                textAlign: "center",
                color: "var(--text-light)",
              }}
            >
              Buscando...
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => handleSelect(product)}
                style={{
                  padding: "0.8rem",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  fontSize: "0.9rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--background)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt=""
                    style={{
                      width: "32px",
                      height: "32px",
                      objectFit: "contain",
                      borderRadius: "4px",
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold" }}>{product.name}</div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-light)" }}
                  >
                    {formatPrice(product.currentPrice)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedProduct && (
        <div
          style={{
            marginTop: "0.4rem",
            fontSize: "0.85rem",
            color: "var(--primary)",
            fontWeight: "bold",
          }}
        >
          ✓ Produto selecionado: {selectedProduct.name}
        </div>
      )}
    </div>
  );
}
