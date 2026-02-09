/**
 * Unit Tests for Query Decomposer Service
 * 
 * @module tests/unit/query-transformation
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { decomposeQuery, extractFilters, extractProductType } from '../../../query-transformation/query-decomposer.service.js';

// Mock LLMProvider
vi.mock('../../../core/LLMProvider.js', () => ({
    llmProvider: {
        jsonCompletion: vi.fn()
    }
}));

import { llmProvider } from '../../../core/LLMProvider.js';

describe('Query Decomposer Service', () => {
    beforeAll(() => {
        // Set feature flag
        process.env.ENABLE_QUERY_TRANSFORMATION = 'true';
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe('decomposeQuery', () => {
        it('should decompose multi-intent query with product and filters', async () => {
            // Mock LLM response
            llmProvider.jsonCompletion.mockResolvedValue({
                isMultiIntent: true,
                subQueries: [
                    { type: 'product', value: 'áo polo' },
                    { type: 'filter_color', value: 'đen' },
                    { type: 'filter_size', value: 'M' },
                    { type: 'filter_price', max: 500000, operator: 'lte' }
                ],
                executionStrategy: 'parallel_filter'
            });

            const result = await decomposeQuery('tìm áo polo màu đen size M giá 500k');

            expect(result.isMultiIntent).toBe(true);
            expect(result.subQueries).toHaveLength(4);
            expect(result.subQueries[0]).toEqual({ type: 'product', value: 'áo polo' });
            expect(result.executionStrategy).toBe('parallel_filter');
        });

        it('should handle simple query without filters', async () => {
            llmProvider.jsonCompletion.mockResolvedValue({
                isMultiIntent: false,
                subQueries: [
                    { type: 'product', value: 'áo khoác' }
                ],
                executionStrategy: 'simple'
            });

            const result = await decomposeQuery('tìm áo khoác');

            expect(result.isMultiIntent).toBe(false);
            expect(result.subQueries).toHaveLength(1);
            expect(result.executionStrategy).toBe('simple');
        });

        it('should fallback gracefully on LLM error', async () => {
            llmProvider.jsonCompletion.mockRejectedValue(new Error('LLM timeout'));

            const result = await decomposeQuery('test query');

            // Should return fallback structure
            expect(result.isMultiIntent).toBe(false);
            expect(result.subQueries).toHaveLength(1);
            expect(result.subQueries[0].type).toBe('text');
            expect(result.executionStrategy).toBe('simple');
        });

        it('should return simple structure when feature flag disabled', async () => {
            process.env.ENABLE_QUERY_TRANSFORMATION = 'false';

            const result = await decomposeQuery('tìm áo polo màu đen');

            expect(result.isMultiIntent).toBe(false);
            expect(result.subQueries[0].type).toBe('text');
            expect(result.executionStrategy).toBe('simple');

            // Restore flag
            process.env.ENABLE_QUERY_TRANSFORMATION = 'true';
        });
    });

    describe('extractFilters', () => {
        it('should extract color filter', () => {
            const decomposed = {
                subQueries: [
                    { type: 'filter_color', value: 'đen' }
                ]
            };

            const filters = extractFilters(decomposed);

            expect(filters.color).toBe('đen');
        });

        it('should extract size filter', () => {
            const decomposed = {
                subQueries: [
                    { type: 'filter_size', value: 'M' }
                ]
            };

            const filters = extractFilters(decomposed);

            expect(filters.size).toBe('M');
        });

        it('should extract price range filter', () => {
            const decomposed = {
                subQueries: [
                    { type: 'filter_price', min: 300000, max: 500000 }
                ]
            };

            const filters = extractFilters(decomposed);

            expect(filters.price).toEqual({
                $gte: 300000,
                $lte: 500000
            });
        });

        it('should extract max price filter', () => {
            const decomposed = {
                subQueries: [
                    { type: 'filter_price', value: 500000, operator: 'lte' }
                ]
            };

            const filters = extractFilters(decomposed);

            expect(filters.price).toEqual({ $lte: 500000 });
        });

        it('should extract multiple filters', () => {
            const decomposed = {
                subQueries: [
                    { type: 'filter_color', value: 'đen' },
                    { type: 'filter_size', value: 'L' },
                    { type: 'filter_brand', value: 'Devenir' }
                ]
            };

            const filters = extractFilters(decomposed);

            expect(filters.color).toBe('đen');
            expect(filters.size).toBe('L');
            expect(filters.brand).toBe('Devenir');
        });

        it('should return empty object for no filters', () => {
            const decomposed = {
                subQueries: [
                    { type: 'product', value: 'áo polo' }
                ]
            };

            const filters = extractFilters(decomposed);

            expect(filters).toEqual({});
        });
    });

    describe('extractProductType', () => {
        it('should extract product type from decomposed query', () => {
            const decomposed = {
                subQueries: [
                    { type: 'product', value: 'áo polo' },
                    { type: 'filter_color', value: 'đen' }
                ]
            };

            const productType = extractProductType(decomposed);

            expect(productType).toBe('áo polo');
        });

        it('should return null when no product type', () => {
            const decomposed = {
                subQueries: [
                    { type: 'filter_color', value: 'đen' }
                ]
            };

            const productType = extractProductType(decomposed);

            expect(productType).toBeNull();
        });
    });
});
