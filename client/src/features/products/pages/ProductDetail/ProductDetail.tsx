import styles from './ProductDetail.module.css';
import { toast } from 'sonner';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHeaderHeight } from '@/shared/hooks/useHeaderHeight';
import ProductCarousel from '@/features/products/components/ProductCarousel/ProductCarousel';
import { createColorMap } from '@/features/products/api/colorService';
import { useCategories } from '@/features/products/hooks/useCategories';
import { useColors } from '@/features/products/hooks/useColors';
import { useAddToCart } from '@/features/cart/hooks/useCart';
import PageWrapper from '@/shared/components/PageWrapper/PageWrapper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import ColourVarients from '@/features/products/components/ColourVarients/ColourVarients';
import SelectSize from '@/features/products/components/SelectSize/SelectSize';
import SizeAndFit from '@/features/products/components/SizeAndFit/SizeAndFit';
import AddToBagNoti from '@/shared/components/Notification/AddToBagNoti';
import TryOn from '@/features/products/components/TryOn/TryOn';
import { useProductView, useGallery, useRelatedProducts } from '@/features/products/hooks/useProductDetailLogic';
import { getColorName } from '@/features/products/utils/productUtils';
import { useImagePreloader } from '@/shared/hooks/useImagePreloader';
import { PRODUCT_DETAIL_ACCORDION_ITEMS } from '@/features/products/constants/productDetail';

