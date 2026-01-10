import styles from './ProductDetail.module.css';
import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel.jsx';
import { scarves } from '../../data/scarvesData.js';
import { getVariantsByCategoryWithChildren } from '../../services/productService.js';
import { createColorMap } from '../../services/colorService.js';
import { useCategories } from '../../hooks/useCategories.js';
import { useVariantById } from '../../hooks/useProducts.js';
import { useColors } from '../../hooks/useColors.js';
import { useAddToCart } from '../../hooks/useCart.js';
import Loading from '../../components/Loading/Loading.jsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import ColourVarients from '../../components/ColourVarients/ColourVarients.jsx';
import SelectSize from '../../components/SelectSize/SelectSize.jsx';
import SizeAndFit from '../../components/SizeAndFit/SizeAndFit.jsx';
import AddToBagNoti from '../../components/Notification/AddToBagNoti.jsx';
import TryOn from '../../components/TryOn/TryOn.jsx';
import { getOptimizedImageUrl } from '../../utils/imageOptimization.js';
import { trackEvent } from '../../utils/eventTracker.js';
import { useProductTracking } from '../../hooks/useTracking';

const ProductDetail = memo(() => {
    const [searchParams] = useSearchParams();
    const variantId = searchParams.get('variant');

    const headerHeight = useHeaderHeight();
    const [openItem, setOpenItem] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [totalSlides, setTotalSlides] = useState(4);
    const [isColourVariantsOpen, setIsColourVariantsOpen] = useState(false);
    const [isSelectSizeOpen, setIsSelectSizeOpen] = useState(false);
    const [isSizeAndFitOpen, setIsSizeAndFitOpen] = useState(false);
    const [isAddToBagNotiOpen, setIsAddToBagNotiOpen] = useState(false);
    const [isAddToBagHovered, setIsAddToBagHovered] = useState(false);

    // Product data states
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Fetch colors using React Query
    const { data: colorsData } = useColors();
    const colorMap = useMemo(() => {
        const colors = colorsData?.data || colorsData || [];
        return createColorMap(colors);
    }, [colorsData]);

    // Fetch product data using React Query
    const {
        data: productData,
        isLoading: productLoading,
        error: productError
    } = useVariantById(variantId);

    const variant = productData?.variant;
    const product = productData?.product;
    const siblingVariants = productData?.siblingVariants || [];
    const loading = productLoading;

    // Track product view with variant details
    useEffect(() => {
        if (productData?.variant && productData?.product) {
            const { variant, product } = productData;
            trackEvent.productView({
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                category: product.category?.name || 'Unknown',
                brand: product.brand?.name || 'Unknown',
                color: variant.color?.name || 'Unknown',
                size: variant.size || 'Free Size',
                price: variant.salePrice || variant.basePrice,
                sku: variant.sku
            });
        }
    }, [productData]);

    // Ref to capture initial height of .right panel
    const rightRef = useRef(null);
    const [initialRightHeight, setInitialRightHeight] = useState(null);

    // Track product view with variant details
    useProductTracking(
        product ? {
            _id: product._id,
            name: product.name,
            category: product.category?.name,
            basePrice: variant?.price || product.basePrice
        } : null,
        variant?.size,
        variant?.colorName || variant?.color
    );

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
            content: product?.description || "Product description is loading..."
        },
        {
            id: 'sizeAndFit',
            title: 'Size & Fit',
            content: '168 x 30cm/66.1 x 11.8in',
            hasButton: true
        },
        {
            id: 'fabricAndCare',
            title: 'Fabric & Care',
            content: `100% cashmere | Specialist dry clean | Made in Scotland`
        }
    ];

    // Capture initial height of .right panel (before any accordion opens)
    useLayoutEffect(() => {
        // Reset height when variant changes
        setInitialRightHeight(null);
    }, [variant?._id]);

    useLayoutEffect(() => {
        // Only calculate after images are loaded and we don't have a height yet
        if (rightRef.current && !initialRightHeight && !loading && imagesLoaded) {
            // Wait for next frame to ensure layout is complete
            requestAnimationFrame(() => {
                const height = rightRef.current.offsetHeight;
                if (height > 0) {
                    setInitialRightHeight(height);
                }
            });
        }
    }, [loading, initialRightHeight, imagesLoaded]);

    // Gallery images: Get mainImage and images array from variant
    const rawMainImage = variant?.mainImage || './images/product/1.png';

    // Helper function to extract Cloudinary public_id for comparison
    const getPublicId = (url) => {
        if (!url || !url.includes('cloudinary.com')) return url;
        // Extract the path after /upload/ and remove transformations/version
        const match = url.match(/\/upload\/(?:[^\/]+\/)*v?\d*\/?(.+?)(?:\.[^.]+)?$/);
        return match ? match[1] : url;
    };

    const mainImageId = getPublicId(rawMainImage);

    // Filter out mainImage from the images array (compare by public_id to handle URL variations)
    const rawOtherImages = (variant?.images || []).filter(img => {
        const imgId = getPublicId(img);
        return imgId !== mainImageId;
    });

    // Optimize all gallery images for faster loading
    const mainImage = getOptimizedImageUrl(rawMainImage);
    const otherImages = rawOtherImages.map(img => getOptimizedImageUrl(img));
    const allGalleryImages = [mainImage, ...otherImages];

    // Preload all gallery images (with optimized URLs)
    const preloadImages = useCallback(async (imageUrls) => {
        const promises = imageUrls.map((url) => {
            return new Promise((resolve) => {
                if (!url) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve; // Still resolve on error to continue
                img.src = url;
            });
        });

        await Promise.all(promises);
        setImagesLoaded(true);
    }, []);

    // Start preloading when variant images are ready
    useEffect(() => {
        if (!loading && variant && allGalleryImages.length > 0) {
            setImagesLoaded(false);
            preloadImages(allGalleryImages);
        }
    }, [loading, variant?._id, allGalleryImages.length, preloadImages]);

    // Check image count for layout adjustments
    const imageCount = allGalleryImages.length;
    const isSingleImage = imageCount === 1;
    const isFewImages = imageCount <= 2; // 2 or fewer images - no sticky

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

    // Get variants of the same color for size selection
    const sameColorVariants = siblingVariants.filter(v => v.color === currentColorName);

    // Determine if product needs size selection
    // If all variants are "Free Size" or only 1 variant, no need to show size selector
    const availableSizes = [...new Set(sameColorVariants.map(v => v.size))].filter(Boolean);
    const isFreeSize = availableSizes.length === 1 && availableSizes[0]?.toLowerCase() === 'free size';
    const needsSizeSelection = !isFreeSize && availableSizes.length > 0;
    const currentColorHex = colorMap[currentColorName] || '#ccc';

    // Add to cart mutation for Free Size products
    const addToCartMutation = useAddToCart();

    // Handle add to bag for Free Size products
    const handleAddToBagFreeSize = () => {
        if (!variant?._id) return;

        addToCartMutation.mutate(
            { variantId: variant._id, quantity: 1 },
            {
                onSuccess: () => {
                    // Show AddToBagNoti modal instead of alert
                    setIsAddToBagNotiOpen(true);
                },
                onError: (error) => {
                    alert(error.response?.data?.message || 'Failed to add to bag. Please login first.');
                }
            }
        );
    };

    // Fetch all categories to find children of parent category
    const { data: allCategoriesData } = useCategories();
    const allCategories = useMemo(() => {
        if (allCategoriesData?.data) return allCategoriesData.data;
        if (Array.isArray(allCategoriesData)) return allCategoriesData;
        return [];
    }, [allCategoriesData]);

    // Get parent category ID (main category)
    // If product.category has a parentCategory, use it; otherwise use the category itself
    const parentCategoryId = product?.category?.parentCategory?._id ||
        product?.category?.parentCategory ||
        product?.category?._id ||
        product?.category;

    // Fetch variants from parent category + all its children using useQuery
    const { data: variantsData } = useQuery({
        queryKey: ['variants', 'categoryWithChildren', parentCategoryId],
        queryFn: () => getVariantsByCategoryWithChildren(parentCategoryId, allCategories),
        enabled: !!parentCategoryId && allCategories.length > 0,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });

    // Transform and filter variants to show all products in the same main category
    const relatedProducts = useMemo(() => {
        const variants = variantsData || [];

        if (!variants || variants.length === 0) return [];

        // Get current product ID to exclude variants from the same product
        const currentProductId = String(product?._id || '');

        // Group variants by product (keep only one variant per product)
        const productMap = new Map();
        const uniqueVariants = variants.filter(variantItem => {
            // Get product ID from variant (could be in productInfo or product_id)
            const variantProductId = String(
                variantItem.productInfo?._id ||
                variantItem.product_id ||
                variantItem.product ||
                ''
            );

            // Exclude variants from the same product
            if (variantProductId === currentProductId) return false;

            // Keep only one variant per product
            if (variantProductId && !productMap.has(variantProductId)) {
                productMap.set(variantProductId, true);
                return true;
            }
            return false;
        });

        // Transform to product format (no limit)
        return uniqueVariants.map(variantItem => ({
            id: variantItem._id,
            name: variantItem.productInfo?.name || 'Product',
            price: variantItem.price,
            image: variantItem.mainImage || '/images/placeholder.png',
            imageHover: variantItem.hoverImage || variantItem.mainImage || '/images/placeholder.png',
            color: variantItem.color,
            size: variantItem.size,
            sku: variantItem.sku,
        }));
    }, [variantsData, product?._id, parentCategoryId, allCategories.length]);

    // Show loading if data is loading OR images are not ready
    if (loading || (variant && !imagesLoaded)) {
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
            <div className={`${styles.product} ${isFewImages ? styles.fewImages : ''}`}>
                <div
                    className={`${styles.leftCenterContainer} ${isSingleImage ? styles.singleImage : ''} ${isFewImages ? styles.fewImagesContainer : ''}`}
                    data-tryon-container
                    style={isFewImages && initialRightHeight ? { height: `${initialRightHeight}px` } : {}}
                >
                    <TryOn />
                    {isSingleImage ? (
                        // Single image: span full width
                        <div className={styles.fullWidthImage}>
                            <img src={mainImage} alt={product.name} />
                        </div>
                    ) : (
                        // Multiple images: normal layout
                        <>
                            <div
                                className={`${styles.left} ${isFewImages ? styles.noSticky : ''}`}
                                style={isFewImages ? {} : { top: `${headerHeight}px` }}
                            >
                                <img src={mainImage} alt={product.name} />
                            </div>
                            <div className={`${styles.center} ${isFewImages ? styles.noSticky : ''}`}>
                                {otherImages.map((image, index) => (
                                    <img key={index} src={image} alt={`${product.name} ${index + 1}`} />
                                ))}
                            </div>
                        </>
                    )}
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


                <div
                    ref={rightRef}
                    className={`${styles.right} ${isFewImages ? styles.noSticky : ''}`}
                    style={isMobile || isFewImages ? {} : { top: `${headerHeight}px` }}
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
                            <button
                                className={styles.addToBag}
                                onClick={() => {
                                    if (needsSizeSelection) {
                                        setIsSelectSizeOpen(true);
                                    } else {
                                        // Add directly to cart for Free Size products
                                        handleAddToBagFreeSize();
                                    }
                                }}
                                onMouseEnter={() => setIsAddToBagHovered(true)}
                                onMouseLeave={() => setIsAddToBagHovered(false)}
                            >
                                {needsSizeSelection && isAddToBagHovered ? 'Select Size' : 'Add to Bag'}
                            </button>
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
                                    {item.hasButton && (
                                        <p className={styles.sizeGuideLink} onClick={() => setIsSizeAndFitOpen(true)}>
                                            Size Guide
                                            <svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none">
                                                <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                                            </svg>
                                        </p>
                                    )}
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
            {isSelectSizeOpen && (
                <SelectSize
                    isOpen={isSelectSizeOpen}
                    onClose={() => setIsSelectSizeOpen(false)}
                    variants={sameColorVariants}
                    currentVariant={variant}
                    product={product}
                    onAddToCartSuccess={() => setIsAddToBagNotiOpen(true)}
                />
            )}
            {isSizeAndFitOpen && (
                <SizeAndFit
                    isOpen={isSizeAndFitOpen}
                    onClose={() => setIsSizeAndFitOpen(false)}
                />
            )}
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
            <AddToBagNoti
                isOpen={isAddToBagNotiOpen}
                onClose={() => setIsAddToBagNotiOpen(false)}
            />
        </div>
    );
});

ProductDetail.displayName = 'ProductDetail';

export default ProductDetail;