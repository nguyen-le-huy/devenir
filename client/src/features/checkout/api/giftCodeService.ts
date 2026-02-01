/**
 * Gift Code API Service
 * Handles gift code validation
 */

import type { GiftCodeValidationResponse } from '../types';
import { handleApiError } from '../utils';
import { validateGiftCodeFormat } from '../schemas';

/**
 * Known valid gift codes (temporary - should come from backend)
 * TODO: Replace with actual API call when backend implements gift code validation
 */
const VALID_GIFT_CODES = ['emanhhuy', 'devenir2026', 'welcome'];

/**
 * Check if gift code is valid
 * @param code - Gift code to check
 * @returns Validation result
 * @throws Error if validation fails
 */
export const validateGiftCode = async (
    code: string
): Promise<GiftCodeValidationResponse> => {
    try {
        // First, validate format
        const formatValidation = validateGiftCodeFormat(code);
        if (!formatValidation.isValid) {
            return {
                valid: false,
            };
        }

        const normalizedCode = formatValidation.normalizedCode || code.toLowerCase();

        // TODO: Replace with actual API call
        // const response = await apiClient.post<ApiResponse<GiftCodeValidationResponse>>(
        //   '/checkout/validate-gift-code',
        //   { code: normalizedCode }
        // );
        // return response.data;

        // MOCK IMPLEMENTATION: Simulating API latency
        await new Promise((resolve) => setTimeout(resolve, 500));

        const isValid = VALID_GIFT_CODES.includes(normalizedCode);

        return {
            valid: isValid,
            code: isValid ? normalizedCode : undefined,
            discount: isValid
                ? {
                    type: 'fixed',
                    value: 0, // Special pricing handled in payment flow
                }
                : undefined,
        };
    } catch (error: unknown) {
        throw new Error(handleApiError(error, 'Failed to validate gift code'));
    }
};

/**
 * Apply gift code to current session
 * @param code - Gift code to apply
 * @returns Applied gift code details
 * @throws Error if application fails
 */
export const applyGiftCode = async (code: string): Promise<GiftCodeValidationResponse> => {
    const validation = await validateGiftCode(code);

    if (!validation.valid) {
        throw new Error('Invalid gift code');
    }

    return validation;
};

/**
 * Remove applied gift code from session
 * @returns Success status
 */
export const removeGiftCode = async (): Promise<void> => {
    // TODO: Implement backend call if needed
    // For now, this is handled client-side only
    return Promise.resolve();
};
