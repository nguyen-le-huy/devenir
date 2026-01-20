import { memo } from 'react';
import Hero from './Hero.jsx';
import Introduction from './Introduction.jsx';
import NewArrivals from './NewArrivals.jsx';
import CategoryBox from './CategoryBox.jsx';
import SmallTreasures from './SmallTreasures.jsx';
import Scarves from './Scarves.jsx';
import OurPartners from './OurPartners.jsx';

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