
import { FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './ChatMessage.module.css';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import type { SuggestedProduct } from '../types';

interface ChatProductCardProps {
    product: SuggestedProduct;
}

const ChatProductCard: FC<ChatProductCardProps> = ({ product }) => {
    const formatPrice = (price: number): string => {
        return '$' + new Intl.NumberFormat('en-US').format(price);
    };

    return (
        <Link
            to={`/product-detail?variant=${product.variantId || product._id}`}
            className={`${styles.productCard} ${!product.inStock ? styles.outOfStock : ''}`}
        >
            {product.mainImage && (
                <div className={styles.imageWrapper}>
                    <img
                        src={getOptimizedImageUrl(product.mainImage)}
                        alt={product.name}
                        loading="lazy"
                    />
                    {!product.inStock && (
                        <div className={styles.outOfStockOverlay}>
                            <span>Hết hàng</span>
                        </div>
                    )}
                </div>
            )}
            <div className={styles.productInfo}>
                <span className={styles.productName}>{product.name}</span>
                <span className={styles.productPrice}>
                    {product.minPrice === product.maxPrice
                        ? formatPrice(product.minPrice)
                        : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`}
                </span>
            </div>
        </Link>
    );
};

export default ChatProductCard;
