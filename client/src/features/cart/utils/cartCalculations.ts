/**
 * Cart Calculations - Pure Business Logic
 * 
 * All cart calculation functions are pure (no side effects).
 * Testable, reusable, and maintainable.
 * 
 * @module features/cart/utils/cartCalculations
 */

import { ICartItem, IProductVariant } from '../types';
import { IVariant } from '@/features/products/types';

/**
 * Calculate cart totals from items array
 * 
 * @param items - Array of cart items
 * @returns Object with totalItems count and totalPrice sum
 * 
 * @example
 * ```ts
 * const cart = { items: [...] };
 * const { totalItems, totalPrice } = calculateCartTotals(cart.items);
 * // { totalItems: 3, totalPrice: 299.97 }
 * ```
 */
export const calculateCartTotals = (items: ICartItem[]): { totalItems: number; totalPrice: number } => {
    if (!items || items.length === 0) {
        return { totalItems: 0, totalPrice: 0 };
    }

    const totalItems = items.reduce((acc, item) => acc + (item.quantity || 0), 0);

    const totalPrice = items.reduce((acc, item) => {
        const price = getVariantPrice(item.productVariant);
        return acc + price * (item.quantity || 0);
    }, 0);

    return { totalItems, totalPrice };
};

/**
 * Get the effective price for a product variant
 * Priority: salePrice > basePrice > price > 0
 * 
 * @param variant - Product variant object
 * @returns Effective price as number
 * 
 * @example
 * ```ts
 * const variant = { salePrice: 79.99, basePrice: 99.99 };
 * const price = getVariantPrice(variant); // 79.99
 * ```
 */
export const getVariantPrice = (variant: IProductVariant): number => {
    if (!variant) return 0;
    return variant.salePrice || variant.basePrice || variant.price || 0;
};

/**
 * Extract color name from variant color field
 * Handles both string and object formats
 * 
 * @param color - Color field (string or object with name property)
 * @returns Color name as string or empty string
 * 
 * @example
 * ```ts
 * getColorName({ name: 'Navy Blue', code: '#001f3f' }); // 'Navy Blue'
 * getColorName('Red'); // 'Red'
 * getColorName(null); // ''
 * ```
 */
export const getColorName = (color: { name: string } | string | null | undefined): string => {
    if (!color) return '';
    return typeof color === 'string' ? color : color.name || '';
};

/**
 * Find variant by color and size attributes
 * 
 * @param variants - Array of product variants to search
 * @param color - Color name to match
 * @param size - Size to match
 * @returns Matching variant or undefined
 * 
 * @example
 * ```ts
 * const variants = [...];
 * const variant = findVariantByAttributes(variants, 'Navy Blue', 'L');
 * if (variant) {
 *   console.log('Found variant:', variant._id);
 * }
 * ```
 */
export const findVariantByAttributes = <T extends IVariant | IProductVariant>(
    variants: T[],
    color: string,
    size: string
): T | undefined => {
    if (!variants || variants.length === 0) return undefined;

    return variants.find((variant) => {
        const variantColor = getColorName(variant.color);
        return variantColor === color && variant.size === size;
    });
};

/**
 * Check if cart item can be updated to specified quantity
 * Validates against available stock
 * 
 * @param item - Cart item to validate
 * @param newQuantity - Desired new quantity
 * @returns Object with isValid boolean and optional error message
 * 
 * @example
 * ```ts
 * const { isValid, error } = canUpdateQuantity(item, 5);
 * if (!isValid) {
 *   toast.error(error);
 * }
 * ```
 */
export const canUpdateQuantity = (
    item: ICartItem,
    newQuantity: number
): { isValid: boolean; error?: string } => {
    if (newQuantity < 1) {
        return { isValid: false, error: 'Quantity must be at least 1' };
    }

    if (newQuantity > 999) {
        return { isValid: false, error: 'Quantity cannot exceed 999' };
    }

    const stock = item.productVariant?.stock || 0;
    if (newQuantity > stock) {
        return {
            isValid: false,
            error: `Only ${stock} items available in stock`,
        };
    }

    return { isValid: true };
};

/**
 * Get available sizes for a product with stock status
 * 
 * @param variants - All variants of the product
 * @param currentColor - Color to filter variants by
 * @param sizes - Array of size options to check
 * @returns Array of size objects with stock status and variantId
 * 
 * @example
 * ```ts
 * const availableSizes = getAvailableSizes(variants, 'Navy Blue', SIZE_OPTIONS);
 * // [{ size: 'M', inStock: true, variantId: '...' }, ...]
 * ```
 */
export const getAvailableSizes = <T extends IVariant | IProductVariant>(
    variants: T[],
    currentColor: string,
    sizes: readonly string[]
): Array<{ size: string; inStock: boolean; variantId?: string }> => {
    return sizes.map((size) => {
        const sizeVariant = findVariantByAttributes(variants, currentColor, size);

        return {
            size,
            inStock: sizeVariant ? (sizeVariant.stock || 0) > 0 : false,
            variantId: sizeVariant?._id,
        };
    });
};
