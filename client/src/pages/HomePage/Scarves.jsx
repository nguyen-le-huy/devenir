import { useMemo } from 'react';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel.jsx';
import { useCategories } from '../../hooks/useCategories.js';
import { getAllProducts, getProductVariants } from '../../services/productService.js';
import { useQuery } from '@tanstack/react-query';

const Scarves = () => {
    // Fetch all categories
    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useCategories();

    // Find Scarves category and its subcategories
    const { scarvesCategory, allCategoryIds } = useMemo(() => {
        let categories = [];

        if (categoriesResponse?.data) {
            categories = categoriesResponse.data;
        } else if (Array.isArray(categoriesResponse)) {
            categories = categoriesResponse;
        }

        if (!categories || categories.length === 0) {
            return { scarvesCategory: null, allCategoryIds: [] };
        }

        // Find parent Scarves category
        const parentCategory = categories.find(cat => {
            const name = cat.name?.toLowerCase() || '';
            return name === 'scarves' || name === 'scarf';
        });

        if (!parentCategory) {
            return { scarvesCategory: null, allCategoryIds: [] };
        }

        // Find all subcategories of Scarves
        const subcategories = categories.filter(cat =>
            cat.parentCategory === parentCategory._id ||
            cat.parentCategory?._id === parentCategory._id ||
            String(cat.parentCategory) === String(parentCategory._id)
        );

        // Collect all category IDs (parent + children)
        const allIds = [parentCategory._id, ...subcategories.map(sub => sub._id)];

        return {
            scarvesCategory: parentCategory,
            allCategoryIds: allIds
        };
    }, [categoriesResponse]);

    // Fetch products from Scarves and all subcategories
    const { data: allVariants, isLoading: isVariantsLoading } = useQuery({
        queryKey: ['scarves-all-variants', scarvesCategory?._id, allCategoryIds.length],
        queryFn: async () => {
            if (!scarvesCategory?._id) return [];
            // Use the optimized service method from ProductByCategory
            const { getVariantsByCategoryWithChildren } = await import('../../services/productService.js');
            return await getVariantsByCategoryWithChildren(scarvesCategory._id, categoriesResponse?.data || []);
        },
        enabled: !!scarvesCategory?._id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Transform variants for carousel display
    const scarves = useMemo(() => {
        if (!allVariants || allVariants.length === 0) return [];


        return allVariants.slice(0, 12).map(variant => ({
            id: variant._id,
            name: variant.productInfo?.name || 'Scarf',
            price: variant.price,
            image: variant.mainImage || '/images/placeholder.png',
            imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
            color: variant.color?.name || variant.color,
            size: variant.size,
            sku: variant.sku,
        }));
    }, [allVariants]);

    // Show loading state
    const isLoading = isCategoriesLoading || isVariantsLoading;

    if (isLoading) {
        return (
            <ProductCarousel
                title="Scarves Collection"
                viewAllLink="#"
                products={[]}
                showViewAll={true}
            />
        );
    }

    // If no scarves category or no products found
    if (!scarvesCategory || scarves.length === 0) {
        return null;
    }

    return (
        <ProductCarousel
            title="Scarves Collection"
            viewAllLink={`/products?category=${scarvesCategory._id}`}
            products={scarves}
            showViewAll={true}
        />
    );
};

export default Scarves;