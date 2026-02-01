/**
 * Checkout Types
 * Central export point for all checkout type definitions
 */

// API Types
export type {
    ApiError,
    ApiResponse,
    ShippingAddressDTO,
    ShippingAddressResponse,
    GiftCodeValidationRequest,
    GiftCodeValidationResponse,
    PaymentSessionRequest,
    PaymentSessionResponse,
    OrderStatusResponse,
    ProductVariantDTO,
    RecommendedProductsResponse,
    PaymentOrderStatus,
    PaymentStatusResponse,
    PaymentSuccessState,
    PaymentFailedState,
} from './api';


// Form Types
export type {
    ShippingAddress,
    ShippingAddressField,
    FormValidationErrors,
    FormValidationResult,
    ShippingMethod,
    DeliveryTime,
    PaymentMethodType,
    GiftCodeState,
    CheckoutFormState,
} from './form';

export {
    DEFAULT_SHIPPING_ADDRESS,
    DEFAULT_GIFT_CODE_STATE,
    DEFAULT_CHECKOUT_FORM_STATE,
} from './form';

// Payment Types
export type {
    PaymentAmount,
    PaymentProcessingState,
    PaymentSession,
    PaymentResult,
    RecommendedProduct,
} from './payment';

// Legacy exports for backward compatibility
// TODO: Remove these after migration is complete
export type { ShippingAddressDTO as AddressResponse } from './api';
