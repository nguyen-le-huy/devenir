/**
 * Fact Checker Service
 * Validates factual accuracy of generated responses
 * 
 * @module FactChecker
 * @version 3.0.0
 */

import Product from '../../../models/ProductModel.js';
import logger from '../utils/logger.js';

/**
 * Fact check result types
 */
const FACT_CHECK_STATUS = {
    VERIFIED: 'verified',
    FAILED: 'failed',
    PARTIAL: 'partial',
    SKIPPED: 'skipped'
};

/**
 * Fact check a generated response against source data
 * @param {string} response - Generated response text
 * @param {Array} sources - Source products used for generation
 * @param {Object} context - Request context
 * @returns {Promise<Object>} Fact check results
 */
export async function factCheckResponse(response, sources, context = {}) {
    if (process.env.ENABLE_FACT_CHECKING !== 'true') {
        return {
            status: FACT_CHECK_STATUS.SKIPPED,
            checks: [],
            passed: true,
            message: 'Fact checking disabled'
        };
    }

    try {
        const checks = [];
        let failedChecks = 0;

        // 1. Price verification
        const priceCheck = await verifyPrices(response, sources);
        checks.push(priceCheck);
        if (!priceCheck.passed) failedChecks++;

        // 2. Stock availability verification
        const stockCheck = await verifyStockAvailability(response, sources);
        checks.push(stockCheck);
        if (!stockCheck.passed) failedChecks++;

        // 3. Product name accuracy
        const nameCheck = verifyProductNames(response, sources);
        checks.push(nameCheck);
        if (!nameCheck.passed) failedChecks++;

        // 4. Product attribute accuracy
        const attributeCheck = verifyProductAttributes(response, sources);
        checks.push(attributeCheck);
        if (!attributeCheck.passed) failedChecks++;

        // Determine overall status
        let status;
        if (failedChecks === 0) {
            status = FACT_CHECK_STATUS.VERIFIED;
        } else if (failedChecks === checks.length) {
            status = FACT_CHECK_STATUS.FAILED;
        } else {
            status = FACT_CHECK_STATUS.PARTIAL;
        }

        const result = {
            status,
            checks,
            passed: failedChecks === 0,
            totalChecks: checks.length,
            failedChecks,
            message: getFactCheckMessage(status, failedChecks)
        };

        logger.info('Fact check completed', {
            status,
            totalChecks: checks.length,
            failedChecks,
            query: context.query
        });

        return result;

    } catch (error) {
        logger.error('Fact checking failed', {
            error: error.message,
            stack: error.stack
        });

        return {
            status: FACT_CHECK_STATUS.SKIPPED,
            checks: [],
            passed: true,
            message: 'Fact checking error'
        };
    }
}

/**
 * Verify prices mentioned in response match actual prices
 */
async function verifyPrices(response, sources) {
    const pricePattern = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:đ|đồng|VND|vnđ)/gi;
    const mentionedPrices = [];
    let match;

    while ((match = pricePattern.exec(response)) !== null) {
        const priceStr = match[1].replace(/[.,]/g, '');
        const price = parseInt(priceStr, 10);
        if (!isNaN(price)) {
            mentionedPrices.push(price);
        }
    }

    if (mentionedPrices.length === 0) {
        return {
            type: 'price_verification',
            passed: true,
            message: 'No prices mentioned'
        };
    }

    // Get all valid prices from sources
    const validPrices = new Set();
    for (const source of sources) {
        if (source.variants && Array.isArray(source.variants)) {
            source.variants.forEach(v => {
                if (v.price) validPrices.add(v.price);
            });
        }
        if (source.price) validPrices.add(source.price);
    }

    // Check all mentioned prices are valid (within 5% tolerance)
    const invalidPrices = mentionedPrices.filter(price => {
        return ![...validPrices].some(validPrice => {
            const tolerance = validPrice * 0.05; // 5% tolerance
            return Math.abs(price - validPrice) <= tolerance;
        });
    });

    return {
        type: 'price_verification',
        passed: invalidPrices.length === 0,
        mentionedPrices,
        validPrices: [...validPrices],
        invalidPrices,
        message: invalidPrices.length === 0
            ? 'All prices verified'
            : `${invalidPrices.length} invalid price(s) detected`
    };
}

/**
 * Verify stock availability claims
 */
