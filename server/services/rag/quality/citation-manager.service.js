/**
 * Citation Manager Service
 * Manages citations and source tracking in responses
 * 
 * @module CitationManager
 * @version 3.0.0
 */

import logger from '../utils/logger.js';

/**
 * Extract and format citations from response
 * @param {string} response - Generated response with citations
 * @param {Array} sources - Source products
 * @returns {Object} Parsed citations and clean response
 */
export function extractCitations(response, sources) {
    const citationPattern = /\[(\d+)\]/g;
    const citations = [];
    const matches = response.matchAll(citationPattern);

    for (const match of matches) {
        const index = parseInt(match[1], 10) - 1; // Convert to 0-based index
        const source = sources[index];

        if (source) {
            citations.push({
                index: index + 1,
                productId: source._id?.toString(),
                productName: source.name,
                productSlug: source.slug,
                cited: true
            });
        }
    }

    // Remove duplicates
    const uniqueCitations = Array.from(
        new Map(citations.map(c => [c.productId, c])).values()
    );

    return {
        response,
        citations: uniqueCitations,
        citationCount: uniqueCitations.length,
        hasCitations: uniqueCitations.length > 0
    };
}

/**
 * Inject citations into response text
 * @param {string} response - Response text
 * @param {Array} products - Products to cite
 * @returns {string} Response with citation markers
 */
export function injectCitations(response, products) {
    if (!products || products.length === 0) {
        return response;
    }

    let citedResponse = response;
    const citationMap = new Map();

    // Create citation map
    products.forEach((product, index) => {
        citationMap.set(product.name, index + 1);
    });

    // Inject citations after product names
    citationMap.forEach((citationNum, productName) => {
        const regex = new RegExp(`\\b(${escapeRegex(productName)})\\b`, 'gi');
        let replaced = false;

        citedResponse = citedResponse.replace(regex, (match) => {
            if (!replaced) {
                replaced = true;
                return `${match} [${citationNum}]`;
            }
            return match;
        });
    });

    return citedResponse;
}

/**
 * Generate citation footer for response
 * @param {Array} products - Source products
 * @returns {string} Citation footer text
 */
export function generateCitationFooter(products) {
    if (!products || products.length === 0) {
        return '';
    }

    const citations = products.map((product, index) => {
        const price = getProductPriceRange(product);
        return `[${index + 1}] ${product.name}${price ? ` - ${price}` : ''}`;
    }).join('\n');

    return `\n\n📚 **Nguồn tham khảo:**\n${citations}`;
}

/**
 * Get product price range string
 */
function getProductPriceRange(product) {
    if (!product.variants || product.variants.length === 0) {
        return product.price ? formatPrice(product.price) : null;
    }

    const prices = product.variants
        .map(v => v.price)
        .filter(p => p > 0);

    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

/**
 * Format price to Vietnamese format
 */
function formatPrice(price) {
    return `${price.toLocaleString('vi-VN')}đ`;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate citation integrity
 * @param {string} response - Response with citations
 * @param {Array} sources - Source products
 * @returns {Object} Validation result
 */
export function validateCitations(response, sources) {
    const citationPattern = /\[(\d+)\]/g;
    const matches = [...response.matchAll(citationPattern)];

    const invalidCitations = [];
    const validCitations = [];

    for (const match of matches) {
        const index = parseInt(match[1], 10);

        if (index < 1 || index > sources.length) {
            invalidCitations.push({
                citation: match[0],
                index,
                reason: 'Index out of range'
            });
        } else {
            validCitations.push({
                citation: match[0],
                index,
                product: sources[index - 1]
            });
        }
    }

    const isValid = invalidCitations.length === 0;

    logger.debug('Citation validation', {
        totalCitations: matches.length,
        validCitations: validCitations.length,
        invalidCitations: invalidCitations.length,
        isValid
    });

    return {
        isValid,
        totalCitations: matches.length,
        validCitations,
        invalidCitations,
        coverage: sources.length > 0
            ? validCitations.length / sources.length
            : 0
    };
}

/**
 * Generate citation metadata for analytics
 * @param {string} response - Response with citations
 * @param {Array} sources - Source products
 * @returns {Object} Citation metadata
 */
export function getCitationMetadata(response, sources) {
    const { citations, citationCount } = extractCitations(response, sources);
    const validation = validateCitations(response, sources);

    // Calculate citation distribution
    const citedProductIds = new Set(citations.map(c => c.productId));
    const uncitedProducts = sources.filter(s =>
        !citedProductIds.has(s._id?.toString())
    );

    return {
        totalSources: sources.length,
        citedSources: citationCount,
        uncitedSources: uncitedProducts.length,
        citationCoverage: sources.length > 0
            ? citationCount / sources.length
            : 0,
        isValid: validation.isValid,
        invalidCitations: validation.invalidCitations,
        uncitedProducts: uncitedProducts.map(p => ({
            id: p._id?.toString(),
            name: p.name
        }))
    };
}

export default {
    extractCitations,
    injectCitations,
    generateCitationFooter,
    validateCitations,
    getCitationMetadata
};
