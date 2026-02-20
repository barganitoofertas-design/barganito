"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Supplement with a robust custom list for BR-PT
const CUSTOM_BAD_WORDS = [
  // Básicos
  "cu",
  "cú",
  "foda",
  "porra",
  "caralho",
  "merda",
  "puta",
  "bosta",
  "desgraça",
  "arrombado",
  "babaca",
  "pau",
  "pinto",
  "buceta",
  "xereca",
  "cacete",
  "vagabundo",
  "piranha",
  "chupa",
  "fodasse",
  "foda-se",
  "foda se",
  // Frases e Abreviações
  "vai tomar no",
  "vai tomar",
  "vtc",
  "fdp",
  "vai se foder",
  "vtnc",
  "filho da puta",
  "vtnc",
  "tomar no cu",
  "tomar no cú",
  "toma no cu",
  "toma no cú",
  // Insultos e Outros
  "viado",
  "corno",
  "safado",
  "rapariga",
  "canalha",
  "imbecil",
  "idiota",
  "trouxa",
  "f d p",
  "v.t.n.c",
  "v.t.c",
  "p.o.r.r.a",
  "carai",
  "caray",
  "putaria",
  "putinho",
  "putinha",
  "vsf",
  "v.s.f",
  "tmnc",
  "t.m.n.c",
  "pqp",
  "p.q.p",
  "estupro",
  "bucetão",
  "maldito",
  "maldita",
  "escória",
  "desgraca",
  "disgraca",
  "pnc",
  "p.n.c",
  "fdpt",
  "fuder",
  "fude",
  "fudendo",
  "krai",
  "krl",
  "krlh",
  "vão se foder",
  "vao se foder",
  "va se foder",
  "xana",
  "xereca",
  "chupa",
  "mamada",
  "boquete",
  "pnc",
  "bucet",
];

const normalizeText = (textVal: string) => {
  return textVal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const superNormalize = (textVal: string) => {
  return normalizeText(textVal).replace(/[^a-z0-9]/g, "");
};

// Regex for link detection
const LINK_REGEX = /(https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
const DOMAIN_REGEX = /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/gi;

export async function addComment(promotionId: string, text: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Você precisa estar logado para comentar.",
    };
  }

  const trimmedText = text.trim();

  // 1. Validation: Empty
  if (!trimmedText) {
    return { success: false, message: "O comentário não pode estar vazio." };
  }

  // 2. Validation: Length
  if (trimmedText.length < 3) {
    return { success: false, message: "O comentário é muito curto." };
  }
  if (trimmedText.length > 500) {
    return {
      success: false,
      message: "O comentário deve ter no máximo 500 caracteres.",
    };
  }

  // 3. Validation: Links
  if (LINK_REGEX.test(trimmedText) || DOMAIN_REGEX.test(trimmedText)) {
    return {
      success: false,
      message: "Não é permitido postar links nos comentários.",
    };
  }

  // 4. Validation: Profanity
  const normalizedText = normalizeText(trimmedText);
  const superNormalizedText = superNormalize(trimmedText);

  const hasProfanity = CUSTOM_BAD_WORDS.some((word) => {
    const normWord = normalizeText(word);
    const superNormWord = superNormalize(word);
    return (
      normalizedText.includes(normWord) ||
      superNormalizedText.includes(superNormWord)
    );
  });

  if (hasProfanity) {
    return {
      success: false,
      message: "Seu comentário contém palavras não permitidas.",
    };
  }

  try {
    // Fallback to Raw SQL because Prisma Client is not updating on this environment
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Comment" ("id", "text", "userId", "promotionId", "updatedAt", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      `cmt_${Math.random().toString(36).substr(2, 9)}`,
      trimmedText,
      session.user.id,
      promotionId,
      new Date(),
      new Date(),
    );

    revalidatePath(`/oferta/${promotionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, message: "Erro ao salvar comentário." };
  }
}

export async function getComments(promotionId: string) {
  try {
    // Fallback to Raw SQL because Prisma Client is not updating on this environment
    const comments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c.*, u.name as "userName", u.image as "userImage",
       COALESCE(likes.count, 0) as likes,
       COALESCE(dislikes.count, 0) as dislikes
       FROM "Comment" c
       JOIN "User" u ON c."userId" = u.id
       LEFT JOIN (SELECT "commentId", COUNT(*) as count FROM "CommentVote" WHERE "type" = 'like' GROUP BY "commentId") likes ON c.id = likes."commentId"
       LEFT JOIN (SELECT "commentId", COUNT(*) as count FROM "CommentVote" WHERE "type" = 'dislike' GROUP BY "commentId") dislikes ON c.id = dislikes."commentId"
       WHERE c."promotionId" = $1
       ORDER BY c."createdAt" DESC`,
      promotionId,
    );

    // Map the results to the expected format
    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      user: {
        name: c.userName,
        image: c.userImage,
      },
      likes: Number(c.likes),
      dislikes: Number(c.dislikes),
    }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function deleteComment(commentId: string) {
  try {
    // Fallback to Raw SQL because Prisma Client is not updating on this environment
    const comments = await prisma.$queryRawUnsafe<any[]>(
      `DELETE FROM "Comment" c
       WHERE c."id" = $1`,
      commentId,
    );

    // Map the results to the expected format
    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      user: {
        name: c.userName,
        image: c.userImage,
      },
    }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function voteComment(commentId: string, type: "like" | "dislike") {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado para votar." };
  }

  try {
    // Check if user already voted
    const existingVote = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "CommentVote" WHERE "userId" = $1 AND "commentId" = $2`,
      session.user.id,
      commentId,
    );

    if (existingVote.length > 0) {
      // Update vote if different
      if (existingVote[0].type !== type) {
        await prisma.$executeRawUnsafe(
          `UPDATE "CommentVote" SET "type" = $1 WHERE "userId" = $2 AND "commentId" = $3`,
          type,
          session.user.id,
          commentId,
        );
      } else {
        // Remove vote if same
        await prisma.$executeRawUnsafe(
          `DELETE FROM "CommentVote" WHERE "userId" = $1 AND "commentId" = $2`,
          session.user.id,
          commentId,
        );
      }
    } else {
      // Insert new vote
      await prisma.$executeRawUnsafe(
        `INSERT INTO "CommentVote" ("id", "type", "userId", "commentId", "createdAt")
         VALUES ($1, $2, $3, $4, $5)`,
        `cv_${Math.random().toString(36).substr(2, 9)}`,
        type,
        session.user.id,
        commentId,
        new Date(),
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error voting on comment:", error);
    return { success: false, message: "Erro ao votar no comentário." };
  }
}

export async function getUserCommentVote(commentId: string, userId: string) {
  try {
    const vote = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "type" FROM "CommentVote" WHERE "commentId" = $1 AND "userId" = $2`,
      commentId,
      userId,
    );

    return vote.length > 0 ? vote[0].type : null;
  } catch (error) {
    console.error("Error fetching user comment vote:", error);
    return null;
  }
}
