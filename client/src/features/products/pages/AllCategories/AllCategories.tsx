import styles from './AllCategories.module.css';
import { useQuery } from '@tanstack/react-query';
import { getMainCategories } from '@/features/products/api/categoryService';
import { useNavigate } from 'react-router-dom';
import Header from '@/shared/components/layout/Header/Header';
import Footer from '@/shared/components/layout/Footer/Footer';
import PageWrapper from '@/shared/components/PageWrapper/PageWrapper';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';

const AllCategories = () => {
    const navigate = useNavigate();

    // Fetch all categories
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['categories', 'all'],
        queryFn: getMainCategories,
    });

    const categories = (categoriesData as any)?.data || [];

    const handleCategoryClick = (categoryId: string) => {
        navigate(`/products?category=${categoryId}`);
    };

    return (
        <>
            <Header />
            <PageWrapper isLoading={isLoading}>
                <main className={styles.allCategories}>
                    <div className={styles.categoryGrid}>
                        {categories.map((category: any) => (
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
