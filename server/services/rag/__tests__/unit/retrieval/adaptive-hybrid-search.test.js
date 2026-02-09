/**
 * Unit Tests for Adaptive Hybrid Search Service
 * 
 * @module tests/unit/retrieval
 */

import { describe, it, expect, vi } from 'vitest';
import {
    getAdaptiveWeights,
    mergeResults,
    applyPopularityBoost,
    applySeasonalBoost,
    getCurrentSeason
} from '../../../retrieval/adaptive-hybrid-search.service.js';

describe('Adaptive Hybrid Search Service', () => {
    describe('getAdaptiveWeights', () => {
        it('should classify brand search queries', () => {
            const result = getAdaptiveWeights('sản phẩm Devenir');

            expect(result.queryType).toBe('brand_search');
            expect(result.vectorWeight).toBe(0.3);
            expect(result.keywordWeight).toBe(0.7);
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should classify semantic search queries', () => {
            const result = getAdaptiveWeights('áo mặc đi làm công sở');

            expect(result.queryType).toBe('semantic_search');
            expect(result.vectorWeight).toBe(0.8);
            expect(result.keywordWeight).toBe(0.2);
        });

        it('should classify attribute search queries', () => {
            const result = getAdaptiveWeights('áo polo màu đen size M');

            expect(result.queryType).toBe('attribute_search');
            expect(result.vectorWeight).toBe(0.35);
            expect(result.keywordWeight).toBe(0.65);
        });

        it('should classify category browse queries', () => {
            const result = getAdaptiveWeights('áo khoác');

            expect(result.queryType).toBe('category_browse');
            expect(result.vectorWeight).toBe(0.4);
            expect(result.keywordWeight).toBe(0.6);
        });

        it('should classify specific product queries', () => {
            const result = getAdaptiveWeights('Áo Polo Devenir Classic Premium');

            expect(result.queryType).toBe('brand_search'); // Has Devenir
            expect(result.vectorWeight).toBe(0.3);
        });

        it('should use category browse for ambiguous queries', () => {
            const result = getAdaptiveWeights('xyz random query');

            // Ambiguous queries default to category_browse with low confidence
            expect(result.queryType).toBe('category_browse');
            expect(result.vectorWeight).toBe(0.4);
            expect(result.keywordWeight).toBe(0.6);
            expect(result.confidence).toBe(0.5);
        });
    });

    describe('mergeResults', () => {
        it('should merge vector and keyword results', () => {
            const vectorResults = [
                { metadata: { product_id: 'p1' }, score: 0.9 },
                { metadata: { product_id: 'p2' }, score: 0.8 }
            ];

            const keywordResults = [
                { _id: 'p2', score: 1.0 },
                { _id: 'p3', score: 0.9 }
            ];

            const weights = { vectorWeight: 0.6, keywordWeight: 0.4 };

            const merged = mergeResults(vectorResults, keywordResults, weights);

            expect(merged).toHaveLength(3);
            expect(merged[0].id).toBe('p2'); // Highest combined score
            expect(merged[0].source).toBe('both');
        });

        it('should calculate hybrid scores correctly', () => {
            const vectorResults = [
                { metadata: { product_id: 'p1' }, score: 0.8 }
            ];

            const keywordResults = [
                { _id: 'p1', score: 0.6 }
            ];

            const weights = { vectorWeight: 0.5, keywordWeight: 0.5 };

            const merged = mergeResults(vectorResults, keywordResults, weights);

            // (0.8 * 0.5) + (0.6 * 0.5) = 0.7
            expect(merged[0].hybridScore).toBeCloseTo(0.7, 2);
        });

        it('should handle vector-only results', () => {
            const vectorResults = [
                { metadata: { product_id: 'p1' }, score: 0.9 }
            ];

            const keywordResults = [];

            const weights = { vectorWeight: 0.6, keywordWeight: 0.4 };

            const merged = mergeResults(vectorResults, keywordResults, weights);

            expect(merged).toHaveLength(1);
            expect(merged[0].source).toBe('vector');
            expect(merged[0].hybridScore).toBeCloseTo(0.54, 2); // 0.9 * 0.6
        });

        it('should handle keyword-only results', () => {
            const vectorResults = [];

            const keywordResults = [
                { _id: 'p1', score: 0.8 }
            ];

            const weights = { vectorWeight: 0.6, keywordWeight: 0.4 };

            const merged = mergeResults(vectorResults, keywordResults, weights);

            expect(merged).toHaveLength(1);
            expect(merged[0].source).toBe('keyword');
            expect(merged[0].hybridScore).toBeCloseTo(0.32, 2); // 0.8 * 0.4
        });

        it('should sort results by hybrid score', () => {
            const vectorResults = [
                { metadata: { product_id: 'p1' }, score: 0.5 },
                { metadata: { product_id: 'p2' }, score: 0.9 }
            ];

            const keywordResults = [
                { _id: 'p1', score: 1.0 }
            ];

            const weights = { vectorWeight: 0.5, keywordWeight: 0.5 };

            const merged = mergeResults(vectorResults, keywordResults, weights);

            // p1: (0.5 * 0.5) + (1.0 * 0.5) = 0.75
            // p2: (0.9 * 0.5) + (0 * 0.5) = 0.45
            expect(merged[0].id).toBe('p1');
            expect(merged[1].id).toBe('p2');
        });
    });

    describe('applyPopularityBoost', () => {
        it('should boost popular products', () => {
            const results = [
                { id: 'p1', hybridScore: 0.8 },
                { id: 'p2', hybridScore: 0.7 }
            ];

            const popularityScores = new Map([
                ['p1', 0.5], // 50% popularity
                ['p2', 0.9]  // 90% popularity
            ]);

            const boosted = applyPopularityBoost(results, popularityScores, 0.2);

            // p1: 0.8 * (1 + 0.5 * 0.2) = 0.8 * 1.1 = 0.88
            // p2: 0.7 * (1 + 0.9 * 0.2) = 0.7 * 1.18 = 0.826
            expect(boosted[0].id).toBe('p1');
            expect(boosted[0].hybridScore).toBeCloseTo(0.88, 2);
            expect(boosted[0].popularityBoost).toBeCloseTo(0.1, 2);
        });

        it('should handle missing popularity scores', () => {
            const results = [
                { id: 'p1', hybridScore: 0.8 }
            ];

            const popularityScores = new Map();

            const boosted = applyPopularityBoost(results, popularityScores);

            expect(boosted[0].hybridScore).toBe(0.8);
        });

        it('should return unchanged results when no popularity map', () => {
            const results = [
                { id: 'p1', hybridScore: 0.8 }
            ];

            const boosted = applyPopularityBoost(results, null);

            expect(boosted).toEqual(results);
        });
    });

    describe('applySeasonalBoost', () => {
        it('should boost winter products in winter', () => {
            const results = [
                {
                    id: 'p1',
                    hybridScore: 0.8,
                    metadata: { product_name: 'Áo khoác mùa đông' }
                },
                {
                    id: 'p2',
                    hybridScore: 0.7,
                    metadata: { product_name: 'Áo thun' }
                }
            ];

            const boosted = applySeasonalBoost(results, 'winter', 0.15);

            // p1: 0.8 * (1 + 0.15) = 0.92
            // p2: 0.7 (no boost)
            expect(boosted[0].id).toBe('p1');
            expect(boosted[0].hybridScore).toBeCloseTo(0.92, 2);
            expect(boosted[0].seasonalBoost).toBe(0.15);
        });

        it('should boost summer products in summer', () => {
            const results = [
                {
                    id: 'p1',
                    hybridScore: 0.8,
                    metadata: { product_name: 'Áo thun cotton' }
                }
            ];

            const boosted = applySeasonalBoost(results, 'summer', 0.15);

            expect(boosted[0].hybridScore).toBeCloseTo(0.92, 2);
        });

        it('should handle no season', () => {
            const results = [
                { id: 'p1', hybridScore: 0.8, metadata: {} }
            ];

            const boosted = applySeasonalBoost(results, null);

            expect(boosted).toEqual(results);
        });
    });

    describe('getCurrentSeason', () => {
        it('should return correct season for each month', () => {
            // Mock Date for testing
            const originalDate = Date;

            // Test spring (March)
            global.Date = class extends originalDate {
                getMonth() { return 2; } // March = 2
            };
            expect(getCurrentSeason()).toBe('spring');

            // Test summer (July)
            global.Date = class extends originalDate {
                getMonth() { return 6; } // July = 6
            };
            expect(getCurrentSeason()).toBe('summer');

            // Test fall (October)
            global.Date = class extends originalDate {
                getMonth() { return 9; } // October = 9
            };
            expect(getCurrentSeason()).toBe('fall');

            // Test winter (January)
            global.Date = class extends originalDate {
                getMonth() { return 0; } // January = 0
            };
            expect(getCurrentSeason()).toBe('winter');

            // Restore
            global.Date = originalDate;
        });
    });
});
