import { useState, useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import { trackEvent } from '@/shared/utils/eventTracker';
import { useProductTracking } from '@/core/hooks/useTracking';
import { useVariantById } from './useProducts';
import { getVariantsByCategoryWithChildren } from '@/features/products/api/productService';
import { getColorName, getCloudinaryPublicId } from '@/features/products/utils/productUtils';
import type {
    IProduct,
    IVariant,
    ICategory,
    IEnrichedVariant,
    IGalleryData,
} from '@/features/products/types';

/**
 * Product Detail Logic Hooks
 * Separated from UI components for better testability
 */

// ============================================
// Constants
// ============================================

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

const STALE_TIMES = {
    RELATED_PRODUCTS: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================
// Hooks
// ============================================

/**
 * Hook to manage product view logic including data fetching and tracking
 */
export const useProductView = (variantId: string) => {
    const { data: productData, isLoading, error } = useVariantById(variantId);

    const variant = productData?.variant as IVariant | undefined;
    const product = productData?.product as IProduct | undefined;
    const siblingVariants = (productData?.siblingVariants || []) as IVariant[];

    // Track product view event
    useEffect(() => {
        if (variant && product) {
            trackEvent.productView({
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                category: product.category?.name || 'Unknown',
                brand: product.brand?.name || 'Unknown',
                color: getColorName(variant.color),
                size: variant.size || 'Free Size',
                price: variant.salePrice || variant.basePrice,
                sku: variant.sku,
            });
        }
    }, [variant, product]);

    // Track active time on product
    useProductTracking(
        product
            ? {
                _id: product._id,
                name: product.name,
                category: product.category?.name,
                basePrice: variant?.price || product.basePrice,
            }
            : null,
        variant?.size,
        getColorName(variant?.color || variant?.colorName)
    );

    return { variant, product, siblingVariants, isLoading, error, productData };
};

/**
 * Hook to manage product gallery logic
 */
export const useGallery = (
    variant: IVariant | undefined,
    _headerHeight?: number
): IGalleryData & {
    rightRef: React.RefObject<HTMLDivElement | null>;
    initialRightHeight: number | null;
} => {
    const [initialRightHeight, setInitialRightHeight] = useState<number | null>(null);
    const rightRef = useRef<HTMLDivElement | null>(null);

    // Image logic
    const { mainImage, otherImages, allGalleryImages } = useMemo(() => {
        const rawMain = variant?.mainImage || PLACEHOLDER_IMAGE;
        const mainId = getCloudinaryPublicId(rawMain);
        const rawOther = (variant?.images || []).filter(
            (img: string) => getCloudinaryPublicId(img) !== mainId
        );

        return {
            mainImage: getOptimizedImageUrl(rawMain),
            otherImages: rawOther.map((img: string) => getOptimizedImageUrl(img)),
            allGalleryImages: [
                getOptimizedImageUrl(rawMain),
                ...rawOther.map((img: string) => getOptimizedImageUrl(img)),
            ],
        };
    }, [variant]);

    // Reset height when variant changes
    useLayoutEffect(() => {
        setInitialRightHeight(null);
    }, [variant?._id]);

    // Calculate initial right panel height for sticky behavior
    useLayoutEffect(() => {
        if (rightRef.current && !initialRightHeight && variant) {
            requestAnimationFrame(() => {
                const height = rightRef.current?.offsetHeight;
                if (height && height > 0) {
                    setInitialRightHeight(height);
                }
            });
        }
    }, [variant, initialRightHeight]);

    const imageCount = allGalleryImages.length;

    return {
        mainImage,
        otherImages,
        allGalleryImages,
        isSingleImage: imageCount === 1,
        isFewImages: imageCount <= 2,
        rightRef,
        initialRightHeight,
    };
};

/**
 * Hook to fetch and manage related products
 * Returns IEnrichedVariant[] for direct use with ProductCarousel/ScarfCard
 */
export const useRelatedProducts = (
    product: IProduct | undefined,
    allCategories: ICategory[]
): IEnrichedVariant[] => {
    // Get parent category ID
    const parentCategoryId = useMemo(() => {
        if (!product?.category) return null;

        const category = product.category;
        const parentCategory = category.parentCategory;

        if (typeof parentCategory === 'object' && parentCategory?._id) {
            return parentCategory._id;
        }
        if (typeof parentCategory === 'string') {
            return parentCategory;
        }

        return category._id;
    }, [product]);

    // Fetch related variants using query key factory
    const { data: variantsData } = useQuery<IEnrichedVariant[]>({
        queryKey: queryKeys.variants.categoryWithChildren(parentCategoryId || ''),
        queryFn: () =>
            getVariantsByCategoryWithChildren(parentCategoryId!, allCategories),
        enabled: !!parentCategoryId && allCategories.length > 0,
        staleTime: STALE_TIMES.RELATED_PRODUCTS,
    });

    // Filter to get unique products (exclude current product)
    const relatedProducts = useMemo((): IEnrichedVariant[] => {
        const variants = variantsData || [];
        if (!variants.length || !product) return [];

        const currentProductId = String(product._id);
        const productMap = new Map<string, boolean>();

        return variants
            .filter((variantItem) => {
                const pid = String(
                    variantItem.productInfo?._id ||
                    variantItem.product_id ||
                    ''
                );

                // Exclude current product
                if (pid === currentProductId) return false;

                // Keep only one variant per product
                if (pid && !productMap.has(pid)) {
                    productMap.set(pid, true);
                    return true;
                }
                return false;
            });
    }, [variantsData, product]);

    return relatedProducts;
};
