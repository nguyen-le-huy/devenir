import { memo } from 'react';
import styles from './ProductCard.module.css';
import PropTypes from 'prop-types';
import { getOptimizedImageUrl } from '../../utils/imageOptimization';

const ProductCard = memo(({ product }) => {
    const { name, price, images, colors, tag } = product;
    const [mainImage, hoverImage] = images;

    // Optimize images to WebP format
    const optimizedMainImage = getOptimizedImageUrl(mainImage);
    const optimizedHoverImage = getOptimizedImageUrl(hoverImage);

    const getTagClassName = (tagValue) => {
        if (!tagValue) return '';

        const tagLower = tagValue.toLowerCase();
        if (tagLower === 'new') return styles.newTag;
        if (tagLower === 'limited edition') return styles.limitedTag;
        if (tagLower === 'hot') return styles.hotTag;

        return styles.tag;
    }

    return (
        <div className={styles.productCard}>
            <div className={styles.imageContainer} style={{
                backgroundImage: `url(${optimizedHoverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
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

export default ProductCard;