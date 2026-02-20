"use client";

import {
  deleteComment,
  voteComment,
  getUserCommentVote,
} from "@/app/oferta/actions";
import styles from "./Comments.module.css";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Session } from "next-auth";
import React from "react";

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
  likes: number;
  dislikes: number;
}

interface CommentListProps {
  comments: Comment[];
  session: Session | null;
}

export default function CommentList({ comments, session }: CommentListProps) {
  const [localComments, setLocalComments] = React.useState(comments);
  const [userVotes, setUserVotes] = React.useState<
    Record<string, string | null>
  >({});

  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  React.useEffect(() => {
    if (session?.user?.id) {
      const fetchUserVotes = async () => {
        const votes: Record<string, string | null> = {};
        for (const comment of comments) {
          const vote = await getUserCommentVote(
            comment.id,
            session.user!.id as string,
          );
          votes[comment.id] = vote;
        }
        setUserVotes(votes);
      };
      fetchUserVotes();
    }
  }, [comments, session]);

  if (localComments.length === 0) {
    return (
      <div className={styles.empty}>
        Nenhum comentário ainda. Seja o primeiro a comentar!
      </div>
    );
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setLocalComments((prev) =>
        prev.filter((comment) => comment.id !== commentId),
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleVote = async (commentId: string, type: "like" | "dislike") => {
    if (!session?.user?.id) return;

    const currentVote = userVotes[commentId];
    let newVote: string | null = type;
    if (currentVote === type) {
      newVote = null; // toggle off
    }

    // Optimistically update
    setUserVotes((prev) => ({ ...prev, [commentId]: newVote }));

    // Update local comments counts
    setLocalComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          let newLikes = c.likes;
          let newDislikes = c.dislikes;
          if (currentVote === "like") newLikes--;
          if (currentVote === "dislike") newDislikes--;
          if (newVote === "like") newLikes++;
          if (newVote === "dislike") newDislikes++;
          return { ...c, likes: newLikes, dislikes: newDislikes };
        }
        return c;
      }),
    );

    try {
      await voteComment(commentId, type);
    } catch (error) {
      // Revert on error
      setUserVotes((prev) => ({ ...prev, [commentId]: currentVote }));
      setLocalComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            let newLikes = c.likes;
            let newDislikes = c.dislikes;
            if (newVote === "like") newLikes--;
            if (newVote === "dislike") newDislikes--;
            if (currentVote === "like") newLikes++;
            if (currentVote === "dislike") newDislikes++;
            return { ...c, likes: newLikes, dislikes: newDislikes };
          }
          return c;
        }),
      );
      console.error("Error voting:", error);
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
                alt={comment.user.name || "User"}
                className={styles.avatarImg}
              />
            ) : (
              <span>{comment.user.name?.charAt(0).toUpperCase() || "?"}</span>
            )}
          </div>
          <div className={styles.commentContent}>
            <div className={styles.header}>
              <span className={styles.userName}>
                {comment.user.name || "Usuário"}
              </span>
              <span className={styles.date}>
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            <p className={styles.text}>{comment.text}</p>
            <div className={styles.votes}>
              <button
                onClick={() => handleVote(comment.id, "like")}
                className={`${styles.voteButton} ${userVotes[comment.id] === "like" ? styles.active : ""}`}
              >
                👍 {comment.likes}
              </button>
              <button
                onClick={() => handleVote(comment.id, "dislike")}
                className={`${styles.voteButton} ${userVotes[comment.id] === "dislike" ? styles.active : ""}`}
              >
                👎 {comment.dislikes}
              </button>
            </div>
          </div>
          {(session?.user as any).role == "admin" && (
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
