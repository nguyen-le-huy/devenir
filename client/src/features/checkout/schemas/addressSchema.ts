/**
 * Address Validation Schema
 * Zod schema for shipping address validation
 */

import { z } from 'zod';
import {
    VALIDATION_MESSAGES,
    VALIDATION_RULES,
    VALIDATION_PATTERNS,
} from '../constants/validation';

/**
 * Shipping address validation schema
 * Validates all fields of the shipping address form
 */
export const addressSchema = z.object({
    firstName: z
        .string()
        .min(VALIDATION_RULES.NAME_MIN_LENGTH, VALIDATION_MESSAGES.NAME_TOO_SHORT)
        .max(VALIDATION_RULES.NAME_MAX_LENGTH, VALIDATION_MESSAGES.NAME_TOO_LONG)
        .regex(VALIDATION_PATTERNS.NAME, VALIDATION_MESSAGES.REQUIRED_FIRST_NAME)
        .trim(),

    lastName: z
        .string()
        .min(VALIDATION_RULES.NAME_MIN_LENGTH, VALIDATION_MESSAGES.NAME_TOO_SHORT)
        .max(VALIDATION_RULES.NAME_MAX_LENGTH, VALIDATION_MESSAGES.NAME_TOO_LONG)
        .regex(VALIDATION_PATTERNS.NAME, VALIDATION_MESSAGES.REQUIRED_LAST_NAME)
        .trim(),

    phoneNumber: z
        .string()
        .min(VALIDATION_RULES.PHONE_MIN_LENGTH, VALIDATION_MESSAGES.PHONE_TOO_SHORT)
        .max(VALIDATION_RULES.PHONE_MAX_LENGTH, VALIDATION_MESSAGES.PHONE_TOO_LONG)
        .regex(VALIDATION_PATTERNS.PHONE, VALIDATION_MESSAGES.INVALID_PHONE)
        .trim(),

    address: z
        .string()
        .min(VALIDATION_RULES.ADDRESS_MIN_LENGTH, VALIDATION_MESSAGES.ADDRESS_TOO_SHORT)
        .max(VALIDATION_RULES.ADDRESS_MAX_LENGTH, VALIDATION_MESSAGES.ADDRESS_TOO_LONG)
        .trim(),

    city: z
        .string()
        .min(VALIDATION_RULES.CITY_MIN_LENGTH, VALIDATION_MESSAGES.REQUIRED_CITY)
        .max(VALIDATION_RULES.CITY_MAX_LENGTH, VALIDATION_MESSAGES.REQUIRED_CITY)
        .trim(),

    district: z
        .string()
        .min(VALIDATION_RULES.DISTRICT_MIN_LENGTH, VALIDATION_MESSAGES.REQUIRED_DISTRICT)
        .max(VALIDATION_RULES.DISTRICT_MAX_LENGTH, VALIDATION_MESSAGES.REQUIRED_DISTRICT)
        .trim(),

    zipCode: z
        .string()
        .min(VALIDATION_RULES.POSTAL_CODE_MIN_LENGTH, VALIDATION_MESSAGES.INVALID_POSTAL_CODE)
        .max(VALIDATION_RULES.POSTAL_CODE_MAX_LENGTH, VALIDATION_MESSAGES.INVALID_POSTAL_CODE)
        .regex(VALIDATION_PATTERNS.POSTAL_CODE, VALIDATION_MESSAGES.INVALID_POSTAL_CODE)
        .trim(),
});

/**
 * Infer TypeScript type from schema
 */
export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Partial address schema for incremental validation
 * Useful for validating individual fields as user types
 */
export const partialAddressSchema = addressSchema.partial();

/**
 * Validate a single address field
 * @param field - Field name to validate
 * @param value - Field value
 * @returns Validation result with error message if invalid
 */
export const validateAddressField = (
    field: keyof AddressFormData,
    value: string
): { isValid: boolean; error?: string } => {
    try {
        const fieldSchema = addressSchema.shape[field];
        fieldSchema.parse(value);
        return { isValid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                isValid: false,
                error: error.issues[0]?.message || VALIDATION_MESSAGES.REQUIRED_FIELD,
            };
        }
        return { isValid: false, error: VALIDATION_MESSAGES.UNKNOWN_ERROR };
    }
};
