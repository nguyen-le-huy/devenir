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

        // apiClient interceptor đã unwrap response.data
        // Nên productsResponse = { success: true, data: [...], pagination: {...} }
        const products = productsResponse.data || [];

        if (!products || products.length === 0) {
            return [];
        }

        // Lấy variants cho từng product
        const allVariants = [];
        for (const product of products) {
            try {
                const variantsResponse = await apiClient.get(`/products/${product._id}/variants`);

                // apiClient đã unwrap, nên variantsResponse = { success: true, data: [...] }
                const variants = variantsResponse.data || [];

                if (variants.length > 0) {
                    // Thêm thông tin product vào mỗi variant
                    const enrichedVariants = variants.map(variant => ({
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
 * Lấy tất cả variants của một category VÀ các subcategories của nó
 * @param {string} parentCategoryId - Parent Category ID
 * @param {Array} allCategories - Tất cả categories (để tìm subcategories)
 * @returns {Promise} Array of variants với thông tin product
 */
export const getVariantsByCategoryWithChildren = async (parentCategoryId, allCategories = []) => {
    try {
        // Tìm tất cả subcategory IDs
        const subcategories = allCategories.filter(cat => 
            cat.parentCategory === parentCategoryId || 
            cat.parentCategory?._id === parentCategoryId ||
            String(cat.parentCategory) === String(parentCategoryId)
        );

        // Tạo danh sách tất cả category IDs (parent + children)
        const allCategoryIds = [parentCategoryId, ...subcategories.map(sub => sub._id)];

        // Fetch variants từ tất cả categories
        const allVariants = [];
        for (const categoryId of allCategoryIds) {
            try {
                const variants = await getVariantsByCategory(categoryId);
                if (Array.isArray(variants)) {
                    allVariants.push(...variants);
                }
            } catch (err) {
                // Silently handle error for individual category
            }
        }

        return allVariants;
    } catch (error) {
        console.error('Error fetching variants by category with children:', error);
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

/**
 * Lấy các variants mới nhất (sorted by createdAt)
 * Chỉ lấy 1 variant cho mỗi product+color combination (tránh trùng màu)
 * @param {number} limit - Số lượng variants cần lấy
 * @returns {Promise} Array of latest variants với thông tin product
 */
export const getLatestVariants = async (limit = 4) => {
    try {
        // Lấy tất cả products mới nhất
        const productsResponse = await apiClient.get('/products', {
            params: {
                limit: 50, // Lấy 50 products gần nhất
                sort: '-createdAt'
            }
        });

        const products = productsResponse.data || [];

        if (!products || products.length === 0) {
            return [];
        }

        // Lấy variants và flatten
        const allVariants = [];
        for (const product of products) {
            try {
                const variantsResponse = await apiClient.get(`/products/${product._id}/variants`);
                const variants = variantsResponse.data || [];

                if (variants.length > 0) {
                    const enrichedVariants = variants.map(variant => ({
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

        // Sort by createdAt (newest first)
        const sortedVariants = allVariants.sort((a, b) => {
            const dateA = new Date(a.createdAt || a._id);
            const dateB = new Date(b.createdAt || b._id);
            return dateB - dateA;
        });

        // Filter unique by product+color combination
        const uniqueMap = new Map();
        const uniqueVariants = sortedVariants.filter(variant => {
            const productId = variant.productInfo?._id || variant.product_id;
            const key = `${productId}_${variant.color}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                return true;
            }
            return false;
        });

        return uniqueVariants.slice(0, limit);
    } catch (error) {
        console.error('Error fetching latest variants:', error);
        throw error;
    }
};
