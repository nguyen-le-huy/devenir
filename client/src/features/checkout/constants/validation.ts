/**
 * Validation Constants
 * Centralized validation rules and error messages
 */

/**
 * Validation error messages
 * User-friendly messages for validation errors
 */
export const VALIDATION_MESSAGES = {
    // Required field errors
    REQUIRED_FIELD: 'This field is required',
    REQUIRED_FIRST_NAME: 'First name is required',
    REQUIRED_LAST_NAME: 'Last name is required',
    REQUIRED_PHONE: 'Phone number is required',
    REQUIRED_ADDRESS: 'Address is required',
    REQUIRED_CITY: 'City is required',
    REQUIRED_DISTRICT: 'District is required',
    REQUIRED_POSTAL_CODE: 'Postal code is required',
    REQUIRED_GIFT_CODE: 'Please enter a gift code',

    // Format errors
    INVALID_PHONE: 'Please enter a valid phone number (10-15 digits)',
    INVALID_POSTAL_CODE: 'Please enter a valid postal code (5-10 digits)',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_GIFT_CODE: 'Invalid gift code',

    // Length errors
    NAME_TOO_SHORT: 'Name must be at least 2 characters',
    NAME_TOO_LONG: 'Name must not exceed 50 characters',
    PHONE_TOO_SHORT: 'Phone number must be at least 10 digits',
    PHONE_TOO_LONG: 'Phone number must not exceed 15 digits',
    ADDRESS_TOO_SHORT: 'Address must be at least 5 characters',
    ADDRESS_TOO_LONG: 'Address must not exceed 200 characters',

    // Payment errors
    PAYMENT_METHOD_REQUIRED: 'Please select a payment method',
    SHIPPING_METHOD_REQUIRED: 'Please select a shipping method',
    DELIVERY_TIME_REQUIRED: 'Please choose a delivery time',
    ADDRESS_REQUIRED: 'Please confirm your shipping address to continue',
    PAYMENT_HOME_DELIVERY_ONLY: 'This payment method is available for home delivery only',

    // General errors
    UNKNOWN_ERROR: 'An unexpected error occurred',
    NETWORK_ERROR: 'Network error. Please check your connection and try again',
    SERVER_ERROR: 'Server error. Please try again later',
} as const;

/**
 * Validation rules
 * Numeric constraints for validation
 */
export const VALIDATION_RULES = {
    // Name constraints
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,

    // Phone number constraints
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,

    // Address constraints
    ADDRESS_MIN_LENGTH: 5,
    ADDRESS_MAX_LENGTH: 200,

    // City/District constraints
    CITY_MIN_LENGTH: 2,
    CITY_MAX_LENGTH: 50,
    DISTRICT_MIN_LENGTH: 2,
    DISTRICT_MAX_LENGTH: 50,

    // Postal code constraints
    POSTAL_CODE_MIN_LENGTH: 5,
    POSTAL_CODE_MAX_LENGTH: 10,

    // Gift code constraints
    GIFT_CODE_MIN_LENGTH: 3,
    GIFT_CODE_MAX_LENGTH: 20,
} as const;

/**
 * Regular expressions for validation
 */
export const VALIDATION_PATTERNS = {
    // Phone number: digits, spaces, hyphens, parentheses, plus sign
    PHONE: /^[0-9+\-\s()]+$/,

    // Postal code: 5-10 digits
    POSTAL_CODE: /^[0-9]{5,10}$/,

    // Email: standard email format
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Name: letters, spaces, hyphens, apostrophes (for names like O'Brien, Jean-Pierre)
    NAME: /^[a-zA-ZÀ-ỹ\s'-]+$/,

    // Gift code: alphanumeric, case-insensitive
    GIFT_CODE: /^[a-zA-Z0-9]+$/,
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
    ADDRESS_SAVED: 'Address saved successfully',
    ADDRESS_UPDATED: 'Address updated successfully',
    GIFT_CODE_APPLIED: 'Gift code applied successfully!',
    PAYMENT_INITIATED: 'Redirecting to payment...',
} as const;

/**
 * Field labels for forms
 */
export const FIELD_LABELS = {
    FIRST_NAME: 'First name',
    LAST_NAME: 'Last name',
    PHONE_NUMBER: 'Phone number',
    ADDRESS: 'Address',
    CITY: 'City',
    DISTRICT: 'District',
    POSTAL_CODE: 'Zipcode',
    GIFT_CODE: 'Gift Code',
} as const;

/**
 * Validation debounce delay in milliseconds
 */
export const VALIDATION_DEBOUNCE_MS = 300;
