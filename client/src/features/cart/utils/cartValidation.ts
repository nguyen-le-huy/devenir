/**
 * Cart Validation - Input Validation Schemas
 * 
 * Uses Zod for runtime validation of cart operations.
 * Prevents invalid data from reaching the API.
 * 
 * @module features/cart/utils/cartValidation
 */

import { z } from 'zod';

/**
 * Validation schema for adding items to cart
 */
export const addToCartSchema = z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(999, 'Quantity cannot exceed 999'),
});

/**
 * Validation schema for updating cart item quantity
 */
export const updateCartItemSchema = z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(999, 'Quantity cannot exceed 999'),
});

/**
 * Type inference from schemas
 */
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

/**
 * Validate add to cart payload
 * 
 * @param payload - Data to validate
 * @returns Validated and typed payload
 * @throws {ZodError} If validation fails
 * 
 * @example
 * ```ts
 * try {
 *   const validated = validateAddToCart({ variantId: '123', quantity: 2 });
 *   await cartService.addToCart(validated.variantId, validated.quantity);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     toast.error(error.errors[0].message);
 *   }
 * }
 * ```
 */
export const validateAddToCart = (payload: unknown): AddToCartInput => {
    return addToCartSchema.parse(payload);
};

/**
 * Validate update cart item payload
 * 
 * @param payload - Data to validate
 * @returns Validated and typed payload
 * @throws {ZodError} If validation fails
 */
export const validateUpdateCartItem = (payload: unknown): UpdateCartItemInput => {
    return updateCartItemSchema.parse(payload);
};

/**
 * Safe validation that returns result object instead of throwing
 * 
 * @param payload - Data to validate
 * @returns Object with success status and data or error
 * 
 * @example
 * ```ts
 * const result = safeValidateAddToCart({ variantId: '', quantity: -1 });
 * if (!result.success) {
 *   console.error('Validation errors:', result.error.errors);
 * } else {
 *   console.log('Valid data:', result.data);
 * }
 * ```
 */
export const safeValidateAddToCart = (payload: unknown) => {
    return addToCartSchema.safeParse(payload);
};

/**
 * Safe validation for update cart item
 */
export const safeValidateUpdateCartItem = (payload: unknown) => {
    return updateCartItemSchema.safeParse(payload);
};
