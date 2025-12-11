import styles from "./PaymentSuccessful.module.css";

const PaymentSuccessfulPreview = () => {
    return (
        <div className={styles.container}>
            <div className={styles.paymentSuccessful}>
                <div className={styles.successfulGradient}></div>
                <div className={styles.content}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 113" fill="none">
                        <path d="M53.5 3.5L67.3084 13.5731L84.4027 13.5415L89.6521 29.8078L103.5 39.8283L98.1874 56.0735L103.5 72.3187L89.6521 82.3392L84.4027 98.6054L67.3084 98.5739L53.5 108.647L39.6916 98.5739L22.5973 98.6054L17.3479 82.3392L3.5 72.3187L8.81255 56.0735L3.5 39.8283L17.3479 29.8078L22.5973 13.5415L39.6916 13.5731L53.5 3.5Z" stroke="#619683" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M35.1016 56.0735L48.2449 69.2168L74.5317 42.9301" stroke="#619683" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h1 className={styles.title + " " + styles.titleSuccessful}>Payment Successful</h1>
                    <p className={styles.orderInfo}>
                        Order #123456 • $299.00 • PayOS
                    </p>
                    <p>Thank you for your purchase! A confirmation email has been sent to you. <span>Track your order here.</span></p>
                </div>
                <div className={styles.buttonContainer}>
                    <div className={styles.button + " " + styles.buttonContinue}>
                        <p>Continue Shopping</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessfulPreview;
