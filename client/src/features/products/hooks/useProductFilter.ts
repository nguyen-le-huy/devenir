import { useMemo } from 'react';
import type { IEnrichedVariant } from '@/features/products/types';
import { getColorName } from '@/features/products/utils/productUtils';

/**
 * Product Filter Hook
 * Handles filtering, deduplication, and sorting of product variants
 */

// ============================================
// Types
// ============================================

interface UseProductFilterResult {
    /** List of unique colors available in the variants */
    availableColors: string[];
    /** Count of products for each color */
    colorCounts: Record<string, number>;
    /** Filtered and sorted variants */
    filteredVariants: IEnrichedVariant[];
}

type SortOption = 'Price High' | 'Price Low' | 'New In' | string;

// ============================================
// Sort Functions
// ============================================

const sortByPriceHigh = (a: IEnrichedVariant, b: IEnrichedVariant): number =>
    b.price - a.price;

const sortByPriceLow = (a: IEnrichedVariant, b: IEnrichedVariant): number =>
    a.price - b.price;

const sortByNewest = (a: IEnrichedVariant, b: IEnrichedVariant): number => {
    const dateA = a.createdAt || a._id;
    const dateB = b.createdAt || b._id;
    return dateB > dateA ? 1 : -1;
};

// ============================================
// Hook Implementation
// ============================================

export const useProductFilter = (
    variants: IEnrichedVariant[],
    selectedSort: SortOption,
    selectedColors: string[]
): UseProductFilterResult => {
    return useMemo(() => {
        // Extract unique colors from variants using helper to handle both string and IColor
        const availableColors = [...new Set(variants.map((v) => getColorName(v.color)))].filter(Boolean);

        // Count unique product + color combinations
        const colorCounts: Record<string, number> = {};
        const countedProductColors = new Set<string>();

        variants.forEach((variant) => {
            const colorName = getColorName(variant.color);
            if (colorName) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const productId = variant.productInfo?._id || (variant as any).product;
                const key = `${productId}_${colorName}`;

                if (!countedProductColors.has(key)) {
                    countedProductColors.add(key);
                    colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
                }
            }
        });

        // Apply filters
        let filtered = [...variants];

        // 1. Color filter
        if (selectedColors.length > 0) {
            filtered = filtered.filter((v) => selectedColors.includes(getColorName(v.color)));
        }

        // 2. Remove duplicates (keep one variant per product-color)
        const uniqueMap = new Map<string, boolean>();
        filtered = filtered.filter((variant) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const productId = variant.productInfo?._id || (variant as any).product;
            const colorName = getColorName(variant.color);
            const key = `${productId}_${colorName}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                return true;
            }
            return false;
        });

        // 3. Apply sorting
        switch (selectedSort) {
            case 'Price High':
                filtered.sort(sortByPriceHigh);
                break;
            case 'Price Low':
                filtered.sort(sortByPriceLow);
                break;
            case 'New In':
                filtered.sort(sortByNewest);
                break;
            default:
                // Keep original order
                break;
        }

        return { availableColors, colorCounts, filteredVariants: filtered };
    }, [variants, selectedSort, selectedColors]);
};
