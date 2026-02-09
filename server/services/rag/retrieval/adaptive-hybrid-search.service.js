/**
 * Adaptive Hybrid Search Service
 * Dynamically adjusts vector/keyword weights based on query characteristics
 * 
 * @module AdaptiveHybridSearch
 * @version 3.0.0
 */

import logger from '../utils/logger.js';

/**
 * Query type classification for adaptive weighting
 */
const QUERY_TYPES = {
    SPECIFIC_PRODUCT: 'specific_product',      // "Áo Polo Devenir Classic"
    CATEGORY_BROWSE: 'category_browse',        // "áo khoác", "quần jean"
    ATTRIBUTE_SEARCH: 'attribute_search',      // "áo màu đen size M"
    SEMANTIC_SEARCH: 'semantic_search',        // "áo mặc đi làm", "outfit cho mùa đông"
    BRAND_SEARCH: 'brand_search'              // "sản phẩm Devenir"
};

/**
 * Weight configurations for each query type
 * vectorWeight + keywordWeight = 1.0
 */
const WEIGHT_PROFILES = {
    [QUERY_TYPES.SPECIFIC_PRODUCT]: {
        vectorWeight: 0.3,
        keywordWeight: 0.7,
        reason: 'Exact match priority for specific products'
    },
    [QUERY_TYPES.CATEGORY_BROWSE]: {
        vectorWeight: 0.4,
        keywordWeight: 0.6,
        reason: 'Balance between category match and semantic similarity'
    },
    [QUERY_TYPES.ATTRIBUTE_SEARCH]: {
        vectorWeight: 0.35,
        keywordWeight: 0.65,
        reason: 'Keyword match important for specific attributes'
    },
    [QUERY_TYPES.SEMANTIC_SEARCH]: {
        vectorWeight: 0.8,
        keywordWeight: 0.2,
        reason: 'Vector search excels at understanding intent'
    },
    [QUERY_TYPES.BRAND_SEARCH]: {
        vectorWeight: 0.3,
        keywordWeight: 0.7,
        reason: 'Exact brand name match is critical'
    }
};

/**
 * Default weights for unknown query types
 */
const DEFAULT_WEIGHTS = {
    vectorWeight: 0.6,
    keywordWeight: 0.4,
    reason: 'Balanced default (slight vector preference)'
};

/**
 * Classify query type based on characteristics
 * @param {string} query - User query
 * @returns {Object} Query type and confidence
 */
function classifyQueryType(query) {
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);

    // Specific brand keywords
    const brandKeywords = ['devenir', 'nike', 'adidas', 'gucci', 'zara', 'h&m'];
    const hasBrand = brandKeywords.some(brand => lowerQuery.includes(brand));

    // Category keywords
    const categoryKeywords = [
        'áo', 'quần', 'giày', 'dép', 'nón', 'túi', 'thắt lưng',
        'jacket', 'shirt', 'pants', 'shoes', 'hat', 'bag', 'belt'
    ];
    const hasCategory = categoryKeywords.some(cat => words.includes(cat));

    // Attribute keywords
    const attributeKeywords = [
        'màu', 'color', 'size', 'cỡ', 'kích cỡ', 'giá', 'price',
        'chất liệu', 'material', 'fabric'
    ];
    const hasAttribute = attributeKeywords.some(attr => lowerQuery.includes(attr));

    // Semantic/intent keywords
    const semanticKeywords = [
        'đi làm', 'công sở', 'dạo phố', 'đi chơi', 'thể thao',
        'mùa đông', 'mùa hè', 'outfit', 'phối đồ', 'style',
        'casual', 'formal', 'elegant', 'sport'
    ];
    const hasSemantic = semanticKeywords.some(sem => lowerQuery.includes(sem));

    // Decision tree
    if (hasBrand) {
        return {
            type: QUERY_TYPES.BRAND_SEARCH,
            confidence: 0.9,
            indicators: ['brand_detected']
        };
    }

    if (hasSemantic) {
        return {
            type: QUERY_TYPES.SEMANTIC_SEARCH,
            confidence: 0.85,
            indicators: ['semantic_intent']
        };
    }

    if (hasAttribute && hasCategory) {
        return {
            type: QUERY_TYPES.ATTRIBUTE_SEARCH,
            confidence: 0.8,
            indicators: ['category', 'attributes']
        };
    }

    if (hasCategory && words.length <= 3) {
        // Short category queries
        return {
            type: QUERY_TYPES.CATEGORY_BROWSE,
            confidence: 0.75,
            indicators: ['category', 'short_query']
        };
    }

    if (words.length >= 4 && !hasSemantic) {
        // Long specific queries without semantic intent
        return {
            type: QUERY_TYPES.SPECIFIC_PRODUCT,
            confidence: 0.7,
            indicators: ['long_query', 'specific']
        };
    }

    // Default: category browse
    return {
        type: QUERY_TYPES.CATEGORY_BROWSE,
        confidence: 0.5,
        indicators: ['default']
    };
}

/**
 * Get adaptive weights for query
 * @param {string} query - User query
 * @returns {Object} Weights with metadata
 */
export function getAdaptiveWeights(query) {
    const classification = classifyQueryType(query);
    const weights = WEIGHT_PROFILES[classification.type] || DEFAULT_WEIGHTS;

    logger.debug('Adaptive weights calculated', {
        query,
        queryType: classification.type,
        confidence: classification.confidence,
        indicators: classification.indicators,
        vectorWeight: weights.vectorWeight,
        keywordWeight: weights.keywordWeight,
        reason: weights.reason
    });

    return {
        vectorWeight: weights.vectorWeight,
        keywordWeight: weights.keywordWeight,
        queryType: classification.type,
        confidence: classification.confidence,
        reason: weights.reason,
        indicators: classification.indicators
    };
}

