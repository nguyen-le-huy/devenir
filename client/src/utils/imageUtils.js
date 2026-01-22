/**
 * Image utility functions for Visual Search feature
 */

/**
 * Validate image file type and size
 * @param {File} file - File to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return 'Please upload a JPEG, PNG, or WebP image.';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return 'Image size must be less than 10MB.';
    }

    return null;
};

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Get cropped image from canvas as base64
 * @param {HTMLImageElement} imageElement - Source image element
 * @param {Object} cropArea - Crop dimensions {x, y, width, height}
 * @param {string} fallbackImage - Fallback if crop fails
 * @returns {string} - Base64 encoded cropped image
 */
export const getCroppedImageBase64 = (imageElement, cropArea, fallbackImage) => {
    if (!imageElement || !cropArea) {
        return fallbackImage;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return fallbackImage;
    }

    // Calculate crop area in actual image dimensions
    const scaleX = imageElement.naturalWidth / imageElement.width;
    const scaleY = imageElement.naturalHeight / imageElement.height;

    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;

    // Set canvas dimensions
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw cropped portion
    ctx.drawImage(
        imageElement,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
    );

    return canvas.toDataURL('image/png');
};

/**
 * Calculate initial crop area (centered square)
 * @param {number} width - Image display width
 * @param {number} height - Image display height
 * @returns {Object} - Crop object for react-image-crop
 */
export const calculateInitialCrop = (width, height) => {
    const cropSize = Math.min(width, height) * 0.8;
    return {
        unit: 'px',
        x: (width - cropSize) / 2,
        y: (height - cropSize) / 2,
        width: cropSize,
        height: cropSize
    };
};
