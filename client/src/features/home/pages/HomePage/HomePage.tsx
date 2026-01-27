import { memo } from 'react';
import Hero from '@/features/home/components/Hero/Hero';
import Introduction from '@/features/home/components/Introduction/Introduction';
import NewArrivals from '@/features/home/components/NewArrivals/NewArrivals';
import CategoryBox from '@/features/home/components/CategoryBox/CategoryBox';
import SmallTreasures from '@/features/home/components/SmallTreasures/SmallTreasures';
import Scarves from '@/features/home/components/Scarves/Scarves';
import OurPartners from '@/features/home/components/OurPartners/OurPartners';

const HomePage = memo(() => {
    return (
        <>
            <Hero />
            <Introduction />
            <NewArrivals />
            <SmallTreasures />
            <CategoryBox />
            <Scarves />
            <OurPartners />
        </>
    );
});

HomePage.displayName = 'HomePage';

export default HomePage;
