import { useState, useEffect } from 'react';
import { createPromotion, updatePromotion } from './actions';
import ProductAutocomplete from './ProductAutocomplete';
import { formatDateForInput } from '@/lib/utils';

interface PromotionFormProps {
  initialData?: any;
  categories?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function PromotionForm({ initialData, categories, onCancel, onSuccess }: PromotionFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [key, setKey] = useState(0); 
  const [showProductEdit, setShowProductEdit] = useState(false);

  useEffect(() => {
    if (initialData) {
      setKey(prev => prev + 1);
      setMessage(null);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    try {
      const data = new FormData(form);
      const result = initialData 
        ? await updatePromotion(initialData.id, data)
        : await createPromotion(data);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        if (!initialData) {
          form.reset();
          setKey(prev => prev + 1);
        }
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      console.error('Form error:', error);
      setMessage({ type: 'error', text: `Erro ao ${initialData ? 'atualizar' : 'cadastrar'} promoção: ` + (error.message || 'Erro inesperado') });
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const formatPrice = (price: number) => {
    return price?.toFixed(2).replace('.', ',');
  };

  return (
    <div className="promotion-form-container" style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
      {loading && !message && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(var(--card-bg-rgb), 0.7)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: 'var(--radius)'
        }}>
          <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{initialData ? 'Atualizando...' : 'Cadastrando...'}</p>
        </div>
      )}

      <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Editar Promoção' : 'Cadastrar Nova Promoção'}</h2>

      {message && (
        <div className="status-message" style={{
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          background: message.type === 'success' 
            ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#34d399' : '#f87171'}`,
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{message.type === 'success' ? '✅' : '❌'}</span>
            <span style={{ fontWeight: 500 }}>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold', fontSize: '1.1rem', padding: '0 0.2rem' }}>✕</button>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .responsive-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .promotion-form-container {
            padding: 1rem !important;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Dados da Promoção */}
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Informações da Oferta</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!initialData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="productId">Produto</label>
                <ProductAutocomplete key={key} initialProduct={initialData?.product} />
              </div>
            )}
            {initialData && <input type="hidden" name="productId" value={initialData.product.id} />}

            <div className="responsive-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="discountPercentage">Desconto (%)</label>
                <input 
                  name="discountPercentage" 
                  id="discountPercentage" 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 15.00" 
                  defaultValue={initialData?.discountPercentage || ''}
                  style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="isActive">Status</label>
                <select 
                  name="isActive" 
                  id="isActive" 
                  defaultValue={initialData ? String(initialData.isActive) : "true"}
                  style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="promoDescription">Chamada da Promoção</label>
              <input 
                name="description" 
                id="promoDescription" 
                type="text" 
                placeholder="Ex: Cupom PRIME15" 
                defaultValue={initialData?.description || ''}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
              />
            </div>

            <div className="responsive-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="startsAt">Início</label>
                <input 
                  name="startsAt" 
                  id="startsAt" 
                  type="datetime-local" 
                  defaultValue={formatDateForInput(initialData?.startsAt)}
                  style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="expiresAt">Expira em</label>
                <input 
                  name="expiresAt" 
                  id="expiresAt" 
                  type="datetime-local" 
                  required
                  defaultValue={formatDateForInput(initialData?.expiresAt)}
                  style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
                />
              </div>
            </div>
          </div>
        </div>


        {/* Dados do Produto (Apenas na Edição) */}
        {initialData && (
          <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showProductEdit ? '1rem' : 0 }}
              onClick={() => setShowProductEdit(!showProductEdit)}
            >
              <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0 }}>Editar Dados do Produto</h3>
              <span style={{ transform: showProductEdit ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </div>

            {showProductEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="productName">Nome do Produto</label>
                  <input 
                    name="productName" 
                    id="productName" 
                    type="text" 
                    required 
                    defaultValue={initialData.product.name}
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
                  />
                </div>

                <div className="responsive-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label htmlFor="productPrice">Preço Original (R$)</label>
                    <input 
                      name="productPrice" 
                      id="productPrice" 
                      type="text" 
                      required 
                      defaultValue={formatPrice(initialData.product.currentPrice)}
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label htmlFor="productCategoryId">Categoria</label>
                    <select 
                      name="productCategoryId" 
                      id="productCategoryId" 
                      required 
                      defaultValue={initialData.product.categoryId}
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                    >
                      {categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="productImageUrl">URL da Imagem</label>
                  <input 
                    name="productImageUrl" 
                    id="productImageUrl" 
                    type="url" 
                    defaultValue={initialData.product.imageUrl}
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="productDescription">Descrição do Produto</label>
                  <textarea 
                    name="productDescription" 
                    id="productDescription" 
                    rows={3}
                    defaultValue={initialData.product.description}
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', resize: 'vertical' }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button 
            type="submit" 
            className="btn btn-secondary" 
            disabled={loading}
            style={{ 
              flex: 1,
              padding: '0.8rem', 
              background: 'var(--secondary)', 
              color: 'white',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            {loading ? (initialData ? 'Atualizando...' : 'Cadastrando...') : (initialData ? 'Salvar Alterações' : 'Cadastrar Promoção')}
          </button>
          
          {initialData && (
            <button 
              type="button" 
              onClick={onCancel}
              className="btn" 
              style={{ 
                flex: 0.5,
                padding: '0.8rem', 
                background: 'var(--background)', 
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
