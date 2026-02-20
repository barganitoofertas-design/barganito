"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    name: string | null;
  };
  promotion: {
    product: {
      name: string;
    };
    discountPercentage: number | null;
    description: string | null;
  };
  likes: number;
  dislikes: number;
}

export default function CommentManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchComments(page);
  }, [page]);

  const fetchComments = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/comments/disliked?page=${pageNum}&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
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
        Comentários com Dislikes
      </h3>
      <p
        style={{
          color: "var(--text-light)",
          marginBottom: "1rem",
          fontSize: "0.9rem",
        }}
      >
        Comentários que podem precisar de revisão.
      </p>
      {comments.length === 0 ? (
        <p style={{ color: "var(--text-light)" }}>
          Nenhum comentário encontrado.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--background)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <strong style={{ fontSize: "0.9rem" }}>
                  {comment.user.name}
                </strong>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-light)" }}
                >
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--text-light)",
                }}
              >
                Oferta: {comment.promotion.product.name}
                {comment.promotion.discountPercentage && (
                  <> - {comment.promotion.discountPercentage}% off</>
                )}
                {comment.promotion.description && (
                  <> - {comment.promotion.description}</>
                )}
              </div>
              <p style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                {comment.text}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.8rem" }}>
                  👍 {comment.likes} 👎 {comment.dislikes}
                </span>
                <button
                  onClick={() => handleDelete(comment.id)}
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
              </div>
            </div>
          ))}
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
    </div>
  );
}
