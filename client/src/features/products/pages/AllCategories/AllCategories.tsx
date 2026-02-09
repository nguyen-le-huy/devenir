import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/shared/components/layout/Header/Header';
import Footer from '@/shared/components/layout/Footer/Footer';
import PageWrapper from '@/shared/components/PageWrapper/PageWrapper';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import { useMainCategories } from '@/features/products/hooks/useCategories';
import { useImagePreloader } from '@/shared/hooks/useImagePreloader';
import type { ICategory } from '@/features/products/types';
import styles from './AllCategories.module.css';

const AllCategories = () => {
    const navigate = useNavigate();

    // Fetch all main categories using standard hook
    const { data: response, isLoading: isCategoriesLoading } = useMainCategories();

    const categories = useMemo(() => {
        return (response?.data || []) as ICategory[];
    }, [response]);

    // IMAGE PRELOADING (Visual-First Strategy)
    // Preload all category thumbnails to ensure instant, glitch-free grid display
    const categoryImages = useMemo(() => {
        return categories
            .filter(cat => cat.thumbnailUrl)
            .map(cat => getOptimizedImageUrl(cat.thumbnailUrl!));
    }, [categories]);

    // Since main categories are few (typically < 10), preloading all of them provides
    // a much more premium feel than lazy loading them individually.
    const areImagesLoaded = useImagePreloader(categoryImages, !isCategoriesLoading && categoryImages.length > 0);

    const handleCategoryClick = useCallback((categoryId: string) => {
        navigate(`/products?category=${categoryId}`);
    }, [navigate]);

    // Combined loading state
    const isPageLoading = isCategoriesLoading || !areImagesLoaded;

    return (
        <>
            <Header />
            <PageWrapper isLoading={isPageLoading}>
                <main className={styles.allCategories}>
                    <div className={styles.categoryGrid}>
                        {categories.map((category) => (
                            <div
                                key={category._id}
                                className={styles.box}
                                style={{
                                    backgroundImage: category.thumbnailUrl
                                        ? `url(${getOptimizedImageUrl(category.thumbnailUrl)})`
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
            </PageWrapper>
            <Footer />
        </>
    );
};

export default AllCategories;
