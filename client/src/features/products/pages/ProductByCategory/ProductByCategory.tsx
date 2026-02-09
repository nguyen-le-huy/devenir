import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './ProductByCategory.module.css';
import Filter from '@/features/products/components/Filter/Filter';
import ScarfCard from '@/features/products/components/ProductCard/ScarfCard';
import PageWrapper from '@/shared/components/PageWrapper/PageWrapper';
import { useHeaderHeight } from '@/shared/hooks/useHeaderHeight';
import { useCategoryById, useCategories } from '@/features/products/hooks/useCategories';
import { useColors } from '@/features/products/hooks/useColors';
import { createColorMap } from '@/features/products/api/colorService';
import { getVariantsByCategory, getVariantsByCategoryWithChildren } from '@/features/products/api/productService';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import { useProductFilter } from '@/features/products/hooks/useProductFilter';
import { getColorName } from '@/features/products/utils/productUtils';
import type { IEnrichedVariant } from '@/features/products/types';
import { useImagePreloader } from '@/shared/hooks/useImagePreloader';

const ProductByCategory = memo(() => {
    const headerHeight = useHeaderHeight();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryId = searchParams.get('category');
    const selectedSubcategory = searchParams.get('subcategory');

    // UI State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('Default');
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    // Data Fetching
    const { data: allCategoriesData } = useCategories();
    const allCategories = useMemo(() => Array.isArray((allCategoriesData as any)?.data) ? (allCategoriesData as any).data : (Array.isArray(allCategoriesData) ? allCategoriesData : []), [allCategoriesData]);

    const { data: categoryData, isLoading: categoryLoading } = useCategoryById(categoryId || '');
    const category = useMemo(() => (categoryData as any)?.data || null, [categoryData]);



    const { data: variantsData = [], isLoading: variantsLoading, error } = useQuery({
        queryKey: ['variants-by-category', categoryId, selectedSubcategory, allCategories.length],
        queryFn: async () => {
            if (!categoryId) return [];
            if (selectedSubcategory) {
                return await getVariantsByCategory(selectedSubcategory);
            }
            return await getVariantsByCategoryWithChildren(categoryId, allCategories as any[]);
        },
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000,
        // REMOVED: placeholderData: keepPreviousData to prevent stale images
    });

    const { data: colorsData } = useColors();
    const colorMap = useMemo(() => createColorMap((colorsData as any)?.data || colorsData || []), [colorsData]);

    // Use Custom Hook for Filtering Logic
    const { availableColors, colorCounts, filteredVariants } = useProductFilter(variantsData as any[], selectedSort, selectedColors);

    // Derived State
    const isFiltering = selectedSort !== 'Default' || selectedColors.length > 0;
    const hasThumbnail = category?.thumbnailUrl && !isFiltering && !selectedSubcategory;

    // Memoize split lists to avoid recalculation
    const { firstFourVariants, remainingVariants } = useMemo(() => {
        const firstFour = hasThumbnail ? filteredVariants.slice(0, 4) : [];
        const remaining = hasThumbnail ? filteredVariants.slice(4) : filteredVariants;
        return { firstFourVariants: firstFour, remainingVariants: remaining };
    }, [hasThumbnail, filteredVariants]);

    const subcategories = useMemo(() => category?.children || [], [category]);

    // IMAGE PRELOADINGLOGIC
    // We want to block the loading screen until:
    // 1. Data is fetched (variantsLoading = false)
    // 2. Critical images are loaded (Hero + Top 8 products)
    const criticalImages = useMemo(() => {
        if (!variantsData || variantsData.length === 0) return [];

        const images: string[] = [];

        // 1. Category Thumbnail
        if (hasThumbnail && category?.thumbnailUrl) {
            images.push(getOptimizedImageUrl(category.thumbnailUrl));
        }

        // 2. Top Products (First 8 items cover most screens)
        const topVariants = filteredVariants.slice(0, 8);
        topVariants.forEach((v: any) => {
            if (v.image) images.push(v.image);
        });

        return images;
    }, [variantsData, hasThumbnail, category, filteredVariants]);

    // Use custom hook to track image loading state
    // Only enabled when variants data is actually present to preload
    const areImagesLoaded = useImagePreloader(
        criticalImages,
        !variantsLoading && !categoryLoading && criticalImages.length > 0
    );

    // Handlers
    const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
    const handleCloseFilter = useCallback(() => setIsFilterOpen(false), []);

    const handleResetFilters = useCallback(() => {
        setSelectedSort('Default');
        setSelectedColors([]);
    }, []);

    const handleSubcategoryChange = useCallback((subcatId: string | null) => {
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
        (variantsData as IEnrichedVariant[]).forEach(variant => {
            const productId = variant.productInfo?._id || variant.product_id;
            if (!productId) return;
            if (!map.has(productId)) map.set(productId, []);
            const colorName = getColorName(variant.color);
            map.get(productId).push({
                ...variant,
                colorHex: colorMap[colorName] || '#ccc'
            });
        });
        return map;
    }, [variantsData, colorMap]);

    const getColorVariants = useCallback((variant: IEnrichedVariant) => {
        const productId = variant.productInfo?._id || variant.product_id;
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

    // Loading State: API fetching OR Image Preloading
    // Only show content when both are ready for visual perfection
    const isPageLoading = categoryLoading || variantsLoading || !areImagesLoaded;

    return (
        <PageWrapper isLoading={isPageLoading}>
            <div className={styles.productByCategory}>
                <h1 className={styles.title}>{category?.name || 'Products'}</h1>

                {subcategories.length > 0 && (
                    <div className={styles.category}>
                        <p className={!selectedSubcategory ? styles.active : ''} onClick={() => handleSubcategoryChange(null)} style={{ cursor: 'pointer' }}>All</p>
                        {subcategories.map((subcat: any) => (
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
                                    <ScarfCard key={variant._id} scarf={variant} colorVariants={getColorVariants(variant)} />
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
                            <ScarfCard key={variant._id} scarf={variant} colorVariants={getColorVariants(variant)} />
                        ))}
                    </div>

                    {filteredVariants.length === 0 && (variantsData as any[]).length > 0 && (
                        <div className={styles.noProducts}>
                            <p>No products match your current filters.</p>
                            <p>Try adjusting your filters or <button onClick={handleResetFilters} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, color: 'inherit' }}>clear all filters</button>.</p>
                        </div>
                    )}

                    {(variantsData as any[]).length === 0 && (
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
