/**
 * Unit Tests for Date Utilities
 * 
 * @module tests/dateUtils
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    calculateDateRange,
    parsePeriodFromText,
    parseDateFromText,
    formatDateVN,
    formatDateISO,
    formatDateTimeVN,
    getRelativeTime,
    isSameDay,
    isToday,
    isPast,
    isFuture,
    addDays,
    addMonths,
    startOfDay,
    endOfDay,
    getDayNameVN,
    getMonthNameVN
} from '../../utils/dateUtils.js';

// ============================================
// CALCULATEDATERANGE TESTS
// ============================================

describe('calculateDateRange', () => {
    // Mock current date for consistent testing
    const mockDate = new Date('2026-02-04T10:30:00Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should calculate today range', () => {
        const { start, end, label } = calculateDateRange({ period: 'today' });

        expect(start.getDate()).toBe(4);
        expect(start.getMonth()).toBe(1); // February
        expect(start.getHours()).toBe(0);
        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
        expect(label).toBe('hôm nay');
    });

    it('should calculate yesterday range', () => {
        const { start, end, label } = calculateDateRange({ period: 'yesterday' });

        expect(start.getDate()).toBe(3);
        expect(end.getDate()).toBe(3);
        expect(label).toBe('hôm qua');
    });

    it('should calculate this week range', () => {
        const { start, label } = calculateDateRange({ period: 'this_week' });

        // Feb 4, 2026 is a Wednesday, so Monday is Feb 2
        expect(start.getDay()).toBe(1); // Monday
        expect(label).toBe('tuần này');
    });

    it('should calculate this month range', () => {
        const { start, label } = calculateDateRange({ period: 'this_month' });

        expect(start.getDate()).toBe(1);
        expect(start.getMonth()).toBe(1); // February
        expect(label).toBe('tháng này');
    });

    it('should calculate custom range', () => {
        const { start, end, label } = calculateDateRange({
            period: 'custom',
            startDate: '2026-01-01',
            endDate: '2026-01-31'
        });

        expect(start.getDate()).toBe(1);
        expect(start.getMonth()).toBe(0); // January
        expect(end.getDate()).toBe(31);
        expect(label).toContain('từ');
    });

    it('should default to today for unknown period', () => {
        const { label } = calculateDateRange({ period: 'unknown' });
        expect(label).toBe('hôm nay');
    });
});

// ============================================
// PARSPERIODFROMTEXT TESTS
// ============================================

describe('parsePeriodFromText', () => {
    it('should parse Vietnamese period expressions', () => {
        expect(parsePeriodFromText('doanh thu hôm nay')).toBe('today');
        expect(parsePeriodFromText('báo cáo hôm qua')).toBe('yesterday');
        expect(parsePeriodFromText('số liệu tuần này')).toBe('this_week');
        expect(parsePeriodFromText('tổng kết tháng này')).toBe('this_month');
        expect(parsePeriodFromText('doanh thu tuần trước')).toBe('last_week');
        expect(parsePeriodFromText('báo cáo tháng trước')).toBe('last_month');
    });

    it('should parse English period expressions', () => {
        expect(parsePeriodFromText('revenue today')).toBe('today');
        expect(parsePeriodFromText('yesterday sales')).toBe('yesterday');
        expect(parsePeriodFromText('this week report')).toBe('this_week');
    });

    it('should default to today for unclear text', () => {
        expect(parsePeriodFromText('show me data')).toBe('today');
        expect(parsePeriodFromText('')).toBe('today');
        expect(parsePeriodFromText(null)).toBe('today');
    });
});

// ============================================
// PARSEDATEFROMTEXT TESTS
// ============================================

describe('parseDateFromText', () => {
    it('should parse Vietnamese date format (DD/MM/YYYY)', () => {
        const date = parseDateFromText('ngày 15/01/2026');
        expect(date.getDate()).toBe(15);
        expect(date.getMonth()).toBe(0); // January
        expect(date.getFullYear()).toBe(2026);
    });

    it('should parse ISO format (YYYY-MM-DD)', () => {
        const date = parseDateFromText('date: 2026-03-20');
        expect(date.getDate()).toBe(20);
        expect(date.getMonth()).toBe(2); // March
    });

    it('should return null for invalid dates', () => {
        expect(parseDateFromText('no date here')).toBeNull();
        expect(parseDateFromText('')).toBeNull();
        expect(parseDateFromText(null)).toBeNull();
    });
});

// ============================================
// FORMATDATEVN TESTS
// ============================================

describe('formatDateVN', () => {
    it('should format date as DD/MM/YYYY', () => {
        const date = new Date('2026-02-04');
        expect(formatDateVN(date)).toBe('04/02/2026');
    });

    it('should pad single digits', () => {
        const date = new Date('2026-01-05');
        expect(formatDateVN(date)).toBe('05/01/2026');
    });

    it('should handle invalid input', () => {
        expect(formatDateVN(null)).toBe('');
        expect(formatDateVN('not a date')).toBe('');
    });
});

// ============================================
// FORMATDATEISO TESTS
// ============================================

describe('formatDateISO', () => {
    it('should format date as YYYY-MM-DD', () => {
        const date = new Date('2026-02-04');
        expect(formatDateISO(date)).toBe('2026-02-04');
    });
});

// ============================================
// GETRELATIVETIME TESTS
// ============================================

describe('getRelativeTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-04T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return "vừa xong" for very recent times', () => {
        const date = new Date('2026-02-04T11:59:30Z'); // 30 seconds ago
        expect(getRelativeTime(date)).toBe('vừa xong');
    });

    it('should return minutes for recent times', () => {
        const date = new Date('2026-02-04T11:45:00Z'); // 15 minutes ago
        expect(getRelativeTime(date)).toBe('15 phút trước');
    });

    it('should return hours', () => {
        const date = new Date('2026-02-04T09:00:00Z'); // 3 hours ago
        expect(getRelativeTime(date)).toBe('3 giờ trước');
    });

    it('should return days', () => {
        const date = new Date('2026-02-01T12:00:00Z'); // 3 days ago
        expect(getRelativeTime(date)).toBe('3 ngày trước');
    });
});

// ============================================
// DATE COMPARISON TESTS
// ============================================

describe('Date Comparison', () => {
    describe('isSameDay', () => {
        it('should return true for same day', () => {
            const date1 = new Date('2026-02-04T10:00:00');
            const date2 = new Date('2026-02-04T18:00:00');
            expect(isSameDay(date1, date2)).toBe(true);
        });

        it('should return false for different days', () => {
            const date1 = new Date('2026-02-04');
            const date2 = new Date('2026-02-05');
            expect(isSameDay(date1, date2)).toBe(false);
        });
    });

    describe('isToday', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-04'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return true for today', () => {
            expect(isToday(new Date('2026-02-04T15:00:00'))).toBe(true);
        });

        it('should return false for other days', () => {
            expect(isToday(new Date('2026-02-03'))).toBe(false);
        });
    });

    describe('isPast/isFuture', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-04T12:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should detect past dates', () => {
            expect(isPast(new Date('2026-02-03'))).toBe(true);
            expect(isPast(new Date('2026-02-05'))).toBe(false);
        });

        it('should detect future dates', () => {
            expect(isFuture(new Date('2026-02-05'))).toBe(true);
            expect(isFuture(new Date('2026-02-03'))).toBe(false);
        });
    });
});

// ============================================
// DATE ARITHMETIC TESTS
// ============================================

describe('Date Arithmetic', () => {
    describe('addDays', () => {
        it('should add positive days', () => {
            const date = new Date('2026-02-04');
            const result = addDays(date, 5);
            expect(result.getDate()).toBe(9);
        });

        it('should subtract with negative days', () => {
            const date = new Date('2026-02-04');
            const result = addDays(date, -3);
            expect(result.getDate()).toBe(1);
        });

        it('should handle month rollover', () => {
            const date = new Date('2026-02-25');
            const result = addDays(date, 10);
            expect(result.getMonth()).toBe(2); // March
        });
    });

    describe('addMonths', () => {
        it('should add months', () => {
            const date = new Date('2026-02-04');
            const result = addMonths(date, 2);
            expect(result.getMonth()).toBe(3); // April
        });

        it('should handle year rollover', () => {
            const date = new Date('2026-11-04');
            const result = addMonths(date, 3);
            expect(result.getFullYear()).toBe(2027);
            expect(result.getMonth()).toBe(1); // February
        });
    });

    describe('startOfDay/endOfDay', () => {
        it('should get start of day', () => {
            const date = new Date('2026-02-04T15:30:45');
            const result = startOfDay(date);
            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
        });

        it('should get end of day', () => {
            const date = new Date('2026-02-04T08:00:00');
            const result = endOfDay(date);
            expect(result.getHours()).toBe(23);
            expect(result.getMinutes()).toBe(59);
            expect(result.getSeconds()).toBe(59);
        });
    });
});

// ============================================
// VIETNAMESE NAME TESTS
// ============================================

describe('Vietnamese Names', () => {
    describe('getDayNameVN', () => {
        it('should return correct day names', () => {
            // February 4, 2026 is a Wednesday
            const wed = new Date('2026-02-04');
            expect(getDayNameVN(wed)).toBe('Thứ tư');

            const sun = new Date('2026-02-01');
            expect(getDayNameVN(sun)).toBe('Chủ nhật');
        });
    });

    describe('getMonthNameVN', () => {
        it('should return correct month names', () => {
            const feb = new Date('2026-02-04');
            expect(getMonthNameVN(feb)).toBe('Tháng 2');

            const jan = new Date('2026-01-15');
            expect(getMonthNameVN(jan)).toBe('Tháng 1');
        });
    });
});
