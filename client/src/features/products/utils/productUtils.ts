import type { IColor, IVariant } from '../types';

/**
 * Get color name from variant color (which can be string or IColor object)
 */
export const getColorName = (color: string | IColor | undefined | null): string => {
    if (!color) return 'Unknown';
    return typeof color === 'string' ? color : color.name;
};

/**
 * Extract Cloudinary public ID from URL for deduplication
 */
export const getCloudinaryPublicId = (url: string): string => {
    if (!url || !url.includes('cloudinary.com')) return url;
    // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
    const match = url.match(/\/upload\/(?:[^/]+\/)*v?\d*\/?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : url;
};

/**
 * Helper to get active variant or fallback
 */
export const getDisplayVariant = (
    currentVariant: IVariant | undefined,
    baseProduct: any // or IProduct
) => {
    if (currentVariant) return currentVariant;
    return baseProduct; // simplified
};
