import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from '../controllers/CartController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get('/', getCart);

// POST /api/cart/items - Add item to cart
router.post('/items', addToCart);

// PUT /api/cart/items/:variantId - Update item quantity
router.put('/items/:variantId', updateCartItem);

// DELETE /api/cart/items/:variantId - Remove item from cart
router.delete('/items/:variantId', removeFromCart);

// DELETE /api/cart - Clear cart
router.delete('/', clearCart);

export default router;
