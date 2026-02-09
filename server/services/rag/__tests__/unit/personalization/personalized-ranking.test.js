/**
 * Unit Tests for Personalized Ranking Service
 * 
 * @module tests/unit/personalization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyPersonalizedRanking, extractPersonalizationInsights } from '../../../personalization/personalized-ranking.service.js';

describe('Personalized Ranking Service', () => {
    beforeEach(() => {
        // Set feature flag
        process.env.ENABLE_PERSONALIZATION = 'true';
        process.env.PERSONALIZATION_BOOST_MAX = '1.5';
    });

    describe('applyPersonalizedRanking', () => {
        it('should return neutral scores when feature flag disabled', () => {
            process.env.ENABLE_PERSONALIZATION = 'false';

            const products = [
                { _id: '1', name: 'Product 1', variants: [] }
            ];

            const userProfile = { preferences: { styleProfile: ['casual'] } };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result).toHaveLength(1);
            expect(result[0].personalizedScore).toBe(1.0);
            expect(result[0].boosts).toEqual([]);
        });

        it('should return neutral scores when no user profile', () => {
            const products = [
                { _id: '1', name: 'Product 1', variants: [] }
            ];

            const result = applyPersonalizedRanking(products, null);

            expect(result[0].personalizedScore).toBe(1.0);
        });

        it('should boost products matching style preference', () => {
            const products = [
                { _id: '1', name: 'Product 1', style: 'casual', variants: [] },
                { _id: '2', name: 'Product 2', style: 'formal', variants: [] }
            ];

            const userProfile = {
                preferences: {
                    styleProfile: ['casual']
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result[0].personalizedScore).toBe(1.3); // 1.0 + 0.3 bonus
            expect(result[0].boosts).toHaveLength(1);
            expect(result[0].boosts[0].type).toBe('style');
            expect(result[1].personalizedScore).toBe(1.0);
        });

        it('should boost products with matching size', () => {
            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    category: { name: 'Shirts' },
                    variants: [{ size: 'M', price: 100 }]
                }
            ];

            const userProfile = {
                preferences: {
                    sizeHistory: {
                        'Shirts': 'M'
                    }
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result[0].personalizedScore).toBe(1.15); // 1.0 + 0.15
            expect(result[0].boosts).toContainEqual({ type: 'size', value: 0.15 });
        });

        it('should boost products within budget range (perfect fit)', () => {
            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    variants: [{ price: 500000 }, { price: 700000 }]
                }
            ];

            const userProfile = {
                preferences: {
                    budgetRange: { min: 400000, max: 800000 }
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result[0].personalizedScore).toBe(1.25); // Perfect fit
            expect(result[0].boosts).toContainEqual({
                type: 'budget',
                value: 0.25,
                reason: 'perfect_fit'
            });
        });

        it('should boost products with partial budget overlap', () => {
            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    variants: [{ price: 300000 }, { price: 600000 }]
                }
            ];

            const userProfile = {
                preferences: {
                    budgetRange: { min: 500000, max: 700000 }
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result[0].personalizedScore).toBe(1.15); // Partial overlap
            expect(result[0].boosts).toContainEqual({
                type: 'budget',
                value: 0.15,
                reason: 'partial_overlap'
            });
        });

        it('should boost products with favorite colors', () => {
            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    variants: [{ color: 'black' }, { color: 'white' }]
                }
            ];

            const userProfile = {
                preferences: {
                    favoriteColors: ['Black', 'Navy']
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result[0].personalizedScore).toBe(1.2); // Color match
            expect(result[0].boosts).toContainEqual({ type: 'color', value: 0.2 });
        });

        it('should boost products from favorite brands', () => {
            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    brand: 'Devenir',
                    variants: []
                },
                {
                    _id: '2',
                    name: 'Product 2',
                    brand: { name: 'Devenir' }, // Brand as object
                    variants: []
                }
            ];

            const userProfile = {
                preferences: {
                    favoriteBrands: ['Devenir']
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            expect(result[0].personalizedScore).toBe(1.2);
            expect(result[1].personalizedScore).toBe(1.2);
        });

        it('should apply multiple boosts cumulatively', () => {
            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    style: 'casual',
                    brand: 'Devenir',
                    category: { name: 'Shirts' },
                    variants: [
                        { size: 'L', color: 'black', price: 500000 }
                    ]
                }
            ];

            const userProfile = {
                preferences: {
                    styleProfile: ['casual'],
                    sizeHistory: { 'Shirts': 'L' },
                    budgetRange: { min: 400000, max: 600000 },
                    favoriteColors: ['Black'],
                    favoriteBrands: ['Devenir']
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            // 1.0 + 0.3 (style) + 0.15 (size) + 0.25 (budget) + 0.2 (color) + 0.2 (brand)
            // = 2.1, but capped at 1.5
            expect(result[0].personalizedScore).toBe(1.5); // Max cap
            expect(result[0].boosts).toHaveLength(5);
        });

        it('should respect max boost configuration', () => {
            process.env.PERSONALIZATION_BOOST_MAX = '1.3';

            const products = [
                {
                    _id: '1',
                    name: 'Product 1',
                    style: 'casual',
                    brand: 'Devenir',
                    variants: []
                }
            ];

            const userProfile = {
                preferences: {
                    styleProfile: ['casual'],
                    favoriteBrands: ['Devenir']
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            // 1.0 + 0.3 + 0.2 = 1.5, but capped at 1.3
            expect(result[0].personalizedScore).toBe(1.3);
        });

        it('should sort products by personalized score', () => {
            const products = [
                { _id: '1', name: 'Product 1', style: 'formal', variants: [] },
                { _id: '2', name: 'Product 2', style: 'casual', variants: [] },
                { _id: '3', name: 'Product 3', style: 'casual', brand: 'Devenir', variants: [] }
            ];

            const userProfile = {
                preferences: {
                    styleProfile: ['casual'],
                    favoriteBrands: ['Devenir']
                }
            };

            const result = applyPersonalizedRanking(products, userProfile);

            // Should be sorted by score descending
            expect(result[0].product._id).toBe('3'); // Score 1.5
            expect(result[1].product._id).toBe('2'); // Score 1.3
            expect(result[2].product._id).toBe('1'); // Score 1.0
        });
    });

    describe('extractPersonalizationInsights', () => {
        it('should extract insights from scored products', () => {
            const scoredProducts = [
                {
                    product: { _id: '1' },
                    personalizedScore: 1.5,
                    boosts: [
                        { type: 'style', value: 0.3 },
                        { type: 'color', value: 0.2 }
                    ]
                },
                {
                    product: { _id: '2' },
                    personalizedScore: 1.3,
                    boosts: [
                        { type: 'style', value: 0.3 }
                    ]
                },
                {
                    product: { _id: '3' },
                    personalizedScore: 1.0,
                    boosts: []
                }
            ];

            const insights = extractPersonalizationInsights(scoredProducts);

            expect(insights.totalProducts).toBe(3);
            expect(insights.personalizedProducts).toBe(2);
            expect(insights.avgPersonalizationScore).toBeCloseTo(1.27, 2);
            expect(insights.boostDistribution).toEqual({
                style: 2,
                color: 1
            });
        });

        it('should handle empty products array', () => {
            const insights = extractPersonalizationInsights([]);

            expect(insights.totalProducts).toBe(0);
            expect(insights.personalizedProducts).toBe(0);
            expect(insights.avgPersonalizationScore).toBeNaN();
        });

        it('should handle products with no boosts', () => {
            const scoredProducts = [
                { product: { _id: '1' }, personalizedScore: 1.0, boosts: [] },
                { product: { _id: '2' }, personalizedScore: 1.0, boosts: [] }
            ];

            const insights = extractPersonalizationInsights(scoredProducts);

            expect(insights.personalizedProducts).toBe(0);
            expect(insights.boostDistribution).toEqual({});
        });
    });
});
