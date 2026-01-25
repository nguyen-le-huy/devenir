import { memo, useEffect, useState, useMemo, useCallback } from "react";
import styles from "./Bag.module.css";
import { useHeaderHeight } from '@/shared/hooks/useHeaderHeight';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { useNavigate } from "react-router-dom";
import { useCart } from '@/features/cart/hooks/useCart';
import Backdrop from '@/shared/components/Backdrop/Backdrop';
import Loading from "@/shared/components/Loading/Loading";
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';

interface BagProps {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClose?: () => void;
}

const Bag = memo(({ onMouseEnter, onMouseLeave, onClose }: BagProps) => {
    const navigate = useNavigate();
    const headerHeight = useHeaderHeight();
    const [isVisible, setIsVisible] = useState(false);

    useLenisControl(true);

    // Fetch real cart data
    const { data: cartData, isLoading } = useCart();
    const cart = (cartData as any)?.data || { items: [], totalItems: 0, totalPrice: 0 };

    // Trigger animation immediately on mount
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    const handleCheckout = useCallback(() => {
        if (cart.items.length === 0) return;
        if (onClose) onClose();
        navigate("/checkout");
    }, [cart.items.length, onClose, navigate]);

    const handleProductClick = useCallback((variantId: string) => {
        if (onClose) onClose();
        navigate(`/product-detail?variant=${variantId}`);
    }, [onClose, navigate]);

    // Memoize cart items to prevent unnecessary re-renders
    const cartItems = useMemo(() => {
        return cart.items.map((item: any, index: number) => {
            const variant = item.productVariant;
            const productName = variant?.product_id?.name || 'Product';
            const image = variant?.mainImage || '/images/placeholder.png';
            const price = variant?.price || 0;
            const size = variant?.size || '';
            const color = variant?.color || '';
            const variantId = variant?._id;

            return (
                <div
                    key={variantId || index}
                    className={styles.product}
                >
                    <img
                        src={getOptimizedImageUrl(image)}
                        alt={productName}
                        onClick={() => handleProductClick(variantId)}
                        style={{ cursor: 'pointer' }}
                        loading="lazy"
                    />
                    <div className={styles.productInfo}>
                        <div className={styles.nameAndQuanity}>
                            <p
                                className={styles.productName}
                                onClick={() => handleProductClick(variantId)}
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
    }, [cart.items, handleProductClick]);

    // Show loading while fetching data
    const showLoading = isLoading;

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
    );
});

Bag.displayName = 'Bag';

export default Bag;
