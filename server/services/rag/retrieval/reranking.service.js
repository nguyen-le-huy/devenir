import { CohereClient } from 'cohere-ai';

let cohereClient = null;

/**
 * Initialize Cohere client
 */
function getClient() {
    if (!cohereClient && process.env.COHERE_API_KEY) {
        cohereClient = new CohereClient({
            token: process.env.COHERE_API_KEY
        });
    }
    return cohereClient;
}

/**
 * Rerank documents using Cohere
 * @param {string} query - Original query
 * @param {Array<string>} documents - Documents to rerank
 * @param {number} topN - Number of top results to return
 */
export async function rerankDocuments(query, documents, topN = 5) {
    try {
        const client = getClient();

        if (!client) {
            console.warn('⚠️ Cohere API key not found. Skipping reranking, returning top results by index.');
            return documents.slice(0, topN).map((doc, index) => ({
                index,
                relevance_score: 1.0 - (index * 0.1),
                document: doc
            }));
        }

        // Handle empty documents
        if (!documents || documents.length === 0) {
            return [];
        }

        // If documents less than topN, return all
        if (documents.length <= topN) {
            return documents.map((doc, index) => ({
                index,
                relevance_score: 1.0,
                document: doc
            }));
        }

        const response = await client.rerank({
            model: 'rerank-multilingual-v3.0',
            query,
            documents,
            topN,
            returnDocuments: false
        });

        return response.results.map(result => ({
            index: result.index,
            relevance_score: result.relevanceScore,
            document: documents[result.index]
        }));

    } catch (error) {
        console.error('Reranking Error:', error);
        // Fallback: return top N without reranking
        return documents.slice(0, topN).map((doc, index) => ({
            index,
            relevance_score: 1.0,
            document: doc
        }));
    }
}

/**
 * Rerank search results from Pinecone
 * @param {string} query - Original query
 * @param {Array} searchResults - Results from Pinecone search
 * @param {number} topN - Number of top results
 */
export async function rerankSearchResults(query, searchResults, topN = 5) {
    // Extract proposition texts from metadata
    const documents = searchResults.map(r => r.metadata?.proposition_text || '');

    const reranked = await rerankDocuments(query, documents, topN);

    // Map back to original search results
    return reranked.map(r => ({
        ...searchResults[r.index],
        relevance_score: r.relevance_score
    }));
}
