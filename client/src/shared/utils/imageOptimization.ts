/**
 * Cloudinary image optimization utility
 * Converts images to WebP format while preserving original quality and dimensions
 */

/**
 * Convert Cloudinary image to WebP format
 * Preserves original quality and dimensions - only changes format for smaller file size
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @returns {string} WebP optimized URL (same quality, same dimensions, smaller file)
 */
export const getOptimizedImageUrl = (imageUrl: string): string => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return imageUrl;
    }

    // Parse the Cloudinary URL
    const uploadIndex = imageUrl.indexOf('/upload/');
    if (uploadIndex === -1) return imageUrl;

    const baseUrl = imageUrl.substring(0, uploadIndex + 8);
    let imagePath = imageUrl.substring(uploadIndex + 8);

    // Remove existing transformations (like q_90/) to avoid double transformation
    // Pattern: transformations are before version (v1234/) or folder path
    const transformPattern = /^([a-z]_[^\/]+\/)+/;
    imagePath = imagePath.replace(transformPattern, '');

    // Change extension to .webp for clarity (Cloudinary supports this)
    imagePath = imagePath.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');

    // Only apply WebP format with maximum quality (100)
    // No resizing, no cropping - preserve original dimensions
    const transformString = 'f_webp,q_100';

    return `${baseUrl}${transformString}/${imagePath}`;
};

/**
 * Lazy load image component helper
 * Returns props for native lazy loading
 */
export const getLazyLoadProps = () => ({
    loading: 'lazy' as const,
    decoding: 'async' as const,
});
