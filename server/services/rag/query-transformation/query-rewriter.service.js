/**
 * Query Rewriter Service
 * Context-aware query rewriting for conversational flows
 * 
 * @module QueryRewriter
 * @version 3.0.0
 */

import logger from '../utils/logger.js';

/**
 * Vietnamese pronouns and references
 */
const PRONOUNS = [
    'cái này', 'cái đó', 'cái kia',
    'nó', 'sản phẩm này', 'sản phẩm đó',
    'mẫu này', 'mẫu đó', 'mẫu kia',
    'chiếc này', 'chiếc đó',
    'cặp này', 'cặp đó',
    'đôi này', 'đôi đó'
];

/**
 * Patterns for partial queries
 */
const PARTIAL_QUERY_PATTERNS = [
    {
        pattern: /^(màu|color)\s*(gì|nào|available|có gì)/i,
        template: '{product} có màu gì',
        needsContext: true
    },
    {
        pattern: /^(giá|price)\s*(bao nhiêu|how much|là bao nhiêu)/i,
        template: '{product} giá bao nhiêu',
        needsContext: true
    },
    {
        pattern: /^(size|cỡ|kích cỡ)\s*(nào|gì|available|có gì)/i,
        template: '{product} có size nào',
        needsContext: true
    },
    {
        pattern: /^(còn hàng|available|in stock)\s*(không|chưa|ko)?/i,
        template: '{product} còn hàng không',
        needsContext: true
    },
    {
        pattern: /^(chất liệu|material|fabric)\s*(gì|nào)/i,
        template: '{product} chất liệu gì',
        needsContext: true
    },
    {
        pattern: /^(có|còn)\s*(size|cỡ)\s*([A-Z]{1,3}|\d+)/i,
        template: '{product} có size {size}',
        needsContext: true,
        extractSize: true
    }
];

/**
 * Follow-up action patterns
 */
const FOLLOWUP_PATTERNS = [
    {
        pattern: /^(thêm vào giỏ|add to cart|mua|đặt|order)/i,
        action: 'add_to_cart',
        needsContext: true
    },
    {
        pattern: /^(xem thêm|show more|còn gì|tương tự)/i,
        action: 'show_similar',
        needsContext: false
    },
    {
        pattern: /^(so sánh|compare)/i,
        action: 'compare',
        needsContext: true
    }
];

/**
 * Rewrite queries based on conversation context
 * @param {string} query - User query
 * @param {Object} context - Conversation context
 * @returns {Object} Rewritten query result
 */
export function rewriteQuery(query, context = {}) {
    const lowerQuery = query.toLowerCase().trim();
    const result = {
        rewritten: query,
        hasContext: false,
        rewriteType: null,
        metadata: {}
    };

    // 1. Handle pronoun references
    const pronounResult = handlePronouns(lowerQuery, context);
    if (pronounResult.rewritten) {
        result.rewritten = pronounResult.rewritten;
        result.hasContext = true;
        result.rewriteType = 'pronoun_reference';
        result.metadata = pronounResult.metadata;

        logger.debug('Query rewritten (pronoun)', {
            original: query,
            rewritten: result.rewritten,
            product: pronounResult.metadata.productName
        });

        return result;
    }

    // 2. Handle partial queries
    const partialResult = handlePartialQuery(lowerQuery, context);
    if (partialResult.rewritten) {
        result.rewritten = partialResult.rewritten;
        result.hasContext = true;
        result.rewriteType = 'partial_query';
        result.metadata = partialResult.metadata;

        logger.debug('Query rewritten (partial)', {
            original: query,
            rewritten: result.rewritten
        });

        return result;
    }

    // 3. Handle follow-up actions
    const followupResult = handleFollowup(lowerQuery, context);
    if (followupResult.action) {
        result.rewritten = query; // Keep original
        result.hasContext = true;
        result.rewriteType = 'followup_action';
        result.metadata = {
            action: followupResult.action,
            ...followupResult.metadata
        };

        logger.debug('Query identified as followup', {
            original: query,
            action: followupResult.action
        });

        return result;
    }

    // 4. No rewriting needed
    return result;
}

/**
 * Handle pronoun references
 * @private
 */
