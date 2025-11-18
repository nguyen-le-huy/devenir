import { useState, useEffect } from 'react';
import styles from './ProductByCategory.module.css';
import Filter from '../../components/Filter/Filter.jsx';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';
import { scarves } from '../../data/scarvesData.js'; // ✅ Import dữ liệu

const ProductByCategory = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    

    const handleOpenFilter = () => {
        setIsFilterOpen(true);
    };

    const handleCloseFilter = () => {
        setIsFilterOpen(false);
    };

    useEffect(() => {
        const updateHeaderHeight = () => {
            const header = document.querySelector('[class*="header"]');
            if (header) {
                const rect = header.getBoundingClientRect();
                setHeaderHeight(rect.bottom);
            }
        };

        updateHeaderHeight();

        // ✅ Listen scroll để update khi topbar biến mất
        window.addEventListener('scroll', updateHeaderHeight);
        window.addEventListener('resize', updateHeaderHeight);

        // Cleanup
        return () => {
            window.removeEventListener('scroll', updateHeaderHeight);
            window.removeEventListener('resize', updateHeaderHeight);
        };
    }, []);

    return (
        <div className={styles.productByCategory}>
            <h1 className={styles.title}>Scarves</h1>
            <div className={styles.category}>
                <p className={styles.active}>All</p>
                <p>Cashmere Scarves</p>
                <p>Wool Scarves</p>
                <p>Silk Scarves</p>
            </div>
            <div className={styles.countAndFilter} style={{ top: `${headerHeight}px` }}>
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