/**
 * Merge vector and keyword search results with adaptive weighting
 * @param {Array} vectorResults - Results from vector search [{id, score, metadata}]
 * @param {Array} keywordResults - Results from keyword search [{id, score, metadata}]
 * @param {Object} weights - Weight configuration
 * @returns {Array} Merged and scored results
 */
export function mergeResults(vectorResults, keywordResults, weights) {
    const { vectorWeight, keywordWeight } = weights;

    // Build score maps
    const vectorScores = new Map();
    vectorResults.forEach(result => {
        const id = result.metadata?.product_id || result.id;
        vectorScores.set(id, result.score || 0);
    });

    const keywordScores = new Map();
    keywordResults.forEach(result => {
        const id = result._id?.toString() || result.id;
        keywordScores.set(id, result.score || 1.0); // MongoDB text search score
    });

    // Get all unique product IDs
    const allIds = new Set([...vectorScores.keys(), ...keywordScores.keys()]);

    // Calculate hybrid scores
    const mergedResults = [];
    for (const id of allIds) {
        const vectorScore = vectorScores.get(id) || 0;
        const keywordScore = keywordScores.get(id) || 0;

        // Weighted combination
        const hybridScore = (vectorScore * vectorWeight) + (keywordScore * keywordWeight);

        // Get metadata from either source
        const vectorMatch = vectorResults.find(r =>
            (r.metadata?.product_id || r.id) === id
        );
        const keywordMatch = keywordResults.find(r =>
            (r._id?.toString() || r.id) === id
        );

        mergedResults.push({
            id,
            hybridScore,
            vectorScore,
            keywordScore,
            metadata: vectorMatch?.metadata || keywordMatch,
            source: vectorMatch && keywordMatch ? 'both' : (vectorMatch ? 'vector' : 'keyword')
        });
    }

    // Sort by hybrid score descending
    mergedResults.sort((a, b) => b.hybridScore - a.hybridScore);

    logger.debug('Results merged', {
        vectorCount: vectorResults.length,
        keywordCount: keywordResults.length,
        mergedCount: mergedResults.length,
        topScore: mergedResults[0]?.hybridScore,
        sourcesDistribution: {
            both: mergedResults.filter(r => r.source === 'both').length,
            vectorOnly: mergedResults.filter(r => r.source === 'vector').length,
            keywordOnly: mergedResults.filter(r => r.source === 'keyword').length
        }
    });

    return mergedResults;
}

/**
 * Apply popularity boost to results
 * @param {Array} results - Merged results
 * @param {Map} popularityScores - Map of productId -> popularity score (0-1)
 * @param {number} boostWeight - Weight for popularity (default: 0.1)
 * @returns {Array} Boosted results
 */
export function applyPopularityBoost(results, popularityScores, boostWeight = 0.1) {
    if (!popularityScores || popularityScores.size === 0) {
        return results;
    }

    const boostedResults = results.map(result => {
        const popularity = popularityScores.get(result.id) || 0;
        const boostedScore = result.hybridScore * (1 + (popularity * boostWeight));

        return {
            ...result,
            hybridScore: boostedScore,
            popularityBoost: popularity * boostWeight
        };
    });

    // Re-sort after boosting
    boostedResults.sort((a, b) => b.hybridScore - a.hybridScore);

    return boostedResults;
}

/**
 * Apply seasonal boost to results
 * @param {Array} results - Merged results
 * @param {string} season - Current season ('spring', 'summer', 'fall', 'winter')
 * @param {number} boostWeight - Weight for seasonal boost (default: 0.15)
 * @returns {Array} Boosted results
 */
export function applySeasonalBoost(results, season, boostWeight = 0.15) {
    if (!season) {
        return results;
    }

    const seasonalTags = {
        spring: ['spring', 'xuân', 'light', 'jacket', 'áo khoác nhẹ'],
        summer: ['summer', 'hè', 't-shirt', 'shorts', 'áo thun', 'quần short'],
        fall: ['fall', 'autumn', 'thu', 'sweater', 'cardigan', 'áo len'],
        winter: ['winter', 'đông', 'coat', 'jacket', 'áo khoác', 'áo ấm']
    };

    const currentSeasonTags = seasonalTags[season.toLowerCase()] || [];

    const boostedResults = results.map(result => {
        const tags = result.metadata?.tags || [];
        const category = result.metadata?.category?.toLowerCase() || '';
        const name = result.metadata?.product_name?.toLowerCase() || '';

        // Check if product matches current season
        const isSeasonalMatch = currentSeasonTags.some(tag =>
            tags.includes(tag) || category.includes(tag) || name.includes(tag)
        );

        if (isSeasonalMatch) {
            return {
                ...result,
                hybridScore: result.hybridScore * (1 + boostWeight),
                seasonalBoost: boostWeight
            };
        }

        return result;
    });

    // Re-sort after boosting
    boostedResults.sort((a, b) => b.hybridScore - a.hybridScore);

    return boostedResults;
}

/**
 * Get current season based on month
 * @returns {string} Current season
 */
export function getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
}

export default {
    getAdaptiveWeights,
    mergeResults,
    applyPopularityBoost,
    applySeasonalBoost,
    getCurrentSeason
};
