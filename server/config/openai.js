import OpenAI from 'openai';

// Lazy initialization - only create client when needed
let openaiClient = null;

export const getOpenAI = () => {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
};

// For backward compatibility - lazy getter
export const openai = {
    get embeddings() {
        return getOpenAI().embeddings;
    },
    get chat() {
        return getOpenAI().chat;
    }
};

export const MODELS = {
    EMBEDDING: 'text-embedding-3-small',
    CHAT: 'gpt-4.1-mini-2025-04-14',
    CHAT_FAST: 'gpt-4.1-mini-2025-04-14',
};
