'use client';

import { useState } from 'react';
import { submitUserPromotion, getUserProductMetadata } from '@/app/promocoes/actions';
import styles from './UserPromotionForm.module.css';

interface UserPromotionFormProps {
  categories: any[];
}

export default function UserPromotionForm({ categories }: UserPromotionFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    categoryId: '',
    currentPrice: '',
    discountPercentage: '',
    imageUrl: '',
    promoDescription: '',
    description: ''
  });

  const handleFetchMetadata = async () => {
    if (!formData.url || !formData.url.startsWith('http')) return;
    
    setFetchingMetadata(true);
    try {
      const data = await getUserProductMetadata(formData.url);
      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.title || prev.name,
          description: data.description || prev.description,
          imageUrl: data.imageUrl || prev.imageUrl,
        }));
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));

    try {
      const result = await submitUserPromotion(data);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setFormData({
          url: '',
          name: '',
          categoryId: '',
          currentPrice: '',
          discountPercentage: '',
          imageUrl: '',
          promoDescription: '',
          description: ''
        });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao enviar: ' + (error.message || 'Erro desconhecido') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formCard}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className={styles.closeBtn}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="url">Link do Produto (URL) *</label>
          <div className={styles.urlInputRow}>
            <input 
              id="url"
              type="url" 
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              onBlur={handleFetchMetadata}
              required 
            />
            <button 
              type="button" 
              onClick={handleFetchMetadata} 
              disabled={fetchingMetadata}
              className={styles.fetchBtn}
            >
              {fetchingMetadata ? '...' : '🔍'}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="name">Nome do Produto *</label>
          <input 
            id="name"
            type="text" 
            placeholder="Ex: PlayStation 5 com 2 Controles"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required 
          />
        </div>

        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="categoryId">Categoria *</label>
            <select 
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="currentPrice">Preço (Opcional)</label>
            <input 
              id="currentPrice"
              type="text" 
              placeholder="Ex: 3499,00"
              value={formData.currentPrice}
              onChange={(e) => setFormData({...formData, currentPrice: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="promoDescription">Chamada da Promoção</label>
          <input 
            id="promoDescription"
            type="text" 
            placeholder="Ex: Use o cupom BARGANITO10"
            value={formData.promoDescription}
            onChange={(e) => setFormData({...formData, promoDescription: e.target.value})}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="imageUrl">URL da Imagem (Opcional)</label>
          <input 
            id="imageUrl"
            type="url" 
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Sugestão'}
        </button>
      </form>
    </div>
  );
}
