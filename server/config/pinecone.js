import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;
let pineconeIndex = null;

export const initializePinecone = async () => {
    if (pineconeClient) return { client: pineconeClient, index: pineconeIndex };

    if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY is not set in environment variables');
    }

    try {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        const indexName = process.env.PINECONE_INDEX_NAME || 'clothing-store';
        pineconeIndex = pineconeClient.Index(indexName);

        console.log(`✅ Pinecone initialized (index: ${indexName})`);
        return { client: pineconeClient, index: pineconeIndex };
    } catch (error) {
        console.error('❌ Pinecone initialization error:', error);
        throw error;
    }
};

export const getPineconeIndex = () => {
    if (!pineconeIndex) {
        throw new Error('Pinecone not initialized. Call initializePinecone() first.');
    }
    return pineconeIndex;
};

export const getPineconeClient = () => {
    if (!pineconeClient) {
        throw new Error('Pinecone not initialized. Call initializePinecone() first.');
    }
    return pineconeClient;
};

// Auto-initialize only in server context (when env is already loaded)
// This will only run if PINECONE_API_KEY is available
if (process.env.PINECONE_API_KEY) {
    initializePinecone().catch(err => {
        console.warn('⚠️ Pinecone auto-initialization failed:', err.message);
    });
}
