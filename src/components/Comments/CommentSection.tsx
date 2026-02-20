import { auth } from '@/auth';
import { getComments } from '@/app/oferta/actions';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import styles from './Comments.module.css';
import Link from 'next/link';

interface CommentSectionProps {
  promotionId: string;
}

export default async function CommentSection({ promotionId }: CommentSectionProps) {
  const session = await auth();
  const comments = await getComments(promotionId);

  return (
    <section className={styles.section} id="comments">
      <h3 className={styles.title}>
        Comentários <span>({comments.length})</span>
      </h3>

      {session ? (
        <CommentForm promotionId={promotionId} />
      ) : (
        <div className={styles.loginPrompt}>
          <p>
            <Link href="/login" className={styles.loginLink}>Entre na sua conta</Link> para participar da discussão.
          </p>
        </div>
      )}

      <CommentList comments={comments} session={session} />
    </section>
  );
}
