import ProductCarousel from '../../components/ProductCarousel/ProductCarousel.jsx';
import { scarves } from '../../data/scarvesData.js';

const Scarves = () => {
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