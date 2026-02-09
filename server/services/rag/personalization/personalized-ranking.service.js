/**
 * Personalized Ranking Service
 * Boosts product relevance based on user preferences
 * 
 * @module PersonalizedRanking
 * @version 3.0.0
 */

import logger from '../utils/logger.js';

/**
 * Apply personalized ranking boost to products
 * @param {Array} products - Product list with variants
 * @param {Object} userProfile - User profile from UserProfiler
 * @returns {Array} Products with personalization scores
 */
export function applyPersonalizedRanking(products, userProfile) {
    if (!userProfile || process.env.ENABLE_PERSONALIZATION !== 'true') {
        // Return products with neutral score
        return products.map(p => ({
            product: p,
            personalizedScore: 1.0,
            boosts: []
        }));
    }

    const maxBoost = parseFloat(process.env.PERSONALIZATION_BOOST_MAX || '1.5');
    const scoredProducts = products.map(product => {
        let score = 1.0; // Base score
        const boosts = [];

        // 1. Style Match (up to +0.3)
        if (userProfile.preferences?.styleProfile?.length > 0) {
            const productStyle = product.style || product.category?.name;
            if (productStyle && userProfile.preferences.styleProfile.includes(productStyle)) {
                score += 0.3;
                boosts.push({ type: 'style', value: 0.3 });
            }
        }

        // 2. Size Match (up to +0.15)
        if (userProfile.preferences?.sizeHistory) {
            const productCategory = product.category?.name;
            const preferredSize = userProfile.preferences.sizeHistory[productCategory];

            if (preferredSize && product.variants?.some(v => v.size === preferredSize)) {
                score += 0.15;
                boosts.push({ type: 'size', value: 0.15 });
            }
        }

        // 3. Budget Match (up to +0.25)
        if (userProfile.preferences?.budgetRange) {
            const { min, max } = userProfile.preferences.budgetRange;
            const productPrices = product.variants?.map(v => v.price).filter(p => p > 0) || [];

            if (productPrices.length > 0) {
                const productMinPrice = Math.min(...productPrices);
                const productMaxPrice = Math.max(...productPrices);

                // Product price overlaps with user budget
                if (productMaxPrice >= min && productMinPrice <= max) {
                    // Perfect fit: product entirely within budget
                    if (productMinPrice >= min && productMaxPrice <= max) {
                        score += 0.25;
                        boosts.push({ type: 'budget', value: 0.25, reason: 'perfect_fit' });
                    } else {
                        // Partial overlap
                        score += 0.15;
                        boosts.push({ type: 'budget', value: 0.15, reason: 'partial_overlap' });
                    }
                }
            }
        }

        // 4. Color Preference (up to +0.2)
        if (userProfile.preferences?.favoriteColors?.length > 0) {
            const productColors = product.variants?.map(v => v.color?.toLowerCase()).filter(Boolean) || [];
            const favoriteColors = userProfile.preferences.favoriteColors.map(c => c.toLowerCase());

            const hasMatchingColor = productColors.some(pc =>
                favoriteColors.some(fc => pc.includes(fc) || fc.includes(pc))
            );

            if (hasMatchingColor) {
                score += 0.2;
                boosts.push({ type: 'color', value: 0.2 });
            }
        }

        // 5. Brand Preference (up to +0.2)
        if (userProfile.preferences?.favoriteBrands?.length > 0) {
            const productBrand = typeof product.brand === 'object' ? product.brand?.name : product.brand;

            if (productBrand && userProfile.preferences.favoriteBrands.includes(productBrand)) {
                score += 0.2;
                boosts.push({ type: 'brand', value: 0.2 });
            }
        }

        // 6. Apply max boost cap
        score = Math.min(score, maxBoost);

        if (boosts.length > 0) {
            logger.debug('Personalization boost applied', {
                productId: product._id,
                productName: product.name,
                finalScore: score,
                boosts
            });
        }

        return {
            product,
            personalizedScore: score,
            boosts
        };
    });

    // Sort by personalized score descending
    scoredProducts.sort((a, b) => b.personalizedScore - a.personalizedScore);

    return scoredProducts;
}

/**
 * Extract personalization insights for logging
 * @param {Array} scoredProducts - Products with personalization scores
 * @returns {Object} Insights summary
 */
export function extractPersonalizationInsights(scoredProducts) {
    const totalBoosts = scoredProducts.reduce((sum, sp) => sum + sp.boosts.length, 0);
    const avgScore = scoredProducts.reduce((sum, sp) => sum + sp.personalizedScore, 0) / scoredProducts.length;

    const boostTypes = scoredProducts
        .flatMap(sp => sp.boosts)
        .reduce((acc, boost) => {
            acc[boost.type] = (acc[boost.type] || 0) + 1;
            return acc;
        }, {});

    return {
        totalProducts: scoredProducts.length,
        personalizedProducts: scoredProducts.filter(sp => sp.boosts.length > 0).length,
        avgPersonalizationScore: Math.round(avgScore * 100) / 100,
        boostDistribution: boostTypes
    };
}

export default { applyPersonalizedRanking, extractPersonalizationInsights };
