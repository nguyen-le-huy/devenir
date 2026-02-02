import { useMemo } from 'react';
import { useLatestVariants } from '@/features/products/hooks/useProducts';
import { IEnrichedVariant } from '@/features/products/types';

export const useRecommendedProducts = (limit: number = 8) => {
    // Fetch latest variants for "You May Also Like" carousel
    // Fetching 20 to shuffle and pick random 'limit' items
    const { data: variantsData, isLoading } = useLatestVariants(20);

    const recommendedProducts: IEnrichedVariant[] = useMemo(() => {
        const variants = (variantsData as any)?.data || variantsData || [];
        if (!variants || variants.length === 0) return [];

        // Shuffle array randomly
        const shuffled = [...variants].sort(() => Math.random() - 0.5);

        // Take first 'limit' items - they're already in IEnrichedVariant format
        return shuffled.slice(0, limit);
    }, [variantsData, limit]);

    return { recommendedProducts, isLoading };
};
