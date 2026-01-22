import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOptimizedImageUrl } from '../utils/imageOptimization.js';
import { trackEvent } from '../utils/eventTracker.js';
import { useProductTracking } from './useTracking.ts';
import { useVariantById } from './useProducts.js';
import { getVariantsByCategoryWithChildren } from '../services/productService.js';

/**
 * Hook to manage product view logic including data fetching and tracking
 */
export const useProductView = (variantId) => {
    // Fetch product data
    const { data: productData, isLoading, error } = useVariantById(variantId);

    const variant = productData?.variant;
    const product = productData?.product;
    const siblingVariants = productData?.siblingVariants || [];

    // Track product view event
    useEffect(() => {
        if (variant && product) {
            trackEvent.productView({
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                category: product.category?.name || 'Unknown',
                brand: product.brand?.name || 'Unknown',
                color: variant.color?.name || 'Unknown',
                size: variant.size || 'Free Size',
                price: variant.salePrice || variant.basePrice,
                sku: variant.sku
            });
        }
    }, [variant, product]);

    // Track active time on product
    useProductTracking(
        product ? {
            _id: product._id,
            name: product.name,
            category: product.category?.name,
            basePrice: variant?.price || product.basePrice
        } : null,
        variant?.size,
        variant?.colorName || variant?.color
    );

    return { variant, product, siblingVariants, isLoading, error, productData };
};

/**
 * Hook to manage product gallery logic
 */
export const useGallery = (variant, headerHeight) => {
    const [initialRightHeight, setInitialRightHeight] = useState(null);
    const rightRef = useRef(null);

    // Image logic
    const { mainImage, otherImages, allGalleryImages } = useMemo(() => {
        const rawMain = variant?.mainImage || '/images/placeholder.png';

        // Helper to extract Cloudinary ID
        const getPublicId = (url) => {
            if (!url || !url.includes('cloudinary.com')) return url;
            const match = url.match(/\/upload\/(?:[^\/]+\/)*v?\d*\/?(.+?)(?:\.[^.]+)?$/);
            return match ? match[1] : url;
        };

        const mainId = getPublicId(rawMain);
        const rawOther = (variant?.images || []).filter(img => getPublicId(img) !== mainId);

        return {
            mainImage: getOptimizedImageUrl(rawMain),
            otherImages: rawOther.map(img => getOptimizedImageUrl(img)),
            allGalleryImages: [getOptimizedImageUrl(rawMain), ...rawOther.map(img => getOptimizedImageUrl(img))]
        };
    }, [variant]);

    // Layout calculation for sticky behavior
    useLayoutEffect(() => {
        setInitialRightHeight(null);
    }, [variant?._id]);

    useLayoutEffect(() => {
        if (rightRef.current && !initialRightHeight && variant) {
            requestAnimationFrame(() => {
                const height = rightRef.current?.offsetHeight;
                if (height > 0) {
                    setInitialRightHeight(height);
                }
            });
        }
    }, [variant, initialRightHeight]);

    const imageCount = allGalleryImages.length;
    const isSingleImage = imageCount === 1;
    const isFewImages = imageCount <= 2;

    return {
        mainImage,
        otherImages,
        allGalleryImages,
        isSingleImage,
        isFewImages,
        rightRef,
        initialRightHeight
    };
};

/**
 * Hook to fetch and manage related products
 */
export const useRelatedProducts = (product, allCategories) => {
    // Get parent category ID
    const parentCategoryId = useMemo(() => {
        return product?.category?.parentCategory?._id ||
            product?.category?.parentCategory ||
            product?.category?._id ||
            product?.category;
    }, [product]);

    // Fetch related variants
    const { data: variantsData } = useQuery({
        queryKey: ['variants', 'categoryWithChildren', parentCategoryId],
        queryFn: () => getVariantsByCategoryWithChildren(parentCategoryId, allCategories),
        enabled: !!parentCategoryId && allCategories.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    // Filter and transform
    const relatedProducts = useMemo(() => {
        const variants = variantsData || [];
        if (!variants.length) return [];

        const currentProductId = String(product?._id || '');
        const productMap = new Map();

        return variants.filter(variantItem => {
            const pid = String(variantItem.productInfo?._id || variantItem.product_id || variantItem.product || '');

            if (pid === currentProductId) return false;
            if (pid && !productMap.has(pid)) {
                productMap.set(pid, true);
                return true;
            }
            return false;
        }).map(variantItem => ({
            id: variantItem._id,
            name: variantItem.productInfo?.name || 'Product',
            price: variantItem.price,
            image: variantItem.mainImage || '/images/placeholder.png',
            imageHover: variantItem.hoverImage || variantItem.mainImage || '/images/placeholder.png',
            color: variantItem.color,
            size: variantItem.size,
            sku: variantItem.sku,
        }));
    }, [variantsData, product, parentCategoryId]);

    return relatedProducts;
};
