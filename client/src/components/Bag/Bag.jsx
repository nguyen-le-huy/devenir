import styles from "./Bag.module.css";
import { useHeaderHeight } from "../../hooks/useHeaderHeight";
import { useEffect, useState, useMemo } from "react";
import { useLenisControl } from "../../hooks/useLenisControl";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart.js";
import Backdrop from "../Backdrop";

export default function Bag({ onMouseEnter, onMouseLeave, onClose }) {
    const navigate = useNavigate();
    const headerHeight = useHeaderHeight();
    const [isVisible, setIsVisible] = useState(false);
    useLenisControl(true);

    // Fetch real cart data
    const { data: cartData, isLoading } = useCart();
    const cart = cartData?.data || { items: [], totalItems: 0, totalPrice: 0 };

    // Trigger animation after component mounts
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    const handleCheckout = () => {
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
                        src={image}
                        alt={productName}
                        onClick={() => handleProductClick(variant?._id)}
                        style={{ cursor: 'pointer' }}
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
                {cart.items.length > 0 ? (
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