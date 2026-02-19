'use client';

import { useState, useRef } from 'react';
import PromotionForm from './PromotionForm';
import PromotionList from './PromotionList';
import ProductForm from './ProductForm';
import Modal from '@/components/Modal/Modal';

interface PromotionManagerProps {
  categories: any[];
}

export default function PromotionManager({ categories }: PromotionManagerProps) {
  const [editingPromotion, setEditingPromotion] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
  };

  const handleCancel = () => {
    setEditingPromotion(null);
  };

  const handleSuccess = () => {
    setEditingPromotion(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="promotion-manager">
      <div className="admin-grid">
        {/* Formulário de Produto */}
        <ProductForm categories={categories} />

        {/* Formulário de Nova Promoção (Fixo) */}
        <div>
          <PromotionForm 
            onSuccess={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>

      <style jsx>{`
        .admin-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .admin-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 3rem;
          }
        }
      `}</style>

      {/* Modal de Edição */}
      <Modal 
        isOpen={!!editingPromotion} 
        onClose={handleCancel} 
        title="Editar Promoção"
      >
        <PromotionForm 
          initialData={editingPromotion} 
          categories={categories}
          onCancel={handleCancel} 
          onSuccess={handleSuccess}
        />
      </Modal>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Promoções Ativas e Histórico</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Gerencie as promoções cadastradas, filtre por produto e acompanhe status.</p>
        <PromotionList key={refreshKey} onEdit={handleEdit} />
      </div>
    </div>
  );
}
