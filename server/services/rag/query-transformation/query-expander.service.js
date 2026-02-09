/**
 * Query Expander Service
 * Expands queries with domain-specific synonyms and variations
 * 
 * @module QueryExpander
 * @version 3.0.0
 */

import logger from '../utils/logger.js';

// ============================================
// FASHION DOMAIN SYNONYM DICTIONARIES
// ============================================

/**
 * Vietnamese-English product type synonyms
 */
const FASHION_SYNONYMS = {
    // Tops
    'áo ấm': ['áo len', 'sweater', 'áo khoác len', 'hoodie', 'cardigan'],
    'áo thun': ['t-shirt', 'áo phông', 'tee', 'polo'],
    'áo sơ mi': ['shirt', 'dress shirt', 'button-up', 'oxford'],
    'áo khoác': ['jacket', 'blazer', 'coat', 'outerwear'],
    'áo len': ['sweater', 'pullover', 'knit', 'áo ấm'],
    'hoodie': ['áo hoodie', 'áo có mũ', 'sweatshirt'],

    // Bottoms
    'quần dài': ['pants', 'trousers', 'quần tây', 'slacks'],
    'quần jean': ['jeans', 'denim', 'quần bò'],
    'quần short': ['shorts', 'quần ngắn'],
    'quần kaki': ['khaki pants', 'chinos'],

    // Footwear
    'giày': ['shoes', 'footwear'],
    'giày thể thao': ['sneakers', 'athletic shoes', 'trainers'],
    'giày boot': ['boots', 'chelsea boots'],
    'dép': ['sandals', 'slides', 'flip-flops'],

    // Accessories
    'nón': ['hat', 'cap', 'beanie'],
    'túi': ['bag', 'backpack', 'tote'],
    'đồng hồ': ['watch', 'timepiece'],
    'thắt lưng': ['belt', 'strap'],

    // 🆕 Gift Shopping Categories
    'quà tặng': ['gift', 'nước hoa', 'perfume', 'trang sức', 'jewelry', 'vòng cổ', 'vòng tay', 'bracelet', 'necklace', 'khăn choàng', 'scarf', 'túi xách', 'handbag', 'phụ kiện', 'accessories'],
    'quà sinh nhật': ['birthday gift', 'nước hoa', 'trang sức', 'phụ kiện cao cấp', 'luxury accessories'],
    'quà tặng mẹ': ['gift for mom', 'nước hoa', 'perfume', 'vòng cổ', 'khăn choàng', 'túi xách'],
    'quà tặng bố': ['gift for dad', 'thắt lưng', 'belt', 'wallet', 'ví', 'túi xách nam'],
    'nước hoa': ['perfume', 'fragrance', 'cologne', 'eau de parfum'],
    'trang sức': ['jewelry', 'vòng cổ', 'necklace', 'vòng tay', 'bracelet', 'nhẫn', 'ring'],
    'vòng cổ': ['necklace', 'trang sức', 'jewelry'],
    'vòng tay': ['bracelet', 'trang sức', 'jewelry'],
    'khăn choàng': ['scarf', 'khăn', 'shawl', 'wrap']
};

/**
 * Color variations and translations
 */
const COLOR_VARIATIONS = {
    'đen': ['black', 'đen', 'dark', 'noir'],
    'trắng': ['white', 'trắng', 'off-white', 'ivory', 'cream'],
    'xám': ['gray', 'grey', 'xám', 'charcoal', 'silver'],
    'xanh navy': ['navy', 'navy blue', 'dark blue'],
    'xanh dương': ['blue', 'azure', 'sky blue'],
    'đỏ': ['red', 'đỏ', 'crimson', 'burgundy'],
    'vàng': ['yellow', 'gold', 'mustard'],
    'nâu': ['brown', 'tan', 'beige', 'khaki'],
    'hồng': ['pink', 'rose', 'blush'],
    'tím': ['purple', 'violet', 'lavender'],
    'cam': ['orange', 'tangerine'],
    'be': ['beige', 'cream', 'ivory', 'off-white']
};

/**
 * Style/occasion keywords
 */
const STYLE_KEYWORDS = {
    'công sở': ['business', 'formal', 'office', 'professional'],
    'thể thao': ['sport', 'athletic', 'active', 'gym'],
    'dạo phố': ['casual', 'streetwear', 'everyday'],
    'sang trọng': ['luxury', 'premium', 'elegant', 'sophisticated'],
    'tối giản': ['minimalist', 'simple', 'basic', 'clean']
};

/**
 * Material keywords
 */
const MATERIAL_KEYWORDS = {
    'cotton': ['bông', 'cotton 100%', 'pure cotton'],
    'polyester': ['poly', 'synthetic'],
    'len': ['wool', 'merino', 'cashmere'],
    'denim': ['jean', 'bò', 'denim fabric'],
    'linen': ['vải lanh', 'flax'],
    'da': ['leather', 'genuine leather', 'faux leather']
};

