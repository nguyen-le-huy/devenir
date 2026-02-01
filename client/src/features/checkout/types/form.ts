/**
 * Form Types
 * Type definitions for form data and UI state
 */

import type { ShippingMethodValue, DeliveryTimeValue } from '../constants/shipping';
import type { PaymentMethodValue } from '../constants/payment';

/**
 * Shipping address form data (Frontend format)
 * This is the format used in the UI forms
 */
export interface ShippingAddress {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    city: string;
    district: string;
    zipCode: string;
}

/**
 * Default empty shipping address
 */
export const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    district: '',
    zipCode: '',
};

/**
 * Form field names for shipping address
 */
export type ShippingAddressField = keyof ShippingAddress;

/**
 * Form validation errors
 */
export interface FormValidationErrors {
    [key: string]: string[];
}

/**
 * Form validation result
 */
export interface FormValidationResult<T> {
    isValid: boolean;
    data?: T;
    errors: FormValidationErrors;
}

/**
 * Shipping method selection state
 */
export type ShippingMethod = ShippingMethodValue | '';

/**
 * Delivery time selection state
 */
export type DeliveryTime = DeliveryTimeValue | '';

/**
 * Payment method selection state
 */
export type PaymentMethodType = PaymentMethodValue | '';

/**
 * Gift code state
 */
export interface GiftCodeState {
    code: string;
    applied: boolean;
    error: string;
    isValidating: boolean;
}

/**
 * Default gift code state
 */
export const DEFAULT_GIFT_CODE_STATE: GiftCodeState = {
    code: '',
    applied: false,
    error: '',
    isValidating: false,
};

/**
 * Checkout form state
 */
export interface CheckoutFormState {
    shippingMethod: ShippingMethod;
    deliveryTime: DeliveryTime;
    paymentMethod: PaymentMethodType;
    address: ShippingAddress;
    giftCode: GiftCodeState;
    showAddressForm: boolean;
    isProcessing: boolean;
    error: string;
}

/**
 * Default checkout form state
 */
export const DEFAULT_CHECKOUT_FORM_STATE: CheckoutFormState = {
    shippingMethod: '',
    deliveryTime: '',
    paymentMethod: '',
    address: DEFAULT_SHIPPING_ADDRESS,
    giftCode: DEFAULT_GIFT_CODE_STATE,
    showAddressForm: false,
    isProcessing: false,
    error: '',
};
