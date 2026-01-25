import { useMemo } from 'react';

export const useProductFilter = (variants: any[], selectedSort: string, selectedColors: string[]) => {
    return useMemo(() => {
        // Extract unique colors from variants
        const availableColors = [...new Set(variants.map(v => v.color))].filter(Boolean);

        // Count unique product + color combinations
        const colorCounts: Record<string, number> = {};
        const countedProductColors = new Set();

        variants.forEach(variant => {
            if (variant.color) {
                const productId = variant.productInfo?._id || variant.product;
                const key = `${productId}_${variant.color}`;

                if (!countedProductColors.has(key)) {
                    countedProductColors.add(key);
                    colorCounts[variant.color] = (colorCounts[variant.color] || 0) + 1;
                }
            }
        });

        // Apply filters
        let filtered = [...variants];

        // 1. Color filter
        if (selectedColors.length > 0) {
            filtered = filtered.filter(v => selectedColors.includes(v.color));
        }

        // 2. Remove duplicates (keep one variant per product-color)
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
                break;
        }

        return { availableColors, colorCounts, filteredVariants: filtered };
    }, [variants, selectedSort, selectedColors]);
};
