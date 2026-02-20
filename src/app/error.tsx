"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Oops! Algo deu errado.</h1>
      <p>Desculpe, ocorreu um erro inesperado.</p>
      <Link href="/">
        <button style={{ padding: "10px 20px", fontSize: "16px" }}>
          Voltar para a Home
        </button>
      </Link>
    </div>
  );
}
