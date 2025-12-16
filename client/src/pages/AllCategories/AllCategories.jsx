import styles from './AllCategories.module.css';
import { useQuery } from '@tanstack/react-query';
import { getMainCategories } from '../../services/categoryService';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import Loading from '../../components/Loading/Loading';

const AllCategories = () => {
    const navigate = useNavigate();
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Fetch all categories
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['categories', 'all'],
        queryFn: getMainCategories,
    });

    const categories = categoriesData?.data || [];

    // Preload all category images
    const preloadImages = useCallback(async (imageUrls) => {
        const promises = imageUrls.map((url) => {
            return new Promise((resolve) => {
                if (!url) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve; // Still resolve on error to continue
                img.src = url;
            });
        });

        await Promise.all(promises);
        setImagesLoaded(true);
    }, []);

    // Start preloading when categories are fetched
    useEffect(() => {
        if (categories.length > 0) {
            const imageUrls = categories
                .map((cat) => cat.thumbnailUrl)
                .filter(Boolean);

            if (imageUrls.length > 0) {
                preloadImages(imageUrls);
            } else {
                // No images to load
                setImagesLoaded(true);
            }
        }
    }, [categories, preloadImages]);

    const handleCategoryClick = (categoryId) => {
        navigate(`/products?category=${categoryId}`);
    };

    // Show loading if data is loading OR images are not ready
    if (isLoading || (categories.length > 0 && !imagesLoaded)) {
        return (
            <>
                <Header />
                <Loading />
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className={styles.allCategories}>
                <div className={styles.categoryGrid}>
                    {categories.map((category) => (
                        <div
                            key={category._id}
                            className={styles.box}
                            style={{
                                backgroundImage: category.thumbnailUrl
                                    ? `url(${category.thumbnailUrl})`
                                    : `linear-gradient(135deg, #5C4439 0%, #3d2d26 100%)`
                            }}
                            onClick={() => handleCategoryClick(category._id)}
                        >
                            <div className={styles.contentBox}>
                                <h2 className={styles.title}>{category.name}</h2>
                                <p className={styles.description}>
                                    {category.description || 'Discover timeless craftsmanship and modern silhouettes for the season ahead.'}
                                </p>
                                <span className={styles.link}>Shop Now</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default AllCategories;
