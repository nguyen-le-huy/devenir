import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import styles from './VisuallySimilar.module.css';
import ScarfCard from '../../components/ProductCard/ScarfCard';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';

const VisuallySimilar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const headerHeight = useHeaderHeight();

    // Get data from navigation state
    const { uploadedImage, results = [], count = 0 } = location.state || {};

    // Transform results to match ScarfCard format
    const products = useMemo(() => {
        // Remove duplicates based on productName + color
        const uniqueMap = new Map();

        return results.filter(result => {
            const key = `${result.productName}_${result.color}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                return true;
            }
            return false;
        }).map(result => ({
            id: result.variantId,
            name: result.productName,
            price: result.price,
            image: result.mainImage || '/images/placeholder.png',
            imageHover: result.hoverImage || result.mainImage || '/images/placeholder.png',
            color: result.color,
            size: result.size,
            sku: result.sku,
            similarity: result.similarity,
            urlSlug: result.urlSlug
        }));
    }, [results]);

    // Handle back/search again
    const handleSearchAgain = () => {
        navigate(-1); // Go back to previous page
    };

    // If no results, show empty state
    if (!uploadedImage || products.length === 0) {
        return (
            <div className={styles.visuallySimilar}>
                <div className={styles.emptyState}>
                    <h2>No Results Found</h2>
                    <p>Try uploading a different image or go back to search.</p>
                    <button onClick={handleSearchAgain}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.visuallySimilar}>

            <div className={styles.yourImage}>
                <p className={styles.title}>Your Image:</p>
                <div className={styles.imageContainer}>
                    <img src={uploadedImage} alt="Your uploaded image" />
                </div>
            </div>

            <div className={styles.similarProducts}>
                <div className={styles.header} style={{ top: `${headerHeight}px` }}>
                    <p className={styles.title}>Visually Similar Products</p>
                    <span className={styles.count}>{products.length} items found</span>
                </div>

                <div className={styles.productList}>
                    {products.map((product) => (
                        <ScarfCard
                            key={product.id}
                            scarf={product}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VisuallySimilar;
