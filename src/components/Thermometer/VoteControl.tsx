'use client';

import { useState } from 'react';
import { votePromotion } from '@/app/oferta/vote-actions';
import styles from './Thermometer.module.css';

interface VoteControlProps {
  promotionId: string;
  initialVote: number | null;
  count: number;
}

const VOTE_OPTIONS = [
  { value: 5, label: 'TOP', emoji: '🔥' },
  { value: 4, label: 'Mto Bom', emoji: '💎' },
  { value: 3, label: 'Bom', emoji: '✅' },
  { value: 2, label: 'OK', emoji: '👍' },
  { value: 1, label: 'Nheee', emoji: '🤨' },
  { value: 0, label: 'Ruim', emoji: '📉' },
];

export default function VoteControl({ promotionId, initialVote, count }: VoteControlProps) {
  const [currentVote, setCurrentVote] = useState<number | null>(initialVote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (value: number) => {
    if (isSubmitting || value === currentVote) return;

    setIsSubmitting(true);
    const result = await votePromotion(promotionId, value);

    if (result.success) {
      setCurrentVote(value);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.voteSection}>
      <h4 className={styles.voteTitle}>O que você achou dessa oferta?</h4>
      <div className={styles.buttonGroup}>
        {VOTE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.voteButton} ${currentVote === opt.value ? styles.active : ''}`}
            onClick={() => handleVote(opt.value)}
            disabled={isSubmitting}
          >
            <span className={styles.emoji}>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <p className={styles.countText}>
        {count} {count === 1 ? 'voto recebido' : 'votos recebidos'}
      </p>
    </div>
  );
}
