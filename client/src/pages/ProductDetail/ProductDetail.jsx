import styles from './ProductDetail.module.css';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel.jsx';
import { scarves } from '../../data/scarvesData.js';
import { getVariantById } from '../../services/productService.js';
import { getAllColors, createColorMap } from '../../services/colorService.js';
import { useVariantsByCategory } from '../../hooks/useProducts.js';
import Loading from '../../components/Loading/Loading.jsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import ColourVarients from '../../components/ColourVarients/ColourVarients.jsx';

export default function ProductDetail() {
    const [searchParams] = useSearchParams();
    const variantId = searchParams.get('variant');

    const headerHeight = useHeaderHeight();
    const [openItem, setOpenItem] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [totalSlides, setTotalSlides] = useState(4);
    const [isColourVariantsOpen, setIsColourVariantsOpen] = useState(false);

    // Product data states
    const [loading, setLoading] = useState(true);
    const [variant, setVariant] = useState(null);
    const [product, setProduct] = useState(null);
    const [siblingVariants, setSiblingVariants] = useState([]);
    const [colorMap, setColorMap] = useState({});

    const handleToggle = (itemName) => {
        setOpenItem(openItem === itemName ? null : itemName);
    };

    // Fetch colors
    useEffect(() => {
        const fetchColors = async () => {
            try {
                const response = await getAllColors();
                const colorsData = response.data || response;
                setColorMap(createColorMap(colorsData));
            } catch (error) {
                console.error('Error fetching colors:', error);
            }
        };

        fetchColors();
    }, []);

    // Fetch product data
    useEffect(() => {
        const fetchProductData = async () => {
            if (!variantId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getVariantById(variantId);
                setVariant(data.variant);
                setProduct(data.product);
                setSiblingVariants(data.siblingVariants);
            } catch (error) {
                console.error('Error fetching product data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [variantId]);

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
            content: product?.description || "Product description is loading..."
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

    // Gallery images: Get mainImage and images array from variant
    const mainImage = variant?.mainImage || './images/product/1.png';
    // images array chứa tất cả ảnh bao gồm mainImage, nên cần filter ra
    const otherImages = (variant?.images || []).filter(img => img !== mainImage);
    const allGalleryImages = [mainImage, ...otherImages];

    // Calculate progress bar position
    const progressBarLeft = (activeSlide / (allGalleryImages.length || 1)) * 100;
    const progressBarWidth = (1 / (allGalleryImages.length || 1)) * 100;

    // Count unique colors from sibling variants
    const uniqueColors = [...new Set(siblingVariants.map(v => v.color))].filter(Boolean);
    const colorCount = uniqueColors.length;

    // Get current color name and hex
    // variant.color stores the color name (e.g., "Charcoal")
    // colorMap maps colorName -> hexCode
    const currentColorName = variant?.color || 'Unknown';
    const currentColorHex = colorMap[currentColorName] || '#ccc';

    // Fetch variants from the same category
    // product.category is populated, so we need to use _id
    const categoryId = product?.category?._id || product?.category;
    const { data: variantsData } = useVariantsByCategory(categoryId);

    // Transform and filter variants to unique colors for related products
    const relatedProducts = useMemo(() => {
        const variants = variantsData || [];

        if (!variants || variants.length === 0) return [];

        // Remove duplicates by color (keep only one variant per color)
        const colorMap = new Map();
        const uniqueVariants = variants.filter(variantItem => {
            // Exclude the current variant
            if (variantItem._id === variantId) return false;

            if (variantItem.color && !colorMap.has(variantItem.color)) {
                colorMap.set(variantItem.color, true);
                return true;
            }
            return false;
        });

        // Transform to product format and limit to 8 items for carousel
        return uniqueVariants.slice(0, 8).map(variantItem => ({
            id: variantItem._id,
            name: variantItem.productInfo?.name || 'Product',
            price: variantItem.price,
            image: variantItem.mainImage || '/images/placeholder.png',
            imageHover: variantItem.hoverImage || variantItem.mainImage || '/images/placeholder.png',
            color: variantItem.color,
            size: variantItem.size,
            sku: variantItem.sku,
        }));
    }, [variantsData, variantId]);

    if (loading) {
        return (
            <div className={styles.productDetail}>
                <Loading />
            </div>
        );
    }

    if (!variant || !product) {
        return (
            <div className={styles.productDetail}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h3>Product not found</h3>
                    <p>The product you are looking for does not exist.</p>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.productDetail}>
            <div className={styles.product}>
                <div className={styles.left} style={{ top: `${headerHeight}px` }}>
                    <img src={mainImage} alt={product.name} />
                </div>
                <div className={styles.center}>
                    {otherImages.map((image, index) => (
                        <img key={index} src={image} alt={`${product.name} ${index + 1}`} />
                    ))}
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
                            setTotalSlides(allGalleryImages.length);
                        }}
                        className={styles.mobileGallerySwiper}
                    >
                        {allGalleryImages.map((image, index) => (
                            <SwiperSlide key={index} className={styles.mobileGalleryItems}>
                                <img src={image} alt={`${product.name} ${index + 1}`} />
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
                            <p className={styles.type}>New In</p>
                            <div className={styles.nameAndPrice}>
                                <h2 className={styles.name}>{product.name}</h2>
                                <p className={styles.price}>${variant.price}</p>
                            </div>
                        </div>
                        <div className={styles.colour}>
                            <div className={styles.productColour}>
                                <span className={styles.colourSquare} style={{ backgroundColor: currentColorHex }}></span>
                                <p>{currentColorName}</p>
                            </div>
                            <div className={styles.colourVarients} onClick={() => setIsColourVariantsOpen(true)} style={{ cursor: 'pointer' }}>
                                <p>{colorCount} {colorCount === 1 ? 'colour' : 'colours'}</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="9" viewBox="0 0 14 9" fill="none">
                                    <path d="M11.5625 1.5625L6.5625 6.5625L1.5625 1.5625" stroke="#0E0E0E" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round" />
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
                                            <path d="M0 1V0H15V1H0Z" fill="#0E0E0E" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                            <path d="M0 8.07692V6.92308H6.92308V0H8.07692V6.92308H15V8.07692H8.07692V15H6.92308V8.07692H0Z" fill="#0E0E0E" />
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
            <ColourVarients
                isOpen={isColourVariantsOpen}
                onClose={() => setIsColourVariantsOpen(false)}
                siblingVariants={siblingVariants}
                currentVariantId={variantId}
                colorMap={colorMap}
            />
        </div>
    );
};