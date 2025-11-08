import styles from './HomePage.module.css';
import Preloader from '../../components/Preloader/Preloader';
import Hero from './Hero.jsx';
import Introduction from './Introduction.jsx';
import NewArrivals from './NewArrivals.jsx';
import CategoryBox from './CategoryBox.jsx';
import SmallTreasures from './SmallTreasures.jsx';

const HomePage = () => {
    return (
        <>
            <Preloader />
            <Hero />
            <Introduction />
            <NewArrivals />
            <SmallTreasures />
            <CategoryBox />
        </>
    );
}

export default HomePage;