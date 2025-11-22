import styles from "./Bag.module.css";
import { useHeaderHeight } from "../../hooks/useHeaderHeight";
import { lenisInstance } from "../../App";
import { useEffect } from "react";
import { useLenisControl } from "../../hooks/useLenisControl";

export default function Bag({ onMouseEnter, onMouseLeave, bagCount }) {
    const headerHeight = useHeaderHeight();
    useLenisControl(true);

    return (
        <>
            <div
                className={styles.backdrop}
                style={{ top: headerHeight }}
            ></div>
            <div
                className={styles.bag}
                style={{ top: headerHeight }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {bagCount > 0 ? (
                    <div className={styles.bagContent}>
                        <div className={styles.productList} data-lenis-prevent>
                            <div className={styles.product}>
                                <img src="/images/scarf1.png" alt="product" />
                                <div className={styles.productInfo}>
                                    <div className={styles.nameAndQuanity}>
                                        <p className={styles.productName}>Check Cashmere Scarf</p>
                                        <p className={styles.productQuantity}>Quantity: 1</p>
                                    </div>
                                    <p className={styles.productPrice}>$120.00</p>
                                </div>
                            </div>
                            <div className={styles.product}>
                                <img src="/images/scarf1.png" alt="product" />
                                <div className={styles.productInfo}>
                                    <div className={styles.nameAndQuanity}>
                                        <p className={styles.productName}>Check Cashmere Scarf</p>
                                        <p className={styles.productQuantity}>Quantity: 1</p>
                                    </div>
                                    <p className={styles.productPrice}>$120.00</p>
                                </div>
                            </div>
                            <div className={styles.product}>
                                <img src="/images/scarf1.png" alt="product" />
                                <div className={styles.productInfo}>
                                    <div className={styles.nameAndQuanity}>
                                        <p className={styles.productName}>Check Cashmere Scarf</p>
                                        <p className={styles.productQuantity}>Quantity: 1</p>
                                    </div>
                                    <p className={styles.productPrice}>$120.00</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.totalPrice}>
                            <p>Sub total</p>
                            <p>$7360.00</p>
                        </div>

                        <div className={styles.checkoutButton}>
                            <button>Checkout</button>
                        </div>

                    </div>
                ) : (
                    <p className={styles.emptyText}>Your bag is empty</p>
                )}
            </div>
        </>
    )
}