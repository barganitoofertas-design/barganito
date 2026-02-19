'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getPromotions(params: { page?: number, pageSize?: number, query?: string } = {}) {
  const { page = 1, pageSize = 10, query = '' } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (query) {
    where.OR = [
      { product: { name: { contains: query, mode: 'insensitive' } } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [total, promotions] = await Promise.all([
    (prisma as any).promotion.count({ where }),
    (prisma as any).promotion.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    promotions,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

export async function searchProducts(query: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Não autorizado');
  }

  if (!query || query.length < 2) return [];

  return await prisma.product.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
    },
    take: 10,
    orderBy: { name: 'asc' },
  });
}

export async function createPromotion(formData: FormData) {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, message: 'Não autorizado' };
  }

  try {
    const productId = formData.get('productId') as string;
    const discountStr = formData.get('discountPercentage') as string;
    const description = formData.get('description') as string;
    const startsAtStr = formData.get('startsAt') as string;
    const expiresAtStr = formData.get('expiresAt') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!productId) {
      return { success: false, message: 'O Produto é obrigatório.' };
    }

    if (!expiresAtStr) {
      return { success: false, message: 'A Data de Expiração é obrigatória.' };
    }

    const expiresAt = new Date(expiresAtStr);
    if (isNaN(expiresAt.getTime())) {
      return { success: false, message: 'Data de expiração inválida.' };
    }

    let startsAt = new Date();
    if (startsAtStr) {
      startsAt = new Date(startsAtStr);
      if (isNaN(startsAt.getTime())) {
        startsAt = new Date();
      }
    }

    const discountPercentage = (discountStr && discountStr.trim() !== '') ? parseFloat(discountStr) : null;
    if (discountStr && discountStr.trim() !== '' && isNaN(discountPercentage as number)) {
      return { success: false, message: 'O percentual de desconto deve ser um número válido.' };
    }

    const id = `cl${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
    
    // Workaround: Use raw SQL because the Prisma Client is out of sync and won't accept 'startsAt'
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Promotion" ("id", "productId", "discountPercentage", "description", "startsAt", "expiresAt", "isActive", "updatedAt", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      id,
      productId,
      discountPercentage,
      description,
      startsAt,
      expiresAt,
      isActive,
      new Date(), // updatedAt in BR time
      new Date()  // createdAt in BR time
    );

    revalidatePath('/admin/promotions');
    revalidatePath('/');
    return { success: true, message: 'Promoção cadastrada com sucesso!' };
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return { 
      success: false, 
      message: 'Erro ao cadastrar no banco: ' + (error.message || 'Erro desconhecido') 
    };
  }
}

export async function updatePromotion(id: string, formData: FormData) {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, message: 'Não autorizado' };
  }

  try {
    const productId = formData.get('productId') as string;
    const discountStr = formData.get('discountPercentage') as string;
    const description = formData.get('description') as string;
    const startsAtStr = formData.get('startsAt') as string;
    const expiresAtStr = formData.get('expiresAt') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!productId) {
      return { success: false, message: 'O Produto é obrigatório.' };
    }

    if (!expiresAtStr) {
      return { success: false, message: 'A Data de Expiração é obrigatória.' };
    }

    const expiresAt = new Date(expiresAtStr);
    if (isNaN(expiresAt.getTime())) {
      return { success: false, message: 'Data de expiração inválida.' };
    }

    let startsAt = new Date();
    if (startsAtStr) {
      startsAt = new Date(startsAtStr);
      if (isNaN(startsAt.getTime())) {
        startsAt = new Date();
      }
    }

    const discountPercentage = (discountStr && discountStr.trim() !== '') ? parseFloat(discountStr) : null;
    if (discountStr && discountStr.trim() !== '' && isNaN(discountPercentage as number)) {
      return { success: false, message: 'O percentual de desconto deve ser um número válido.' };
    }

    // Product fields (if provided by the unified edit form)
    const productName = formData.get('productName') as string;
    const productPriceStr = formData.get('productPrice') as string;
    const productCategoryId = formData.get('productCategoryId') as string;
    const productImageUrl = formData.get('productImageUrl') as string;
    const productDescription = formData.get('productDescription') as string;

    // 1. Update Product if we have product data
    if (productName && productId) {
      const productPrice = parseFloat(productPriceStr.replace(',', '.'));
      await (prisma.product as any).update({
        where: { id: productId },
        data: {
          name: productName,
          categoryId: productCategoryId,
          currentPrice: productPrice,
          imageUrl: productImageUrl,
          description: productDescription,
        }
      });
    }

    // 2. Update Promotion
    // Workaround: Use raw SQL because the Prisma Client is out of sync and won't accept 'startsAt'
    await prisma.$executeRawUnsafe(
      `UPDATE "Promotion" 
       SET "productId" = $1, "discountPercentage" = $2, "description" = $3, 
           "startsAt" = $4, "expiresAt" = $5, "isActive" = $6, "updatedAt" = $7 
       WHERE "id" = $8`,
      productId, 
      discountPercentage, 
      description, 
      startsAt, 
      expiresAt, 
      isActive, 
      new Date(), // updatedAt in BR time
      id
    );

    revalidatePath('/admin/promotions');
    revalidatePath('/');
    return { success: true, message: 'Promoção e Produto atualizados com sucesso!' };
  } catch (error: any) {
    console.error('Error updating promotion/product:', error);
    return { 
      success: false, 
      message: 'Erro ao atualizar no banco: ' + (error.message || 'Erro desconhecido') 
    };
  }
}

export async function getProductMetadata(url: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Não autorizado');
  }

  try {
    // Use a User-Agent that triggers better meta-tag responses (like Facebook/WhatsApp)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    const html = await response.text();

    const getMeta = (names: string[]) => {
      for (const name of names) {
        // Robust regex to handle different attribute orders, quotes, and spaces in content.
        // It tries to find content="..." or content='...' or content=NoQuotes
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
    
    // Check for link tags and common img IDs in Amazon/Common sites as fallsbacks
    const image_src = html.match(/<link[^>]+rel=["']?image_src["']?[^>]+href=["']?([^"'>\s]+)["']?/i)?.[1];
    const main_image = html.match(/<img[^>]+id=["']?landingImage["']?[^>]+src=["']?([^"'>\s]+)["']?/i)?.[1] ||
                       html.match(/<img[^>]+id=["']?main-image["']?[^>]+src=["']?([^"'>\s]+)["']?/i)?.[1];
    
    let imageUrl = getMeta(['og:image', 'twitter:image:src', 'twitter:image', 'image', 'thumbnail', 'maintitleimage']) || image_src || main_image || '';

    // Price extraction
    const priceAmount = getMeta(['og:price:amount', 'product:price:amount', 'price:amount', 'amount']);
    
    // Fallback for Amazon price (very common)
    const amazonPriceMatch = html.match(/<span[^>]+class=["'][^"']*a-price-whole[^"']*["']?[^>]*>([^<]+)<\/span>/i);
    const amazonPriceFractionMatch = html.match(/<span[^>]+class=["'][^"']*a-price-fraction[^"']*["']?[^>]*>([^<]+)<\/span>/i);
    
    let price = priceAmount;
    if (!price && amazonPriceMatch) {
      price = amazonPriceMatch[1].replace(/[^\d]/g, '') + '.' + (amazonPriceFractionMatch ? amazonPriceFractionMatch[1] : '00');
    }

    // If it's a relative URL, make it absolute (common for some sites)
    if (imageUrl && imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
    } else if (imageUrl && imageUrl.startsWith('//')) {
      imageUrl = `https:${imageUrl}`;
    }

    // Check if product already exists by URL
    const existingProduct = await (prisma.product as any).findFirst({
      where: { url },
    });

    return {
      title: (title || '').trim(),
      description: (description || '').trim(),
      imageUrl: (imageUrl || '').trim(),
      price: price ? parseFloat(price.replace(',', '.')) : null,
      exists: !!existingProduct,
      product: existingProduct,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

export async function createProduct(formData: FormData) {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, message: 'Não autorizado' };
  }

  try {
    const url = formData.get('url') as string;
    const name = formData.get('name') as string;
    const categoryId = formData.get('categoryId') as string;
    const currentPriceStr = formData.get('currentPrice') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;

    console.log('Creating product:', { url, name, categoryId, currentPriceStr });

    const currentPrice = parseFloat(currentPriceStr.replace(',', '.'));

    if (!url || !name || !categoryId || isNaN(currentPrice)) {
      return { success: false, message: 'Preencha todos os campos obrigatórios corretamente' };
    }

    // Upsert logic based on URL
    await (prisma.product as any).upsert({
      where: { url },
      update: {
        name,
        categoryId,
        currentPrice,
        description,
        imageUrl,
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

    revalidatePath('/admin/promotions');
    revalidatePath('/');
    return { success: true, message: 'Produto salvo com sucesso!' };
  } catch (error: any) {
    console.error('Error creating/updating product:', error);
    return { success: false, message: 'Erro ao salvar produto: ' + (error.message || 'Erro desconhecido') };
  }
}

export async function togglePromotionStatus(id: string, isActive: boolean) {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Não autorizado');
  }

  await (prisma.promotion as any).update({
    where: { id },
    data: { isActive } as any,
  });

  revalidatePath('/');
  revalidatePath('/admin/promotions');
}

export async function deletePromotion(id: string) {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, message: 'Não autorizado' };
  }

  try {
    await prisma.$executeRawUnsafe(
      'DELETE FROM "Promotion" WHERE "id" = $1',
      id
    );

    revalidatePath('/admin/promotions');
    revalidatePath('/');
    return { success: true, message: 'Promoção excluída com sucesso!' };
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return { 
      success: false, 
      message: 'Erro ao excluir no banco: ' + (error.message || 'Erro desconhecido')
    };
  }
}
