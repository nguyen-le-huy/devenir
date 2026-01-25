import apiClient from '@/core/api/apiClient';

/**
 * Cart Service - API calls for shopping cart operations
 * Errors are logged for debugging but propagate to callers for handling
 */

/**
 * Lấy cart của user hiện tại
 * @returns {Promise} Cart data với items, totalItems, totalPrice
 */
export const getCart = () => apiClient.get('/cart');

/**
 * Thêm sản phẩm vào cart
 * @param {string} variantId - ID của variant cần thêm
 * @param {number} quantity - Số lượng (mặc định 1)
 * @returns {Promise} Updated cart data
 */
export const addToCart = (variantId: string, quantity = 1) =>
    apiClient.post('/cart/items', { variantId, quantity });

/**
 * Cập nhật số lượng sản phẩm trong cart
 * @param {string} variantId - ID của variant cần update
 * @param {number} quantity - Số lượng mới
 * @returns {Promise} Updated cart data
 */
export const updateCartItem = (variantId: string, quantity: number) =>
    apiClient.put(`/cart/items/${variantId}`, { quantity });

/**
 * Xóa sản phẩm khỏi cart
 * @param {string} variantId - ID của variant cần xóa
 * @returns {Promise} Updated cart data
 */
export const removeFromCart = (variantId: string) =>
    apiClient.delete(`/cart/items/${variantId}`);

/**
 * Xóa toàn bộ cart
 * @returns {Promise} Empty cart data
 */
export const clearCart = () => apiClient.delete('/cart');
