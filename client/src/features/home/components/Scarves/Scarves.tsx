import { memo } from 'react';
import ProductCarousel from '@/features/products/components/ProductCarousel/ProductCarousel';
import { useScarves } from '@/features/home/hooks/useHomeProducts';
import type { ScarvesProduct } from '@/features/home/types';

const Scarves = memo(() => {
    // Use custom hook for scarves collection
    const { products, isLoading, isError } = useScarves();

    // Loading state
    if (isLoading) {
        return (
            <ProductCarousel
                title="Scarves Collection"
                viewAllLink="/products?category=scarves"
                products={[]}
                showViewAll={true}
            />
        );
    }

    // Error or empty state - silently fail on home page
    if (isError || !products || products.length === 0) {
        return null;
    }

    // Map ScarvesProduct to format compatible with ScarfCard
    const mappedProducts = products.map((product: ScarvesProduct) => ({
        _id: product.id,
        product_id: product.id,
        sku: product.sku,
        price: product.price,
        basePrice: product.price,
        color: 'Unknown', // Scarves don't have color in the type
        size: 'Free Size',
        stock: 0,
        mainImage: product.image,
        hoverImage: product.imageHover,
        images: [product.image],
        name: product.name,
    }));

    return (
        <ProductCarousel
            title="Scarves Collection"
            viewAllLink="/products?category=scarves"
            products={mappedProducts}
            showViewAll={true}
        />
    );
});

Scarves.displayName = 'Scarves';

export default Scarves;