const ProductDetail = memo(() => {
    const [searchParams] = useSearchParams();
    const variantId = searchParams.get('variant') || '';
    const headerHeight = useHeaderHeight();

    // UI State
    const [openItem, setOpenItem] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [_totalSlides, setTotalSlides] = useState(4);
    const [isColourVariantsOpen, setIsColourVariantsOpen] = useState(false);
    const [isSelectSizeOpen, setIsSelectSizeOpen] = useState(false);
    const [isSizeAndFitOpen, setIsSizeAndFitOpen] = useState(false);
    const [isAddToBagNotiOpen, setIsAddToBagNotiOpen] = useState(false);
    const [isAddToBagHovered, setIsAddToBagHovered] = useState(false);

    // Custom Hooks
    const { variant, product, siblingVariants, isLoading: productLoading } = useProductView(variantId);
    const { mainImage, otherImages, allGalleryImages, isSingleImage, isFewImages, rightRef, initialRightHeight } = useGallery(variant, headerHeight);

    // Categories & Related Products
    const { data: allCategoriesData } = useCategories();
    // Safely extract categories array from response
    const allCategories = useMemo(() => {
        if (!allCategoriesData) return [];
        return allCategoriesData.data || [];
    }, [allCategoriesData]);

    const relatedProducts = useRelatedProducts(product, allCategories);

    // Colors
    const { data: colorsData } = useColors();
    const colorMap = useMemo(() => createColorMap(colorsData || []), [colorsData]);

    // Derived Logic
    const colorCount = useMemo(() => new Set(siblingVariants.map((v) => getColorName(v.color))).size, [siblingVariants]);
    const currentColorName = getColorName(variant?.color);
    const currentColorHex = colorMap[currentColorName] || '#ccc';

    const { sameColorVariants, needsSizeSelection } = useMemo(() => {
        const sameColor = siblingVariants.filter((v) => getColorName(v.color) === currentColorName);
        const sizes = [...new Set(sameColor.map((v) => v.size))].filter(Boolean);
        const isFree = sizes.length === 1 && String(sizes[0]).toLowerCase() === 'free size';
        return { sameColorVariants: sameColor, needsSizeSelection: !isFree && sizes.length > 0 };
    }, [siblingVariants, currentColorName]);

    // IMAGE PRELOADING (Visual-First Strategy)
    // Identify critical images that MUST be loaded before showing the page
    const criticalImages = useMemo(() => {
        if (!mainImage) return [];

        // Always preload the Main Hero Image
        const images = [mainImage];

        // On Desktop, we might want to preload the next 1-2 grid images if they exist
        // to prevent "pop-in" as user scrolls immediately
        if (!isMobile && otherImages.length > 0) {
            images.push(...otherImages.slice(0, 2));
        }

        return images;
    }, [mainImage, otherImages, isMobile]);

    // Use preloader hook
    const areImagesLoaded = useImagePreloader(criticalImages, !productLoading && criticalImages.length > 0);

    // Handlers
    const handleToggle = useCallback((itemName: string) => {
        setOpenItem(prev => prev === itemName ? null : itemName);
    }, []);

    const addToCartMutation = useAddToCart();

    const handleAddToBagFreeSize = useCallback(() => {
        if (!variant?._id) return;
        addToCartMutation.mutate(
            { variantId: variant._id, quantity: 1 },
            {
                onSuccess: () => setIsAddToBagNotiOpen(true),
                onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to add to bag. Please login first.')
            }
        );
    }, [variant?._id, addToCartMutation]);

    const handleAddToBagClick = useCallback(() => {
        if (needsSizeSelection) {
            setIsSelectSizeOpen(true);
        } else {
            handleAddToBagFreeSize();
        }
    }, [needsSizeSelection, handleAddToBagFreeSize]);

    // Mobile check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Combine loading states
    const isPageLoading = productLoading || !areImagesLoaded;

    if (isPageLoading) return <PageWrapper isLoading={true}><div className={styles.productDetail} /></PageWrapper>;

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

    // Calculations for progress bar
    const progressBarLeft = (activeSlide / (allGalleryImages.length || 1)) * 100;
    const progressBarWidth = (1 / (allGalleryImages.length || 1)) * 100;

    return (
        <PageWrapper>
            <div className={styles.productDetail}>
                <div className={`${styles.product} ${isFewImages ? styles.fewImages : ''}`}>
                    <div
                        className={`${styles.leftCenterContainer} ${isSingleImage ? styles.singleImage : ''} ${isFewImages ? styles.fewImagesContainer : ''}`}
                        data-tryon-container
                        style={isFewImages && initialRightHeight ? { height: `${initialRightHeight}px` } : {}}
                    >
                        <TryOn />
                        {isSingleImage ? (
                            <div className={styles.fullWidthImage}><img src={mainImage} alt={product.name} /></div>
                        ) : (
                            <>
                                <div className={`${styles.left} ${isFewImages ? styles.noSticky : ''}`} style={isFewImages ? {} : { top: `${headerHeight}px` }}>
                                    <img src={mainImage} alt={product.name} />
                                </div>
                                <div className={`${styles.center} ${isFewImages ? styles.noSticky : ''}`}>
                                    {otherImages.map((image: string, index: number) => (
                                        <img key={index} src={image} alt={`${product.name} ${index + 1}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.mobileGallery} style={{ top: `${headerHeight}px` }}>
                        <Swiper
                            spaceBetween={0}
                            slidesPerView={1}
                            loop={true}
                            onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
                            onSwiper={() => setTotalSlides(allGalleryImages.length)}
                            className={styles.mobileGallerySwiper}
                        >
                            {allGalleryImages.map((image: string, index: number) => (
                                <SwiperSlide key={index} className={styles.mobileGalleryItems}>
                                    <img src={image} alt={`${product.name} ${index + 1}`} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <div className={styles.mobileGalleryNav}>
                            <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarActive} style={{ left: `${progressBarLeft}%`, width: `${progressBarWidth}%` }} />
                            </div>
                        </div>
                    </div>

                    <div ref={rightRef} className={`${styles.right} ${isFewImages ? styles.noSticky : ''}`} style={isMobile || isFewImages ? {} : { top: `${headerHeight}px` }}>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M11.5625 1.5625L6.5625 6.5625L1.5625 1.5625" stroke="#0E0E0E" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                            <div className={styles.buttonList}>
                                <button
                                    className={styles.addToBag}
                                    onClick={handleAddToBagClick}
                                    onMouseEnter={() => setIsAddToBagHovered(true)}
                                    onMouseLeave={() => setIsAddToBagHovered(false)}
                                >
                                    {needsSizeSelection && isAddToBagHovered ? 'Select Size' : 'Add to Bag'}
                                </button>
                                <button className={styles.sendGift}>Send using 4GIFT</button>
                                <p className={styles.instalment}>Instalment payments available <span className={styles.learnMore}>Learn More<svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path></svg></span></p>
                            </div>
                        </div>

                        <div className={styles.box2}>
                            <div className={styles.itemBox}><h3 className={styles.itemBoxTitle}>Next-day Delivery & Returns</h3><p className={styles.itemBoxDescription}>Order by 1pm EST, Monday - Friday</p></div>
                            <div className={styles.itemBox}><h3 className={styles.itemBoxTitle}>Find in Store</h3><p className={styles.itemBoxDescription}>Check availability in your nearest Devenir store</p></div>
                            <div className={styles.itemBox}><h3 className={styles.itemBoxTitle}>Gift Packaging</h3><p className={styles.itemBoxDescription}>Complimentary and plastic-free</p></div>
                        </div>

                        <div className={styles.box3}>
                            {PRODUCT_DETAIL_ACCORDION_ITEMS.map((item) => (
                                <div key={item.id} className={styles.accordionItem}>
                                    <div className={styles.itemLabel} onClick={() => handleToggle(item.id)}>
                                        <p>{item.title}</p>
                                        {openItem === item.id ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="1" viewBox="0 0 15 1" fill="none"><path d="M0 1V0H15V1H0Z" fill="#0E0E0E" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M0 8.07692V6.92308H6.92308V0H8.07692V6.92308H15V8.07692H8.07692V15H6.92308V8.07692H0Z" fill="#0E0E0E" /></svg>}
                                    </div>
                                    <div className={`${styles.itemContent} ${openItem === item.id ? styles.open : ''}`}>
                                        <p className={styles.contentText}>{item.getContent ? item.getContent(product) : item.content}</p>
                                        {item.hasButton && (
                                            <p className={styles.sizeGuideLink} onClick={() => setIsSizeAndFitOpen(true)}>
                                                Size Guide
                                                <svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path></svg>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.box4}>
                            <p className={styles.appointmentLink}>Book an Appointment<svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path></svg></p>
                            <p className={styles.contactLink}>Contact Us<svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path></svg></p>
                        </div>
                    </div>
                </div>

                {isSelectSizeOpen && <SelectSize isOpen={isSelectSizeOpen} onClose={() => setIsSelectSizeOpen(false)} variants={sameColorVariants} currentVariant={variant} product={product} onAddToCartSuccess={() => setIsAddToBagNotiOpen(true)} />}
                {isSizeAndFitOpen && <SizeAndFit isOpen={isSizeAndFitOpen} onClose={() => setIsSizeAndFitOpen(false)} />}
                <ProductCarousel title="We Recommend" viewAllLink="#" products={relatedProducts} showViewAll={false} />
                <ColourVarients isOpen={isColourVariantsOpen} onClose={() => setIsColourVariantsOpen(false)} siblingVariants={siblingVariants} currentVariantId={variantId} colorMap={colorMap} />
                <AddToBagNoti isOpen={isAddToBagNotiOpen} onClose={() => setIsAddToBagNotiOpen(false)} />
            </div>
        </PageWrapper>
    );
});

ProductDetail.displayName = 'ProductDetail';

export default ProductDetail;