function handlePronouns(query, context) {
    const result = { rewritten: null, metadata: {} };

    // Check if query contains pronouns
    const hasPronoun = PRONOUNS.some(p => query.includes(p));
    if (!hasPronoun) return result;

    // Need current product in context
    if (!context.current_product) {
        logger.warn('Pronoun detected but no product in context', { query });
        return result;
    }

    const productName = context.current_product.name || context.current_product.productName;
    if (!productName) return result;

    // Replace pronouns with product name
    let rewritten = query;
    for (const pronoun of PRONOUNS) {
        const regex = new RegExp(pronoun, 'gi');
        rewritten = rewritten.replace(regex, productName);
    }

    result.rewritten = rewritten;
    result.metadata = {
        productId: context.current_product._id,
        productName,
        pronounsReplaced: PRONOUNS.filter(p => query.includes(p))
    };

    return result;
}

/**
 * Handle partial queries
 * @private
 */
function handlePartialQuery(query, context) {
    const result = { rewritten: null, metadata: {} };

    for (const { pattern, template, needsContext, extractSize } of PARTIAL_QUERY_PATTERNS) {
        const match = pattern.exec(query);
        if (!match) continue;

        if (needsContext && !context.current_product) {
            logger.warn('Partial query needs context but none available', { query });
            continue;
        }

        const productName = context.current_product?.name || context.current_product?.productName;
        if (!productName) continue;

        let rewritten = template.replace('{product}', productName);

        // Extract size if pattern supports it
        if (extractSize && match[3]) {
            rewritten = rewritten.replace('{size}', match[3]);
        }

        result.rewritten = rewritten;
        result.metadata = {
            productId: context.current_product._id,
            productName,
            patternMatched: pattern.toString()
        };

        return result;
    }

    return result;
}

/**
 * Handle follow-up actions
 * @private
 */
function handleFollowup(query, context) {
    const result = { action: null, metadata: {} };

    for (const { pattern, action, needsContext } of FOLLOWUP_PATTERNS) {
        if (pattern.test(query)) {
            if (needsContext && !context.current_product) {
                logger.warn('Followup action needs context', { query, action });
                continue;
            }

            result.action = action;
            result.metadata = {
                productId: context.current_product?._id,
                productName: context.current_product?.name
            };

            return result;
        }
    }

    return result;
}

/**
 * Check if query needs context for rewriting
 * @param {string} query - Query to check
 * @returns {boolean} True if context needed
 */
export function needsContext(query) {
    const lowerQuery = query.toLowerCase().trim();

    // Check pronouns
    if (PRONOUNS.some(p => lowerQuery.includes(p))) {
        return true;
    }

    // Check partial query patterns
    for (const { pattern, needsContext } of PARTIAL_QUERY_PATTERNS) {
        if (needsContext && pattern.test(lowerQuery)) {
            return true;
        }
    }

    // Check followup patterns
    for (const { pattern, needsContext } of FOLLOWUP_PATTERNS) {
        if (needsContext && pattern.test(lowerQuery)) {
            return true;
        }
    }

    return false;
}

/**
 * Extract implicit filters from context
 * @param {Object} context - Conversation context
 * @returns {Object} Extracted filters
 */
export function extractImplicitFilters(context) {
    const filters = {};

    if (!context || !context.history) {
        return filters;
    }

    // Look at last user message for implicit preferences
    const lastUserMsg = context.history
        .filter(m => m.role === 'user')
        .slice(-1)[0];

    if (!lastUserMsg) return filters;

    const content = lastUserMsg.content.toLowerCase();

    // Extract color preference
    const colors = ['đen', 'trắng', 'xám', 'xanh', 'đỏ', 'vàng', 'nâu'];
    for (const color of colors) {
        if (content.includes(color)) {
            filters.implicitColor = color;
            break;
        }
    }

    // Extract size preference
    const sizeMatch = content.match(/size\s*([A-Z]{1,3}|\d+)/i);
    if (sizeMatch) {
        filters.implicitSize = sizeMatch[1];
    }

    return filters;
}

export default {
    rewriteQuery,
    needsContext,
    extractImplicitFilters
};
