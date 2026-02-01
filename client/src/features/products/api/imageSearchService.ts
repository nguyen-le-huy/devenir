import apiClient from '@/core/api/apiClient';

/**
 * Image Search Service
 * API calls for visual product search functionality
 */

// ============================================
// Types
// ============================================

interface ImageSearchResult {
    success: boolean;
    data: unknown[];
    count: number;
}

interface HealthCheckResult {
    success: boolean;
    status: string;
    checks: Record<string, unknown>;
}

// ============================================
// Constants
// ============================================

const TIMEOUTS = {
    IMAGE_SEARCH: 60000, // 60 seconds for large image uploads
} as const;

const IMAGE_COMPRESSION = {
    MAX_SIZE_PX: 1024,
    QUALITY: 0.85,
    SMALL_FILE_THRESHOLD: 500 * 1024, // 500KB
} as const;

// ============================================
// API Functions
// ============================================

/**
 * Find visually similar products using an uploaded image
 * @param base64Image - Base64 encoded image (with or without data URL prefix)
 * @param topK - Number of results to return (default: 12)
 */
export const findSimilarProducts = async (
    base64Image: string,
    topK = 12
): Promise<ImageSearchResult> => {
    const data = await apiClient.post<ImageSearchResult>(
        '/image-search/find-similar',
        { image: base64Image, topK },
        { timeout: TIMEOUTS.IMAGE_SEARCH }
    );

    return data as unknown as ImageSearchResult;
};

/**
 * Check health of image search service
 */
export const getImageSearchHealth = async (): Promise<HealthCheckResult> => {
    const data = await apiClient.get<HealthCheckResult>('/image-search/health');
    return data as unknown as HealthCheckResult;
};

// ============================================
// Utility Functions
// ============================================

/**
 * Convert File to base64 with optional compression
 * Large images are resized to max 1024px for faster upload
 * @param file - Image file
 * @param maxSize - Max dimension in pixels (default: 1024)
 * @param quality - JPEG quality 0-1 (default: 0.85)
 */
export const fileToBase64 = (
    file: File,
    maxSize = IMAGE_COMPRESSION.MAX_SIZE_PX,
    quality = IMAGE_COMPRESSION.QUALITY
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // For small files, just convert directly
        if (file.size < IMAGE_COMPRESSION.SMALL_FILE_THRESHOLD) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
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
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Convert to JPEG for better compression
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } else {
                    reject(new Error('Canvas context is null'));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));

            if (typeof e.target?.result === 'string') {
                img.src = e.target.result;
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
