// Core
export { RAGService } from './core/RAGService.js';
export { VectorStore } from './core/VectorStore.js';
export { LLMProvider, llmProvider } from './core/LLMProvider.js';

// Embeddings
export { getEmbedding, getBatchEmbeddings } from './embeddings/embedding.service.js';
export { createProductPropositions, createSimpleChunks } from './embeddings/proposition.service.js';

// Retrieval
export {
    searchProducts,
    searchByCategory,
    searchInStock,
    searchByPriceRange,
    searchByBrand,
    vectorSearch
} from './retrieval/vector-search.service.js';
export { rerankDocuments, rerankSearchResults } from './retrieval/reranking.service.js';

// Generation
export { generateResponse, generateStreamingResponse, generateJsonResponse } from './generation/response-generator.js';
export {
    buildCoVePrompt,
    buildIntentClassificationPrompt,
    buildSizePrompt,
    buildStylePrompt
} from './generation/prompt-builder.js';

// Orchestrators
export { classifyIntent, quickIntentDetection, hybridClassifyIntent } from './orchestrators/intent-classifier.js';
export { ConversationManager } from './orchestrators/conversation-manager.js';

// Specialized Services
export { productAdvice } from './specialized/product-advisor.service.js';
export { sizeRecommendation, getSizeGuide } from './specialized/size-advisor.service.js';
export { styleMatcher, getStyleByOccasion } from './specialized/style-matcher.service.js';
export { orderLookup } from './specialized/order-lookup.service.js';
