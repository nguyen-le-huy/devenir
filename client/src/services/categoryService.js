import apiClient from './api';

/**
 * Lấy tất cả categories
 * @param {Object} params - Query parameters (page, limit, parentCategory, isActive)
 * @returns {Promise} Response data from API
 */
export const getAllCategories = async (params = {}) => {
    try {
        const response = await apiClient.get('/categories', { params });
        return response;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Lấy category theo ID
 * @param {string} id - Category ID
 * @returns {Promise} Response data from API
 */
export const getCategoryById = async (id) => {
    try {
        const response = await apiClient.get(`/categories/${id}`);
        return response;
    } catch (error) {
        console.error('Error fetching category:', error);
        throw error;
    }
};

/**
 * Lấy danh sách categories chính (top-level) đang active
 * @returns {Promise} Response data from API
 */
export const getMainCategories = async () => {
    try {
        const response = await apiClient.get('/categories', {
            params: {
                isActive: true,
                limit: 50, // Giới hạn 50 categories
            }
        });

        // Filter chỉ lấy categories chính (không có parentCategory)
        if (response.data) {
            const mainCategories = response.data.filter(cat => !cat.parentCategory);
            return {
                ...response,
                data: mainCategories
            };
        }

        return response;
    } catch (error) {
        console.error('Error fetching main categories:', error);
        throw error;
    }
};
