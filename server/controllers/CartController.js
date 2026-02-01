import asyncHandler from 'express-async-handler';
import cartService from '../services/cart.service.js';

/**
 * Cart Controller
 * Purely handles HTTP Req/Res
 */

export const getCart = asyncHandler(async (req, res) => {
    const data = await cartService.getCart(req.userId);
    res.status(200).json({ success: true, data });
});

export const addToCart = asyncHandler(async (req, res) => {
    const { variantId, quantity } = req.body;
    const data = await cartService.addToCart(req.userId, { variantId, quantity });

    res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data
    });
});

export const updateCartItem = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const data = await cartService.updateItemQuantity(req.userId, variantId, quantity);

    res.status(200).json({
        success: true,
        message: 'Cart updated',
        data
    });
});

export const removeFromCart = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const data = await cartService.removeItem(req.userId, variantId);

    res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data
    });
});

export const clearCart = asyncHandler(async (req, res) => {
    const data = await cartService.clearCart(req.userId);
    res.status(200).json({
        success: true,
        message: 'Cart cleared',
        data
    });
});
