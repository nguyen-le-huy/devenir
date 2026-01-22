import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import styles from './ProductByCategory.module.css';
import Filter from '../../components/Filter/Filter.jsx';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';
import PageWrapper from '../../components/PageWrapper/PageWrapper.jsx';
import { useHeaderHeight } from '../../hooks/useHeaderHeight.js';
import { useCategoryById, useCategories } from '../../hooks/useCategories.js';
import { useColors } from '../../hooks/useColors.js';
import { createColorMap } from '../../services/colorService.js';
import { getVariantsByCategory, getVariantsByCategoryWithChildren } from '../../services/productService.js';
import { getOptimizedImageUrl } from '../../utils/imageOptimization.js';
import { useProductFilter } from '../../hooks/useProductFilter.js';

// Helper to transform variant to card props - moved outside to stable reference
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

const ProductByCategory = memo(() => {
    const headerHeight = useHeaderHeight();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryId = searchParams.get('category');
    const selectedSubcategory = searchParams.get('subcategory');

    // UI State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('Default');
    const [selectedColors, setSelectedColors] = useState([]);

    // Data Fetching
    const { data: allCategoriesData } = useCategories();
    const allCategories = useMemo(() => Array.isArray(allCategoriesData?.data) ? allCategoriesData.data : (Array.isArray(allCategoriesData) ? allCategoriesData : []), [allCategoriesData]);

    const { data: categoryData, isLoading: categoryLoading } = useCategoryById(categoryId);
    const category = useMemo(() => categoryData?.data || null, [categoryData]);

    const { data: variantsData = [], isLoading: variantsLoading, error } = useQuery({
        queryKey: ['variants-by-category', categoryId, selectedSubcategory, allCategories.length],
        queryFn: async () => {
            if (!categoryId) return [];
            if (selectedSubcategory) {
                return await getVariantsByCategory(selectedSubcategory);
            }
            return await getVariantsByCategoryWithChildren(categoryId, allCategories);
        },
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });

    const { data: colorsData } = useColors();
    const colorMap = useMemo(() => createColorMap(colorsData?.data || colorsData || []), [colorsData]);

    // Use Custom Hook for Filtering Logic
    const { availableColors, colorCounts, filteredVariants } = useProductFilter(variantsData, selectedSort, selectedColors);

    // Derived State
    const isFiltering = selectedSort !== 'Default' || selectedColors.length > 0;
    const hasThumbnail = category?.thumbnailUrl && !isFiltering && !selectedSubcategory;
    const firstFourVariants = hasThumbnail ? filteredVariants.slice(0, 4) : [];
    const remainingVariants = hasThumbnail ? filteredVariants.slice(4) : filteredVariants;
    const subcategories = useMemo(() => category?.children || [], [category]);

    // Handlers
    const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
    const handleCloseFilter = useCallback(() => setIsFilterOpen(false), []);

    const handleResetFilters = useCallback(() => {
        setSelectedSort('Default');
        setSelectedColors([]);
    }, []);

    const handleSubcategoryChange = useCallback((subcatId) => {
        const newParams = new URLSearchParams(searchParams);
        if (subcatId) {
            newParams.set('subcategory', subcatId);
        } else {
            newParams.delete('subcategory');
        }
        setSearchParams(newParams);
    }, [searchParams, setSearchParams]);

    // Reset filters on navigation
    useEffect(() => {
        handleResetFilters();
    }, [categoryId, selectedSubcategory, handleResetFilters]);

    // Calculate product variants map for color swatches
    const productVariantsMap = useMemo(() => {
        const map = new Map();
        variantsData.forEach(variant => {
            const productId = variant.productInfo?._id || variant.product;
            if (!productId) return;
            if (!map.has(productId)) map.set(productId, []);
            map.get(productId).push({ ...variant, productId });
        });
        return map;
    }, [variantsData]);

    const getColorVariants = useCallback((variant) => {
        const productId = variant.productInfo?._id || variant.product;
        return productVariantsMap.get(productId) || [];
    }, [productVariantsMap]);

    if (error) {
        return (
            <div className={styles.productByCategory}>
                <div className={styles.noProducts}>
                    <h2>Error loading products</h2>
                    <p>{error.message || 'Something went wrong.'}</p>
                </div>
            </div>
        );
    }

    if (!categoryId) {
        return <div className={styles.productByCategory}><h1 className={styles.title}>Please select a category</h1></div>;
    }

    return (
        <PageWrapper isLoading={categoryLoading || variantsLoading}>
            <div className={styles.productByCategory}>
                <h1 className={styles.title}>{category?.name || 'Products'}</h1>

                {subcategories.length > 0 && (
                    <div className={styles.category}>
                        <p className={!selectedSubcategory ? styles.active : ''} onClick={() => handleSubcategoryChange(null)} style={{ cursor: 'pointer' }}>All</p>
                        {subcategories.map((subcat) => (
                            <p key={subcat._id} className={selectedSubcategory === subcat._id ? styles.active : ''} onClick={() => handleSubcategoryChange(subcat._id)} style={{ cursor: 'pointer' }}>
                                {subcat.name}
                            </p>
                        ))}
                    </div>
                )}

                <div className={styles.countAndFilter} style={{ top: `${headerHeight}px` }}>
                    <span className={styles.count}>{filteredVariants.length} items</span>
                    <span className={styles.filter} onClick={handleOpenFilter}>Filter & Sort</span>
                </div>

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
                    {hasThumbnail && firstFourVariants.length > 0 && (
                        <div className={styles.topBox}>
                            <div className={styles.leftBox}>
                                {firstFourVariants.map((variant) => (
                                    <ScarfCard key={variant._id} scarf={transformVariantToProduct(variant)} colorVariants={getColorVariants(variant)} />
                                ))}
                            </div>
                            <div className={styles.rightBox} style={{ backgroundImage: `url('${getOptimizedImageUrl(category.thumbnailUrl)}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                                <div className={styles.content}>
                                    <h2>{category.description || category.name}</h2>
                                    <a href="#"><span>Shop Now</span><svg className={styles.linkGraphic} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path></svg></a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.productList}>
                        {remainingVariants.map((variant) => (
                            <ScarfCard key={variant._id} scarf={transformVariantToProduct(variant)} colorVariants={getColorVariants(variant)} />
                        ))}
                    </div>

                    {filteredVariants.length === 0 && variantsData.length > 0 && (
                        <div className={styles.noProducts}>
                            <p>No products match your current filters.</p>
                            <p>Try adjusting your filters or <button onClick={handleResetFilters} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, color: 'inherit' }}>clear all filters</button>.</p>
                        </div>
                    )}

                    {variantsData.length === 0 && (
                        <div className={styles.noProducts}>
                            <p>No products found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
});

ProductByCategory.displayName = 'ProductByCategory';

export default ProductByCategory;