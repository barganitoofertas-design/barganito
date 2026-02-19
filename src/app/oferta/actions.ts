'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Simple profane words list (expand this as needed)
const BANNED_WORDS = [
  'ofensivo', 'burro', 'idiota', 'lixo', 'bosta', 'droga', // Exemplo
  // Adicione mais palavras aqui ou use uma lib específica se o projeto crescer
];

// Regex for link detection
const LINK_REGEX = /(https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
const DOMAIN_REGEX = /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/gi;

export async function addComment(promotionId: string, text: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Você precisa estar logado para comentar.' };
  }

  const trimmedText = text.trim();

  // 1. Validation: Empty
  if (!trimmedText) {
    return { success: false, message: 'O comentário não pode estar vazio.' };
  }

  // 2. Validation: Length
  if (trimmedText.length < 3) {
    return { success: false, message: 'O comentário é muito curto.' };
  }
  if (trimmedText.length > 500) {
    return { success: false, message: 'O comentário deve ter no máximo 500 caracteres.' };
  }

  // 3. Validation: Links
  if (LINK_REGEX.test(trimmedText) || DOMAIN_REGEX.test(trimmedText)) {
    return { success: false, message: 'Não é permitido postar links nos comentários.' };
  }

  // 4. Validation: Profanity
  const lowerText = trimmedText.toLowerCase();
  const hasProfanity = BANNED_WORDS.some(word => lowerText.includes(word));
  if (hasProfanity) {
    return { success: false, message: 'Seu comentário contém palavras não permitidas.' };
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
      new Date()
    );

    revalidatePath(`/oferta/${promotionId}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, message: 'Erro ao salvar comentário.' };
  }
}

export async function getComments(promotionId: string) {
  try {
    // Fallback to Raw SQL because Prisma Client is not updating on this environment
    const comments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c.*, u.name as "userName", u.image as "userImage"
       FROM "Comment" c
       JOIN "User" u ON c."userId" = u.id
       WHERE c."promotionId" = $1
       ORDER BY c."createdAt" DESC`,
      promotionId
    );

    // Map the results to the expected format
    return comments.map(c => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      user: {
        name: c.userName,
        image: c.userImage
      }
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}
