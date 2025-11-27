/**
 * Cloudinary image optimization utility
 * Generates optimized Cloudinary URLs with automatic format and quality
 */

/**
 * Get optimized image URL from Cloudinary
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {string} options.quality - Quality ('auto', 'best', 'good', 'eco', 'low')
 * @param {string} options.format - Format ('auto', 'webp', 'jpg', 'png')
 * @param {string} options.crop - Crop mode ('fill', 'fit', 'scale', 'crop', 'thumb')
 * @returns {string} Optimized Cloudinary URL
 */
export const getOptimizedImageUrl = (
  imageUrl,
  {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
  } = {}
) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  // Parse the Cloudinary URL
  const uploadIndex = imageUrl.indexOf('/upload/');
  if (uploadIndex === -1) return imageUrl;

  const baseUrl = imageUrl.substring(0, uploadIndex + 8);
  const imagePath = imageUrl.substring(uploadIndex + 8);

  // Build transformation string
  const transformations = [];

  // Format and quality (always include for optimization)
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);

  // Dimensions
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);

  // Add DPR for responsive images
  transformations.push('dpr_auto');

  // Combine transformations
  const transformString = transformations.join(',');

  return `${baseUrl}${transformString}/${imagePath}`;
};

/**
 * Preset configurations for common use cases
 */
export const ImagePresets = {
  // Product thumbnails in grids
  thumbnail: {
    width: 600,
    height: 750,
    quality: 'auto:best',
    crop: 'fill',
  },

  // Product detail page main image
  productMain: {
    width: 800,
    height: 1000,
    quality: 'auto:best',
    crop: 'fit',
  },

  // Gallery/carousel images
  gallery: {
    width: 1200,
    height: 1500,
    quality: 'auto:good',
    crop: 'fit',
  },

  // Hero/banner images
  hero: {
    width: 1920,
    height: 800,
    quality: 'auto:good',
    crop: 'fill',
  },

  // Mobile optimized
  mobile: {
    width: 600,
    height: 750,
    quality: 'auto:eco',
    crop: 'fill',
  },
};

/**
 * Generate srcSet for responsive images
 * @param {string} imageUrl - Original image URL
 * @param {Array<number>} widths - Array of widths for srcSet
 * @returns {string} srcSet string
 */
export const generateSrcSet = (imageUrl, widths = [400, 800, 1200, 1600]) => {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(imageUrl, { width, quality: 'auto' });
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Lazy load image component helper
 * Returns props for native lazy loading
 */
export const getLazyLoadProps = () => ({
  loading: 'lazy',
  decoding: 'async',
});
