import styles from './AllCategories.module.css';
import { useQuery } from '@tanstack/react-query';
import { getMainCategories } from '../../services/categoryService';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import Loading from '../../components/Loading/Loading';

const AllCategories = () => {
    const navigate = useNavigate();

    // Fetch all categories
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['categories', 'all'],
        queryFn: getMainCategories,
    });

    const categories = categoriesData?.data || [];

    const handleCategoryClick = (categoryId) => {
        navigate(`/products?category=${categoryId}`);
    };

    if (isLoading) {
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
