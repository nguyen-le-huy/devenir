import apiClient from './api';

/**
 * Product Service - API calls for product operations
 * Simple functions delegate directly to apiClient
 * Complex functions with data transformation handle errors appropriately
 */

/**
 * Lấy tất cả products với pagination và filtering
 * @param {Object} params - Query parameters (page, limit, category, brand, status, search)
 * @returns {Promise} Response data from API
 */
export const getAllProducts = (params = {}) => 
    apiClient.get('/products', { params });

/**
 * Lấy product theo ID kèm variants
 * @param {string} id - Product ID
 * @returns {Promise} Response data from API
 */
export const getProductById = (id) => 
    apiClient.get(`/products/${id}`);

/**
 * Lấy variants của một product
 * @param {string} productId - Product ID
 * @returns {Promise} Response data from API
 */
export const getProductVariants = (productId) => 
    apiClient.get(`/products/${productId}/variants`);

/**
 * Lấy tất cả variants (có thể filter theo product, size, color)
 * @param {Object} params - Query parameters
 * @returns {Promise} Response data from API
 */
export const getAllVariants = (params = {}) => 
    apiClient.get('/variants', { params });

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

        // Fetch variants cho tất cả products cùng lúc (parallel) thay vì tuần tự
        const variantPromises = products.map(product =>
            apiClient.get(`/products/${product._id}/variants`)
                .then(response => ({ product, variants: response.data || [] }))
                .catch(() => ({ product, variants: [] })) // Graceful fallback
        );
        const variantResults = await Promise.all(variantPromises);

        // Enrich variants với thông tin product
        const allVariants = variantResults.flatMap(({ product, variants }) =>
            variants.map(variant => ({
                ...variant,
                productInfo: {
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    brand: product.brand,
                    averageRating: product.averageRating,
                }
            }))
        );

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

        // Fetch variants parallel thay vì tuần tự
        const variantPromises = products.map(product =>
            apiClient.get(`/products/${product._id}/variants`)
                .then(response => ({ product, variants: response.data || [] }))
                .catch(() => ({ product, variants: [] }))
        );
        const variantResults = await Promise.all(variantPromises);

        const allVariants = variantResults.flatMap(({ product, variants }) =>
            variants.map(variant => ({
                ...variant,
                productInfo: {
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    brand: product.brand,
                    averageRating: product.averageRating,
                }
            }))
        );

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

/**
 * Lấy các variants ngẫu nhiên để gợi ý sản phẩm
 * @param {number} limit - Số lượng variants cần lấy
 * @returns {Promise} Array of random variants với thông tin product
 */
export const getRandomVariants = async (limit = 8) => {
    try {
        // Lấy tất cả products
        const productsResponse = await apiClient.get('/products', {
            params: {
                limit: 100, // Lấy 100 products để có đủ dữ liệu random
            }
        });

        const products = productsResponse.data || [];

        if (!products || products.length === 0) {
            return [];
        }

        // Fetch variants parallel thay vì tuần tự
        const variantPromises = products.map(product =>
            apiClient.get(`/products/${product._id}/variants`)
                .then(response => ({ product, variants: response.data || [] }))
                .catch(() => ({ product, variants: [] }))
        );
        const variantResults = await Promise.all(variantPromises);

        const allVariants = variantResults.flatMap(({ product, variants }) =>
            variants.map(variant => ({
                ...variant,
                productInfo: {
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    brand: product.brand,
                    averageRating: product.averageRating,
                }
            }))
        );

        // Filter unique by product+color combination
        const uniqueMap = new Map();
        const uniqueVariants = allVariants.filter(variant => {
            const productId = variant.productInfo?._id || variant.product_id;
            const key = `${productId}_${variant.color}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                return true;
            }
            return false;
        });

        // Shuffle array để random
        const shuffled = uniqueVariants.sort(() => Math.random() - 0.5);

        return shuffled.slice(0, limit);
    } catch (error) {
        console.error('Error fetching random variants:', error);
        throw error;
    }
};
