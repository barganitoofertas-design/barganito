import styles from './Comments.module.css';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <div className={styles.empty}>Nenhum comentário ainda. Seja o primeiro a comentar!</div>;
  }

  return (
    <div className={styles.list}>
      {comments.map((comment) => (
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
        </div>
      ))}
    </div>
  );
}
