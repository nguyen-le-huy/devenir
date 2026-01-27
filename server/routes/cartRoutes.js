import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from '../controllers/CartController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
    addToCartSchema,
    updateCartItemSchema,
    cartItemParamSchema
} from '../validators/cart.validator.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get('/', getCart);

// POST /api/cart/items - Add item to cart
router.post('/items', validate(addToCartSchema), addToCart);

// PUT /api/cart/items/:variantId - Update item quantity
router.put('/items/:variantId', validate(updateCartItemSchema), updateCartItem);

// DELETE /api/cart/items/:variantId - Remove item from cart
router.delete('/items/:variantId', validate(cartItemParamSchema), removeFromCart);

// DELETE /api/cart - Clear cart
router.delete('/', clearCart);

export default router;
