import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styles from './ProductByCategory.module.css';
import Filter from '../../components/Filter/Filter.jsx';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import { useHeaderHeight } from '../../hooks/useHeaderHeight.js';
import { getVariantsByCategory } from '../../services/productService.js';
import { getCategoryById } from '../../services/categoryService.js';
import { getAllColors, createColorMap } from '../../services/colorService.js';

const ProductByCategory = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [variants, setVariants] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedSort, setSelectedSort] = useState('Default');
    const [selectedColors, setSelectedColors] = useState([]);

    // Color data từ DB
    const [colors, setColors] = useState([]);
    const [colorMap, setColorMap] = useState({});

    const headerHeight = useHeaderHeight();

    // Lấy categoryId từ URL query params
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('category');

    // Fetch colors từ DB
    useEffect(() => {
        const fetchColors = async () => {
            try {
                const response = await getAllColors();
                const colorsData = response.data || response;
                setColors(colorsData);
                setColorMap(createColorMap(colorsData));
            } catch (error) {
                console.error('Error fetching colors:', error);
            }
        };

        fetchColors();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!categoryId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch category info
                const categoryResponse = await getCategoryById(categoryId);
                if (categoryResponse.data) {
                    setCategory(categoryResponse.data);
                }

                // Fetch variants by category
                const variantsData = await getVariantsByCategory(categoryId);
                setVariants(variantsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setVariants([]);
                setCategory(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Reset filters khi category thay đổi
        setSelectedSort('Default');
        setSelectedColors([]);
    }, [categoryId]);

    const handleOpenFilter = () => {
        setIsFilterOpen(true);
    };

    const handleCloseFilter = () => {
        setIsFilterOpen(false);
    };

    // Extract unique colors from variants
    const availableColors = [...new Set(variants.map(v => v.color))].filter(Boolean);

    // Count variants per color
    const colorCounts = {};
    variants.forEach(variant => {
        if (variant.color) {
            colorCounts[variant.color] = (colorCounts[variant.color] || 0) + 1;
        }
    });

    // Apply filters and sorting
    const getFilteredAndSortedVariants = () => {
        let filtered = [...variants];

        // 1. Apply color filter
        if (selectedColors.length > 0) {
            filtered = filtered.filter(v => selectedColors.includes(v.color));
        }

        // 2. Apply sorting
        switch (selectedSort) {
            case 'Price High':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'Price Low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'New In':
                // Sort by createdAt if available, otherwise by _id (MongoDB ObjectId contains timestamp)
                filtered.sort((a, b) => {
                    const dateA = a.createdAt || a._id;
                    const dateB = b.createdAt || b._id;
                    return dateB > dateA ? 1 : -1;
                });
                break;
            default:
                // 'Default' - keep original order
                break;
        }

        return filtered;
    };

    const filteredVariants = getFilteredAndSortedVariants();

    // Check if filters are active
    const isFiltering = selectedSort !== 'Default' || selectedColors.length > 0;

    // Logic hiển thị: Nếu đang filter thì ẩn topBox
    const hasThumbnail = category?.thumbnailUrl && !isFiltering;

    // 4 variants đầu tiên cho leftBox (chỉ khi có thumbnail VÀ không filter)
    const firstFourVariants = hasThumbnail ? filteredVariants.slice(0, 4) : [];

    // Các variants còn lại cho productList
    const remainingVariants = hasThumbnail ? filteredVariants.slice(4) : filteredVariants;

    // Transform variant data để phù hợp với ScarfCard component
    const transformVariantToProduct = (variant) => ({
        id: variant._id,
        name: variant.productInfo?.name || 'Unknown Product',
        price: variant.price,
        image: variant.mainImage || '/images/placeholder.png',
        imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
        color: variant.color,
        size: variant.size,
        sku: variant.sku,
    });

    if (loading) {
        return (
            <div className={styles.productByCategory}>
                <Loading />
            </div>
        );
    }

    if (!categoryId) {
        return (
            <div className={styles.productByCategory}>
                <h1 className={styles.title}>Please select a category</h1>
            </div>
        );
    }

    return (
        <div className={styles.productByCategory}>
            <h1 className={styles.title}>{category?.name || 'Products'}</h1>
            <div className={styles.category}>
                <p className={styles.active}>All</p>
                <p>Cashmere Scarves</p>
                <p>Wool Scarves</p>
                <p>Silk Scarves</p>
            </div>

            <div className={styles.countAndFilter} style={{ top: `${headerHeight}px` }}>
                <span className={styles.count}>{filteredVariants.length} items</span>
                <span className={styles.filter} onClick={handleOpenFilter}>
                    Filter & Sort
                </span>
            </div>

            {/* Filter Component */}
            <Filter
                isOpen={isFilterOpen}
                onClose={handleCloseFilter}
                availableColors={availableColors}
                colorMap={colorMap}
                colorCounts={colorCounts}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                totalResults={filteredVariants.length}
            />

            <div className={styles.productContainer}>
                {/* Chỉ hiển thị topBox nếu category có thumbnail */}
                {hasThumbnail && firstFourVariants.length > 0 && (
                    <div className={styles.topBox}>
                        <div className={styles.leftBox}>
                            {firstFourVariants.map((variant) => (
                                <ScarfCard
                                    key={variant._id}
                                    scarf={transformVariantToProduct(variant)}
                                />
                            ))}
                        </div>
                        <div className={styles.rightBox}
                            style={{
                                backgroundImage: `url('${category.thumbnailUrl}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            <div className={styles.content}>
                                <h2>{category.description || category.name}</h2>
                                <a href="#">
                                    <span>Shop Now</span>
                                    <svg
                                        className={styles.linkGraphic}
                                        width="300%"
                                        height="100%"
                                        viewBox="0 0 1200 60"
                                        preserveAspectRatio="none"
                                    >
                                        <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product List - hiển thị tất cả nếu không có thumbnail, hoặc variants còn lại */}
                <div className={styles.productList}>
                    {remainingVariants.map((variant) => (
                        <ScarfCard
                            key={variant._id}
                            scarf={transformVariantToProduct(variant)}
                        />
                    ))}
                </div>

                {/* Hiển thị message nếu không có products */}
                {variants.length === 0 && (
                    <div className={styles.noProducts}>
                        <p>No products found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductByCategory;