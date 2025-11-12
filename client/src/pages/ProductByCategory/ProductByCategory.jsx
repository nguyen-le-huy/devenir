import { useState } from 'react';
import styles from './ProductByCategory.module.css';
import Filter from '../../components/Filter/Filter.jsx';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';

const ProductByCategory = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleOpenFilter = () => {
        setIsFilterOpen(true);
    };

    const handleCloseFilter = () => {
        setIsFilterOpen(false);
    };


    const scarves = [
        {
            id: '1',
            name: 'Elegant Silk Scarf',
            price: 79.99,
            image: '/images/scarf1.png'
        },
        {
            id: '2',
            name: 'Cashmere Winter Scarf',
            price: 129.99,
            image: '/images/scarf2.png'
        },
        {
            id: '3',
            name: 'Wool Check Scarf',
            price: 89.99,
            image: '/images/scarf3.png'
        },
        {
            id: '4',
            name: 'Cotton Summer Scarf',
            price: 59.99,
            image: '/images/scarf4.png'
        },
        {
            id: '5',
            name: 'Patterned Fashion Scarf',
            price: 69.99,
            image: '/images/scarf5.webp'
        },
        {
            id: '6',
            name: 'Linen Casual Scarf',
            price: 49.99,
            image: '/images/scarf6.png'
        },
        { 
            id: '7',
            name: 'Silk Blend Scarf',
            price: 89.99,
            image: '/images/scarf7.webp'
        },
        {
            id: '8',
            name: 'Alpaca Cozy Scarf',
            price: 139.99,
            image: '/images/scarf8.webp'
        },
        {
            id: '9',
            name: 'Fringed Wool Scarf',
            price: 99.99,
            image: '/images/scarf9.png'
        }
    ];

    return (
        <div className={styles.productByCategory}>
            <h1 className={styles.title}>Scarves</h1>
            <div className={styles.category}>
                <p className={styles.active}>All</p>
                <p>Cashmere Scarves</p>
                <p>Wool Scarves</p>
                <p>Silk Scarves</p>
            </div>
            <div className={styles.countAndFilter}>
                <span className={styles.count}>212 items</span>
                <span className={styles.filter} onClick={handleOpenFilter}>
                    Filter & Sort
                </span>
            </div>
            
            {/* Filter Component */}
            <Filter isOpen={isFilterOpen} onClose={handleCloseFilter} />
            <div className={styles.productContainer}>
                <div className={styles.topBox}>
                    <div className={styles.leftBox}>
                        {scarves.slice(0, 4).map((scarf) => (
                            <ScarfCard
                                key={scarf.id}
                                scarf={scarf}
                            />
                        ))}
                    </div>
                    <div className={styles.rightBox}
                        style={{ backgroundImage: `url('/images/scarfProduct.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'    
                        }}
                    >
                        <div className={styles.content}>
                            <h2>A Knight to remember – add a signature touch with a check scarf.</h2>
                            <a href="#">
                                <span>Shop Now</span>
                                <svg 
                                    className={styles.linkGraphic} 
                                    width="300%" 
                                    height="100%" 
                                    viewBox="0 0 1200 60" 
                                    preserveAspectRatio="none"
                                >
                                    <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div className={styles.productList}>
                    {scarves.map((scarf) => (
                        <ScarfCard
                            key={scarf.id}
                            scarf={scarf}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductByCategory;