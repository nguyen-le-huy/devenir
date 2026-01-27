
import styles from '@/features/checkout/pages/Checkout/Checkout.module.css';
import PaymentOptions from './PaymentOptions';
import GiftCodeSection from './GiftCodeSection';
import { ShippingAddress, PaymentMethodType } from '@/features/checkout/types';

interface ReviewAndPayProps {
    savedAddress: ShippingAddress;
    onEditAddress: () => void;
    paymentMethod: PaymentMethodType;
    setPaymentMethod: (method: PaymentMethodType) => void;
    giftCode: string;
    setGiftCode: (code: string) => void;
    giftCodeApplied: boolean;
    giftCodeError: string;
    setGiftCodeError: (error: string) => void;
    onApplyGiftCode: () => void;
    onRemoveGiftCode: () => void;
    handlePay: () => void;
    payButtonDisabled: boolean;
    payButtonText: string;
    paymentError: string;
}

const ReviewAndPay = ({
    savedAddress,
    onEditAddress,
    paymentMethod,
    setPaymentMethod,
    giftCode,
    setGiftCode,
    giftCodeApplied,
    giftCodeError,
    setGiftCodeError,
    onApplyGiftCode,
    onRemoveGiftCode,
    handlePay,
    payButtonDisabled,
    payButtonText,
    paymentError
}: ReviewAndPayProps) => {
    return (
        <div className={styles.checkInfo}>
            <div className={styles.shippingDetails}>
                <div className={styles.shippingDetailsTitle}>
                    <h3>Shipping Details</h3>
                    <p onClick={onEditAddress} style={{ cursor: "pointer" }}>Edit</p>
                </div>
                <div className={styles.shippingDetailsContent}>
                    <p>{savedAddress.firstName} {savedAddress.lastName}</p>
                    <p>{savedAddress.address}</p>
                    <p>{savedAddress.district}</p>
                    <p>{savedAddress.city}</p>
                    <p>{savedAddress.zipCode}</p>
                    <p>Vietnam</p>
                    <p>{savedAddress.phoneNumber}</p>
                </div>
            </div>
            <div className={styles.gift}>
                <div className={styles.shippingDetailsTitle}>
                    <h3>Is your delivery a gift?</h3>
                </div>
                <div className={styles.giftCheckbox}>
                    <input type="checkbox" />
                    <p>Add complimentary gift packaging</p>
                </div>
            </div>
            <PaymentOptions
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
            />

            <GiftCodeSection
                giftCode={giftCode}
                setGiftCode={setGiftCode}
                giftCodeApplied={giftCodeApplied}
                giftCodeError={giftCodeError}
                setGiftCodeError={setGiftCodeError}
                onApplyGiftCode={onApplyGiftCode}
                onRemoveGiftCode={onRemoveGiftCode}
            />

            <button
                type="button"
                className={`${styles.confirmButton} ${styles.continueToPayment}`}
                onClick={handlePay}
                disabled={payButtonDisabled}
            >
                <p>{payButtonText}</p>
            </button>
            {paymentError && (
                <p className={styles.paymentError} role="alert">
                    {paymentError}
                </p>
            )}
        </div>
    );
};

export default ReviewAndPay;
