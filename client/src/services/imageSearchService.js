import api from './api';

/**
 * Find visually similar products using an uploaded image
 * @param {string} base64Image - Base64 encoded image (with or without data URL prefix)
 * @param {number} topK - Number of results to return (default: 12)
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export const findSimilarProducts = async (base64Image, topK = 12) => {
    try {
        // api interceptor already unwraps response.data
        const data = await api.post('/image-search/find-similar', {
            image: base64Image,
            topK
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
 * Convert File to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
