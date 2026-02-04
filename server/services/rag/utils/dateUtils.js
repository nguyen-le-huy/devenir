/**
 * Date Utilities for RAG Services
 * Centralized date parsing and range calculation
 * 
 * @module DateUtils
 * @version 1.0.0
 */

// ============================================
// PERIOD TYPES
// ============================================

/**
 * @typedef {'today'|'yesterday'|'this_week'|'last_week'|'this_month'|'last_month'|'this_year'|'custom'} PeriodType
 */

// ============================================
// DATE RANGE CALCULATION
// ============================================

/**
 * Calculate date range from period type
 * @param {Object} params - Parameters
 * @param {PeriodType} params.period - Period type
 * @param {string} [params.startDate] - Custom start date (YYYY-MM-DD)
 * @param {string} [params.endDate] - Custom end date (YYYY-MM-DD)
 * @returns {{ start: Date, end: Date, label: string }}
 */
export function calculateDateRange(params = {}) {
    const { period = 'today', startDate, endDate } = params;
    const now = new Date();

    let start, end, label;

    switch (period) {
        case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'hôm nay';
            break;

        case 'yesterday':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
            label = 'hôm qua';
            break;

        case 'this_week':
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'tuần này';
            break;

        case 'last_week':
            const lastWeekDay = now.getDay();
            const lastMondayOffset = lastWeekDay === 0 ? 6 : lastWeekDay - 1;
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastMondayOffset - 1, 23, 59, 59, 999);
            start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6, 0, 0, 0);
            label = 'tuần trước';
            break;

        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'tháng này';
            break;

        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            label = 'tháng trước';
            break;

        case 'this_year':
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'năm nay';
            break;

        case 'custom':
            start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
            end = endDate ? new Date(endDate) : now;
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            label = `từ ${formatDateVN(start)} đến ${formatDateVN(end)}`;
            break;

        default:
            // Default to today
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'hôm nay';
    }

    return { start, end, label };
}

// ============================================
// DATE PARSING
// ============================================

/**
 * Parse period from natural language (Vietnamese)
 * @param {string} text - User query
 * @returns {PeriodType}
 * 
 * @example
 * parsePeriodFromText('doanh thu hôm nay') // 'today'
 * parsePeriodFromText('báo cáo tuần này') // 'this_week'
 */
export function parsePeriodFromText(text) {
    if (!text) return 'today';

    const lower = text.toLowerCase();

    // Today
    if (/hôm nay|today|hôm\s*nay/i.test(lower)) {
        return 'today';
    }

    // Yesterday
    if (/hôm qua|yesterday|hôm\s*qua/i.test(lower)) {
        return 'yesterday';
    }

    // This week
    if (/tuần này|this week|tuần\s*này/i.test(lower)) {
        return 'this_week';
    }

    // Last week
    if (/tuần trước|tuần qua|last week|tuần\s*trước/i.test(lower)) {
        return 'last_week';
    }

    // This month
    if (/tháng này|this month|tháng\s*này/i.test(lower)) {
        return 'this_month';
    }

    // Last month
    if (/tháng trước|tháng qua|last month|tháng\s*trước/i.test(lower)) {
        return 'last_month';
    }

    // This year
    if (/năm nay|this year|năm\s*nay/i.test(lower)) {
        return 'this_year';
    }

    // Default to today
    return 'today';
}

/**
 * Parse specific date from text
 * @param {string} text - Text containing date
 * @returns {Date|null}
 * 
 * @example
 * parseDateFromText('ngày 15/01/2026') // Date object
 */
export function parseDateFromText(text) {
    if (!text) return null;

    // Vietnamese format: DD/MM/YYYY
    const vnMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (vnMatch) {
        const [_, day, month, year] = vnMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // ISO format: YYYY-MM-DD
    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return new Date(isoMatch[0]);
    }

    // US format: MM/DD/YYYY
    const usMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch && parseInt(usMatch[1]) <= 12) {
        const [_, month, day, year] = usMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return null;
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format date for Vietnamese display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date (DD/MM/YYYY)
 */
export function formatDateVN(date) {
    if (!date || !(date instanceof Date)) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Format date for API/database
 * @param {Date} date - Date to format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function formatDateISO(date) {
    if (!date || !(date instanceof Date)) return '';
    return date.toISOString().split('T')[0];
}

/**
 * Format date and time for Vietnamese display
 * @param {Date} date - Date to format
 * @returns {string} Formatted datetime (HH:mm DD/MM/YYYY)
 */
export function formatDateTimeVN(date) {
    if (!date || !(date instanceof Date)) return '';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes} ${formatDateVN(date)}`;
}

/**
 * Get relative time string (Vietnamese)
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 * 
 * @example
 * getRelativeTime(new Date(Date.now() - 3600000)) // '1 giờ trước'
 */
export function getRelativeTime(date) {
    if (!date || !(date instanceof Date)) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'vừa xong';
    }

    if (diffMin < 60) {
        return `${diffMin} phút trước`;
    }

    if (diffHour < 24) {
        return `${diffHour} giờ trước`;
    }

    if (diffDay < 7) {
        return `${diffDay} ngày trước`;
    }

    if (diffDay < 30) {
        const weeks = Math.floor(diffDay / 7);
        return `${weeks} tuần trước`;
    }

    if (diffDay < 365) {
        const months = Math.floor(diffDay / 30);
        return `${months} tháng trước`;
    }

    const years = Math.floor(diffDay / 365);
    return `${years} năm trước`;
}

// ============================================
// DATE COMPARISON
// ============================================

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;

    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isToday(date) {
    return isSameDay(date, new Date());
}

/**
 * Check if date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isPast(date) {
    if (!date || !(date instanceof Date)) return false;
    return date.getTime() < Date.now();
}

/**
 * Check if date is in the future
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isFuture(date) {
    if (!date || !(date instanceof Date)) return false;
    return date.getTime() > Date.now();
}

// ============================================
// DATE ARITHMETIC
// ============================================

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Days to add (negative for subtract)
 * @returns {Date} New date
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Add months to a date
 * @param {Date} date - Starting date
 * @param {number} months - Months to add (negative for subtract)
 * @returns {Date} New date
 */
export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Get start of day
 * @param {Date} date - Date
 * @returns {Date} Start of day (00:00:00)
 */
export function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get end of day
 * @param {Date} date - Date
 * @returns {Date} End of day (23:59:59.999)
 */
export function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Get day of week name (Vietnamese)
 * @param {Date} date - Date
 * @returns {string} Day name
 */
export function getDayNameVN(date) {
    if (!date || !(date instanceof Date)) return '';

    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[date.getDay()];
}

/**
 * Get month name (Vietnamese)
 * @param {Date} date - Date
 * @returns {string} Month name
 */
export function getMonthNameVN(date) {
    if (!date || !(date instanceof Date)) return '';
    return `Tháng ${date.getMonth() + 1}`;
}
