'use client';

import { deleteComment } from '@/app/oferta/actions';
import styles from './Comments.module.css';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Session } from 'next-auth';
import React from 'react';

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface CommentListProps {
  comments: Comment[];
  session: Session | null;
}

export default function CommentList({ comments, session }: CommentListProps) {
  const [localComments, setLocalComments] = React.useState(comments);

  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  if (localComments.length === 0) {
    return <div className={styles.empty}>Nenhum comentário ainda. Seja o primeiro a comentar!</div>;
  }

  const handleDeleteComment = async (commentId: string) => {
    
    try {
      await deleteComment(commentId);
       setLocalComments((prev) => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className={styles.list}>
      {localComments.map((comment) => (
        <div key={comment.id} className={styles.commentItem}>
          <div className={styles.avatar}>
            {comment.user.image ? (
              <img 
                src={comment.user.image} 
                alt={comment.user.name || 'User'} 
                className={styles.avatarImg}
              />
            ) : (
              <span>{comment.user.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div className={styles.commentContent}>
            <div className={styles.header}>
              <span className={styles.userName}>{comment.user.name || 'Usuário'}</span>
              <span className={styles.date}>
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            <p className={styles.text}>{comment.text}</p>
          </div>
            {(session?.user as any).role == 'admin' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => handleDeleteComment(comment.id)}
                style={{ cursor: "pointer" }}
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M6 6l1 14h10l1-14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>

            )}
        </div>
      ))}
    </div>
  );
}
