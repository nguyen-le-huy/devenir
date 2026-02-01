/**
 * Checkout Utilities
 * Central export point for all utility functions
 */

export {
    parseApiError,
    handleApiError,
    isNetworkError,
    isTimeoutError,
    getContextualErrorMessage,
    logError,
    createMutationErrorHandler,
} from './errorHandling';

export {
    validateForm,
    formatZodErrors,
    getFirstError,
    hasErrors,
    clearFieldError,
    mergeErrors,
    validateRequiredFields,
    debounceValidation,
} from './validation';

export {
    formatPrice,
    formatPriceWithSymbol,
    calculateShippingCost,
    formatShippingCost,
    calculateTotal,
    formatDeliveryEstimate,
    calculateDeliveryDateRange,
    formatDate,
    formatDeliveryDateRange,
    formatPhoneNumber,
    truncateText,
    formatFullName,
    parseFullName,
} from './formatting';
