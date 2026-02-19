'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function submitUserPromotion(formData: FormData) {
  const session = await auth();
  
  if (!session) {
    return { success: false, message: 'Você precisa estar logado para sugerir uma promoção.' };
  }

  try {
    const url = formData.get('url') as string;
    const name = formData.get('name') as string;
    const categoryId = formData.get('categoryId') as string;
    const currentPriceStr = formData.get('currentPrice') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const promoDescription = formData.get('promoDescription') as string;
    const discountStr = formData.get('discountPercentage') as string;

    if (!url || !name || !categoryId) {
      return { success: false, message: 'Preencha os campos obrigatórios (Link, Nome e Categoria).' };
    }

    const currentPrice = currentPriceStr ? parseFloat(currentPriceStr.replace(',', '.')) : 0;
    const discountPercentage = discountStr ? parseFloat(discountStr) : null;

    // 1. Create or Find Product
    const product = await (prisma.product as any).upsert({
      where: { url },
      update: {
        name,
        categoryId,
        currentPrice: currentPrice || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      },
      create: {
        url,
        name,
        categoryId,
        currentPrice,
        description,
        imageUrl,
      },
    });

    // 2. Create Promotion Suggestion (Inactive, no dates)
    await prisma.promotion.create({
      data: {
        productId: product.id,
        discountPercentage: discountPercentage,
        description: promoDescription,
        isActive: false, // Inactive by default
        userId: session.user?.id,
      } as any
    });

    revalidatePath('/admin/promotions');
    return { success: true, message: 'Sugestão enviada com sucesso! Um administrador irá revisar em breve.' };
  } catch (error: any) {
    console.error('Error submitting user promotion:', error);
    return { success: false, message: 'Erro ao enviar sugestão: ' + (error.message || 'Erro desconhecido') };
  }
}

export async function getUserProductMetadata(url: string) {
  const session = await auth();
  if (!session) throw new Error('Não autorizado');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      }
    });
    const html = await response.text();

    const getMeta = (names: string[]) => {
      for (const name of names) {
        const regexes = [
          new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']?${name}["']?[^>]+content=(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`, 'i'),
          new RegExp(`<meta[^>]+content=(?:"([^"]+)"|'([^']+)'|([^\\s>]+))[^>]+(?:property|name|itemprop)=["']?${name}["']?`, 'i')
        ];
        for (const regex of regexes) {
          const match = html.match(regex);
          if (match) return match[1] || match[2] || match[3];
        }
      }
      return null;
    };

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = getMeta(['og:title', 'twitter:title', 'title']) || (titleMatch ? titleMatch[1] : '');
    const description = getMeta(['og:description', 'twitter:description', 'description']) || '';
    const imageUrl = getMeta(['og:image', 'twitter:image', 'image']) || '';

    return {
      title: (title || '').trim(),
      description: (description || '').trim(),
      imageUrl: (imageUrl || '').trim(),
    };
  } catch (error) {
    console.error('Error fetching metadata (user):', error);
    return null;
  }
}
