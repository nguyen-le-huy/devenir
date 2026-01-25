import styles from "./Checkout.module.css";
import { memo } from "react";

interface PaymentOptionsProps {
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
}

const PaymentOptions = memo(({ paymentMethod, setPaymentMethod }: PaymentOptionsProps) => {
    return (
        <div className={styles.paymentMethod}>
            <div className={styles.shippingTitleHeader}>
                <h2>Payment Method</h2>
                <p>Choose your payment method</p>
            </div>
            <div className={styles.paymentList}>
                <div
                    className={styles.payOS}
                    onClick={() => setPaymentMethod("payos")}
                    style={{ cursor: 'pointer' }}
                >
                    <div className={styles.shippingMethodItem + " " + styles.paymentMethodItem}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "payos"}
                            onChange={() => setPaymentMethod("payos")}
                        />
                        <div className={styles.paymentInfo}>
                            <p>PayOS</p>
                            <span className={styles.paymentSubtitle}>Local bank & e-wallet payment (Vietnam)</span>
                        </div>
                    </div>
                    <img src="/images/payos.png" alt="payos" />
                </div>
                <div
                    className={styles.coinBase}
                    onClick={() => setPaymentMethod("nowpayments")}
                    style={{ cursor: 'pointer' }}
                >
                    <div className={styles.shippingMethodItem + " " + styles.paymentMethodItem}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "nowpayments"}
                            onChange={() => setPaymentMethod("nowpayments")}
                        />
                        <div className={styles.paymentInfo}>
                            <p>NowPayments</p>
                            <span className={styles.paymentSubtitle}>Pay with USDT (BSC / BEP20)</span>
                        </div>
                    </div>
                    <img src="/images/nowpayments.png" alt="nowpayments" />
                </div>
            </div>
        </div>
    );
});

PaymentOptions.displayName = "PaymentOptions";

export default PaymentOptions;
