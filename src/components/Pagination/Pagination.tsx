'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Pagination.module.css';

interface PaginationProps {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Pagination({ pagination }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newLimit);
    params.set('page', '1'); // Reset to first page when limit changes
    router.push(`/?${params.toString()}`);
  };

  if (pagination.totalPages <= 1 && pagination.limit === 20) {
    // Show limit selector even if only 1 page, unless it's default
    if (pagination.total <= 20) return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageSize}>
        <span>Itens por página:</span>
        <select 
          value={pagination.limit} 
          onChange={(e) => handleLimitChange(e.target.value)}
          className={styles.select}
        >
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className={styles.pages}>
        <button 
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className={styles.pageBtn}
        >
          &laquo;
        </button>

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`${styles.pageBtn} ${pagination.page === p ? styles.active : ''}`}
          >
            {p}
          </button>
        ))}

        <button 
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className={styles.pageBtn}
        >
          &raquo;
        </button>
      </div>

      <div className={styles.info}>
        Total: {pagination.total} produtos
      </div>
    </div>
  );
}
