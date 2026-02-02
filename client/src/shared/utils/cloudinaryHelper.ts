/**
 * Cloudinary URL Helper
 * Transforms existing Cloudinary image URLs to WebP format
 */

interface CloudinaryOptions {
    quality?: number | string;
    width?: number | string;
    height?: number | string;
}

/**
 * Convert Cloudinary URL to WebP format
 * @param {string} url - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @param {number} options.quality - Quality (1-100), default 90
 * @param {number} options.width - Optional width to resize
 * @param {number} options.height - Optional height to resize
 * @returns {string} - Transformed URL with WebP format
 * 
 * @example
 * // Original: https://res.cloudinary.com/demo/image/upload/v1234/devenir/products/abc.png
 * // Transformed: https://res.cloudinary.com/demo/image/upload/f_webp,q_90/v1234/devenir/products/abc.png
 */
export const toWebP = (url: string, options: CloudinaryOptions = {}): string => {
    if (!url || typeof url !== 'string') return url;

    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) return url;

    const { quality = 90, width, height } = options;

    // Build transformation string
    const transformations = [`f_webp`, `q_${quality}`];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);

    const transformString = transformations.join(',');

    // Insert transformation after /upload/
    // Pattern: https://res.cloudinary.com/xxx/image/upload/v1234/folder/file.png
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
    const afterUpload = url.substring(uploadIndex + 8);

    // Check if there's already a transformation (starts with a letter followed by underscore)
    // If so, append to existing transformations
    if (/^[a-z]_/.test(afterUpload)) {
        // Already has transformations, append ours
        return `${beforeUpload}${transformString},${afterUpload}`;
    }

    return `${beforeUpload}${transformString}/${afterUpload}`;
};

/**
 * Convert Cloudinary URL to optimized format with auto quality
 * Best for responsive images
 * @param {string} url - Original Cloudinary URL
 * @param {Object} options - Options
 * @returns {string} - Optimized URL
 */
export const toOptimized = (url: string, options: CloudinaryOptions = {}): string => {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('cloudinary.com')) return url;

    const { width, height } = options;

    // Use f_auto for automatic format selection (WebP for supported browsers)
    // Use q_auto for automatic quality optimization
    const transformations = ['f_auto', 'q_auto'];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);

    const transformString = transformations.join(',');

    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const beforeUpload = url.substring(0, uploadIndex + 8);
    const afterUpload = url.substring(uploadIndex + 8);

    if (/^[a-z]_/.test(afterUpload)) {
        return `${beforeUpload}${transformString},${afterUpload}`;
    }

    return `${beforeUpload}${transformString}/${afterUpload}`;
};

export default { toWebP, toOptimized };
