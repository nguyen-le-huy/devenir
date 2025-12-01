import apiClient from './api';

/**
 * Lấy cart của user hiện tại
 * @returns {Promise} Cart data với items, totalItems, totalPrice
 */
export const getCart = async () => {
    try {
        const response = await apiClient.get('/cart');
        return response;
    } catch (error) {
        console.error('Error fetching cart:', error);
        throw error;
    }
};

/**
 * Thêm sản phẩm vào cart
 * @param {string} variantId - ID của variant cần thêm
 * @param {number} quantity - Số lượng (mặc định 1)
 * @returns {Promise} Updated cart data
 */
export const addToCart = async (variantId, quantity = 1) => {
    try {
        const response = await apiClient.post('/cart/items', {
            variantId,
            quantity
        });
        return response;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
};

/**
 * Cập nhật số lượng sản phẩm trong cart
 * @param {string} variantId - ID của variant cần update
 * @param {number} quantity - Số lượng mới
 * @returns {Promise} Updated cart data
 */
export const updateCartItem = async (variantId, quantity) => {
    try {
        const response = await apiClient.put(`/cart/items/${variantId}`, {
            quantity
        });
        return response;
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
};

/**
 * Xóa sản phẩm khỏi cart
 * @param {string} variantId - ID của variant cần xóa
 * @returns {Promise} Updated cart data
 */
export const removeFromCart = async (variantId) => {
    try {
        const response = await apiClient.delete(`/cart/items/${variantId}`);
        return response;
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
};

/**
 * Xóa toàn bộ cart
 * @returns {Promise} Empty cart data
 */
export const clearCart = async () => {
    try {
        const response = await apiClient.delete('/cart');
        return response;
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }
};
