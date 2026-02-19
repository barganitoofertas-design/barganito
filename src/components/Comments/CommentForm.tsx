'use client';

import { useState } from 'react';
import { addComment } from '@/app/oferta/actions';
import styles from './Comments.module.css';

interface CommentFormProps {
  promotionId: string;
}

export default function CommentForm({ promotionId }: CommentFormProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const result = await addComment(promotionId, text);

    if (result.success) {
      setText('');
      // The page will revalidate via server action
    } else {
      setError(result.message || 'Erro ao publicar comentário.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        placeholder="O que você achou dessa oferta?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        maxLength={500}
      />
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formFooter}>
        <span className={styles.charCount}>{text.length}/500</span>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting || !text.trim()}
        >
          {isSubmitting ? 'Publicando...' : 'Comentar'}
        </button>
      </div>
    </form>
  );
}
