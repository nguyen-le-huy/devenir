/**
 * Self-hosted CLIP Service Client
 * Gọi CLIP FastAPI service để tạo image embeddings
 */

const CLIP_SERVICE_URL = process.env.CLIP_SERVICE_URL || 'http://localhost:8899';
const CLIP_TIMEOUT = 30000; // 30 seconds

/**
 * Check if CLIP service is healthy
 */
export async function checkClipHealth() {
    try {
        const response = await fetch(`${CLIP_SERVICE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ CLIP service health check failed:', error.message);
        return null;
    }
}

/**
 * Encode single image to embedding
 * @param {string} imageData - Base64 image or URL
 * @returns {Promise<{embedding: number[], processingTime: number}>}
 */
export async function encodeImage(imageData) {
    try {
        const response = await fetch(`${CLIP_SERVICE_URL}/encode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData }),
            signal: AbortSignal.timeout(CLIP_TIMEOUT)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`CLIP encode failed: ${error}`);
        }

        const result = await response.json();
        return {
            embedding: result.embedding,
            processingTime: result.processing_time_ms
        };
    } catch (error) {
        console.error('❌ CLIP encode error:', error.message);
        throw error;
    }
}

/**
 * Encode batch of images
 * @param {string[]} images - Array of base64 images or URLs
 * @returns {Promise<{embeddings: number[][], processingTime: number}>}
 */
export async function encodeImageBatch(images) {
    try {
        const response = await fetch(`${CLIP_SERVICE_URL}/encode-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ images }),
            signal: AbortSignal.timeout(CLIP_TIMEOUT * 2) // Longer timeout for batch
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`CLIP batch encode failed: ${error}`);
        }

        const result = await response.json();
        return {
            embeddings: result.embeddings,
            count: result.count,
            processingTime: result.processing_time_ms
        };
    } catch (error) {
        console.error('❌ CLIP batch encode error:', error.message);
        throw error;
    }
}

/**
 * Encode text to embedding (for text-to-image search)
 * @param {string} text - Search text
 * @returns {Promise<{embedding: number[], processingTime: number}>}
 */
export async function encodeText(text) {
    try {
        const response = await fetch(`${CLIP_SERVICE_URL}/encode-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text }),
            signal: AbortSignal.timeout(CLIP_TIMEOUT)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`CLIP text encode failed: ${error}`);
        }

        const result = await response.json();
        return {
            embedding: result.embedding,
            processingTime: result.processing_time_ms
        };
    } catch (error) {
        console.error('❌ CLIP text encode error:', error.message);
        throw error;
    }
}

export const CLIP_DIMENSIONS = 768;  // ViT-L-14
