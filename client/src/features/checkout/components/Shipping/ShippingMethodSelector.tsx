
import { ShippingMethod, DeliveryTime } from '@/features/checkout/types';
import styles from '@/features/checkout/pages/Checkout/Checkout.module.css';

interface ShippingMethodSelectorProps {
    shippingMethod: ShippingMethod;
    deliveryTime: DeliveryTime;
    onMethodChange: (method: ShippingMethod) => void;
    onTimeChange: (time: DeliveryTime) => void;
}

const ShippingMethodSelector = ({
    shippingMethod,
    deliveryTime,
    onMethodChange,
    onTimeChange
}: ShippingMethodSelectorProps) => {
    return (
        <>
            {/* Step 1: Choose shipping method */}
            <div className={styles.shippingMethod}>
                <div className={styles.shippingTitleHeader}>
                    <h2>Choose your shipping method</h2>
                    <p>You are currently in Vietnam store. <span>Shipping to a different location?</span></p>
                </div>
                <div className={styles.shippingMethodList}>
                    <div
                        className={styles.shippingMethodItem}
                        onClick={() => onMethodChange("home")}
                        style={{ cursor: 'pointer' }}
                    >
                        <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === "home"}
                            readOnly
                        />
                        <p>Home delivery</p>
                    </div>
                    <div
                        className={styles.shippingMethodItem}
                        onClick={() => onMethodChange("store")}
                        style={{ cursor: 'pointer' }}
                    >
                        <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === "store"}
                            readOnly
                        />
                        <p>Collect in store</p>
                    </div>
                </div>

                {/* Show "Not support yet" for store collection */}
                {shippingMethod === "store" && (
                    <p style={{ marginTop: "20px", color: "var(--dark-gray)", fontSize: "16px" }}>
                        Not support yet
                    </p>
                )}
            </div>

            {/* Step 2: Choose delivery time (only for home delivery) */}
            {shippingMethod === "home" && (
                <div className={styles.dayShippingMethod}>
                    <div className={styles.shippingTitleHeader}>
                        <h2>When would you like your items?</h2>
                        <p>See more detail about our <span>Shipping</span></p>
                    </div>
                    <div className={styles.shippingMethodList}>
                        <div
                            className={styles.dayShippingMethodItem}
                            onClick={() => onTimeChange("standard")}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.title}>
                                <div className={styles.selection}>
                                    <input
                                        type="radio"
                                        name="deliveryTime"
                                        checked={deliveryTime === "standard"}
                                        readOnly
                                    />
                                    <p>Standard delivery</p>
                                </div>
                                <p>FREE</p>
                            </div>
                            <p>Estimated delivery: December 6, 2026 - December 8, 2026</p>
                        </div>
                        <div
                            className={styles.dayShippingMethodItem}
                            onClick={() => onTimeChange("next")}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.title}>
                                <div className={styles.selection}>
                                    <input
                                        type="radio"
                                        name="deliveryTime"
                                        checked={deliveryTime === "next"}
                                        readOnly
                                    />
                                    <p>Next day delivery</p>
                                </div>
                                <p>USD 5</p>
                            </div>
                            <p>Estimated delivery: Tomorrow December 8, 2026</p>
                        </div>
                        <div
                            className={styles.dayShippingMethodItem}
                            onClick={() => onTimeChange("nominated")}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.title}>
                                <div className={styles.selection}>
                                    <input
                                        type="radio"
                                        name="deliveryTime"
                                        checked={deliveryTime === "nominated"}
                                        readOnly
                                    />
                                    <p>Nominated day delivery</p>
                                </div>
                                <p>USD 10</p>
                            </div>
                            <p>Choose a day that suits you</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShippingMethodSelector;
