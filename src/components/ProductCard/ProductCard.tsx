import styles from './ProductCard.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Thermometer from '../Thermometer/Thermometer';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const promotion = product.promotions?.[0];
  const hasPromo = !!promotion;
  const rating = product.rating || { level: 'OK', average: 2.0, count: 0 };

  return (
    <div className={`card ${styles.card}`}>
      {hasPromo && (
        <div className={styles.badge}>
          -{promotion.discountPercentage}%
        </div>
      )}
      
      <div className={styles.imageContainer}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className={styles.placeholder}>Imagem</div>
        )}
      </div>

      <div className={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
          <span className={styles.category}>{product.category?.name}</span>
          <Thermometer level={rating.level} showText={false} />
        </div>
        <h3 className={styles.title}>{product.name}</h3>
        
        <div className={styles.priceContainer}>
          <span className={styles.currentPrice}>
            R$ {product.currentPrice.toFixed(2)}
          </span>
          {hasPromo && (
            <span className={styles.originalPrice}>
              R$ {(product.currentPrice / (1 - promotion.discountPercentage / 100)).toFixed(2)}
            </span>
          )}
        </div>

        <div className={styles.footer}>
          {hasPromo ? (
            <Link 
              href={`/oferta/${promotion.id}`} 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}
            >
              Ir para Oferta
            </Link>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Ir para Oferta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
