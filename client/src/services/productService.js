import apiClient from './api';

/**
 * Lấy tất cả products với pagination và filtering
 * @param {Object} params - Query parameters (page, limit, category, brand, status, search)
 * @returns {Promise} Response data from API
 */
export const getAllProducts = async (params = {}) => {
    try {
        const response = await apiClient.get('/products', { params });
        return response;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Lấy product theo ID kèm variants
 * @param {string} id - Product ID
 * @returns {Promise} Response data from API
 */
export const getProductById = async (id) => {
    try {
        const response = await apiClient.get(`/products/${id}`);
        return response;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

/**
 * Lấy variants của một product
 * @param {string} productId - Product ID
 * @returns {Promise} Response data from API
 */
export const getProductVariants = async (productId) => {
    try {
        const response = await apiClient.get(`/products/${productId}/variants`);
        return response;
    } catch (error) {
        console.error('Error fetching product variants:', error);
        throw error;
    }
};

/**
 * Lấy tất cả variants (có thể filter theo product, size, color)
 * @param {Object} params - Query parameters
 * @returns {Promise} Response data from API
 */
export const getAllVariants = async (params = {}) => {
    try {
        const response = await apiClient.get('/variants', { params });
        return response;
    } catch (error) {
        console.error('Error fetching variants:', error);
        throw error;
    }
};

/**
 * Lấy tất cả variants của một category
 * Mỗi variant được coi như một product riêng
 * @param {string} categoryId - Category ID
 * @returns {Promise} Array of variants với thông tin product
 */
export const getVariantsByCategory = async (categoryId) => {
    try {
        // Đầu tiên lấy tất cả products thuộc category
        const productsResponse = await apiClient.get('/products', {
            params: {
                category: categoryId,
                limit: 1000, // Lấy hết products
            }
        });

        if (!productsResponse.data || productsResponse.data.length === 0) {
            return [];
        }

        // Lấy variants cho từng product
        const allVariants = [];
        for (const product of productsResponse.data) {
            try {
                const variantsResponse = await apiClient.get(`/products/${product._id}/variants`);
                if (variantsResponse.data && variantsResponse.data.length > 0) {
                    // Thêm thông tin product vào mỗi variant
                    const enrichedVariants = variantsResponse.data.map(variant => ({
                        ...variant,
                        productInfo: {
                            _id: product._id,
                            name: product.name,
                            description: product.description,
                            category: product.category,
                            brand: product.brand,
                            averageRating: product.averageRating,
                        }
                    }));
                    allVariants.push(...enrichedVariants);
                }
            } catch (err) {
                console.error(`Error fetching variants for product ${product._id}:`, err);
            }
        }

        return allVariants;
    } catch (error) {
        console.error('Error fetching variants by category:', error);
        throw error;
    }
};

/**
 * Lấy thông tin chi tiết của một variant theo ID
 * Bao gồm thông tin product cha và tất cả variants cùng cha
 * @param {string} variantId - Variant ID
 * @returns {Promise} Object chứa variant detail, product info, và sibling variants
 */
export const getVariantById = async (variantId) => {
    try {
        // Gọi single endpoint từ backend
        // apiClient đã unwrap response.data, nên response ở đây chính là body từ backend
        const response = await apiClient.get(`/variants/${variantId}`);

        // Backend trả về: { success: true, data: { variant, product, siblingVariants } }
        if (response.success && response.data) {
            return response.data;
        }

        return response;
    } catch (error) {
        console.error('Error fetching variant detail:', error);
        throw error;
    }
};
