import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './ProductByCategory.module.css';
import Filter from '../../components/Filter/Filter.jsx';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import { useHeaderHeight } from '../../hooks/useHeaderHeight.js';
import { useCategoryById, useCategories } from '../../hooks/useCategories.js';
import { useColors } from '../../hooks/useColors.js';
import { createColorMap } from '../../services/colorService.js';
import { getVariantsByCategory, getVariantsByCategoryWithChildren } from '../../services/productService.js';

const ProductByCategory = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter states
    const [selectedSort, setSelectedSort] = useState('Default');
    const [selectedColors, setSelectedColors] = useState([]);

    const headerHeight = useHeaderHeight();

    // Lấy categoryId và subcategory từ URL query params
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('category');
    const selectedSubcategory = searchParams.get('subcategory');

    // Fetch all categories to find subcategories
    const { data: allCategoriesData } = useCategories();

    // Parse categories array
    const allCategories = useMemo(() => {
        if (allCategoriesData?.data) {
            return allCategoriesData.data;
        } else if (Array.isArray(allCategoriesData)) {
            return allCategoriesData;
        }
        return [];
    }, [allCategoriesData]);

    // Fetch data using React Query hooks
    const { data: categoryData, isLoading: categoryLoading } = useCategoryById(categoryId);

    // Fetch variants from category (with or without children based on selection)
    const { data: variantsData = [], isLoading: variantsLoading, error } = useQuery({
        queryKey: ['variants-by-category', categoryId, selectedSubcategory, allCategories.length],
        queryFn: async () => {
            if (!categoryId) return [];

            // Nếu chọn subcategory cụ thể, chỉ lấy variants từ subcategory đó
            if (selectedSubcategory) {
                return await getVariantsByCategory(selectedSubcategory);
            }

            // Nếu chọn "All", lấy variants từ parent category + tất cả subcategories
            return await getVariantsByCategoryWithChildren(categoryId, allCategories);
        },
        enabled: !!categoryId && allCategories.length > 0,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });

    const { data: colorsData } = useColors();

    // Memoize expensive calculations
    const colors = useMemo(() => colorsData?.data || colorsData || [], [colorsData]);
    const colorMap = useMemo(() => createColorMap(colors), [colors]);
    const category = useMemo(() => categoryData?.data || null, [categoryData]);
    const variants = useMemo(() => variantsData || [], [variantsData]);

    const loading = categoryLoading || variantsLoading;

    // Reset filters khi category hoặc subcategory thay đổi
    useEffect(() => {
        setSelectedSort('Default');
        setSelectedColors([]);
    }, [categoryId, selectedSubcategory]);

    const handleOpenFilter = () => {
        setIsFilterOpen(true);
    };

    const handleCloseFilter = () => {
        setIsFilterOpen(false);
    };

    // Create a map of productId -> all variants with different colors
    // This is used to show color swatches on each card
    const productVariantsMap = useMemo(() => {
        const map = new Map();

        variants.forEach(variant => {
            const productId = variant.productInfo?._id || variant.product;
            if (!productId) return;

            if (!map.has(productId)) {
                map.set(productId, []);
            }

            // Add variant with color info
            map.get(productId).push({
                _id: variant._id,
                id: variant._id,
                color: variant.color,
                colorHex: colorMap[variant.color] || '#ccc',
                mainImage: variant.mainImage,
                hoverImage: variant.hoverImage || variant.mainImage,
                price: variant.price,
                name: variant.productInfo?.name,
                productId: productId
            });
        });

        return map;
    }, [variants, colorMap]);

    // Memoize filtered data calculations
    const { availableColors, colorCounts, filteredVariants } = useMemo(() => {
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
        let filtered = [...variants];

        // 1. Apply color filter
        if (selectedColors.length > 0) {
            filtered = filtered.filter(v => selectedColors.includes(v.color));
        }

        // 2. Remove duplicate product+color combinations (keep only one variant per product-color)
        // Group by productId + color, only show one variant even if there are multiple sizes
        const uniqueMap = new Map();
        filtered = filtered.filter(variant => {
            const productId = variant.productInfo?._id || variant.product;
            const key = `${productId}_${variant.color}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                return true;
            }
            return false;
        });

        // 3. Apply sorting
        switch (selectedSort) {
            case 'Price High':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'Price Low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'New In':
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

        return { availableColors, colorCounts, filteredVariants: filtered };
    }, [variants, selectedColors, selectedSort]);

    // Check if filters are active
    const isFiltering = selectedSort !== 'Default' || selectedColors.length > 0;

    // Logic hiển thị: Chỉ hiển thị topBox khi:
    // 1. Category có thumbnail
    // 2. Không đang filter
    // 3. Không đang chọn subcategory (đang ở "All")
    const hasThumbnail = category?.thumbnailUrl && !isFiltering && !selectedSubcategory;

    // 4 variants đầu tiên cho leftBox (chỉ khi có thumbnail VÀ không filter VÀ không chọn subcategory)
    const firstFourVariants = hasThumbnail ? filteredVariants.slice(0, 4) : [];

    // Các variants còn lại cho productList
    const remainingVariants = hasThumbnail ? filteredVariants.slice(4) : filteredVariants;

    // Transform variant data để phù hợp với ScarfCard component
    const transformVariantToProduct = (variant) => {
        const productId = variant.productInfo?._id || variant.product;
        return {
            id: variant._id,
            name: variant.productInfo?.name || 'Unknown Product',
            price: variant.price,
            image: variant.mainImage || '/images/placeholder.png',
            imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            productId: productId,
        };
    };

    // Get color variants for a product
    const getColorVariants = (variant) => {
        const productId = variant.productInfo?._id || variant.product;
        return productVariantsMap.get(productId) || [];
    };

    // Extract subcategories from category data (must be before early returns)
    const subcategories = useMemo(() => {
        return category?.children || [];
    }, [category]);

    if (loading) {
        return (
            <div className={styles.productByCategory}>
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.productByCategory}>
                <div className={styles.noProducts}>
                    <h2>Error loading products</h2>
                    <p>{error.message || 'Something went wrong. Please try again later.'}</p>
                </div>
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

            {/* Only show subcategories if they exist */}
            {subcategories.length > 0 && (
                <div className={styles.category}>
                    <p
                        className={!selectedSubcategory ? styles.active : ''}
                        onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('subcategory');
                            window.location.search = newParams.toString();
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        All
                    </p>
                    {subcategories.map((subcat) => (
                        <p
                            key={subcat._id}
                            className={selectedSubcategory === subcat._id ? styles.active : ''}
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.set('subcategory', subcat._id);
                                window.location.search = newParams.toString();
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {subcat.name}
                        </p>
                    ))}
                </div>
            )}

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
                                    colorVariants={getColorVariants(variant)}
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
                            colorVariants={getColorVariants(variant)}
                        />
                    ))}
                </div>

                {/* Hiển thị message nếu không có products sau khi filter */}
                {filteredVariants.length === 0 && variants.length > 0 && (
                    <div className={styles.noProducts}>
                        <p>No products match your current filters.</p>
                        <p>Try adjusting your filters or <button
                            onClick={() => {
                                setSelectedSort('Default');
                                setSelectedColors([]);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 0,
                                color: 'inherit'
                            }}
                        >clear all filters</button>.</p>
                    </div>
                )}

                {/* Hiển thị message nếu category không có products */}
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