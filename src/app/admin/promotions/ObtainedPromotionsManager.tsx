"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal/Modal";
import ProductForm from "./ProductForm";
import PromotionForm from "./PromotionForm";

interface ObtainedPromotion {
  id: number;
  message_text: string | null;
  original_url: string | null;
  normalized_url: string | null;
  captured_at: Date;
}

interface ObtainedPromotionsManagerProps {
  categories: any[];
}

export default function ObtainedPromotionsManager({
  categories,
}: ObtainedPromotionsManagerProps) {
  const [promotions, setPromotions] = useState<ObtainedPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingPromotion, setEditingPromotion] =
    useState<ObtainedPromotion | null>(null);
  const [editForm, setEditForm] = useState({
    message_text: "",
    normalized_url: "",
  });

  useEffect(() => {
    fetchPromotions(page);
  }, [page]);

  const fetchPromotions = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/obtained-promotions?page=${pageNum}&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch (error) {
      console.error("Error fetching obtained promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion: ObtainedPromotion) => {
    setEditingPromotion(promotion);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta promoção obtida?"))
      return;

    try {
      const response = await fetch(`/api/admin/obtained-promotions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here if desired
      alert("URL copiada para a área de transferência!");
    } catch (error) {
      console.error("Error copying URL:", error);
      alert("Erro ao copiar URL");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "1.5rem",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          background: "var(--card-bg)",
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "var(--card-bg)",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>
        Promoções Obtidas
      </h3>
      <p
        style={{
          color: "var(--text-light)",
          marginBottom: "1rem",
          fontSize: "0.9rem",
        }}
      >
        Gerencie as promoções capturadas automaticamente.
      </p>
      {promotions.length === 0 ? (
        <p style={{ color: "var(--text-light)" }}>
          Nenhuma promoção encontrada.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>ID</th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>
                  Mensagem
                </th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>
                  URL Original
                </th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>
                  URL Normalizada
                </th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>
                  Capturado em
                </th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => (
                <tr
                  key={promotion.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "0.5rem" }}>{promotion.id}</td>
                  <td
                    style={{
                      padding: "0.5rem",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {promotion.message_text}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {promotion.original_url}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {promotion.normalized_url}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {new Date(promotion.captured_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() =>
                        handleCopyUrl(promotion.original_url || "")
                      }
                      style={{
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        marginRight: "0.5rem",
                      }}
                      title="Copiar URL Original"
                    >
                      📋 Copiar
                    </button>
                    <button
                      onClick={() => handleEdit(promotion)}
                      style={{
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        marginRight: "0.5rem",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(promotion.id)}
                      style={{
                        background: "#ff4d4d",
                        color: "white",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              background: page === 1 ? "var(--border)" : "var(--primary)",
              color: page === 1 ? "var(--text-light)" : "white",
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            Anterior
          </button>
          <span style={{ fontSize: "0.9rem", color: "var(--text-light)" }}>
            Página {page} de {totalPages} (Total: {total})
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              background:
                page === totalPages ? "var(--border)" : "var(--primary)",
              color: page === totalPages ? "var(--text-light)" : "white",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Próxima
          </button>
        </div>
      )}

      <Modal
        isOpen={!!editingPromotion}
        onClose={() => setEditingPromotion(null)}
        title="Editar Promoção Obtida"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <ProductForm
            categories={categories}
            initialData={{
              description: editingPromotion?.message_text || "",
              url: editingPromotion?.normalized_url || "",
            }}
          />
          <PromotionForm
            categories={categories}
            initialDescription={editingPromotion?.message_text || ""}
            onSuccess={() => {
              // Após criar a promoção, deletar a obtained_promotion
              if (editingPromotion) {
                handleDelete(editingPromotion.id);
              }
              setEditingPromotion(null);
            }}
            onCancel={() => setEditingPromotion(null)}
          />
        </div>
      </Modal>
    </div>
  );
}
