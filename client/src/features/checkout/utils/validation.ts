/**
 * Validation Utilities
 * Helper functions for form validation
 */

import type { ZodSchema, ZodError } from 'zod';
import type { FormValidationErrors, FormValidationResult } from '../types/form';
import { VALIDATION_MESSAGES } from '../constants/validation';

/**
 * Validate form data using Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with data or errors
 */
export const validateForm = <T>(
    schema: ZodSchema<T>,
    data: unknown
): FormValidationResult<T> => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors: FormValidationErrors = {};

        result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });

        return {
            isValid: false,
            errors,
        };
    }

    return {
        isValid: true,
        data: result.data,
        errors: {},
    };
};

/**
 * Format Zod errors into user-friendly messages
 * @param error - Zod error object
 * @returns Formatted error messages by field
 */
export const formatZodErrors = (error: ZodError): FormValidationErrors => {
    const errors: FormValidationErrors = {};

    error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
            errors[path] = [];
        }
        errors[path].push(issue.message);
    });

    return errors;
};

/**
 * Get first error message from validation errors
 * @param errors - Validation errors object
 * @returns First error message or undefined
 */
export const getFirstError = (errors: FormValidationErrors): string | undefined => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return undefined;
    return errors[firstKey]?.[0];
};

/**
 * Check if form has any errors
 * @param errors - Validation errors object
 * @returns True if there are any errors
 */
export const hasErrors = (errors: FormValidationErrors): boolean => {
    return Object.keys(errors).length > 0;
};

/**
 * Clear specific field error
 * @param errors - Current validation errors
 * @param field - Field name to clear
 * @returns Updated errors object
 */
export const clearFieldError = (
    errors: FormValidationErrors,
    field: string
): FormValidationErrors => {
    const newErrors = { ...errors };
    delete newErrors[field];
    return newErrors;
};

/**
 * Merge multiple error objects
 * @param errorObjects - Array of error objects to merge
 * @returns Merged errors object
 */
export const mergeErrors = (
    ...errorObjects: FormValidationErrors[]
): FormValidationErrors => {
    return errorObjects.reduce((acc, errors) => {
        Object.entries(errors).forEach(([key, messages]) => {
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(...messages);
        });
        return acc;
    }, {} as FormValidationErrors);
};

/**
 * Validate required fields are not empty
 * @param data - Object with field values
 * @param requiredFields - Array of required field names
 * @returns Validation errors for empty required fields
 */
export const validateRequiredFields = (
    data: Record<string, unknown>,
    requiredFields: string[]
): FormValidationErrors => {
    const errors: FormValidationErrors = {};

    requiredFields.forEach((field) => {
        const value = data[field];
        if (
            value === undefined ||
            value === null ||
            value === '' ||
            (typeof value === 'string' && value.trim() === '')
        ) {
            errors[field] = [VALIDATION_MESSAGES.REQUIRED_FIELD];
        }
    });

    return errors;
};

/**
 * Debounce validation function
 * Useful for validating as user types without excessive validation calls
 * @param validationFn - Validation function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced validation function
 */
export const debounceValidation = <T extends unknown[]>(
    validationFn: (...args: T) => void,
    delay: number
): ((...args: T) => void) => {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: T) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            validationFn(...args);
            timeoutId = null;
        }, delay);
    };
};
