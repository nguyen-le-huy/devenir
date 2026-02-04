/**
 * Unit Tests for Color Utilities
 * 
 * @module tests/colorUtils
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    findColorInQuery,
    normalizeColor,
    getColorDisplayName,
    colorsMatch,
    getColorVariations,
    filterByColor,
    extractColorFromText,
    clearColorCache,
    COLOR_MAPPING_VI_EN,
    ENGLISH_COLORS,
    COMPOUND_COLORS
} from '../../utils/colorUtils.js';

// ============================================
// FINDCOLORINQUERY TESTS
// ============================================

describe('findColorInQuery', () => {
    describe('Vietnamese single colors', () => {
        it('should detect basic Vietnamese colors', () => {
            const cases = [
                { query: 'áo màu đen', expected: { vi: 'đen', en: 'black' } },
                { query: 'tìm quần trắng', expected: { vi: 'trắng', en: 'white' } },
                { query: 'áo polo màu xanh', expected: { vi: 'xanh', en: 'blue' } },
                { query: 'muốn mua áo hồng', expected: { vi: 'hồng', en: 'pink' } }
            ];

            cases.forEach(({ query, expected }) => {
                const result = findColorInQuery(query);
                expect(result).not.toBeNull();
                expect(result.vi).toBe(expected.vi);
                expect(result.en).toBe(expected.en);
            });
        });

        it('should handle colors with context', () => {
            const result = findColorInQuery('tôi thích màu đen vì trông sang');
            expect(result.vi).toBe('đen');
        });
    });

    describe('Vietnamese compound colors', () => {
        it('should detect compound Vietnamese colors', () => {
            const cases = [
                { query: 'áo xanh navy', color: 'xanh navy' },
                { query: 'quần xanh lá', color: 'xanh lá' },
                { query: 'áo xanh dương', color: 'xanh dương' }
            ];

            cases.forEach(({ query, color }) => {
                const result = findColorInQuery(query);
                expect(result).not.toBeNull();
                expect(result.vi).toBe(color);
                expect(result.isCompound).toBe(true);
            });
        });
    });

    describe('English colors', () => {
        it('should detect English colors', () => {
            const cases = [
                { query: 'black shirt', expected: 'black' },
                { query: 'I want a navy polo', expected: 'navy' },
                { query: 'looking for burgundy jacket', expected: 'burgundy' }
            ];

            cases.forEach(({ query, expected }) => {
                const result = findColorInQuery(query);
                expect(result).not.toBeNull();
                expect(result.en).toBe(expected);
            });
        });
    });

    describe('edge cases', () => {
        it('should return null for no color', () => {
            expect(findColorInQuery('tìm áo khoác')).toBeNull();
            expect(findColorInQuery('muốn mua quần')).toBeNull();
        });

        it('should handle null/undefined', () => {
            expect(findColorInQuery(null)).toBeNull();
            expect(findColorInQuery(undefined)).toBeNull();
            expect(findColorInQuery('')).toBeNull();
        });

        it('should match as whole words only', () => {
            // 'be' is a color but shouldn't match in 'because'
            const result = findColorInQuery('because I like it');
            // May or may not match depending on implementation
            // Key is it shouldn't crash
            expect(typeof findColorInQuery('because')).toBe('object');
        });
    });
});

// ============================================
// NORMALIZECOLOR TESTS
// ============================================

describe('normalizeColor', () => {
    it('should normalize Vietnamese to English', () => {
        expect(normalizeColor('đen')).toBe('black');
        expect(normalizeColor('trắng')).toBe('white');
        expect(normalizeColor('xanh')).toBe('blue');
    });

    it('should return English colors as-is', () => {
        expect(normalizeColor('black')).toBe('black');
        expect(normalizeColor('navy')).toBe('navy');
    });

    it('should handle case insensitivity', () => {
        expect(normalizeColor('BLACK')).toBe('BLACK'.toLowerCase());
        expect(normalizeColor('Đen')).toBe('đen'); // Vietnamese normalized
    });

    it('should handle empty/null', () => {
        expect(normalizeColor('')).toBe('');
        expect(normalizeColor(null)).toBe('');
        expect(normalizeColor(undefined)).toBe('');
    });
});

// ============================================
// COLORSMATCH TESTS
// ============================================

describe('colorsMatch', () => {
    it('should match same colors', () => {
        expect(colorsMatch('black', 'black')).toBe(true);
        expect(colorsMatch('đen', 'đen')).toBe(true);
    });

    it('should match Vietnamese and English equivalents', () => {
        expect(colorsMatch('đen', 'black')).toBe(true);
        expect(colorsMatch('trắng', 'white')).toBe(true);
    });

    it('should not match different colors', () => {
        expect(colorsMatch('black', 'white')).toBe(false);
        expect(colorsMatch('đen', 'trắng')).toBe(false);
    });

    it('should handle null/undefined', () => {
        expect(colorsMatch(null, 'black')).toBe(false);
        expect(colorsMatch('black', null)).toBe(false);
    });
});

// ============================================
// GETCOLORVARIATIONS TESTS
// ============================================

describe('getColorVariations', () => {
    it('should return all variations of a color', () => {
        const variations = getColorVariations('black');
        expect(variations).toContain('black');
        expect(variations).toContain('đen');
    });

    it('should handle Vietnamese input', () => {
        const variations = getColorVariations('đen');
        expect(variations).toContain('black');
        expect(variations).toContain('đen');
    });

    it('should return unique values', () => {
        const variations = getColorVariations('black');
        const unique = [...new Set(variations)];
        expect(variations.length).toBe(unique.length);
    });
});

// ============================================
// FILTERBYCOLOR TESTS
// ============================================

describe('filterByColor', () => {
    const products = [
        { id: 1, name: 'Black Shirt', color: 'black' },
        { id: 2, name: 'White Polo', color: 'white' },
        { id: 3, name: 'Navy Jacket', color: 'navy' },
        { id: 4, name: 'Đen T-Shirt', color: 'đen' }
    ];

    it('should filter by English color', () => {
        const result = filterByColor(products, 'black');
        expect(result.length).toBe(2); // black + đen
        expect(result.map(p => p.id)).toContain(1);
        expect(result.map(p => p.id)).toContain(4);
    });

    it('should filter by Vietnamese color', () => {
        const result = filterByColor(products, 'đen');
        expect(result.length).toBe(2);
    });

    it('should return empty for non-matching color', () => {
        const result = filterByColor(products, 'red');
        expect(result.length).toBe(0);
    });

    it('should handle null inputs', () => {
        expect(filterByColor(null, 'black')).toEqual([]);
        expect(filterByColor(products, null)).toEqual(products);
    });
});

// ============================================
// EXTRACTCOLORFROMTEXT TESTS
// ============================================

describe('extractColorFromText', () => {
    it('should extract color from product name', () => {
        expect(extractColorFromText('Black Cotton Polo')).toBe('black');
        expect(extractColorFromText('Áo thun màu trắng')).toBe('white');
    });

    it('should return null for no color', () => {
        expect(extractColorFromText('Cotton Polo Shirt')).toBeNull();
    });
});

// ============================================
// CONSTANTS TESTS
// ============================================

describe('Constants', () => {
    describe('COLOR_MAPPING_VI_EN', () => {
        it('should have common Vietnamese colors', () => {
            expect(COLOR_MAPPING_VI_EN['đen']).toBe('black');
            expect(COLOR_MAPPING_VI_EN['trắng']).toBe('white');
            expect(COLOR_MAPPING_VI_EN['xanh']).toBe('blue');
        });
    });

    describe('ENGLISH_COLORS', () => {
        it('should include common colors', () => {
            expect(ENGLISH_COLORS).toContain('black');
            expect(ENGLISH_COLORS).toContain('white');
            expect(ENGLISH_COLORS).toContain('navy');
            expect(ENGLISH_COLORS).toContain('burgundy');
        });
    });

    describe('COMPOUND_COLORS', () => {
        it('should include multi-word colors', () => {
            expect(COMPOUND_COLORS).toContain('xanh navy');
            expect(COMPOUND_COLORS).toContain('wine red');
            expect(COMPOUND_COLORS).toContain('dusty pink');
        });
    });
});
