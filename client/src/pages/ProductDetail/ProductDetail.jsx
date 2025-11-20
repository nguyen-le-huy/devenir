import styles from './ProductDetail.module.css';
import { useState, useEffect } from 'react';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel.jsx';
import { scarves } from '../../data/scarvesData.js';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

export default function ProductDetail() {
    const headerHeight = useHeaderHeight();
    const [openItem, setOpenItem] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0); // ✅ Track active slide
    const [totalSlides, setTotalSlides] = useState(4); // ✅ Total slides

    const handleToggle = (itemName) => {
        setOpenItem(openItem === itemName ? null : itemName);
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const accordionItems = [
        {
            id: 'productDetail',
            title: 'Product Detail',
            content: "The iconic Burberry Check cashmere scarf, made in Scotland at a mill founded in 1797. Woven on traditional looms, the scarf takes more than 30 steps to complete. The fabric is washed in local spring water and brushed with teasels – dried flowers that are drawn along the surface of the cashmere to 'raise' the cloth, creating a natural lustre and ultra-soft finish."
        },
        {
            id: 'sizeAndFit',
            title: 'Size & Fit',
            content: '168 x 30cm/66.1 x 11.8in'
        },
        {
            id: 'fabricAndCare',
            title: 'Fabric & Care',
            content: `100% cashmere | Specialist dry clean | Made in Scotland`
        }
    ];

    // ✅ Gallery images
    const galleryImages = [
        './images/product/1.png',
        './images/product/2.png',
        './images/product/3.png',
        './images/product/4.png'
    ];

    // ✅ Calculate progress bar position
    const progressBarLeft = (activeSlide / totalSlides) * 100;
    const progressBarWidth = (1 / totalSlides) * 100;


    const relatedProducts = scarves.slice(0, 8);


    return (
        <div className={styles.productDetail}>
            <div className={styles.product}>
                <div className={styles.left} style={{ top: `${headerHeight}px` }}>
                    <img src="./images/product/1.png" alt="product" />
                </div>
                <div className={styles.center}>
                    <img src="./images/product/2.png" alt="product" />
                    <img src="./images/product/3.png" alt="product" />
                    <img src="./images/product/4.png" alt="product" />
                </div>
                
                {/* ✅ Mobile Gallery với Custom Progress Bar */}
                <div className={styles.mobileGallery} style={{ top: `${headerHeight}px` }}>
                    <Swiper
                        spaceBetween={0}
                        slidesPerView={1}
                        loop={true}  // ✅ Thêm prop loop
                        onSlideChange={(swiper) => {
                            // ✅ Cần dùng realIndex thay vì activeIndex khi dùng loop
                            setActiveSlide(swiper.realIndex);
                        }}
                        onSwiper={(swiper) => {
                            // ✅ Với loop, dùng slides.length của original slides
                            setTotalSlides(galleryImages.length);
                        }}
                        className={styles.mobileGallerySwiper}
                    >
                        {galleryImages.map((image, index) => (
                            <SwiperSlide key={index} className={styles.mobileGalleryItems}>
                                <img src={image} alt={`product ${index + 1}`} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    
                    {/* ✅ Custom Progress Bar Pagination */}
                    <div className={styles.mobileGalleryNav}>
                        <div className={styles.progressBarTrack}>
                            <div 
                                className={styles.progressBarActive}
                                style={{
                                    left: `${progressBarLeft}%`,
                                    width: `${progressBarWidth}%`
                                }}
                            />
                        </div>
                    </div>
                </div>


                <div className={styles.right}
                    style={isMobile ? {} : { top: `${headerHeight}px` }}
                >
                    <div className={styles.box1}>
                        <div className={styles.productInfo}>
                            <p className={styles.type}>Cashmere Scarf</p>
                            <div className={styles.nameAndPrice}>
                                <h2 className={styles.name}>Check Cashmere Scarf</h2>
                                <p className={styles.price}>$129.99</p>
                            </div>
                        </div>
                        <div className={styles.colour}>
                            <div className={styles.productColour}>
                                <p>Charcoal</p>
                                <span className={styles.colourSquare} style={{ backgroundColor: '#282523' }}></span>
                            </div>
                            <div className={styles.colourVarients}>
                                <p>31 colours</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="9" viewBox="0 0 14 9" fill="none">
                                    <path d="M11.5625 1.5625L6.5625 6.5625L1.5625 1.5625" stroke="#0E0E0E" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                        <div className={styles.buttonList}>
                            <button className={styles.addToBag}>Add to Bag</button>
                            <button className={styles.sendGift}>Send using 4GIFT</button>
                            <p className={styles.instalment}>
                                Instalment payments available{' '}
                                <span className={styles.learnMore}>
                                    Learn More
                                    <svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none">
                                        <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                                    </svg>
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className={styles.box2}>
                        <div className={styles.itemBox}>
                            <h3 className={styles.itemBoxTitle}>Next-day Delivery & Returns</h3>
                            <p className={styles.itemBoxDescription}>Order by 1pm EST, Monday - Friday</p>
                        </div>
                        <div className={styles.itemBox}>
                            <h3 className={styles.itemBoxTitle}>Find in Store</h3>
                            <p className={styles.itemBoxDescription}>Check availability in your nearest Devenir store</p>
                        </div>
                        <div className={styles.itemBox}>
                            <h3 className={styles.itemBoxTitle}>Gift Packaging</h3>
                            <p className={styles.itemBoxDescription}>Complimentary and plastic-free</p>
                        </div>
                    </div>
                    
                    {/* Accordion Items */}
                    <div className={styles.box3}>
                        {accordionItems.map((item) => (
                            <div key={item.id} className={styles.accordionItem}>
                                <div 
                                    className={styles.itemLabel} 
                                    onClick={() => handleToggle(item.id)}
                                >
                                    <p>{item.title}</p>
                                    {openItem === item.id ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="1" viewBox="0 0 15 1" fill="none">
                                            <path d="M0 1V0H15V1H0Z" fill="#0E0E0E"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                            <path d="M0 8.07692V6.92308H6.92308V0H8.07692V6.92308H15V8.07692H8.07692V15H6.92308V8.07692H0Z" fill="#0E0E0E"/>
                                        </svg>
                                    )}
                                </div>
                                
                                <div className={`${styles.itemContent} ${openItem === item.id ? styles.open : ''}`}>
                                    <p className={styles.contentText}>{item.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.box4}>
                        <p className={styles.appointmentLink}>
                            Book an Appointment
                            <svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none">
                                <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                            </svg>
                        </p>
                        <p className={styles.contactLink}>
                            Contact Us
                            <svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none">
                                <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                            </svg>
                        </p>
                    </div>
                </div>
            </div>

            {/* ✅ Reusable ProductCarousel với title khác */}
            <ProductCarousel 
                title="We Recommend"
                viewAllLink="#"
                products={relatedProducts}
                showViewAll={false}
            />
        </div>
    );
};