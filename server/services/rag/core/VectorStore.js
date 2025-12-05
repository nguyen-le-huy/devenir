import { getPineconeIndex } from '../../../config/pinecone.js';
import { getEmbedding } from '../embeddings/embedding.service.js';

export class VectorStore {
    constructor() {
        this.index = null;
    }

    /**
     * Get Pinecone index (lazy initialization)
     */
    getIndex() {
        if (!this.index) {
            this.index = getPineconeIndex();
        }
        return this.index;
    }

    /**
     * Search vectors by query
     */
    async search(query, options = {}) {
        const {
            topK = 50,
            filter = {},
            includeMetadata = true
        } = options;

        // Generate embedding for query
        const queryVector = await getEmbedding(query);

        // Search in Pinecone
        const results = await this.getIndex().query({
            vector: queryVector,
            topK,
            filter,
            includeMetadata
        });

        return results.matches || [];
    }

    /**
     * Upsert vectors
     */
    async upsert(vectors) {
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < vectors.length; i += batchSize) {
            batches.push(vectors.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            await this.getIndex().upsert(batch);
        }

        return { upserted: vectors.length };
    }

    /**
     * Delete vectors by filter
     */
    async delete(filter) {
        await this.getIndex().deleteMany(filter);
        return { deleted: true };
    }

    /**
     * Delete vectors by IDs
     */
    async deleteByIds(ids) {
        await this.getIndex().deleteMany(ids);
        return { deleted: ids.length };
    }

    /**
     * Get vector by ID
     */
    async fetch(ids) {
        return this.getIndex().fetch(ids);
    }
}
