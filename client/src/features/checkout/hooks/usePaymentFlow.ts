import { useState } from 'react';
import { createPayOSPaymentSession } from "@/features/payos";
import { createNowPaymentsSession } from "@/features/nowpayments";
import {
    ShippingAddress,
    ShippingMethod,
    DeliveryTime,
    PaymentMethodType
} from '../types';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../constants';

interface UsePaymentFlowProps {
    shippingMethod: ShippingMethod;
    deliveryTime: DeliveryTime;
    savedAddress: ShippingAddress | null;
    showAddressForm: boolean;
    paymentMethod: PaymentMethodType;
    giftCode: string;
    giftCodeApplied: boolean;
}

export const usePaymentFlow = ({
    shippingMethod,
    deliveryTime,
    savedAddress,
    showAddressForm,
    paymentMethod,
    giftCode,
    giftCodeApplied,
}: UsePaymentFlowProps) => {
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    const handlePay = async () => {
        if (isProcessingPayment) return;
        setPaymentError("");

        // Validations
        const platformName = paymentMethod === PAYMENT_METHODS.PAYOS
            ? PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PAYOS]
            : PAYMENT_METHOD_LABELS[PAYMENT_METHODS.NOWPAYMENTS];

        if (shippingMethod !== "home") {
            setPaymentError(`${platformName} is available for home delivery only.`);
            return;
        }
        if (!deliveryTime) {
            setPaymentError("Please choose a delivery time before paying.");
            return;
        }
        if (!savedAddress || showAddressForm) {
            setPaymentError("Please confirm your shipping address to continue.");
            return;
        }

        if (paymentMethod !== PAYMENT_METHODS.PAYOS && paymentMethod !== PAYMENT_METHODS.NOWPAYMENTS) {
            setPaymentError("Please select a valid payment method.");
            return;
        }

        try {
            setIsProcessingPayment(true);
            const commonPayload = {
                shippingMethod,
                deliveryTime,
                address: savedAddress,
                giftCode: giftCodeApplied ? giftCode : undefined,
            };

            let response: any;
            if (paymentMethod === PAYMENT_METHODS.PAYOS) {
                // Feature api accepts 'any', so no ignore needed
                response = await createPayOSPaymentSession(commonPayload);
            } else {
                response = await createNowPaymentsSession(commonPayload);
            }

            // Handle Response
            // Response structure can vary: { checkoutUrl: ... } or { data: { checkoutUrl: ... } }
            // Using explicit optional chaining for safety
            const url = response?.data?.checkoutUrl || response?.checkoutUrl || response?.data?.invoiceUrl || response?.invoiceUrl;

            if ((response?.success || url) && url) {
                window.location.href = url;
                return;
            }

            throw new Error(response?.message || `Failed to start ${platformName} payment.`);

        } catch (error: any) {
            console.error(`${platformName} payment error:`, error);
            setPaymentError(error.message || `Failed to start payment.`);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const clearPaymentError = () => setPaymentError("");

    return {
        isProcessingPayment,
        paymentError,
        setPaymentError,
        clearPaymentError,
        handlePay
    };
};
