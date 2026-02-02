/**
 * API Types
 * Type definitions for API requests and responses
 */

/**
 * Standard API error structure
 */
export interface ApiError {
    message: string;
    code?: string;
    field?: string;
    details?: Record<string, unknown>;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: ApiError;
    meta?: {
        timestamp?: string;
        requestId?: string;
    };
}

/**
 * Shipping address DTO (Backend format)
 * This is the format expected by the backend API
 */
export interface ShippingAddressDTO {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    district: string;
    postalCode: string;
}

/**
 * Shipping address response from API
 */
export type ShippingAddressResponse = ApiResponse<ShippingAddressDTO>;

/**
 * Gift code validation request
 */
export interface GiftCodeValidationRequest {
    code: string;
}

/**
 * Gift code validation response
 */
export interface GiftCodeValidationResponse {
    valid: boolean;
    code?: string;
    discount?: {
        type: 'fixed' | 'percentage';
        value: number;
        currency?: string;
    };
}

/**
 * Payment session creation request
 */
export interface PaymentSessionRequest {
    shippingMethod: string;
    deliveryTime: string;
    address: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        address: string;
        city: string;
        district: string;
        zipCode: string;
    };
    giftCode?: string;
}

/**
 * Payment session response
 */
export interface PaymentSessionResponse {
    success: boolean;
    checkoutUrl?: string;
    invoiceUrl?: string;
    sessionId?: string;
    message?: string;
    data?: {
        checkoutUrl?: string;
        invoiceUrl?: string;
        sessionId?: string;
    };
}

/**
 * Order status response
 */
export interface OrderStatusResponse {
    orderId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Product variant for recommendations
 */
export interface ProductVariantDTO {
    _id: string;
    sku: string;
    price: number;
    mainImage: string;
    hoverImage?: string;
    color: string;
    size: string;
    productInfo?: {
        name: string;
        slug: string;
    };
}

/**
 * Recommended products response
 */
export type RecommendedProductsResponse = ApiResponse<ProductVariantDTO[]>;

/**
 * Payment order status (from backend)
 */
export interface PaymentOrderStatus {
    orderCode: string;
    status: 'pending' | 'paid' | 'cancelled';
    totalPrice: number;
    deliveryWindow: 'standard' | 'next' | 'nominated';
    paymentMethod: 'payos' | 'nowpayments';
    confirmationEmailSentAt?: string;
}

/**
 * Payment status API response
 */
export type PaymentStatusResponse = ApiResponse<PaymentOrderStatus>;

/**
 * Navigation state for payment success page
 */
export interface PaymentSuccessState {
    orderCode: string;
    totalPrice: number;
    deliveryWindow?: string;
    paymentMethod: string;
    confirmationEmailSentAt?: string;
}

/**
 * Navigation state for payment failed page
 */
export interface PaymentFailedState {
    orderCode?: string;
    errorMessage?: string;
    paymentMethod: string;
}

