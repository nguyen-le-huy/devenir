import { openai, MODELS } from '../../../config/openai.js';
import { EMBEDDING_DIMENSIONS } from '../constants.js';

/**
 * Generate embedding for text
 * @param {String} text - Text to embed
 * @param {Number} dimensions - Embedding dimensions (default from constants)
 */
export async function getEmbedding(text, dimensions = EMBEDDING_DIMENSIONS) {
    try {
        const response = await openai.embeddings.create({
            model: MODELS.EMBEDDING,
            input: text,
            dimensions,
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Embedding Error:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Batch generate embeddings
 * @param {Array<String>} texts - Array of texts
 * @param {Number} dimensions - Embedding dimensions (default from constants)
 */
export async function getBatchEmbeddings(texts, dimensions = EMBEDDING_DIMENSIONS) {
    try {
        // Handle empty array
        if (!texts || texts.length === 0) {
            return [];
        }

        // OpenAI has a limit on batch size
        const batchSize = 100;
        const allEmbeddings = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);

            const response = await openai.embeddings.create({
                model: MODELS.EMBEDDING,
                input: batch,
                dimensions,
            });

            const embeddings = response.data.map(item => item.embedding);
            allEmbeddings.push(...embeddings);
        }

        return allEmbeddings;
    } catch (error) {
        console.error('Batch Embedding Error:', error);
        throw new Error('Failed to generate batch embeddings');
    }
}
