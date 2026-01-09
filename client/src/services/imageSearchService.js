import api from './api';

/**
 * Find visually similar products using an uploaded image
 * @param {string} base64Image - Base64 encoded image (with or without data URL prefix)
 * @param {number} topK - Number of results to return (default: 12)
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export const findSimilarProducts = async (base64Image, topK = 12) => {
    try {
        // Use longer timeout for image search (60s) - large images need more time
        const data = await api.post('/image-search/find-similar', {
            image: base64Image,
            topK
        }, {
            timeout: 60000 // 60 seconds for large image uploads
        });
        return data;
    } catch (error) {
        console.error('Image search error:', error);
        throw error;
    }
};

/**
 * Check health of image search service
 * @returns {Promise<{success: boolean, status: string, checks: object}>}
 */
export const getImageSearchHealth = async () => {
    try {
        const data = await api.get('/image-search/health');
        return data;
    } catch (error) {
        console.error('Image search health check error:', error);
        throw error;
    }
};

/**
 * Convert File to base64 with optional compression
 * Large images are resized to max 1024px for faster upload
 * @param {File} file - Image file
 * @param {number} maxSize - Max dimension in pixels (default: 1024)
 * @param {number} quality - JPEG quality 0-1 (default: 0.85)
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file, maxSize = 1024, quality = 0.85) => {
    return new Promise((resolve, reject) => {
        // For small files (< 500KB), just convert directly
        if (file.size < 500 * 1024) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
            return;
        }

        // For larger files, resize using canvas
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calculate new dimensions maintaining aspect ratio
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG for better compression
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

                resolve(compressedBase64);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
