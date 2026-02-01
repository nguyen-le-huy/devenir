/**
 * Payment Types
 * Type definitions for payment processing
 */

import type { PaymentMethodValue, CurrencyValue } from '../constants/payment';

/**
 * Payment amount with currency
 */
export interface PaymentAmount {
    amount: number;
    currency: CurrencyValue;
    formatted: string;
}

/**
 * Payment processing state
 */
export interface PaymentProcessingState {
    isProcessing: boolean;
    error: string;
    redirectUrl?: string;
}

/**
 * Payment session data
 */
export interface PaymentSession {
    sessionId: string;
    checkoutUrl: string;
    expiresAt: string;
    amount: PaymentAmount;
    method: PaymentMethodValue;
}

/**
 * Payment result from URL parameters
 */
export interface PaymentResult {
    success: boolean;
    orderId?: string;
    transactionId?: string;
    amount?: number;
    currency?: string;
    message?: string;
    error?: string;
}

/**
 * Recommended product for checkout page
 */
export interface RecommendedProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    imageHover: string;
    color: string;
    size: string;
    sku: string;
}
