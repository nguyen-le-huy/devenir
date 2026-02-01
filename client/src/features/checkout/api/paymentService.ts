/**
 * Payment API Service
 * Handles payment session creation and processing
 */

import type {
    PaymentSessionRequest,
    PaymentSessionResponse,
    ShippingAddress,
} from '../types';
import type { ShippingMethod, DeliveryTime, PaymentMethodType } from '../types/form';
import { getContextualErrorMessage } from '../utils';
import { PAYMENT_METHODS } from '../constants';

/**
 * Payment session creation payload
 */
interface CreatePaymentSessionPayload {
    shippingMethod: ShippingMethod;
    deliveryTime: DeliveryTime;
    address: ShippingAddress;
    giftCode?: string;
}

/**
 * Create PayOS payment session
 * @param payload - Payment session data
 * @returns Payment session response with checkout URL
 * @throws Error if session creation fails
 */
export const createPayOSSession = async (
    payload: CreatePaymentSessionPayload
): Promise<PaymentSessionResponse> => {
    try {
        // Import PayOS service dynamically to avoid circular dependencies
        const { createPayOSPaymentSession } = await import('@/features/payos');

        const request: PaymentSessionRequest = {
            shippingMethod: payload.shippingMethod,
            deliveryTime: payload.deliveryTime,
            address: payload.address,
            giftCode: payload.giftCode,
        };

        const response = await createPayOSPaymentSession(request);

        // Normalize response structure
        return {
            success: response.success || !!response.checkoutUrl || !!response.data?.checkoutUrl,
            checkoutUrl: response.checkoutUrl || response.data?.checkoutUrl,
            sessionId: response.data?.sessionId,
            message: response.message,
        };
    } catch (error: unknown) {
        throw new Error(
            getContextualErrorMessage(error, 'creating PayOS payment session')
        );
    }
};

/**
 * Create NowPayments payment session
 * @param payload - Payment session data
 * @returns Payment session response with invoice URL
 * @throws Error if session creation fails
 */
export const createNowPaymentsSession = async (
    payload: CreatePaymentSessionPayload
): Promise<PaymentSessionResponse> => {
    try {
        // Import NowPayments service dynamically to avoid circular dependencies
        const { createNowPaymentsSession } = await import('@/features/nowpayments');

        const request: PaymentSessionRequest = {
            shippingMethod: payload.shippingMethod,
            deliveryTime: payload.deliveryTime,
            address: payload.address,
            giftCode: payload.giftCode,
        };

        const response = await createNowPaymentsSession(request);

        // Normalize response structure
        return {
            success: response.success || !!response.invoiceUrl || !!response.data?.invoiceUrl,
            checkoutUrl: response.invoiceUrl || response.data?.invoiceUrl,
            invoiceUrl: response.invoiceUrl || response.data?.invoiceUrl,
            sessionId: response.data?.sessionId,
            message: response.message,
        };
    } catch (error: unknown) {
        throw new Error(
            getContextualErrorMessage(error, 'creating NowPayments payment session')
        );
    }
};

/**
 * Create payment session based on payment method
 * @param paymentMethod - Selected payment method
 * @param payload - Payment session data
 * @returns Payment session response
 * @throws Error if session creation fails or invalid payment method
 */
export const createPaymentSession = async (
    paymentMethod: PaymentMethodType,
    payload: CreatePaymentSessionPayload
): Promise<PaymentSessionResponse> => {
    switch (paymentMethod) {
        case PAYMENT_METHODS.PAYOS:
            return createPayOSSession(payload);

        case PAYMENT_METHODS.NOWPAYMENTS:
            return createNowPaymentsSession(payload);

        default:
            throw new Error('Invalid payment method selected');
    }
};

/**
 * Get payment redirect URL from response
 * @param response - Payment session response
 * @returns Redirect URL or null
 */
export const getPaymentRedirectUrl = (
    response: PaymentSessionResponse
): string | null => {
    return (
        response.checkoutUrl ||
        response.invoiceUrl ||
        response.data?.checkoutUrl ||
        response.data?.invoiceUrl ||
        null
    );
};

/**
 * Validate payment session response
 * @param response - Payment session response
 * @returns True if response is valid
 */
export const isValidPaymentResponse = (
    response: PaymentSessionResponse
): boolean => {
    return (
        response.success === true &&
        getPaymentRedirectUrl(response) !== null
    );
};
