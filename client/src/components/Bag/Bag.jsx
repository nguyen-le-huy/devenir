import styles from "./Bag.module.css";
import { useHeaderHeight } from "../../hooks/useHeaderHeight";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useLenisControl } from "../../hooks/useLenisControl";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart.js";
import Backdrop from "../Backdrop";
import Loading from "../Loading/Loading";
import { getOptimizedImageUrl } from "../../utils/imageOptimization";

export default function Bag({ onMouseEnter, onMouseLeave, onClose }) {
    const navigate = useNavigate();
    const headerHeight = useHeaderHeight();
    const [isVisible, setIsVisible] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    useLenisControl(true);

    // Fetch real cart data
    const { data: cartData, isLoading } = useCart();
    const cart = cartData?.data || { items: [], totalItems: 0, totalPrice: 0 };

    // Preload all cart item images
    const preloadImages = useCallback(async (imageUrls) => {
        const promises = imageUrls.map((url) => {
            return new Promise((resolve) => {
                if (!url) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                img.src = url;
            });
        });

        await Promise.all(promises);
        setImagesLoaded(true);
    }, []);

    // Start preloading when cart data is ready
    useEffect(() => {
        if (!isLoading) {
            if (cart.items.length > 0) {
                setImagesLoaded(false);

                // Collect and optimize all product images (same URLs as displayed)
                const imagesToPreload = cart.items
                    .map(item => item.productVariant?.mainImage)
                    .filter(Boolean)
                    .map(img => getOptimizedImageUrl(img));

                // Remove duplicates
                const uniqueImages = [...new Set(imagesToPreload)];

                if (uniqueImages.length > 0) {
                    preloadImages(uniqueImages);
                } else {
                    setImagesLoaded(true);
                }
            } else {
                // No items, no images to preload
                setImagesLoaded(true);
            }
        }
    }, [isLoading, cart.items, preloadImages]);

    // Trigger animation after images are loaded
    useEffect(() => {
        if (imagesLoaded) {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }
    }, [imagesLoaded]);

    const handleCheckout = () => {
        if (cart.items.length === 0) return;
        if (onClose) onClose();
        navigate("/checkout");
    };

    const handleProductClick = (variantId) => {
        if (onClose) onClose();
        navigate(`/product-detail?variant=${variantId}`);
    };

    // Memoize cart items to prevent unnecessary re-renders
    const cartItems = useMemo(() => {
        return cart.items.map((item, index) => {
            const variant = item.productVariant;
            const productName = variant?.product_id?.name || 'Product';
            const image = variant?.mainImage || '/images/placeholder.png';
            const price = variant?.price || 0;
            const size = variant?.size || '';
            const color = variant?.color || '';

            return (
                <div
                    key={variant?._id || index}
                    className={styles.product}
                >
                    <img
                        src={getOptimizedImageUrl(image)}
                        alt={productName}
                        onClick={() => handleProductClick(variant?._id)}
                        style={{ cursor: 'pointer' }}
                        loading="lazy"
                    />
                    <div className={styles.productInfo}>
                        <div className={styles.nameAndQuanity}>
                            <p
                                className={styles.productName}
                                onClick={() => handleProductClick(variant?._id)}
                                style={{ cursor: 'pointer' }}
                            >{productName}</p>
                            <p className={styles.productQuantity}>
                                {size && size !== 'Free Size' && `Size: ${size}`}
                                {size && size !== 'Free Size' && color && ' | '}
                                {color && `Color: ${color}`}
                                {(size && size !== 'Free Size') || color ? ' | ' : ''}Qty: {item.quantity}
                            </p>
                        </div>
                        <p className={styles.productPrice}>${(price * item.quantity).toFixed(2)}</p>
                    </div>
                </div>
            );
        });
    }, [cart.items]);

    // Show loading while fetching data or preloading images
    const showLoading = isLoading || !imagesLoaded;

    return (
        <>
            <Backdrop
                visible={isVisible}
                style={{ top: `${headerHeight}px`, bottom: 0 }}
            />
            <div
                className={`${styles.bag} ${isVisible ? styles.visible : ''}`}
                style={{ top: `${headerHeight}px` }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {showLoading ? (
                    <div className={styles.loadingWrapper}>
                        <Loading size="md" />
                    </div>
                ) : cart.items.length > 0 ? (
                    <div className={styles.bagContent}>
                        <div className={styles.productList} data-lenis-prevent>
                            {cartItems}
                        </div>

                        <div className={styles.totalPrice}>
                            <p>Sub total</p>
                            <p>${cart.totalPrice.toFixed(2)}</p>
                        </div>

                        <div className={styles.checkoutButton}>
                            <button onClick={handleCheckout}>Checkout</button>
                        </div>

                    </div>
                ) : (
                    <p className={styles.emptyText}>Your bag is empty</p>
                )}
            </div>
        </>
    )
}