import { memo, useEffect, useState, useCallback } from "react";
import styles from "./Bag.module.css";
import { useHeaderHeight } from '@/shared/hooks/useHeaderHeight';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { useNavigate } from "react-router-dom";
import { useCart } from '@/features/cart/hooks/useCart';
import Backdrop from '@/shared/components/Backdrop/Backdrop';
import Loading from "@/shared/components/Loading/Loading";
import CartItemRow from "./CartItemRow";
import { ICartItem } from '@/features/cart/types';

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
    const { data: cart, isLoading } = useCart();

    // Default empty cart if undefined
    const items = cart?.items || [];
    const totalPrice = cart?.totalPrice || 0;

    // Trigger animation immediately on mount
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    const handleCheckout = useCallback(() => {
        if (items.length === 0) return;
        if (onClose) onClose();
        navigate("/checkout");
    }, [items.length, onClose, navigate]);

    // Show loading while fetching data
    const showLoading = isLoading && !cart; // Only show loading if we have no data at all (first load)

    return (
        <>
            <Backdrop
                visible={isVisible}
                style={{ top: `${headerHeight}px`, bottom: 0 }}
                onClick={onClose} // Allow clicking backdrop to close
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
                ) : items.length > 0 ? (
                    <div className={styles.bagContent}>
                        <div className={styles.productList} data-lenis-prevent>
                            {items.map((item: ICartItem) => (
                                <CartItemRow
                                    key={item._id || item.productVariant?._id}
                                    item={item}
                                    onClose={onClose}
                                />
                            ))}
                        </div>

                        <div className={styles.totalPrice}>
                            <p>Sub total</p>
                            <p>${totalPrice.toFixed(2)}</p>
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
