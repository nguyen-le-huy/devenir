import styles from "./Checkout.module.css";

const PaymentOptions = ({ paymentMethod, setPaymentMethod }) => {
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
                        <p>PayOS</p>
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
                        <p>NowPayments</p>
                    </div>
                    <img src="/images/nowpayments.png" alt="nowpayments" />
                </div>
            </div>
        </div>
    );
};

export default PaymentOptions;
