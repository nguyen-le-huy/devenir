// RAG Constants
// IMPORTANT: These values must match your Pinecone index configuration

// Embedding dimensions - must match Pinecone index dimension
export const EMBEDDING_DIMENSIONS = 1536;

// Vector search defaults
export const VECTOR_SEARCH_TOP_K = 50;
export const RERANK_TOP_N = 5;

// Intent types
export const INTENT_TYPES = {
    PRODUCT_ADVICE: 'product_advice',
    SIZE_RECOMMENDATION: 'size_recommendation',
    STYLE_MATCHING: 'style_matching',
    ORDER_LOOKUP: 'order_lookup',
    RETURN_EXCHANGE: 'return_exchange',
    GENERAL: 'general'
};

// Metadata types in Pinecone
export const METADATA_TYPES = {
    PRODUCT_INFO: 'product_info',
    VARIANT_INFO: 'variant_info'
};
