/**
 * RAG Service Module Exports
 * Enterprise-grade AI chat service
 * 
 * @module RAG
 * @version 2.0.0
 */

// ============================================
// CORE
// ============================================

export { RAGService, ragService } from './core/RAGService.js';
export { VectorStore } from './core/VectorStore.js';
export { LLMProvider, llmProvider } from './core/LLMProvider.js';

// ============================================
// EMBEDDINGS
// ============================================

export { getEmbedding, getBatchEmbeddings } from './embeddings/embedding.service.js';
export { createProductPropositions, createSimpleChunks } from './embeddings/proposition.service.js';

// ============================================
// RETRIEVAL
// ============================================

export {
    searchProducts,
    searchByCategory,
    searchInStock,
    searchByPriceRange,
    searchByBrand,
    vectorSearch
} from './retrieval/vector-search.service.js';
export { rerankDocuments, rerankSearchResults } from './retrieval/reranking.service.js';

// ============================================
// GENERATION
// ============================================

export { generateResponse } from './generation/response-generator.js';
export {
    buildCoVePrompt,
    buildIntentClassificationPrompt,
    buildSizePrompt,
    buildStylePrompt
} from './generation/prompt-builder.js';
export { buildEnterpriseSizeAdvisorPrompt } from './generation/prompts/size-advisor.prompt.js';

// ============================================
// ORCHESTRATORS
// ============================================

export {
    classifyIntent,
    quickIntentDetection,
    hybridClassifyIntent
} from './orchestrators/intent-classifier.js';
export { ConversationManager } from './orchestrators/conversation-manager.js';
export { EnhancedContextManager } from './orchestrators/enhanced-context-manager.js';

// ============================================
// SPECIALIZED SERVICES
// ============================================

export { productAdvice } from './specialized/product-advisor.service.js';
export { sizeRecommendation, getSizeGuide } from './specialized/size-advisor.service.js';
export { styleMatcher, getStyleByOccasion } from './specialized/style-matcher.service.js';
export { orderLookup } from './specialized/order-lookup.service.js';
export { policyFAQ } from './specialized/policy-faq.service.js';
export { handleAddToCart } from './specialized/add-to-cart.service.js';
export { adminAnalytics } from './specialized/admin-analytics.service.js';

// ============================================
// KNOWLEDGE SERVICES
// ============================================

export {
    ProductKnowledgeService,
    productKnowledgeService
} from './knowledge/product-knowledge.service.js';

// ============================================
// UTILITIES
// ============================================

// Customer Context
export { buildCustomerContext, getToneInstruction } from './utils/customerContext.js';

// Error Handling
export {
    RAGError,
    IntentClassificationError,
    ProductNotFoundError,
    VectorSearchError,
    LLMProviderError,
    LLMRateLimitError,
    EntityExtractionError,
    ContextRetrievalError,
    ResponseGenerationError,
    ValidationError,
    TimeoutError,
    isRAGError,
    wrapError,
    getUserFriendlyMessage
} from './utils/errors.js';

// Logging
export {
    default as logger,
    logRequestStart,
    logRequestComplete,
    logIntentClassification,
    logEntityExtraction,
    logVectorSearch,
    logLLMRequest,
    logCacheOperation,
    logProductKnowledge,
    logSizeRecommendation,
    logAdminQuery,
    logError,
    logWarning,
    logPerformance,
    generateRequestId,
    createContextLogger
} from './utils/logger.js';

// Color Utilities
export {
    findColorInQuery,
    normalizeColor,
    getColorDisplayName,
    colorsMatch,
    getColorVariations,
    filterByColor,
    extractColorFromText,
    clearColorCache,
    getColorsFromDB,
    COLOR_MAPPING_VI_EN,
    ENGLISH_COLORS,
    COMPOUND_COLORS
} from './utils/colorUtils.js';

// Date Utilities
export {
    calculateDateRange,
    parsePeriodFromText,
    parseDateFromText,
    formatDateVN,
    formatDateISO,
    formatDateTimeVN,
    getRelativeTime,
    isSameDay,
    isToday,
    isPast,
    isFuture,
    addDays,
    addMonths,
    startOfDay,
    endOfDay,
    getDayNameVN,
    getMonthNameVN
} from './utils/dateUtils.js';

// ============================================
// TYPES (for TypeScript consumers)
// ============================================

// Re-export types when available
// export * from './types/index.js';

// ============================================
// CACHE
// ============================================

export { RAGCache, ragCache } from './cache/rag-cache.service.js';

// ============================================
// MONITORING
// ============================================

export {
    ragMetrics,
    Counter,
    Gauge,
    Histogram
} from './monitoring/metrics.js';

// ============================================
// CONSTANTS
// ============================================

export {
    INTENTS,
    ADMIN_INTENTS,
    RAG_CONFIG,
    INTENT_KEYWORDS,
    SIZE_CHARTS,
    RESPONSES
} from './constants.js';
