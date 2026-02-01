import styles from "@/features/checkout/pages/Checkout/Checkout.module.css";

interface GiftCodeSectionProps {
    giftCode: string;
    setGiftCode: (code: string) => void;
    giftCodeApplied: boolean;
    giftCodeError: string;
    setGiftCodeError: (error: string) => void;
    onApplyGiftCode: () => void;
    onRemoveGiftCode: () => void;
}

const GiftCodeSection = ({
    giftCode,
    setGiftCode,
    giftCodeApplied,
    giftCodeError,
    setGiftCodeError,
    onApplyGiftCode,
    onRemoveGiftCode
}: GiftCodeSectionProps) => {
    return (
        <div className={styles.giftCodeSection}>
            <div className={styles.shippingTitleHeader}>
                <h2>Gift Code</h2>
                <p>Enter your gift code to get a discount</p>
            </div>
            <div className={styles.giftCodeInput}>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="giftCode"
                        placeholder=" "
                        value={giftCode}
                        onChange={(e) => {
                            setGiftCode(e.target.value);
                            setGiftCodeError("");
                        }}
                        disabled={giftCodeApplied}
                    />
                    <label htmlFor="giftCode">Gift Code</label>
                </div>
                {!giftCodeApplied ? (
                    <button
                        type="button"
                        className={styles.applyGiftCodeBtn}
                        onClick={onApplyGiftCode}
                    >
                        Apply
                    </button>
                ) : (
                    <button
                        type="button"
                        className={styles.removeGiftCodeBtn}
                        onClick={onRemoveGiftCode}
                    >
                        Remove
                    </button>
                )}
            </div>
            {giftCodeError && (
                <p className={styles.giftCodeError}>{giftCodeError}</p>
            )}
            {giftCodeApplied && (
                <div className={styles.giftCodeSuccess}>
                    <p>✓ Gift code "{giftCode}" applied successfully!</p>
                    <p className={styles.discountInfo}>
                        Fixed price: <strong>5,000 VND</strong> (PayOS) | <strong>0.1 USDT</strong> (NowPayments)
                    </p>
                </div>
            )}
        </div>
    );
};

export default GiftCodeSection;
