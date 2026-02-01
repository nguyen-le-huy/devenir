/**
 * Gift Code Validation Schema
 * Zod schema for gift code validation
 */

import { z } from 'zod';
import {
    VALIDATION_MESSAGES,
    VALIDATION_RULES,
    VALIDATION_PATTERNS,
} from '../constants/validation';

/**
 * Gift code validation schema
 */
export const giftCodeSchema = z.object({
    code: z
        .string()
        .min(VALIDATION_RULES.GIFT_CODE_MIN_LENGTH, VALIDATION_MESSAGES.REQUIRED_GIFT_CODE)
        .max(VALIDATION_RULES.GIFT_CODE_MAX_LENGTH, VALIDATION_MESSAGES.INVALID_GIFT_CODE)
        .regex(VALIDATION_PATTERNS.GIFT_CODE, VALIDATION_MESSAGES.INVALID_GIFT_CODE)
        .trim()
        .transform((val) => val.toLowerCase()), // Normalize to lowercase for comparison
});

/**
 * Infer TypeScript type from schema
 */
export type GiftCodeFormData = z.infer<typeof giftCodeSchema>;

/**
 * Validate gift code format
 * @param code - Gift code to validate
 * @returns Validation result
 */
export const validateGiftCodeFormat = (
    code: string
): { isValid: boolean; error?: string; normalizedCode?: string } => {
    try {
        const result = giftCodeSchema.parse({ code });
        return {
            isValid: true,
            normalizedCode: result.code,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                isValid: false,
                error: error.issues[0]?.message || VALIDATION_MESSAGES.INVALID_GIFT_CODE,
            };
        }
        return { isValid: false, error: VALIDATION_MESSAGES.UNKNOWN_ERROR };
    }
};
