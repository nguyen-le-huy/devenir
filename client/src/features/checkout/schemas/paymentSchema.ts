/**
 * Payment Validation Schema
 * Zod schema for payment-related validation
 */

import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/validation';
import { SHIPPING_METHODS, DELIVERY_TIMES } from '../constants/shipping';
import { PAYMENT_METHODS } from '../constants/payment';

/**
 * Shipping method validation schema
 */
export const shippingMethodSchema = z.enum([
    SHIPPING_METHODS.HOME,
    SHIPPING_METHODS.STORE,
] as const);

/**
 * Delivery time validation schema
 */
export const deliveryTimeSchema = z.enum([
    DELIVERY_TIMES.STANDARD,
    DELIVERY_TIMES.NEXT_DAY,
    DELIVERY_TIMES.NOMINATED,
] as const);

/**
 * Payment method validation schema
 */
export const paymentMethodSchema = z.enum([
    PAYMENT_METHODS.PAYOS,
    PAYMENT_METHODS.NOWPAYMENTS,
] as const);

/**
 * Complete payment validation schema
 * Validates all required fields for payment processing
 */
export const paymentValidationSchema = z.object({
    shippingMethod: shippingMethodSchema,
    deliveryTime: deliveryTimeSchema,
    paymentMethod: paymentMethodSchema,
    hasAddress: z.boolean().refine((val) => val === true, {
        message: VALIDATION_MESSAGES.ADDRESS_REQUIRED,
    }),
});

/**
 * Infer TypeScript type from schema
 */
export type PaymentValidationData = z.infer<typeof paymentValidationSchema>;

/**
 * Validate payment readiness
 * @param data - Payment data to validate
 * @returns Validation result
 */
export const validatePaymentReadiness = (data: {
    shippingMethod: string;
    deliveryTime: string;
    paymentMethod: string;
    hasAddress: boolean;
}): { isValid: boolean; errors: string[] } => {
    try {
        paymentValidationSchema.parse(data);
        return { isValid: true, errors: [] };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                isValid: false,
                errors: error.issues.map((issue) => issue.message),
            };
        }
        return { isValid: false, errors: [VALIDATION_MESSAGES.UNKNOWN_ERROR] };
    }
};
