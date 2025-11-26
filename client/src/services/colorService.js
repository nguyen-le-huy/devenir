import apiClient from './api';

/**
 * Get all active colors
 */
export const getAllColors = async () => {
    try {
        const response = await apiClient.get('/colors', {
            params: {
                isActive: true,
                limit: 100
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching colors:', error);
        throw error;
    }
};

/**
 * Get color by name
 */
export const getColorByName = async (name) => {
    try {
        const response = await apiClient.get('/colors', {
            params: {
                name: name,
                isActive: true
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching color:', error);
        throw error;
    }
};

/**
 * Create a color map from colors array
 * Returns { colorName: hexCode } object
 */
export const createColorMap = (colors) => {
    const colorMap = {};
    colors.forEach(color => {
        if (color.name && color.hex) {
            colorMap[color.name] = color.hex;
        }
    });
    return colorMap;
};
