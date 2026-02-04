/**
 * Color Matching Utilities
 * Centralized color detection and matching for RAG services
 * 
 * @module ColorUtils
 * @version 1.0.0
 */

import Color from '../../../models/ColorModel.js';
import logger from './logger.js';

// ============================================
// CONSTANTS
// ============================================

/**
 * Vietnamese color mappings to English
 */
export const COLOR_MAPPING_VI_EN = {
    // Basic colors
    'đen': 'black',
    'trắng': 'white',
    'đỏ': 'red',
    'xanh': 'blue',
    'xanh lá': 'green',
    'xanh dương': 'blue',
    'vàng': 'yellow',
    'cam': 'orange',
    'tím': 'purple',
    'hồng': 'pink',
    'nâu': 'brown',
    'xám': 'gray',
    'be': 'beige',
    'kem': 'cream',
    'xanh navy': 'navy',
    'xanh rêu': 'olive',
    'xanh mint': 'mint',
    'bạc': 'silver',
    'vàng gold': 'gold',
    'đỏ rượu': 'wine',
    'hồng pastel': 'pastel pink',
    'xanh pastel': 'pastel blue'
};

/**
 * English color names (for detection)
 */
export const ENGLISH_COLORS = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'beige', 'cream', 'navy', 'olive',
    'mint', 'silver', 'gold', 'wine', 'burgundy', 'teal', 'coral',
    'salmon', 'khaki', 'ivory', 'charcoal', 'indigo', 'maroon', 'tan'
];

/**
 * Compound colors (multi-word)
 */
export const COMPOUND_COLORS = [
    'xanh navy', 'xanh lá', 'xanh dương', 'xanh rêu', 'xanh mint',
    'đỏ rượu', 'đỏ đô', 'wine red', 'navy blue', 'dusty pink',
    'hot pink', 'light pink', 'dark blue', 'light blue', 'dark green',
    'light green', 'off white', 'cream white', 'pastel pink', 'pastel blue',
    'dusty blue', 'burgundy red', 'olive green', 'forest green', 'sky blue'
];

// ============================================
// CACHE
// ============================================

let colorCache = null;
let colorCacheTime = 0;
const COLOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ============================================
// FUNCTIONS
// ============================================

/**
 * Load colors from database with caching
 * @returns {Promise<Array>} Array of color objects
 */
export async function getColorsFromDB() {
    const now = Date.now();

    if (colorCache && (now - colorCacheTime < COLOR_CACHE_TTL)) {
        return colorCache;
    }

    try {
        const colors = await Color.find({ isActive: true }).lean();
        colorCache = colors;
        colorCacheTime = now;
        logger.debug('Color cache refreshed', { count: colors.length });
        return colors;
    } catch (error) {
        logger.logError('getColorsFromDB', error);
        return colorCache || [];
    }
}

/**
 * Check if a color exists as a whole word in text
 * @param {string} text - Text to search in
 * @param {string} color - Color to find
 * @returns {boolean}
 */
