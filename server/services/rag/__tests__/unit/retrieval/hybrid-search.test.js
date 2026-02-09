/**
 * Unit Tests for Hybrid Search Service
 * 
 * @module tests/unit/retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../retrieval/vector-search.service.js', () => ({
    searchProducts: vi.fn()
}));

vi.mock('../../../retrieval/keyword-search.service.js', () => ({
    keywordSearchProducts: vi.fn()
}));

vi.mock('../../../retrieval/adaptive-hybrid-search.service.js', () => ({
    getAdaptiveWeights: vi.fn(),
    mergeResults: vi.fn(),
    applyPopularityBoost: vi.fn(),
    applySeasonalBoost: vi.fn(),
    getCurrentSeason: vi.fn()
}));

vi.mock('../../../../models/ProductModel.js', () => ({
    default: {
        find: vi.fn(() => ({
            populate: vi.fn(() => ({
                lean: vi.fn()
            }))
        }))
    }
}));

import { hybridSearchProducts } from '../../../retrieval/hybrid-search.service.js';
import { searchProducts as vectorSearchProducts } from '../../../retrieval/vector-search.service.js';
import { keywordSearchProducts } from '../../../retrieval/keyword-search.service.js';
import {
    getAdaptiveWeights,
    mergeResults,
    applyPopularityBoost,
    applySeasonalBoost,
    getCurrentSeason
} from '../../../retrieval/adaptive-hybrid-search.service.js';
import Product from '../../../../models/ProductModel.js';

describe('Hybrid Search Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('hybridSearchProducts', () => {
        it('should combine vector and keyword search results', async () => {
            // Mock adaptive weights
            getAdaptiveWeights.mockReturnValue({
                queryType: 'semantic_search',
                vectorWeight: 0.8,
                keywordWeight: 0.2,
                confidence: 0.85
            });

            // Mock search results
            const vectorResults = [
                { metadata: { product_id: 'p1' }, score: 0.9 }
            ];

            const keywordResults = [
                { _id: 'p2', score: 0.8 }
            ];

            vectorSearchProducts.mockResolvedValue(vectorResults);
            keywordSearchProducts.mockResolvedValue(keywordResults);

            // Mock merged results
            const mergedResults = [
                { id: 'p1', hybridScore: 0.72, source: 'vector' },
                { id: 'p2', hybridScore: 0.16, source: 'keyword' }
            ];

            mergeResults.mockReturnValue(mergedResults);
            applyPopularityBoost.mockImplementation(r => r);
            applySeasonalBoost.mockImplementation(r => r);
            getCurrentSeason.mockReturnValue('winter');

            // Mock product fetch
            const products = [
                { _id: 'p1', name: 'Product 1' },
                { _id: 'p2', name: 'Product 2' }
            ];

            Product.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue(products)
                })
            });

            // Execute
            const result = await hybridSearchProducts('test query');

            // Verify
            expect(vectorSearchProducts).toHaveBeenCalledWith('test query', expect.any(Object));
            expect(keywordSearchProducts).toHaveBeenCalledWith('test query', expect.any(Object));
            expect(mergeResults).toHaveBeenCalled();
            expect(result.products).toHaveLength(2);
            expect(result.metadata.queryType).toBe('semantic_search');
        });

        it('should apply popularity boost when enabled', async () => {
            getAdaptiveWeights.mockReturnValue({
                queryType: 'category_browse',
                vectorWeight: 0.4,
                keywordWeight: 0.6
            });

            vectorSearchProducts.mockResolvedValue([]);
            keywordSearchProducts.mockResolvedValue([]);
            mergeResults.mockReturnValue([
                { id: 'p1', hybridScore: 0.5 }
            ]);

            applyPopularityBoost.mockReturnValue([
                { id: 'p1', hybridScore: 0.55, popularityBoost: 0.05 }
            ]);

            applySeasonalBoost.mockImplementation(r => r);
            getCurrentSeason.mockReturnValue('summer');

            Product.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue([])
                })
            });

            await hybridSearchProducts('áo khoác', {
                enablePopularityBoost: true
            });

            expect(applyPopularityBoost).toHaveBeenCalled();
        });

        it('should skip popularity boost when disabled', async () => {
            getAdaptiveWeights.mockReturnValue({
                queryType: 'brand_search',
                vectorWeight: 0.3,
                keywordWeight: 0.7
            });

            vectorSearchProducts.mockResolvedValue([]);
            keywordSearchProducts.mockResolvedValue([]);
            mergeResults.mockReturnValue([]);
            applySeasonalBoost.mockImplementation(r => r);

            Product.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue([])
                })
            });

            await hybridSearchProducts('test', {
                enablePopularityBoost: false
            });

            expect(applyPopularityBoost).not.toHaveBeenCalled();
        });

        it('should apply seasonal boost when enabled', async () => {
            getAdaptiveWeights.mockReturnValue({
                queryType: 'semantic_search',
                vectorWeight: 0.8,
                keywordWeight: 0.2
            });

            vectorSearchProducts.mockResolvedValue([]);
            keywordSearchProducts.mockResolvedValue([]);
            mergeResults.mockReturnValue([
                { id: 'p1', hybridScore: 0.6 }
            ]);

            applyPopularityBoost.mockImplementation(r => r);
            applySeasonalBoost.mockReturnValue([
                { id: 'p1', hybridScore: 0.69, seasonalBoost: 0.15 }
            ]);
            getCurrentSeason.mockReturnValue('winter');

            Product.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue([])
                })
            });

            await hybridSearchProducts('áo ấm', {
                enableSeasonalBoost: true
            });

            expect(getCurrentSeason).toHaveBeenCalled();
            expect(applySeasonalBoost).toHaveBeenCalledWith(
                expect.any(Array),
                'winter',
                0.15
            );
        });

        it('should fallback to vector search on error', async () => {
            getAdaptiveWeights.mockImplementation(() => {
                throw new Error('Weight calculation failed');
            });

            const vectorResults = [
                { metadata: { product_id: 'p1' }, score: 0.9 }
            ];

            vectorSearchProducts.mockResolvedValue(vectorResults);

            Product.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue([
                        { _id: 'p1', name: 'Product 1' }
                    ])
                })
            });

            const result = await hybridSearchProducts('test');

            expect(result.metadata.queryType).toBe('fallback_vector_only');
            expect(result.metadata.error).toBeDefined();
        });

        it('should attach scores and metadata to products', async () => {
            getAdaptiveWeights.mockReturnValue({
                queryType: 'attribute_search',
                vectorWeight: 0.35,
                keywordWeight: 0.65
            });

            vectorSearchProducts.mockResolvedValue([]);
            keywordSearchProducts.mockResolvedValue([]);

            const mergedResults = [
                {
                    id: 'p1',
                    hybridScore: 0.8,
                    vectorScore: 0.9,
                    keywordScore: 0.7,
                    source: 'both',
                    popularityBoost: 0.1,
                    seasonalBoost: 0.15
                }
            ];

            mergeResults.mockReturnValue(mergedResults);
            applyPopularityBoost.mockImplementation(r => r);
            applySeasonalBoost.mockImplementation(r => r);
            getCurrentSeason.mockReturnValue('fall');

            Product.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue([
                        { _id: 'p1', name: 'Product 1' }
                    ])
                })
            });

            const result = await hybridSearchProducts('test');

            expect(result.products[0]._hybridScore).toBe(0.8);
            expect(result.products[0]._vectorScore).toBe(0.9);
            expect(result.products[0]._keywordScore).toBe(0.7);
            expect(result.products[0]._source).toBe('both');
        });
    });
});
