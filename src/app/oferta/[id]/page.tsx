import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./OfferDetail.module.css";
import ShareButtons from "@/components/Share/ShareButtons";
import CommentSection from "@/components/Comments/CommentSection";
import Thermometer from "@/components/Thermometer/Thermometer";
import VoteControl from "@/components/Thermometer/VoteControl";
import ReportButton from "@/components/Report/ReportButton";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";
import { getPromotionRating, getUserVote } from "../vote-actions";
import { formatPrice } from "@/lib/utils";

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
  const originalPrice =
    product.currentPrice / (1 - (promotion.discountPercentage || 0) / 100);

  const rating = await getPromotionRating(id);
  const userVote = await getUserVote(id);

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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <span className={styles.categoryBadge}>
                  {product.category?.name}
                </span>
                <PaymentMethodIcon paymentMethod={promotion.paymentMethod} />
                <Thermometer level={rating.level} />
              </div>
              <h1 className={styles.productTitle}>{product.name}</h1>
            </div>

            <div className={styles.priceCard}>
              {Math.abs(originalPrice - product.currentPrice) > 0.01 && (
                <div className={styles.priceHeader}>
                  {promotion.discountPercentage && (
                    <span className={styles.discountTag}>
                      -{promotion.discountPercentage}% OFF
                    </span>
                  )}
                  <span className={styles.originalPrice}>
                    De {formatPrice(originalPrice)}
                  </span>
                </div>
              )}
              <div className={styles.currentPrice}>
                <span className={styles.currency}>R$</span>
                <span className={styles.value}>
                  {formatPrice(product.currentPrice).replace("R$ ", "")}
                </span>
              </div>

              {promotion.description && (
                <div className={styles.promoCallout}>
                  <strong>Destaque:</strong> {promotion.description}
                </div>
              )}

              <ShareButtons
                url={`https://barganito.com.br/oferta/${id}`}
                title={product.name}
              />

              <ReportButton promotionId={id} />

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
              <p>
                {product.description ||
                  "Nenhuma descrição detalhada disponível."}
              </p>
            </div>

            <VoteControl
              promotionId={id}
              initialVote={userVote}
              count={rating.count}
            />

            <CommentSection promotionId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
