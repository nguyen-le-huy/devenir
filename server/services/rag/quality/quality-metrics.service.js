/**
 * Quality Metrics Service
 * Collects and tracks RAG quality metrics
 * 
 * @module QualityMetrics
 * @version 3.0.0
 */

import logger from '../utils/logger.js';

/**
 * Calculate retrieval quality metrics
 * @param {Array} retrievedProducts - Products retrieved
 * @param {Array} rankedProducts - Products after reranking
 * @param {string} query - User query
 * @returns {Object} Retrieval metrics
 */
export function calculateRetrievalMetrics(retrievedProducts, rankedProducts, query) {
    const metrics = {
        // Basic counts
        retrievedCount: retrievedProducts.length,
        rankedCount: rankedProducts.length,

        // Diversity metrics
        uniqueBrands: new Set(
            retrievedProducts.map(p => p.brand?.name || p.brand).filter(Boolean)
        ).size,
        uniqueCategories: new Set(
            retrievedProducts.map(p => p.category?.name).filter(Boolean)
        ).size,

        // Price range
        priceRange: getPriceRange(retrievedProducts),

        // Availability
        inStockCount: retrievedProducts.filter(p =>
            p.variants?.some(v => v.stock > 0)
        ).length,

        // Reranking impact
        rerankingImpact: calculateRerankingImpact(retrievedProducts, rankedProducts)
    };

    return metrics;
}

/**
 * Calculate RAGAS-style quality scores
 * @param {string} response - Generated response
 * @param {string} query - User query
 * @param {Array} sources - Source documents
 * @returns {Promise<Object>} Quality scores
 */
export async function calculateQualityScores(response, query, sources) {
    // Simplified RAGAS-style scoring
    // In production, use actual RAGAS library or LLM-based evaluation

    const scores = {
        // Faithfulness: Does response stay true to sources?
        faithfulness: calculateFaithfulness(response, sources),

        // Relevance: Does response answer the query?
        relevance: calculateRelevance(response, query),

        // Context Precision: Are sources relevant?
        contextPrecision: calculateContextPrecision(sources, query),

        // Answer Completeness
        completeness: calculateCompleteness(response, query)
    };

    // Overall score (weighted average)
    scores.overall = (
        scores.faithfulness * 0.3 +
        scores.relevance * 0.3 +
        scores.contextPrecision * 0.2 +
        scores.completeness * 0.2
    );

    return scores;
}

/**
 * Calculate faithfulness score
 * How well does response reflect source information?
 */
function calculateFaithfulness(response, sources) {
    if (!sources || sources.length === 0) return 0;

    // Count how many source names/attributes appear in response
    let matches = 0;
    let total = sources.length;

    sources.forEach(source => {
        const nameWords = source.name?.toLowerCase().split(/\s+/) || [];
        const significantWords = nameWords.filter(w => w.length > 3);

        const foundWords = significantWords.filter(word =>
            response.toLowerCase().includes(word)
        );

        if (foundWords.length >= significantWords.length * 0.5) {
            matches++;
        }
    });

    return matches / total;
}

/**
 * Calculate relevance score
 * How well does response answer the query?
 */
function calculateRelevance(response, query) {
    const queryWords = query.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);

    if (queryWords.length === 0) return 1;

    const foundWords = queryWords.filter(word =>
        response.toLowerCase().includes(word)
    );

    return foundWords.length / queryWords.length;
}

/**
 * Calculate context precision
 * How relevant are the retrieved sources?
 */
function calculateContextPrecision(sources, query) {
    if (!sources || sources.length === 0) return 0;

    // Simple heuristic: check if source names/categories match query
    const queryLower = query.toLowerCase();

    let relevantSources = 0;
    sources.forEach(source => {
        const name = source.name?.toLowerCase() || '';
        const category = source.category?.name?.toLowerCase() || '';

        if (name.includes(queryLower) || queryLower.includes(name.split(/\s+/)[0])) {
            relevantSources++;
        } else if (queryLower.includes(category)) {
            relevantSources += 0.5; // Partial credit for category match
        }
    });

    return Math.min(relevantSources / sources.length, 1);
}

