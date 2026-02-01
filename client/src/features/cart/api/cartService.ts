import apiClient from '@/core/api/apiClient';
import { ICartResponse, IAddToCartPayload, IUpdateCartItemPayload } from '../types';

/**
 * Cart Service - API calls for shopping cart operations
 * Errors are logged for debugging but propagate to callers for handling
 */

/**
 * Lấy cart của user hiện tại
 * @returns {Promise<ICartResponse>} Cart data với items, totalItems, totalPrice
 */
export const getCart = (): Promise<ICartResponse> => apiClient.get('/cart');

/**
 * Thêm sản phẩm vào cart
 * @param {string} variantId - ID của variant cần thêm
 * @param {number} quantity - Số lượng (mặc định 1)
 * @returns {Promise<ICartResponse>} Updated cart data
 */
export const addToCart = (variantId: string, quantity = 1): Promise<ICartResponse> => {
    const payload: IAddToCartPayload = { variantId, quantity };
    return apiClient.post('/cart/items', payload);
};

/**
 * Cập nhật số lượng sản phẩm trong cart
 * @param {string} variantId - ID của variant cần update
 * @param {number} quantity - Số lượng mới
 * @returns {Promise<ICartResponse>} Updated cart data
 */
export const updateCartItem = (variantId: string, quantity: number): Promise<ICartResponse> => {
    const payload: IUpdateCartItemPayload = { variantId, quantity };
    return apiClient.put(`/cart/items/${variantId}`, payload);
};

/**
 * Xóa sản phẩm khỏi cart
 * @param {string} variantId - ID của variant cần xóa
 * @returns {Promise<ICartResponse>} Updated cart data
 */
export const removeFromCart = (variantId: string): Promise<ICartResponse> =>
    apiClient.delete(`/cart/items/${variantId}`);

/**
 * Xóa toàn bộ cart
 * @returns {Promise<ICartResponse>} Empty cart data
 */
export const clearCart = (): Promise<ICartResponse> => apiClient.delete('/cart');
