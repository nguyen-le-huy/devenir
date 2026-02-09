import { memo } from 'react';
import Hero from '@/features/home/components/Hero/Hero';
import Introduction from '@/features/home/components/Introduction/Introduction';
import NewArrivals from '@/features/home/components/NewArrivals/NewArrivals';
import SmallTreasures from '@/features/home/components/SmallTreasures/SmallTreasures';
import CategoryBox from '@/features/home/components/CategoryBox/CategoryBox';
import Scarves from '@/features/home/components/Scarves/Scarves';
import OurPartners from '@/features/home/components/OurPartners/OurPartners';
import SEO from '@/shared/components/SEO/SEO';

const HomePage = memo(() => {
    return (
        <main>
            <SEO
                title="Devenir - Premium Fashion"
                description="Discover Devenir's premium collection of fashion. Elevate your style with our exclusive range of clothing and accessories."
            />
            {/* Hero is above the fold - load immediately */}
            <Hero />

            {/* Below fold components - loaded eagerly for smooth scroll experience */}
            <Introduction />
            <NewArrivals />
            <SmallTreasures />
            <CategoryBox />
            <Scarves />
            <OurPartners />
        </main>
    );
});

HomePage.displayName = 'HomePage';

export default HomePage;