function matchesAsWord(text, color) {
    const escapedColor = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escapedColor}($|\\s|,|\\.)`, 'i');
    return regex.test(text);
}

/**
 * Find matching color from query
 * Detects both Vietnamese and English colors, including compound colors
 * 
 * @param {string} query - User query
 * @returns {Object|null} Color match object { vi, en, isCompound }
 * 
 * @example
 * findColorInQuery('tìm áo màu xanh navy') // { vi: 'xanh navy', en: 'navy', isCompound: true }
 */
export function findColorInQuery(query) {
    if (!query || typeof query !== 'string') return null;

    const lowerQuery = query.toLowerCase().trim();

    // 1. Check compound colors first (they need to match before single words)
    for (const compound of COMPOUND_COLORS) {
        if (matchesAsWord(lowerQuery, compound)) {
            // Try to find English equivalent
            const viMatch = compound.startsWith('xanh') || compound.startsWith('đỏ') || compound.startsWith('hồng');
            const en = viMatch
                ? COLOR_MAPPING_VI_EN[compound] || compound.split(' ').pop()
                : compound.split(' ').pop(); // Take last word for English compounds

            return {
                vi: compound,
                en: en,
                isCompound: true
            };
        }
    }

    // 2. Check Vietnamese single colors
    for (const [vi, en] of Object.entries(COLOR_MAPPING_VI_EN)) {
        if (!vi.includes(' ') && matchesAsWord(lowerQuery, vi)) {
            return { vi, en, isCompound: false };
        }
    }

    // 3. Check English colors
    for (const en of ENGLISH_COLORS) {
        if (matchesAsWord(lowerQuery, en)) {
            // Find Vietnamese equivalent
            const vi = Object.entries(COLOR_MAPPING_VI_EN)
                .find(([_, e]) => e === en)?.[0] || en;
            return { vi, en, isCompound: false };
        }
    }

    return null;
}

/**
 * Normalize color name to English
 * @param {string} color - Color name (any language)
 * @returns {string} Normalized English color name
 */
export function normalizeColor(color) {
    if (!color) return '';

    const lower = color.toLowerCase().trim();

    // Check Vietnamese mapping
    if (COLOR_MAPPING_VI_EN[lower]) {
        return COLOR_MAPPING_VI_EN[lower];
    }

    // Check if already English
    if (ENGLISH_COLORS.includes(lower)) {
        return lower;
    }

    // Return as-is
    return lower;
}

/**
 * Get color display name (for Vietnamese users)
 * @param {string} colorEn - English color name
 * @returns {string} Vietnamese display name
 */
export function getColorDisplayName(colorEn) {
    if (!colorEn) return '';

    const lower = colorEn.toLowerCase().trim();

    // Find Vietnamese equivalent
    const entry = Object.entries(COLOR_MAPPING_VI_EN)
        .find(([_, en]) => en === lower);

    return entry ? entry[0] : colorEn;
}

/**
 * Check if two colors are the same (handles language differences)
 * @param {string} color1 - First color
 * @param {string} color2 - Second color
 * @returns {boolean}
 */
export function colorsMatch(color1, color2) {
    if (!color1 || !color2) return false;

    const normalized1 = normalizeColor(color1);
    const normalized2 = normalizeColor(color2);

    return normalized1 === normalized2;
}

/**
 * Get all variations of a color name
 * @param {string} color - Color name
 * @returns {string[]} Array of color variations
 */
export function getColorVariations(color) {
    if (!color) return [];

    const normalized = normalizeColor(color);
    const variations = [normalized];

    // Add Vietnamese equivalent
    for (const [vi, en] of Object.entries(COLOR_MAPPING_VI_EN)) {
        if (en === normalized) {
            variations.push(vi);
        }
    }

    // Add original if different
    if (!variations.includes(color.toLowerCase())) {
        variations.push(color.toLowerCase());
    }

    return [...new Set(variations)];
}

/**
 * Find products matching a specific color
 * @param {Array} products - Array of products
 * @param {string} targetColor - Color to match
 * @returns {Array} Filtered products
 */
export function filterByColor(products, targetColor) {
    if (!products || !targetColor) return products || [];

    const variations = getColorVariations(targetColor);

    return products.filter(product => {
        const productColor = (product.color || '').toLowerCase();
        return variations.some(v => productColor.includes(v));
    });
}

/**
 * Extract primary color from product name/description
 * @param {string} text - Product name or description
 * @returns {string|null} Detected color
 */
export function extractColorFromText(text) {
    if (!text) return null;

    const match = findColorInQuery(text);
    return match?.en || null;
}

// ============================================
// CLEAR CACHE (for testing/admin)
// ============================================

/**
 * Clear the color cache
 */
export function clearColorCache() {
    colorCache = null;
    colorCacheTime = 0;
    logger.debug('Color cache cleared');
}