/**
 * Calculate completeness score
 * Does response provide sufficient information?
 */
function calculateCompleteness(response, query) {
    // Heuristics for completeness
    let score = 0;

    // Has product recommendations
    if (response.includes('sản phẩm') || response.includes('product')) {
        score += 0.25;
    }

    // Has price information
    if (/\d+[.,]\d+\s*(?:đ|đồng|VND)/i.test(response)) {
        score += 0.25;
    }

    // Has variants/options info
    if (/màu|color|size|cỡ/i.test(response)) {
        score += 0.25;
    }

    // Reasonable length (not too short)
    if (response.length > 100) {
        score += 0.25;
    }

    return score;
}

/**
 * Calculate reranking impact
 */
function calculateRerankingImpact(original, reranked) {
    if (original.length === 0 || reranked.length === 0) {
        return 0;
    }

    // Calculate how many positions changed in top 10
    const top10Original = original.slice(0, 10).map(p => p._id?.toString());
    const top10Reranked = reranked.slice(0, 10).map(p => p._id?.toString());

    let positionChanges = 0;
    top10Reranked.forEach((id, newPos) => {
        const oldPos = top10Original.indexOf(id);
        if (oldPos !== -1 && oldPos !== newPos) {
            positionChanges += Math.abs(newPos - oldPos);
        }
    });

    // Normalize to 0-1 scale (max change = 45 for top 10)
    return Math.min(positionChanges / 45, 1);
}

/**
 * Get price range from products
 */
function getPriceRange(products) {
    const prices = [];

    products.forEach(product => {
        if (product.variants) {
            product.variants.forEach(v => {
                if (v.price > 0) prices.push(v.price);
            });
        } else if (product.price) {
            prices.push(product.price);
        }
    });

    if (prices.length === 0) {
        return { min: 0, max: 0, avg: 0 };
    }

    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
}

/**
 * Aggregate quality metrics for reporting
 * @param {Array} chatLogs - Recent chat logs with quality data
 * @returns {Object} Aggregated metrics
 */
export function aggregateQualityMetrics(chatLogs) {
    if (!chatLogs || chatLogs.length === 0) {
        return null;
    }

    const metrics = {
        totalRequests: chatLogs.length,
        avgRagasScore: 0,
        avgFaithfulness: 0,
        avgRelevance: 0,
        avgCacheHitRate: 0,
        avgRetrievedProducts: 0,
        factCheckPassRate: 0
    };

    let totalRagas = 0;
    let totalFaithfulness = 0;
    let totalRelevance = 0;
    let cacheHits = 0;
    let totalRetrieved = 0;
    let factCheckPassed = 0;

    chatLogs.forEach(log => {
        const quality = log.analytics?.qualityMetrics;
        const retrieval = log.analytics?.retrievalDetails;

        if (quality) {
            if (quality.ragasScore) totalRagas += quality.ragasScore;
            if (quality.faithfulness) totalFaithfulness += quality.faithfulness;
            if (quality.relevance) totalRelevance += quality.relevance;
            if (quality.factCheckPassed) factCheckPassed++;
        }

        if (retrieval) {
            if (retrieval.cacheHit) cacheHits++;
            if (retrieval.productsRetrieved) totalRetrieved += retrieval.productsRetrieved;
        }
    });

    metrics.avgRagasScore = totalRagas / chatLogs.length;
    metrics.avgFaithfulness = totalFaithfulness / chatLogs.length;
    metrics.avgRelevance = totalRelevance / chatLogs.length;
    metrics.avgCacheHitRate = cacheHits / chatLogs.length;
    metrics.avgRetrievedProducts = totalRetrieved / chatLogs.length;
    metrics.factCheckPassRate = factCheckPassed / chatLogs.length;

    return metrics;
}

export default {
    calculateRetrievalMetrics,
    calculateQualityScores,
    aggregateQualityMetrics
};
