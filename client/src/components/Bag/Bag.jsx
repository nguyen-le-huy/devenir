import styles from "./Bag.module.css";
import { useHeaderHeight } from "../../hooks/useHeaderHeight";
import { lenisInstance } from "../../App";
import { useEffect } from "react";
import { useLenisControl } from "../../hooks/useLenisControl";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart.js";

export default function Bag({ onMouseEnter, onMouseLeave, onClose }) {
    const navigate = useNavigate();
    const headerHeight = useHeaderHeight();
    useLenisControl(true);

    // Fetch real cart data
    const { data: cartData, isLoading } = useCart();
    const cart = cartData?.data || { items: [], totalItems: 0, totalPrice: 0 };

    const handleCheckout = () => {
        if (onClose) onClose();
        navigate("/checkout");
    };

    return (
        <>
            <div
                className={styles.backdrop}
                style={{ top: `${headerHeight}px` }}
            ></div>
            <div
                className={styles.bag}
                style={{ top: `${headerHeight}px` }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {cart.items.length > 0 ? (
                    <div className={styles.bagContent}>
                        <div className={styles.productList} data-lenis-prevent>
                            {cart.items.map((item, index) => {
                                const variant = item.productVariant;
                                const productName = variant?.product_id?.name || 'Product';
                                const image = variant?.mainImage || '/images/placeholder.png';
                                const price = variant?.price || 0;
                                const size = variant?.size || '';
                                const color = variant?.color || '';

                                return (
                                    <div key={variant?._id || index} className={styles.product}>
                                        <img src={image} alt={productName} />
                                        <div className={styles.productInfo}>
                                            <div className={styles.nameAndQuanity}>
                                                <p className={styles.productName}>{productName}</p>
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
                            })}
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