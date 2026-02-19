import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./OfferDetail.module.css";

interface OfferPageProps {
  params: Promise<{ id: string }>;
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { id } = await params;

  const promotion = await (prisma as any).promotion.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!promotion) {
    notFound();
  }

  const { product } = promotion;
  const originalPrice = product.currentPrice / (1 - (promotion.discountPercentage || 0) / 100);

  return (
    <>
      <Sidebar />
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Voltar para as ofertas
        </Link>

        <div className={styles.grid}>
          {/* Coluna da Imagem */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} />
              ) : (
                <div className={styles.placeholder}>Sem Imagem</div>
              )}
            </div>
          </div>

          {/* Coluna do Conteúdo */}
          <div className={styles.contentSection}>
            <div className={styles.headerInfo}>
              <span className={styles.categoryBadge}>{product.category?.name}</span>
              <h1 className={styles.productTitle}>{product.name}</h1>
            </div>

            <div className={styles.priceCard}>
              <div className={styles.priceHeader}>
                {promotion.discountPercentage && (
                  <span className={styles.discountTag}>-{promotion.discountPercentage}% OFF</span>
                )}
                <span className={styles.originalPrice}>De R$ {originalPrice.toFixed(2)}</span>
              </div>
              <div className={styles.currentPrice}>
                <span className={styles.currency}>R$</span>
                <span className={styles.value}>{product.currentPrice.toFixed(2)}</span>
              </div>
              
              {promotion.description && (
                <div className={styles.promoCallout}>
                  <strong>Destaque:</strong> {promotion.description}
                </div>
              )}

              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.buyButton}
              >
                Ir para a Loja
              </a>
            </div>

            <div className={styles.descriptionSection}>
              <h3>Sobre este produto</h3>
              <p>{product.description || "Nenhuma descrição disponível para este produto."}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
