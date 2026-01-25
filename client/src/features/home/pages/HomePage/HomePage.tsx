import { memo } from 'react';
import Hero from './Hero';
import Introduction from './Introduction';
import NewArrivals from './NewArrivals';
import CategoryBox from './CategoryBox';
import SmallTreasures from './SmallTreasures';
import Scarves from './Scarves';
import OurPartners from './OurPartners';

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
