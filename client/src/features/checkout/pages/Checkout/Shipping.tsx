import { memo } from "react";
import styles from "./Checkout.module.css";
import { useShippingPage } from '@/features/checkout/hooks/useShippingPage';
import ShippingMethodSelector from '@/features/checkout/components/Shipping/ShippingMethodSelector';
import AddressForm from '@/features/checkout/components/Shipping/AddressForm';
import ShippingSummary from '@/features/checkout/components/Shipping/ShippingSummary';
import ReviewAndPay from '@/features/checkout/components/Shipping/ReviewAndPay';
import { SHIPPING_METHODS } from '@/features/checkout/constants';
import { formatShippingCost } from '@/features/checkout/utils';

const Shipping = memo(() => {
    const {
        cart,
        savedAddress,
        showAddressForm,
        paymentError,
        shippingMethod,
        deliveryTime,
        paymentMethod,
        setPaymentMethod,
        giftCode,
        setGiftCode,
        giftCodeApplied,
        giftCodeError,
        setGiftCodeError,
        formData,
        formattedCartTotal,
        formattedTotalWithShipping,

        handleShippingMethodChange,
        handleDeliveryTimeChange,
        handleInputChange,
        handleConfirmAddress,
        handleEditAddress,
        handleApplyGiftCode,
        handleRemoveGiftCode,
        handlePay,
        getPayButtonText,
        isProcessingPayment
    } = useShippingPage();


    const shippingCostLabel = formatShippingCost(deliveryTime);

    // Derived state for button disabled
    const canProceedToPayment = Boolean(deliveryTime && savedAddress && !showAddressForm);
    const payButtonDisabled = isProcessingPayment || !paymentMethod || !canProceedToPayment;


    return (
        <>
            <div className={styles.shipping}>
                <div className={styles.shippingHeader}>
                    <p className={styles.currentStep}>Shipping</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="19" viewBox="0 0 11 19" fill="none">
                        <path d="M1.04297 17.0417L9.04297 9.04166L1.04297 1.04166" stroke="#0E0E0E" strokeWidth="2.08333" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className={styles.nextSection}>Review & Pay</p>
                </div>
                <div className={styles.body}>
                    <div className={`${styles.left} ${styles.leftShipping}`}>
                        <ShippingMethodSelector
                            shippingMethod={shippingMethod}
                            deliveryTime={deliveryTime}
                            onMethodChange={handleShippingMethodChange}
                            onTimeChange={handleDeliveryTimeChange}
                        />

                        {shippingMethod === SHIPPING_METHODS.HOME && deliveryTime && showAddressForm && (
                            <AddressForm
                                formData={formData}
                                onChange={handleInputChange}
                                onConfirm={handleConfirmAddress}
                            />
                        )}

                    </div>
                    <div className={`${styles.right} ${styles.rightShipping}`}>
                        <ShippingSummary
                            totalItems={cart.totalItems}
                            subtotal={formattedCartTotal}
                            shippingCostLabel={shippingCostLabel}
                            total={formattedTotalWithShipping}
                        />
                    </div>
                </div>
            </div>

            {deliveryTime && savedAddress && !showAddressForm && (
                <ReviewAndPay
                    savedAddress={savedAddress}
                    onEditAddress={handleEditAddress}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    giftCode={giftCode}
                    setGiftCode={setGiftCode}
                    giftCodeApplied={giftCodeApplied}
                    giftCodeError={giftCodeError}
                    setGiftCodeError={setGiftCodeError}
                    onApplyGiftCode={handleApplyGiftCode}
                    onRemoveGiftCode={handleRemoveGiftCode}
                    handlePay={handlePay}
                    payButtonDisabled={payButtonDisabled}
                    payButtonText={getPayButtonText()}
                    paymentError={paymentError}
                />
            )}
        </>
    );
});

Shipping.displayName = 'Shipping';

export default Shipping;
