"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Sidebar() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const currentCategory = searchParams.get("category");
  const isRecent = searchParams.get("recent") === "true";

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Categories API did not return an array:", data);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  return (
    <aside className={styles.sidebar}>
      <h3>Categorias</h3>
      <ul className={styles.categoryList}>
        <li>
          <Link
            href="/"
            className={`${styles.categoryLink} ${!currentCategory && !isRecent ? styles.active : ""}`}
          >
            Todos
          </Link>
        </li>
        <li>
          <Link
            href="/?recent=true"
            className={`${styles.categoryLink} ${isRecent ? styles.active : ""}`}
          >
            Recentes
          </Link>
        </li>
        <li>
          <Link
            href="/?category=best"
            className={`${styles.categoryLink} ${currentCategory === "best" ? styles.active : ""}`}
          >
            💎 Melhores
          </Link>
        </li>
        <li>
          <Link
            href="/?category=parcelado"
            className={`${styles.categoryLink} ${currentCategory === "parcelado" ? styles.active : ""}`}
          >
            💳 Parcelado
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/?category=${cat.slug}`}
              className={`${styles.categoryLink} ${currentCategory === cat.slug ? styles.active : ""}`}
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
