import styles from './ScarfCard.module.css';
import { Link } from 'react-router-dom';
import { getLazyLoadProps } from '../../utils/imageOptimization.js';

const ScarfCard = ({ scarf }) => {
    // Use original images without optimization for 100% quality
    return (
        <Link
            to={`/product-detail?variant=${scarf.id}`}
            className={styles.scarfCard}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.imageWrapper}>
                <img
                    src={scarf.image}
                    alt={scarf.name}
                    className={styles.imageDefault}
                    {...getLazyLoadProps()}
                />
                <img
                    src={scarf.imageHover}
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