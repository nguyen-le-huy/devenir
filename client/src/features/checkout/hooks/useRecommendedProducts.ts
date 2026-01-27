import { useMemo } from 'react';
import { useLatestVariants } from '@/features/products/hooks/useProducts';
import { RecommendedProduct } from '../types';

export const useRecommendedProducts = (limit: number = 8) => {
    // Fetch latest variants for "You May Also Like" carousel
    // Fetching 20 to shuffle and pick random 'limit' items
    const { data: variantsData, isLoading } = useLatestVariants(20);

    const recommendedProducts: RecommendedProduct[] = useMemo(() => {
        const variants = (variantsData as any)?.data || variantsData || [];
        if (!variants || variants.length === 0) return [];

        // Shuffle array randomly
        const shuffled = [...variants].sort(() => Math.random() - 0.5);

        // Take first 'limit' items and transform to product format
        return shuffled.slice(0, limit).map((variant: any) => ({
            id: variant._id,
            name: variant.productInfo?.name || 'Product',
            price: variant.price,
            image: variant.mainImage || '/images/placeholder.png',
            imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
        }));
    }, [variantsData, limit]);

    return { recommendedProducts, isLoading };
};
