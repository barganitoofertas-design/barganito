import styles from "./ProductCard.module.css";
import Link from "next/link";
import Thermometer from "../Thermometer/Thermometer";
import PaymentMethodIcon from "../PaymentMethodIcon";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const promotion = product.promotions?.[0];
  const hasPromo = !!promotion;
  const rating = product.rating || { level: "OK", average: 2.0, count: 0 };

  return (
    <div className={`card ${styles.card}`}>
      {hasPromo && promotion.discountPercentage && (
        <div className={styles.badge}>-{promotion.discountPercentage}%</div>
      )}
      {hasPromo && promotion.paymentMethod && (
        <PaymentMethodIcon
          paymentMethod={promotion.paymentMethod}
          className={styles.paymentMethodBadge}
          showText={false}
        />
      )}
      <div className={styles.imageContainer}>
        {hasPromo ? (
          <Link href={`/oferta/${promotion.id}`}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>Imagem</div>
            )}
          </Link>
        ) : (
          <>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>Imagem</div>
            )}
          </>
        )}
      </div>

      <div className={styles.content}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.2rem",
          }}
        >
          <span className={styles.category}>{product.category?.name}</span>
          <Thermometer level={rating.level} showText={false} />
        </div>
        <h3 className={styles.title}>{product.name}</h3>

        <div className={styles.priceContainer}>
          <span className={styles.currentPrice}>
            {formatPrice(product.currentPrice)}
          </span>
          {hasPromo &&
            Math.abs(
              product.currentPrice -
                product.currentPrice / (1 - promotion.discountPercentage / 100),
            ) > 0.01 && (
              <span className={styles.originalPrice}>
                {formatPrice(
                  product.currentPrice /
                    (1 - promotion.discountPercentage / 100),
                )}
              </span>
            )}
        </div>

        <div className={styles.footer}>
          {hasPromo ? (
            <Link
              href={`/oferta/${promotion.id}`}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              Ver Oferta
            </Link>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Ver Oferta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
