/**
 * Enhanced Hybrid Search Service
 * Combines vector search + keyword search with adaptive weighting
 * 
 * @module HybridSearch
 * @version 3.0.0
 */

import { searchProducts as vectorSearchProducts } from './vector-search.service.js';
import { keywordSearchProducts } from './keyword-search.service.js';
import {
    getAdaptiveWeights,
    mergeResults,
    applyPopularityBoost,
    applySeasonalBoost,
    getCurrentSeason
} from './adaptive-hybrid-search.service.js';
import Product from '../../../models/ProductModel.js';
import logger from '../utils/logger.js';

/**
 * Hybrid search combining vector + keyword with adaptive weighting
 * @param {string} query - User query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Hybrid search results
 */
export async function hybridSearchProducts(query, options = {}) {
    const {
        topK = 50,
        enablePopularityBoost = true,
        enableSeasonalBoost = true,
        filters = {}
    } = options;

    try {
        const startTime = Date.now();

        // 1. Get adaptive weights based on query type
        const weightConfig = getAdaptiveWeights(query);

        // 2. Execute vector and keyword search in parallel
        const [vectorResults, keywordResults] = await Promise.all([
            vectorSearchProducts(query, { topK, filter: filters }),
            keywordSearchProducts(query, { limit: topK, filters })
        ]);

        logger.debug('Search results fetched', {
            query,
            queryType: weightConfig.queryType,
            vectorCount: vectorResults.length,
            keywordCount: keywordResults.length
        });

        // 3. Merge results with adaptive weighting
        let mergedResults = mergeResults(vectorResults, keywordResults, weightConfig);

        // 4. Apply popularity boost (optional)
        if (enablePopularityBoost) {
            const popularityScores = await getProductPopularityScores(
                mergedResults.map(r => r.id)
            );
            mergedResults = applyPopularityBoost(mergedResults, popularityScores, 0.1);
        }

        // 5. Apply seasonal boost (optional)
        if (enableSeasonalBoost) {
            const currentSeason = getCurrentSeason();
            mergedResults = applySeasonalBoost(mergedResults, currentSeason, 0.15);
        }

        // 6. Get full product details for top results
        const topResults = mergedResults.slice(0, topK);
        const productIds = topResults.map(r => r.id);

        const products = await Product.find({ _id: { $in: productIds } })
            .populate('category')
            .lean();

        // Map products to maintain hybrid score order
        const productsWithScores = topResults.map(result => {
            const product = products.find(p => p._id.toString() === result.id);
            return product ? {
                ...product,
                _hybridScore: result.hybridScore,
                _vectorScore: result.vectorScore,
                _keywordScore: result.keywordScore,
                _source: result.source,
                _popularityBoost: result.popularityBoost,
                _seasonalBoost: result.seasonalBoost
            } : null;
        }).filter(Boolean);

        const duration = Date.now() - startTime;

        logger.info('Hybrid search completed', {
            query,
            queryType: weightConfig.queryType,
            totalResults: mergedResults.length,
            returnedResults: productsWithScores.length,
            duration,
            weights: {
                vector: weightConfig.vectorWeight,
                keyword: weightConfig.keywordWeight
            }
        });

        return {
            products: productsWithScores,
            metadata: {
                queryType: weightConfig.queryType,
                confidence: weightConfig.confidence,
                weights: {
                    vector: weightConfig.vectorWeight,
                    keyword: weightConfig.keywordWeight
                },
                counts: {
                    vector: vectorResults.length,
                    keyword: keywordResults.length,
                    merged: mergedResults.length
                },
                boosts: {
                    popularity: enablePopularityBoost,
                    seasonal: enableSeasonalBoost
                },
                duration
            }
        };

    } catch (error) {
        logger.error('Hybrid search failed', {
            error: error.message,
            query,
            stack: error.stack
        });

        // Fallback to vector search only
        const vectorResults = await vectorSearchProducts(query, { topK, filter: filters });
        const productIds = vectorResults.slice(0, topK).map(r => r.metadata?.product_id).filter(Boolean);

        const products = await Product.find({ _id: { $in: productIds } })
            .populate('category')
            .lean();

        return {
            products,
            metadata: {
                queryType: 'fallback_vector_only',
                error: error.message,
                duration: 0
            }
        };
    }
}

/**
 * Get popularity scores for products
 * @param {Array} productIds - Product IDs
 * @returns {Promise<Map>} Map of productId -> popularity score (0-1)
 */
async function getProductPopularityScores(productIds) {
    try {
        // Lazy import to avoid circular dependency
        const Order = (await import('../../../models/OrderModel.js')).default;

        // Get order counts for products in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orderCounts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $in: ['completed', 'shipped', 'delivered'] }
                }
            },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.product',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Build popularity map
        const popularityMap = new Map();
        const maxCount = Math.max(...orderCounts.map(oc => oc.count), 1);

        for (const { _id, count } of orderCounts) {
            if (productIds.includes(_id.toString())) {
                // Normalize to 0-1 scale
                popularityMap.set(_id.toString(), count / maxCount);
            }
        }

        logger.debug('Popularity scores calculated', {
            productsScored: popularityMap.size,
            maxOrderCount: maxCount
        });

        return popularityMap;

    } catch (error) {
        logger.error('Popularity scoring failed', { error: error.message });
        return new Map();
    }
}

export default {
    hybridSearchProducts,
    getProductPopularityScores
};
