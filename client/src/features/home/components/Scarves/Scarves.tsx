import { memo } from 'react';
import ProductCarousel from '@/features/products/components/ProductCarousel/ProductCarousel.jsx';
import { useScarves } from '@/features/home/hooks/useHomeProducts';

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

    return (
        <ProductCarousel
            title="Scarves Collection"
            viewAllLink="/products?category=scarves"
            products={products}
            showViewAll={true}
        />
    );
});

Scarves.displayName = 'Scarves';

export default Scarves;
