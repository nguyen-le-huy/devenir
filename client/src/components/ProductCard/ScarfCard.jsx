import styles from './ScarfCard.module.css';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl, ImagePresets, getLazyLoadProps } from '../../utils/imageOptimization.js';

const ScarfCard = ({ scarf }) => {
    // Optimize images with Cloudinary transformations
    const optimizedMainImage = getOptimizedImageUrl(scarf.image, ImagePresets.thumbnail);
    const optimizedHoverImage = getOptimizedImageUrl(scarf.imageHover, ImagePresets.thumbnail);

    return (
        <Link
            to={`/product-detail?variant=${scarf.id}`}
            className={styles.scarfCard}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.imageWrapper}>
                <img
                    src={optimizedMainImage}
                    alt={scarf.name}
                    className={styles.imageDefault}
                    {...getLazyLoadProps()}
                />
                <img
                    src={optimizedHoverImage}
                    alt={`${scarf.name} hover`}
                    className={styles.imageHover}
                    {...getLazyLoadProps()}
                />
            </div>
            <div className={styles.scarfInfo}>
                <h4 className={styles.scarfName}>{scarf.name}</h4>
                <p className={styles.scarfPrice}>${scarf.price}</p>
            </div>
        </Link>
    );
};

export default ScarfCard;