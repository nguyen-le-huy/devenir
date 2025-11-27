import { useMemo } from 'react';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel.jsx';
import { useVariantsByCategory } from '../../hooks/useProducts.js';
import { useCategories } from '../../hooks/useCategories.js';

const Scarves = () => {
    // Fetch categories to find Scarves category ID
    const { data: categoriesData } = useCategories();

    // Find Scarves category
    const scarvesCategory = useMemo(() => {
        const categories = categoriesData?.data || categoriesData || [];
        return categories.find(cat =>
            cat.name?.toLowerCase().includes('scarf') ||
            cat.name?.toLowerCase().includes('scarves')
        );
    }, [categoriesData]);

    // Fetch variants from Scarves category
    const { data: variantsData, isLoading } = useVariantsByCategory(scarvesCategory?._id);

    // Transform and filter variants to unique colors
    const scarves = useMemo(() => {
        const variants = variantsData || [];

        if (!variants || variants.length === 0) return [];

        // Remove duplicates by color (keep only one variant per color)
        const colorMap = new Map();
        const uniqueVariants = variants.filter(variant => {
            if (variant.color && !colorMap.has(variant.color)) {
                colorMap.set(variant.color, true);
                return true;
            }
            return false;
        });

        // Transform to scarf format and limit to 12 items for carousel
        return uniqueVariants.slice(0, 12).map(variant => ({
            id: variant._id,
            name: variant.productInfo?.name || 'Scarf',
            price: variant.price,
            image: variant.mainImage || '/images/placeholder.png',
            imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
        }));
    }, [variantsData]);

    if (isLoading || !scarvesCategory) {
        return (
            <ProductCarousel
                title="Scarves Collection"
                viewAllLink="#"
                products={[]}
                showViewAll={true}
            />
        );
    }

    return (
        <ProductCarousel
            title="Scarves Collection"
            viewAllLink="#"
            products={scarves}
            showViewAll={true}
        />
    );
};

export default Scarves;