// ============================================
// EXPANSION FUNCTIONS
// ============================================

/**
 * Expand query with synonyms and variations
 * @param {string} query - Original query
 * @returns {Object} Expanded query with synonyms
 */
export function expandQuery(query) {
    const lowerQuery = query.toLowerCase().trim();
    const foundSynonyms = [];
    const metadata = {
        productSynonyms: [],
        colorVariations: [],
        styleKeywords: [],
        materialKeywords: []
    };

    // Find matching product types
    for (const [term, synonymList] of Object.entries(FASHION_SYNONYMS)) {
        if (lowerQuery.includes(term)) {
            foundSynonyms.push(...synonymList);
            metadata.productSynonyms.push(...synonymList.slice(0, 3));
        }
    }

    // Find matching colors
    for (const [term, variations] of Object.entries(COLOR_VARIATIONS)) {
        if (lowerQuery.includes(term)) {
            foundSynonyms.push(...variations);
            metadata.colorVariations.push(...variations.slice(0, 3));
        }
    }

    // Find matching styles
    for (const [term, keywords] of Object.entries(STYLE_KEYWORDS)) {
        if (lowerQuery.includes(term)) {
            foundSynonyms.push(...keywords);
            metadata.styleKeywords.push(...keywords.slice(0, 2));
        }
    }

    // Find matching materials
    for (const [term, keywords] of Object.entries(MATERIAL_KEYWORDS)) {
        if (lowerQuery.includes(term)) {
            foundSynonyms.push(...keywords);
            metadata.materialKeywords.push(...keywords.slice(0, 2));
        }
    }

    // Remove duplicates
    const uniqueSynonyms = [...new Set(foundSynonyms)];

    // Enhanced query: original + top N synonyms
    const topSynonyms = uniqueSynonyms.slice(0, 5);
    const enhanced = topSynonyms.length > 0
        ? `${query} ${topSynonyms.join(' ')}`
        : query;

    if (uniqueSynonyms.length > 0) {
        logger.debug('Query expanded', {
            original: query,
            synonymsAdded: topSynonyms.length,
            totalFound: uniqueSynonyms.length
        });
    }

    return {
        original: query,
        enhanced,
        synonyms: uniqueSynonyms,
        metadata
    };
}

/**
 * Get specific synonyms for a term
 * @param {string} term - Term to find synonyms for
 * @param {string} category - Category ('product'|'color'|'style'|'material')
 * @returns {string[]} List of synonyms
 */
export function getTermSynonyms(term, category = 'product') {
    const lowerTerm = term.toLowerCase().trim();

    const dictionaries = {
        product: FASHION_SYNONYMS,
        color: COLOR_VARIATIONS,
        style: STYLE_KEYWORDS,
        material: MATERIAL_KEYWORDS
    };

    const dict = dictionaries[category];
    if (!dict) return [];

    // Find exact match
    if (dict[lowerTerm]) {
        return dict[lowerTerm];
    }

    // Find partial match
    for (const [key, values] of Object.entries(dict)) {
        if (key.includes(lowerTerm) || lowerTerm.includes(key)) {
            return values;
        }
    }

    return [];
}

/**
 * Check if query contains fashion-related terms
 * @param {string} query - Query to check
 * @returns {boolean} True if fashion-related
 */
export function isFashionQuery(query) {
    const lowerQuery = query.toLowerCase();

    // Check all dictionaries
    const allTerms = [
        ...Object.keys(FASHION_SYNONYMS),
        ...Object.keys(COLOR_VARIATIONS),
        ...Object.keys(STYLE_KEYWORDS),
        ...Object.keys(MATERIAL_KEYWORDS)
    ];

    return allTerms.some(term => lowerQuery.includes(term));
}

/**
 * Extract keywords from query for highlighting
 * @param {string} query - Query string
 * @returns {string[]} Extracted keywords
 */
export function extractKeywords(query) {
    const lowerQuery = query.toLowerCase();
    const keywords = [];

    // Extract product types
    for (const term of Object.keys(FASHION_SYNONYMS)) {
        if (lowerQuery.includes(term)) {
            keywords.push(term);
        }
    }

    // Extract colors
    for (const term of Object.keys(COLOR_VARIATIONS)) {
        if (lowerQuery.includes(term)) {
            keywords.push(term);
        }
    }

    // Extract styles
    for (const term of Object.keys(STYLE_KEYWORDS)) {
        if (lowerQuery.includes(term)) {
            keywords.push(term);
        }
    }

    return [...new Set(keywords)];
}

export default {
    expandQuery,
    getTermSynonyms,
    isFashionQuery,
    extractKeywords
};
