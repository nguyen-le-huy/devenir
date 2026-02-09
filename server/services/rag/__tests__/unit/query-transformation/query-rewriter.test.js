/**
 * Unit Tests for Query Rewriter Service
 * 
 * @module tests/unit/query-transformation
 */

import { describe, it, expect } from 'vitest';
import {
    rewriteQuery,
    needsContext,
    extractImplicitFilters
} from '../../../query-transformation/query-rewriter.service.js';

describe('Query Rewriter Service', () => {
    describe('rewriteQuery - Pronoun Handling', () => {
        it('should replace pronouns with product name', () => {
            const context = {
                current_product: {
                    _id: 'prod123',
                    name: 'Áo Polo Devenir Classic'
                }
            };

            const result = rewriteQuery('cái này giá bao nhiêu', context);

            expect(result.rewritten).toContain('Áo Polo Devenir Classic');
            expect(result.hasContext).toBe(true);
            expect(result.rewriteType).toBe('pronoun_reference');
            expect(result.metadata.productId).toBe('prod123');
        });

        it('should handle multiple pronouns', () => {
            const context = {
                current_product: {
                    _id: 'prod456',
                    name: 'Áo Khoác Bomber'
                }
            };

            const result = rewriteQuery('cái này và cái đó khác nhau thế nào', context);

            expect(result.rewritten).toContain('Áo Khoác Bomber');
            expect(result.rewritten).not.toContain('cái này');
        });

        it('should not rewrite when no product in context', () => {
            const context = {};

            const result = rewriteQuery('cái này giá bao nhiêu', context);

            // Warning logged but query unchanged
            expect(result.rewritten).toBe('cái này giá bao nhiêu');
            expect(result.hasContext).toBe(false);
        });
    });

    describe('rewriteQuery - Partial Queries', () => {
        it('should complete partial color query', () => {
            const context = {
                current_product: {
                    _id: 'prod789',
                    name: 'Áo Polo'
                }
            };

            const result = rewriteQuery('màu gì', context);

            expect(result.rewritten).toBe('Áo Polo có màu gì');
            expect(result.hasContext).toBe(true);
            expect(result.rewriteType).toBe('partial_query');
        });

        it('should complete partial price query', () => {
            const context = {
                current_product: {
                    _id: 'prod789',
                    name: 'Quần Jean'
                }
            };

            const result = rewriteQuery('giá bao nhiêu', context);

            expect(result.rewritten).toBe('Quần Jean giá bao nhiêu');
            expect(result.hasContext).toBe(true);
        });

        it('should complete partial size query', () => {
            const context = {
                current_product: {
                    _id: 'prod999',
                    name: 'Áo Khoác'
                }
            };

            const result = rewriteQuery('size nào', context);

            expect(result.rewritten).toBe('Áo Khoác có size nào');
            expect(result.hasContext).toBe(true);
        });

        it('should complete stock query', () => {
            const context = {
                current_product: {
                    _id: 'prod111',
                    name: 'Giày Sneaker'
                }
            };

            const result = rewriteQuery('còn hàng không', context);

            expect(result.rewritten).toBe('Giày Sneaker còn hàng không');
        });

        it('should handle size-specific query', () => {
            const context = {
                current_product: {
                    _id: 'prod222',
                    name: 'Áo Thun'
                }
            };

            const result = rewriteQuery('có size M', context);

            // Template preserves case from match
            expect(result.rewritten.toLowerCase()).toBe('áo thun có size m');
        });
    });

    describe('rewriteQuery - Follow-up Actions', () => {
        it('should detect add to cart action', () => {
            const context = {
                current_product: {
                    _id: 'prod333',
                    name: 'Áo Polo'
                }
            };

            const result = rewriteQuery('thêm vào giỏ', context);

            expect(result.hasContext).toBe(true);
            expect(result.rewriteType).toBe('followup_action');
            expect(result.metadata.action).toBe('add_to_cart');
            expect(result.metadata.productId).toBe('prod333');
        });

        it('should detect show similar action', () => {
            const context = {
                current_product: {
                    _id: 'prod444',
                    name: 'Quần Kaki'
                }
            };

            const result = rewriteQuery('xem thêm', context);

            expect(result.rewriteType).toBe('followup_action');
            expect(result.metadata.action).toBe('show_similar');
        });

        it('should detect compare action', () => {
            const context = {
                current_product: {
                    _id: 'prod555',
                    name: 'Giày Boot'
                }
            };

            const result = rewriteQuery('so sánh', context);

            expect(result.rewriteType).toBe('followup_action');
            expect(result.metadata.action).toBe('compare');
        });
    });

    describe('needsContext', () => {
        it('should detect queries with pronouns', () => {
            expect(needsContext('cái này giá bao nhiêu')).toBe(true);
            expect(needsContext('nó còn hàng không')).toBe(true);
            expect(needsContext('sản phẩm đó có màu gì')).toBe(true);
        });

        it('should detect partial queries', () => {
            expect(needsContext('màu gì')).toBe(true);
            expect(needsContext('giá bao nhiêu')).toBe(true);
            expect(needsContext('size nào')).toBe(true);
        });

        it('should detect context-dependent actions', () => {
            expect(needsContext('thêm vào giỏ')).toBe(true);
            expect(needsContext('mua')).toBe(true);
            expect(needsContext('so sánh')).toBe(true);
        });

        it('should return false for standalone queries', () => {
            expect(needsContext('tìm áo polo')).toBe(false);
            expect(needsContext('quần jean màu đen')).toBe(false);
            expect(needsContext('giày thể thao')).toBe(false);
        });

        it('should handle show similar (no context needed)', () => {
            expect(needsContext('xem thêm')).toBe(false);
        });
    });

    describe('extractImplicitFilters', () => {
        it('should extract implicit color from history', () => {
            const context = {
                history: [
                    { role: 'user', content: 'tìm áo màu đen' },
                    { role: 'assistant', content: 'Đây là áo màu đen...' }
                ]
            };

            const filters = extractImplicitFilters(context);

            expect(filters.implicitColor).toBe('đen');
        });

        it('should extract implicit size from history', () => {
            const context = {
                history: [
                    { role: 'user', content: 'tôi mặc size L' }
                ]
            };

            const filters = extractImplicitFilters(context);

            // Size is extracted as lowercase from match
            expect(filters.implicitSize.toUpperCase()).toBe('L');
        });

        it('should return empty filters when no history', () => {
            const context = {};

            const filters = extractImplicitFilters(context);

            expect(filters).toEqual({});
        });

        it('should return empty filters when history is empty', () => {
            const context = { history: [] };

            const filters = extractImplicitFilters(context);

            expect(filters).toEqual({});
        });

        it('should extract from last user message only', () => {
            const context = {
                history: [
                    { role: 'user', content: 'tìm áo màu đen' },
                    { role: 'assistant', content: 'OK' },
                    { role: 'user', content: 'tìm áo màu trắng' } // This should win
                ]
            };

            const filters = extractImplicitFilters(context);

            expect(filters.implicitColor).toBe('trắng');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty query', () => {
            const result = rewriteQuery('', {});

            expect(result.rewritten).toBe('');
            expect(result.hasContext).toBe(false);
        });

        it('should handle query with only spaces', () => {
            const result = rewriteQuery('   ', {});

            expect(result.rewritten.trim()).toBe('');
        });

        it('should handle missing context gracefully', () => {
            const result = rewriteQuery('cái này giá bao nhiêu');

            expect(result.rewritten).toBe('cái này giá bao nhiêu');
            expect(result.hasContext).toBe(false);
        });

        it('should be case-insensitive for patterns', () => {
            const context = {
                current_product: { _id: '1', name: 'Test' }
            };

            const result1 = rewriteQuery('MÀU GÌ', context);
            const result2 = rewriteQuery('màu gì', context);

            expect(result1.hasContext).toBe(true);
            expect(result2.hasContext).toBe(true);
        });
    });
});
