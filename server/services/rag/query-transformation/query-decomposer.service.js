/**
 * Query Decomposer Service
 * Decomposes complex multi-intent queries into structured sub-queries
 * 
 * @module QueryDecomposer
 * @version 3.0.0
 */

import { llmProvider } from '../core/LLMProvider.js';
import logger, { logError } from '../utils/logger.js';

/**
 * Decompose complex queries into structured components
 * @param {string} query - User query to decompose
 * @returns {Promise<Object>} Decomposed query structure
 * 
 * @example
 * Input: "tìm áo polo màu đen size M giá 500k"
 * Output: {
 *   isMultiIntent: true,
 *   subQueries: [
 *     { type: 'product', value: 'áo polo' },
 *     { type: 'filter_color', value: 'đen' },
 *     { type: 'filter_size', value: 'M' },
 *     { type: 'filter_price', max: 500000 }
 *   ],
 *   executionStrategy: 'parallel_filter'
 * }
 */
export async function decomposeQuery(query) {
    // Feature flag check
    if (process.env.ENABLE_QUERY_TRANSFORMATION !== 'true') {
        return {
            isMultiIntent: false,
            subQueries: [{ type: 'text', value: query }],
            executionStrategy: 'simple'
        };
    }

    try {
        const prompt = `
Analyze this Vietnamese fashion search query and decompose it into structured components.

Query: "${query}"

Extract the following if present:
1. Product type (e.g., áo, quần, giày, phụ kiện)
2. Filters:
   - Color (màu sắc)
   - Size (kích cỡ)
   - Price range (khoảng giá)
   - Brand (thương hiệu)
   - Style (phong cách)
3. Intent: search, compare, get_info, check_price

Return a JSON object with this exact structure:
{
  "isMultiIntent": true|false,
  "subQueries": [
    {
      "type": "product" | "filter_color" | "filter_size" | "filter_price" | "filter_brand" | "filter_style",
      "value": string | number,
      "operator": "eq" | "gte" | "lte" (for price/numeric filters)
    }
  ],
  "executionStrategy": "sequential" | "parallel_filter" | "simple"
}

Rules:
- isMultiIntent = true if query has product + at least 1 filter
- Price should be in VND (convert "500k" to 500000)
- executionStrategy = "parallel_filter" if multiple filters, else "sequential"
        `.trim();

        const result = await llmProvider.jsonCompletion([
            { role: 'system', content: 'You are a query parser for Vietnamese fashion e-commerce. Return only valid JSON.' },
            { role: 'user', content: prompt }
        ], {
            temperature: 0.1,
            max_tokens: 500
        });

        // Validate result structure
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid LLM response structure');
        }

        // Ensure required fields
        const decomposed = {
            isMultiIntent: result.isMultiIntent || false,
            subQueries: result.subQueries || [{ type: 'text', value: query }],
            executionStrategy: result.executionStrategy || 'simple'
        };

        logger.debug('Query decomposed', {
            original: query,
            isMulti: decomposed.isMultiIntent,
            subCount: decomposed.subQueries.length,
            strategy: decomposed.executionStrategy
        });

        return decomposed;

    } catch (error) {
        logError('Query decomposition failed', error, { query });

        // Fallback to simple structure
        return {
            isMultiIntent: false,
            subQueries: [{ type: 'text', value: query }],
            executionStrategy: 'simple'
        };
    }
}

/**
 * Extract filters from decomposed query
 * @param {Object} decomposed - Decomposed query object
 * @returns {Object} MongoDB filter object
 */
export function extractFilters(decomposed) {
    const filters = {};

    for (const subQuery of decomposed.subQueries) {
        switch (subQuery.type) {
            case 'filter_color':
                filters.color = subQuery.value;
                break;

            case 'filter_size':
                filters.size = subQuery.value;
                break;

            case 'filter_price':
                if (subQuery.operator === 'lte') {
                    filters.price = { $lte: subQuery.value };
                } else if (subQuery.operator === 'gte') {
                    filters.price = { $gte: subQuery.value };
                } else {
                    // Range query
                    filters.price = {
                        $gte: subQuery.min || 0,
                        $lte: subQuery.max || Number.MAX_SAFE_INTEGER
                    };
                }
                break;

            case 'filter_brand':
                filters.brand = subQuery.value;
                break;

            case 'filter_style':
                filters.style = subQuery.value;
                break;
        }
    }

    return filters;
}

/**
 * Extract product type from decomposed query
 * @param {Object} decomposed - Decomposed query object
 * @returns {string|null} Product type
 */
export function extractProductType(decomposed) {
    const productQuery = decomposed.subQueries.find(sq => sq.type === 'product');
    return productQuery ? productQuery.value : null;
}

export default { decomposeQuery, extractFilters, extractProductType };
