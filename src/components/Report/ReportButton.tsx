'use client';

import { useState } from 'react';
import { reportPromotion } from '@/app/oferta/report-actions';
import styles from './ReportButton.module.css';

interface ReportButtonProps {
  promotionId: string;
}

export default function ReportButton({ promotionId }: ReportButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReport = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsSubmitting(true);
    const result = await reportPromotion(promotionId);
    
    if (result.success) {
      setMessage(result.message || 'Denúncia enviada.');
    } else {
      setMessage(result.message || 'Erro ao enviar denúncia.');
    }
    
    setIsSubmitting(false);
    setShowConfirm(false);
  };

  return (
    <div className={styles.reportSection}>
      {!message ? (
        <button 
          className={styles.reportButton}
          onClick={handleReport}
          disabled={isSubmitting}
        >
          <span>🚩</span>
          {showConfirm ? 'Confirmar Denúncia?' : 'Denunciar esta Oferta'}
        </button>
      ) : (
        <p className={styles.statusMessage}>{message}</p>
      )}
    </div>
  );
}
