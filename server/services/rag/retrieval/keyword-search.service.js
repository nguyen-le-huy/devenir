/**
 * Keyword Search Service
 * MongoDB text search for exact keyword matching
 * 
 * @module KeywordSearch
 * @version 3.0.0
 */

import Product from '../../../models/ProductModel.js';
import logger from '../utils/logger.js';

/**
 * Search products using MongoDB text search
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Search results with scores
 */
export async function keywordSearchProducts(query, options = {}) {
    try {
        const {
            limit = 50,
            filters = {},
            minScore = 0.1
        } = options;

        // Build text search query
        const searchQuery = {
            $text: { $search: query },
            isActive: true,
            ...filters
        };

        // Execute search with text score
        const results = await Product.find(
            searchQuery,
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .populate('category')
            .lean();

        // Filter by minimum score
        const filteredResults = results.filter(r => r.score >= minScore);

        logger.debug('Keyword search completed', {
            query,
            totalResults: results.length,
            filteredResults: filteredResults.length,
            topScore: filteredResults[0]?.score
        });

        return filteredResults;

    } catch (error) {
        // Text index might not exist
        if (error.code === 27 || error.message.includes('text index')) {
            logger.warn('Text index not found, returning empty results', { query });
            return [];
        }

        logger.error('Keyword search failed', { error: error.message, query });
        return [];
    }
}

/**
 * Search products by exact name match
 * @param {string} productName - Product name
 * @returns {Promise<Array>} Matching products
 */
export async function searchByExactName(productName) {
    try {
        const results = await Product.find({
            name: { $regex: new RegExp(productName, 'i') },
            isActive: true
        })
            .populate('category')
            .lean();

        return results.map(r => ({
            ...r,
            score: 1.0 // Perfect match
        }));

    } catch (error) {
        logger.error('Exact name search failed', { error: error.message });
        return [];
    }
}

/**
 * Create text index for products (run once during setup)
 */
export async function createTextIndex() {
    try {
        await Product.collection.createIndex({
            name: 'text',
            description: 'text',
            'category.name': 'text'
        }, {
            weights: {
                name: 10,          // Name is most important
                description: 5,     // Description medium importance
                'category.name': 2  // Category low importance
            },
            name: 'product_text_index'
        });

        logger.info('Text index created successfully');
    } catch (error) {
        if (error.code === 85) {
            logger.info('Text index already exists');
        } else {
            logger.error('Text index creation failed', { error: error.message });
        }
    }
}

export default {
    keywordSearchProducts,
    searchByExactName,
    createTextIndex
};
