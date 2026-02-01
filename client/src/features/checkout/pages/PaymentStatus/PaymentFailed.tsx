import { useLocation, useNavigate } from "react-router-dom";
import styles from "./PaymentSuccessful.module.css";
import type { PaymentFailedState } from '@/features/checkout/types';

const PaymentFailed = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const errorData = (location.state as PaymentFailedState) || {} as PaymentFailedState;

    const { orderCode, paymentMethod } = errorData;


    const handleRetryPayment = () => {
        // Navigate back to shipping/checkout to retry payment
        navigate("/shipping");
    };

    const handleContactUs = () => {
        // Navigate to contact page or open chat
        // For now, navigate to homepage
        navigate("/");
    };

    return (
        <div className={styles.container}>
            <div className={styles.paymentFailed}>
                <div className={styles.failedGradient}></div>
                <div className={styles.content}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M0 13.8889L13.8889 0L50 36.1111L86.1111 0L100 13.8889L63.8889 50L100 86.1111L86.1111 100L50 63.8889L13.8889 100L0 86.1111L36.1111 50L0 13.8889Z" fill="#B12322" />
                    </svg>
                    <h1 className={styles.title + " " + styles.titleFailed}>Payment Failed</h1>
                    {orderCode && (
                        <p className={styles.orderInfo}>
                            Order #{orderCode}
                            {paymentMethod && ` • ${paymentMethod}`}
                        </p>
                    )}
                    <p>
                        Unfortunately, your payment could not be processed. Please try again or use another payment method.
                    </p>
                </div>
                <div className={styles.buttonContainer}>
                    <div
                        className={styles.button + " " + styles.buttonRetry}
                        onClick={handleRetryPayment}
                    >
                        <p>Retry Payment</p>
                    </div>
                    <p>Need help? <span onClick={handleContactUs}>Contact us</span></p>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
