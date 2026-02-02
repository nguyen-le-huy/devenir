import { memo, lazy, Suspense } from 'react';
import Hero from '@/features/home/components/Hero/Hero';
import Loading from '@/shared/components/Loading/Loading';
import SEO from '@/shared/components/SEO/SEO';

// Lazy load components below the fold for performance
const Introduction = lazy(() => import('@/features/home/components/Introduction/Introduction'));
const NewArrivals = lazy(() => import('@/features/home/components/NewArrivals/NewArrivals'));
const SmallTreasures = lazy(() => import('@/features/home/components/SmallTreasures/SmallTreasures'));
const CategoryBox = lazy(() => import('@/features/home/components/CategoryBox/CategoryBox'));
const Scarves = lazy(() => import('@/features/home/components/Scarves/Scarves'));
const OurPartners = lazy(() => import('@/features/home/components/OurPartners/OurPartners'));

const HomePage = memo(() => {
    return (
        <main>
            <SEO
                title="Devenir - Premium Fashion"
                description="Discover Devenir's premium collection of fashion. Elevate your style with our exclusive range of clothing and accessories."
            />
            {/* Hero is above the fold - load immediately */}
            <Hero />

            {/* Below fold components - lazy load with Suspense */}
            <Suspense fallback={<Loading />}>
                <Introduction />
                <NewArrivals />
                <SmallTreasures />
                <CategoryBox />
                <Scarves />
                <OurPartners />
            </Suspense>
        </main>
    );
});

HomePage.displayName = 'HomePage';

export default HomePage;
