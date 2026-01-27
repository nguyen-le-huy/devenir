/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data - The data to convert.
 * @param {Array<{key: string, label: string}>} headers - The headers configuration.
 * @returns {string} The CSV string.
 */
export const toCsv = (data, headers) => {
    if (!data || !data.length) {
        return headers.map(h => `"${h.label}"`).join(',') + '\n';
    }

    const headerRow = headers.map(h => `"${h.label}"`).join(',');

    const rows = data.map(row => {
        return headers.map(header => {
            const value = row[header.key];
            const stringValue = value === null || value === undefined ? '' : String(value);
            // Escape double quotes by doubling them
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
    });

    return '\uFEFF' + [headerRow, ...rows].join('\n');
};
