/**
 * Unit Tests for Query Expander Service
 * 
 * @module tests/unit/query-transformation
 */

import { describe, it, expect } from 'vitest';
import {
    expandQuery,
    getTermSynonyms,
    isFashionQuery,
    extractKeywords
} from '../../../query-transformation/query-expander.service.js';

describe('Query Expander Service', () => {
    describe('expandQuery', () => {
        it('should expand query with product synonyms', () => {
            const result = expandQuery('tìm áo thun');

            expect(result.original).toBe('tìm áo thun');
            expect(result.enhanced).toContain('áo thun');
            expect(result.synonyms).toContain('t-shirt');
            expect(result.synonyms).toContain('áo phông');
            expect(result.metadata.productSynonyms).toBeDefined();
        });

        it('should expand query with color variations', () => {
            const result = expandQuery('áo màu đen');

            expect(result.synonyms).toContain('black');
            expect(result.synonyms).toContain('dark');
            expect(result.metadata.colorVariations.length).toBeGreaterThan(0);
        });

        it('should expand query with multiple categories', () => {
            const result = expandQuery('áo khoác màu xám thể thao');

            expect(result.synonyms.length).toBeGreaterThan(5);
            expect(result.metadata.productSynonyms).toBeDefined();
            expect(result.metadata.colorVariations).toBeDefined();
            expect(result.metadata.styleKeywords).toBeDefined();
        });

        it('should return original query when no matches found', () => {
            const result = expandQuery('xyz123');

            expect(result.original).toBe('xyz123');
            expect(result.enhanced).toBe('xyz123');
            expect(result.synonyms).toHaveLength(0);
        });

        it('should handle Vietnamese diacritics', () => {
            const result = expandQuery('quần jean màu xanh');

            expect(result.synonyms).toContain('jeans');
            expect(result.synonyms).toContain('denim');
        });

        it('should limit synonyms in enhanced query', () => {
            const result = expandQuery('áo thun');

            // Enhanced should contain original + max 5 synonyms
            const parts = result.enhanced.split(' ');
            expect(parts.length).toBeLessThanOrEqual(8); // original (2 words) + 5 synonyms + margin
        });
    });

    describe('getTermSynonyms', () => {
        it('should get product type synonyms', () => {
            const synonyms = getTermSynonyms('áo thun', 'product');

            expect(synonyms).toContain('t-shirt');
            expect(synonyms).toContain('áo phông');
        });

        it('should get color synonyms', () => {
            const synonyms = getTermSynonyms('đen', 'color');

            expect(synonyms).toContain('black');
            expect(synonyms).toContain('dark');
        });

        it('should get style synonyms', () => {
            const synonyms = getTermSynonyms('công sở', 'style');

            expect(synonyms).toContain('business');
            expect(synonyms).toContain('formal');
        });

        it('should get material synonyms', () => {
            const synonyms = getTermSynonyms('cotton', 'material');

            expect(synonyms).toContain('bông');
            expect(synonyms).toContain('cotton 100%');
        });

        it('should handle partial matches', () => {
            const synonyms = getTermSynonyms('áo', 'product');

            // Should find "áo thun", "áo ấm", etc.
            expect(synonyms.length).toBeGreaterThan(0);
        });

        it('should return empty array for unknown term', () => {
            const synonyms = getTermSynonyms('xyz', 'product');

            expect(synonyms).toEqual([]);
        });

        it('should return empty array for invalid category', () => {
            const synonyms = getTermSynonyms('áo thun', 'invalid');

            expect(synonyms).toEqual([]);
        });
    });

    describe('isFashionQuery', () => {
        it('should detect fashion product queries', () => {
            expect(isFashionQuery('tìm áo thun')).toBe(true);
            expect(isFashionQuery('quần jean')).toBe(true);
            expect(isFashionQuery('giày thể thao')).toBe(true);
        });

        it('should detect color queries', () => {
            expect(isFashionQuery('màu đen')).toBe(true);
            expect(isFashionQuery('áo trắng')).toBe(true);
        });

        it('should detect style queries', () => {
            expect(isFashionQuery('thời trang công sở')).toBe(true);
            expect(isFashionQuery('phong cách thể thao')).toBe(true);
        });

        it('should reject non-fashion queries', () => {
            expect(isFashionQuery('thời tiết hôm nay')).toBe(false);
            expect(isFashionQuery('đặt pizza')).toBe(false);
            expect(isFashionQuery('123456')).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(isFashionQuery('ÁO THUN')).toBe(true);
            expect(isFashionQuery('Quần Jean')).toBe(true);
        });
    });

    describe('extractKeywords', () => {
        it('should extract product keywords', () => {
            const keywords = extractKeywords('tìm áo thun màu đen');

            expect(keywords).toContain('áo thun');
            expect(keywords).toContain('đen');
        });

        it('should extract multiple keywords', () => {
            const keywords = extractKeywords('áo khoác công sở màu xám');

            expect(keywords.length).toBeGreaterThan(2);
            expect(keywords).toContain('áo khoác');
            expect(keywords).toContain('xám');
            expect(keywords).toContain('công sở');
        });

        it('should deduplicate keywords', () => {
            const keywords = extractKeywords('áo thun áo thun áo thun');

            expect(keywords.filter(k => k === 'áo thun')).toHaveLength(1);
        });

        it('should return empty array for non-fashion query', () => {
            const keywords = extractKeywords('xyz random text');

            expect(keywords).toEqual([]);
        });
    });
});
