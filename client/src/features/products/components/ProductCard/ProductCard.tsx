import { memo } from 'react';
import styles from './ProductCard.module.css';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';

interface ProductCardProps {
    product: {
        name: string;
        price: number;
        images: string[];
        colors?: any[];
        tag?: string;
    };
}

const getTagClassName = (tagValue?: string) => {
    if (!tagValue) return '';

    const tagLower = tagValue.toLowerCase();
    if (tagLower === 'new') return styles.newTag;
    if (tagLower === 'limited edition') return styles.limitedTag;
    if (tagLower === 'hot') return styles.hotTag;

    return styles.tag;
};

const ProductCard = memo(({ product }: ProductCardProps) => {
    const { name, price, images, tag } = product;
    const [mainImage, hoverImage] = images;

    // Optimize images to WebP format
    const optimizedMainImage = getOptimizedImageUrl(mainImage);
    const optimizedHoverImage = getOptimizedImageUrl(hoverImage);

    return (
        <div className={styles.productCard}>
            <div
                className={styles.imageContainer}
                style={{
                    backgroundImage: `url(${optimizedHoverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <img src={optimizedMainImage} alt={name} loading="lazy" />
                <div className={styles.showNowButton}>Shop now</div>
            </div>
            <div className={styles.productInfo}>
                <h4>{name}</h4>
                <p className={styles.price}>${price.toFixed(2)}</p>
                {tag && <span className={`${styles.tag} ${getTagClassName(tag)}`}>{tag}</span>}
            </div>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
