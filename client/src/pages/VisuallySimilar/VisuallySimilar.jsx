import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useEffect, useState, useCallback } from 'react';
import styles from './VisuallySimilar.module.css';
import ScarfCard from '../../components/ProductCard/ScarfCard';
import PageWrapper from '../../components/PageWrapper/PageWrapper';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import { getOptimizedImageUrl } from '../../utils/imageOptimization';

const VisuallySimilar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const headerHeight = useHeaderHeight();
    const [imagesLoaded, setImagesLoaded] = useState(false);

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

    // Preload images
    const preloadImages = useCallback(async (imageUrls) => {
        const promises = imageUrls.map((url) => {
            return new Promise((resolve) => {
                if (!url) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                img.src = url;
            });
        });
        await Promise.all(promises);
        setImagesLoaded(true);
    }, []);

    // Start preloading when products are ready
    useEffect(() => {
        if (products.length > 0) {
            const imagesToPreload = [];
            
            // Add uploaded image
            if (uploadedImage) {
                imagesToPreload.push(uploadedImage);
            }
            
            // Add product images
            products.forEach(product => {
                if (product.image) {
                    imagesToPreload.push(getOptimizedImageUrl(product.image));
                }
                if (product.imageHover && product.imageHover !== product.image) {
                    imagesToPreload.push(getOptimizedImageUrl(product.imageHover));
                }
            });
            
            preloadImages([...new Set(imagesToPreload)]);
        } else {
            setImagesLoaded(true);
        }
    }, [products, uploadedImage, preloadImages]);

    // Scroll to top when new results are loaded
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [uploadedImage, results]);

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
        <PageWrapper isReady={imagesLoaded} trackImages={false}>
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
        </PageWrapper>
    );
};

export default VisuallySimilar;
