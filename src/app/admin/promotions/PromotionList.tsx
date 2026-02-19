'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPromotions, togglePromotionStatus, deletePromotion } from './actions';
import { formatDateTime } from '@/lib/utils';

interface Promotion {
  id: string;
  productId: string;
  discountPercentage: number | null;
  startsAt: string | Date;
  expiresAt: string | Date;
  isActive: boolean;
  description: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  product: {
    name: string;
  };
}

interface PromotionListProps {
  onEdit?: (promotion: Promotion) => void;
}

export default function PromotionList({ onEdit }: PromotionListProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromotions({ page, pageSize, query });
      setPromotions(data.promotions as any);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPromotions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPromotions]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await togglePromotionStatus(id, !currentStatus);
      fetchPromotions();
    } catch (error) {
      alert('Erro ao alterar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta promoção?')) return;
    
    try {
      const result = await deletePromotion(id);
      if (result.success) {
        fetchPromotions();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Erro ao excluir promoção');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="filter-bar">
        <div className="search-group">
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', opacity: 0.7 }}>🔍</span>
            <input
              type="text"
              placeholder="Pesquisar por produto ou descrição..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              style={{ 
                width: '100%',
                padding: '0.7rem 1rem 0.7rem 2.5rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                background: 'white',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--primary-rgb), 0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
            />
          </div>
          <button 
            onClick={() => fetchPromotions()} 
            disabled={loading}
            className="btn-refresh"
            style={{ 
              height: '42px',
              padding: '0 1.5rem', 
              border: 'none', 
              background: 'var(--primary)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? '...' : '🔄 Atualizar'}
          </button>
        </div>
        
        <div className="total-badge">
          Total: <strong style={{ color: 'var(--primary)' }}>{total}</strong> promoções
        </div>
      </div>

      <style jsx>{`
        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .search-group {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          flex: 1;
        }

        .total-badge {
          align-self: flex-start;
          font-size: 0.9rem;
          color: var(--text-light);
          background: var(--background);
          padding: 0.4rem 0.8rem;
          borderRadius: 20px;
          border: 1px solid var(--border);
          white-space: nowrap;
        }

        @media (min-width: 768px) {
          .filter-bar {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .search-group {
            flex-direction: row;
            align-items: center;
            max-width: 600px;
          }

          .total-badge {
            align-self: center;
          }
        }
      `}</style>

      <div style={{ overflowX: 'auto', position: 'relative', minHeight: '200px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        {loading && promotions.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.4)', zIndex: 5, borderRadius: '12px' }}></div>
        )}
        
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1.2rem 1rem' }}>Produto</th>
              <th style={{ padding: '1.2rem 1rem' }}>Desconto</th>
              <th style={{ padding: '1.2rem 1rem' }}>Descrição</th>
              <th style={{ padding: '1.2rem 1rem' }}>Status</th>
              <th style={{ padding: '1.2rem 1rem' }}>Início</th>
              <th style={{ padding: '1.2rem 1rem' }}>Expiração</th>
              <th style={{ padding: '1.2rem 1rem' }}>Modificado</th>
              <th style={{ padding: '1.2rem 1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📭</div>
                  Nenhuma promoção encontrada.
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{promo.product.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      background: 'rgba(var(--primary-rgb), 0.1)', 
                      color: 'var(--primary)',
                      fontWeight: 'bold'
                    }}>
                      {promo.discountPercentage ? `${promo.discountPercentage}%` : '-'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>{promo.description || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: promo.isActive ? '#d1fae5' : '#fee2e2',
                      color: promo.isActive ? '#065f46' : '#991b1b',
                      display: 'inline-block'
                    }}>
                      {promo.isActive ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {formatDateTime(promo.startsAt)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {formatDateTime(promo.expiresAt)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {formatDateTime(promo.updatedAt || promo.createdAt)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => onEdit && onEdit(promo)}
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: 'var(--background)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(promo.id, promo.isActive)}
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: promo.isActive ? '#fee2e2' : '#d1fae5',
                          color: promo.isActive ? '#991b1b' : '#065f46',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.1s'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {promo.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button 
                        onClick={() => handleDelete(promo.id)}
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: 'white',
                          color: '#dc2626',
                          border: '1px solid #fee2e2',
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '1rem' }}>
          <button 
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
            style={{ 
              padding: '0.6rem 1.2rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              background: page === 1 ? 'var(--background)' : 'white', 
              color: page === 1 ? 'var(--text-light)' : 'var(--text)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              boxShadow: page === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            Página <strong>{page}</strong> de {totalPages}
          </span>
          <button 
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => p + 1)}
            style={{ 
              padding: '0.6rem 1.2rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              background: page === totalPages ? 'var(--background)' : 'white', 
              color: page === totalPages ? 'var(--text-light)' : 'var(--text)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              boxShadow: page === totalPages ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
