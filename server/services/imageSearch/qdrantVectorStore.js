/**
 * Qdrant Vector Store Service
 * Thay thế Pinecone bằng Self-hosted Qdrant
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'visual-search';
const VECTOR_SIZE = 512;

let qdrantClient = null;

/**
 * Convert MongoDB ObjectId to UUID format for Qdrant
 * Qdrant only accepts UUID or integer IDs
 */
export function mongoIdToUuid(mongoId) {
    // Create a hash from the MongoDB ID and format as UUID
    const hash = crypto.createHash('md5').update(mongoId).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Initialize Qdrant client
 */
export async function initQdrant() {
    if (qdrantClient) return qdrantClient;

    qdrantClient = new QdrantClient({ url: QDRANT_URL });

    // Check if collection exists, create if not
    try {
        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

        if (!exists) {
            console.log(`📦 Creating Qdrant collection: ${COLLECTION_NAME}`);
            await qdrantClient.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine'
                },
                optimizers_config: {
                    indexing_threshold: 0  // Index immediately
                },
                on_disk_payload: true  // Store payloads on disk
            });
            console.log(`✅ Collection created: ${COLLECTION_NAME}`);
        } else {
            console.log(`✅ Qdrant collection exists: ${COLLECTION_NAME}`);
        }
    } catch (error) {
        // Collection might already exist
        console.error('Qdrant init error:', error.message);
    }

    return qdrantClient;
}

/**
 * Get Qdrant client
 */
export function getQdrant() {
    if (!qdrantClient) {
        throw new Error('Qdrant not initialized. Call initQdrant() first.');
    }
    return qdrantClient;
}

/**
 * Upsert vectors with rich payload
 * @param {Array} vectors - Array of {id, vector, payload}
 */
export async function upsertVectors(vectors) {
    const client = getQdrant();

    const points = vectors.map(v => ({
        id: v.id,  // Use UUID or string hash
        vector: v.vector,
        payload: v.payload
    }));

    // Batch upsert
    const batchSize = 100;
    let upserted = 0;

    for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        await client.upsert(COLLECTION_NAME, {
            wait: true,
            points: batch
        });
        upserted += batch.length;
    }

    return { upserted };
}

/**
 * Search similar images
 * @param {number[]} queryVector - 512-dim embedding
 * @param {number} topK - Number of results (default 12)
 * @param {number} scoreThreshold - Minimum similarity score (default 0.3)
 * @returns {Promise<Array>} - Similar products with scores and payloads
 */
export async function searchSimilar(queryVector, topK = 12, scoreThreshold = 0.3) {
    const client = getQdrant();

    const results = await client.search(COLLECTION_NAME, {
        vector: queryVector,
        limit: topK,
        score_threshold: scoreThreshold,
        with_payload: true
    });

    return results.map(r => ({
        id: r.id,
        score: r.score,
        similarity: Math.round(r.score * 100),  // Convert to percentage
        ...r.payload
    }));
}

/**
 * Delete all vectors (for re-indexing)
 */
export async function deleteAllVectors() {
    const client = getQdrant();

    try {
        // Delete and recreate collection
        await client.deleteCollection(COLLECTION_NAME);
        console.log(`🗑️ Deleted collection: ${COLLECTION_NAME}`);

        // Recreate
        await client.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: 'Cosine'
            },
            optimizers_config: {
                indexing_threshold: 0
            },
            on_disk_payload: true
        });
        console.log(`✅ Recreated collection: ${COLLECTION_NAME}`);
    } catch (error) {
        console.error('Delete error:', error.message);
    }
}

/**
 * Get collection stats
 */
export async function getCollectionStats() {
    const client = getQdrant();

    try {
        const info = await client.getCollection(COLLECTION_NAME);
        return {
            vectorCount: info.points_count,
            status: info.status,
            segmentsCount: info.segments_count,
            indexedVectors: info.indexed_vectors_count
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * Check if a variant exists
 * @param {string} variantId 
 */
export async function hasVector(variantId) {
    const client = getQdrant();

    try {
        const result = await client.retrieve(COLLECTION_NAME, {
            ids: [variantId],
            with_payload: false,
            with_vector: false
        });
        return result.length > 0;
    } catch {
        return false;
    }
}

export const QDRANT_COLLECTION = COLLECTION_NAME;
export const QDRANT_VECTOR_SIZE = VECTOR_SIZE;