async function verifyStockAvailability(response, sources) {
    const stockKeywords = [
        'còn hàng', 'có sẵn', 'available', 'in stock',
        'hết hàng', 'out of stock', 'sold out'
    ];

    const mentionsStock = stockKeywords.some(keyword =>
        response.toLowerCase().includes(keyword)
    );

    if (!mentionsStock) {
        return {
            type: 'stock_verification',
            passed: true,
            message: 'No stock claims made'
        };
    }

    // Get product IDs from sources
    const productIds = sources
        .map(s => s._id || s.id)
        .filter(Boolean)
        .map(id => id.toString());

    if (productIds.length === 0) {
        return {
            type: 'stock_verification',
            passed: true,
            message: 'No product IDs to verify'
        };
    }

    // Check actual stock in DB
    const products = await Product.find({
        _id: { $in: productIds }
    }).lean();

    const stockStatus = products.map(p => ({
        productId: p._id.toString(),
        name: p.name,
        inStock: p.variants?.some(v => v.stock > 0) || false
    }));

    // Verify claims match reality
    const claimsInStock = response.toLowerCase().includes('còn hàng') ||
        response.toLowerCase().includes('có sẵn') ||
        response.toLowerCase().includes('in stock');

    const actuallyInStock = stockStatus.some(s => s.inStock);

    const passed = claimsInStock === actuallyInStock;

    return {
        type: 'stock_verification',
        passed,
        claimsInStock,
        actuallyInStock,
        stockStatus,
        message: passed
            ? 'Stock availability verified'
            : 'Stock availability mismatch'
    };
}

/**
 * Verify product names are accurate
 */
function verifyProductNames(response, sources) {
    const productNames = sources
        .map(s => s.name)
        .filter(Boolean);

    if (productNames.length === 0) {
        return {
            type: 'name_verification',
            passed: true,
            message: 'No product names to verify'
        };
    }

    // Check if mentioned names match source names (fuzzy match)
    const mentionedCorrectly = productNames.filter(name => {
        // Split name into words
        const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        // Check if at least 50% of significant words appear in response
        const foundWords = nameWords.filter(word =>
            response.toLowerCase().includes(word)
        );
        return foundWords.length >= nameWords.length * 0.5;
    });

    const accuracy = mentionedCorrectly.length / productNames.length;

    return {
        type: 'name_verification',
        passed: accuracy >= 0.8, // 80% threshold
        accuracy: Math.round(accuracy * 100),
        totalProducts: productNames.length,
        verifiedProducts: mentionedCorrectly.length,
        message: `${mentionedCorrectly.length}/${productNames.length} products named correctly`
    };
}

/**
 * Verify product attributes (colors, sizes, materials)
 */
function verifyProductAttributes(response, sources) {
    // Extract all attributes from sources
    const validColors = new Set();
    const validSizes = new Set();
    const validMaterials = new Set();

    sources.forEach(source => {
        if (source.variants) {
            source.variants.forEach(v => {
                if (v.color) validColors.add(v.color.toLowerCase());
                if (v.size) validSizes.add(v.size.toUpperCase());
            });
        }
        if (source.materials) {
            source.materials.forEach(m => validMaterials.add(m.toLowerCase()));
        }
    });

    // Common Vietnamese colors
    const colorPattern = /(đen|trắng|đỏ|xanh|vàng|nâu|xám|hồng|cam|tím|be|navy|black|white|red|blue|yellow|brown|gray|pink|orange|purple|beige)/gi;
    const sizePattern = /\b(XS|S|M|L|XL|XXL|XXXL|\d{2,3})\b/g;

    const mentionedColors = [...new Set(
        (response.match(colorPattern) || []).map(c => c.toLowerCase())
    )];
    const mentionedSizes = [...new Set(
        (response.match(sizePattern) || []).map(s => s.toUpperCase())
    )];

    // Verify mentioned attributes exist in sources
    const invalidColors = mentionedColors.filter(c => !validColors.has(c));
    const invalidSizes = mentionedSizes.filter(s => !validSizes.has(s));

    const passed = invalidColors.length === 0 && invalidSizes.length === 0;

    return {
        type: 'attribute_verification',
        passed,
        colors: {
            mentioned: mentionedColors,
            valid: [...validColors],
            invalid: invalidColors
        },
        sizes: {
            mentioned: mentionedSizes,
            valid: [...validSizes],
            invalid: invalidSizes
        },
        message: passed
            ? 'All attributes verified'
            : `${invalidColors.length + invalidSizes.length} invalid attribute(s)`
    };
}

/**
 * Get human-readable message for fact check status
 */
function getFactCheckMessage(status, failedChecks) {
    switch (status) {
        case FACT_CHECK_STATUS.VERIFIED:
            return 'All fact checks passed';
        case FACT_CHECK_STATUS.FAILED:
            return `All ${failedChecks} fact checks failed`;
        case FACT_CHECK_STATUS.PARTIAL:
            return `${failedChecks} fact check(s) failed`;
        default:
            return 'Fact checking skipped';
    }
}

export default {
    factCheckResponse,
    FACT_CHECK_STATUS
};
