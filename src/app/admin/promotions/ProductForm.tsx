'use client';

import { useState, useEffect } from 'react';
import { getProductMetadata, createProduct } from './actions';

interface Category {
  id: string;
  name: string;
}

export default function ProductForm({ categories }: { categories: Category[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    categoryId: '',
    currentPrice: '',
    description: '',
    imageUrl: '',
  });

  const handleUrlBlur = async () => {
    if (!formData.url || !formData.url.startsWith('http')) return;

    setLoading(true);
    setMessage(null);
    try {
      const metadata = await getProductMetadata(formData.url);
      if (metadata) {
        setFormData(prev => ({
          ...prev,
          name: metadata.title || prev.name,
          description: metadata.description || prev.description,
          imageUrl: metadata.imageUrl || prev.imageUrl,
          currentPrice: metadata.price ? metadata.price.toFixed(2).replace('.', ',') : prev.currentPrice,
          ...(metadata.exists && metadata.product ? {
            currentPrice: (metadata.product as any).currentPrice.toFixed(2).replace('.', ','),
            categoryId: (metadata.product as any).categoryId,
          } : {})
        }));
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const data = new FormData(e.currentTarget);
    try {
      const result = await createProduct(data);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setFormData({
          url: '',
          name: '',
          categoryId: '',
          currentPrice: '',
          description: '',
          imageUrl: '',
        });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: 'Erro ao processar solicitação: ' + (error.message || 'Erro desconhecido') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative' }}>
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
          <div className="spinner" style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid var(--border)', 
            borderTopColor: 'var(--primary)', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>Processando...</p>
        </div>
      )}

      <h2 style={{ marginBottom: '1.5rem' }}>Adicionar Produto à Promoção</h2>

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
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* URL em Primeiro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="url">URL da Oferta</label>
          <input 
            name="url" 
            id="url" 
            type="url" 
            required 
            placeholder="Cole o link do produto aqui..." 
            value={formData.url}
            onChange={handleChange}
            onBlur={handleUrlBlur}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
          />
          <small style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
            Dica: Cole o link e clique fora do campo para preencher automaticamente.
          </small>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="name">Nome do Produto</label>
          <input 
            name="name" 
            id="name" 
            type="text" 
            required 
            placeholder="Ex: iPhone 15 Pro" 
            value={formData.name}
            onChange={handleChange}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="categoryId">Categoria</label>
          <select 
            name="categoryId" 
            id="categoryId" 
            required 
            value={formData.categoryId}
            onChange={handleChange}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="currentPrice">Preço Atual (R$)</label>
          <input 
            name="currentPrice" 
            id="currentPrice" 
            type="text" 
            required 
            placeholder="0,00" 
            value={formData.currentPrice}
            onChange={(e) => {
              // Basic raw numeric mask/formatting logic can be added here if needed
              // For now, just allow typed values and replace dot with comma for display consistency
              setFormData(prev => ({ ...prev, currentPrice: e.target.value }));
            }}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
          />
          <small style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Use vírgula para centavos (ex: 99,90).</small>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="prodDescription">Descrição</label>
          <textarea 
            name="description" 
            id="prodDescription" 
            rows={3} 
            placeholder="Breve descrição do produto..." 
            value={formData.description}
            onChange={handleChange}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', resize: 'vertical' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="imageUrl">URL da Imagem</label>
          <input 
            name="imageUrl" 
            id="imageUrl" 
            type="url" 
            placeholder="https://..." 
            value={formData.imageUrl}
            onChange={handleChange}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }} 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ 
            marginTop: '1rem', 
            padding: '0.8rem',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processando...' : 'Adicionar Produto'}
        </button>
      </form>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
