/**
 * Image Vector Store
 * Quản lý image embeddings trong Pinecone index "visual-search" (512 dims)
 */

import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;
let imageIndex = null;

const INDEX_NAME = process.env.PINECONE_IMAGE_INDEX_NAME || 'visual-search';
const NAMESPACE = 'product-images';

/**
 * Initialize Pinecone for image search
 */
export async function initImageVectorStore() {
    if (imageIndex) return imageIndex;

    if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY is not set');
    }

    pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });

    imageIndex = pineconeClient.Index(INDEX_NAME);
    console.log(`✅ Image Vector Store initialized (index: ${INDEX_NAME})`);

    return imageIndex;
}

/**
 * Get image index
 */
export function getImageIndex() {
    if (!imageIndex) {
        throw new Error('Image Vector Store not initialized. Call initImageVectorStore() first.');
    }
    return imageIndex;
}

/**
 * Upsert image embeddings
 * @param {Array} vectors - Array of {id, values, metadata}
 */
export async function upsertImageEmbeddings(vectors) {
    const index = getImageIndex();
    const namespace = index.namespace(NAMESPACE);

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await namespace.upsert(batch);
    }

    return { upserted: vectors.length };
}

/**
 * Search similar images
 * @param {number[]} queryVector - 512-dim CLIP embedding
 * @param {number} topK - Number of results
 * @returns {Promise<Array>} - Similar products
 */
export async function searchSimilarImages(queryVector, topK = 8) {
    const index = getImageIndex();
    const namespace = index.namespace(NAMESPACE);

    const results = await namespace.query({
        vector: queryVector,
        topK,
        includeMetadata: true
    });

    return results.matches || [];
}

/**
 * Delete all image embeddings (for re-indexing)
 */
export async function deleteAllImageEmbeddings() {
    const index = getImageIndex();
    const namespace = index.namespace(NAMESPACE);

    try {
        await namespace.deleteAll();
        console.log('🗑️ Deleted all image embeddings');
    } catch (error) {
        // Handle case when namespace is empty or doesn't exist
        if (error.message?.includes('404') || error.name === 'PineconeNotFoundError') {
            console.log('🗑️ Namespace is already empty or does not exist');
        } else {
            throw error;
        }
    }
}

/**
 * Get index stats
 */
export async function getImageIndexStats() {
    const index = getImageIndex();
    return index.describeIndexStats();
}

/**
 * Check if a variant already has embedding
 * @param {string} variantId 
 */
export async function hasEmbedding(variantId) {
    const index = getImageIndex();
    const namespace = index.namespace(NAMESPACE);

    try {
        const result = await namespace.fetch([variantId]);
        return result.records && Object.keys(result.records).length > 0;
    } catch {
        return false;
    }
}
