import Cart from '../models/CartModel.js';
import ProductVariant from '../models/ProductVariantModel.js';
import asyncHandler from 'express-async-handler';

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
    const userId = req.userId;

    let cart = await Cart.findOne({ user: userId })
        .populate({
            path: 'items.productVariant',
            populate: {
                path: 'product_id',
                select: 'name description category brand'
            }
        });

    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
        return res.status(200).json({
            success: true,
            data: {
                items: [],
                totalItems: 0,
                totalPrice: 0
            }
        });
    }

    // Calculate totals manually to avoid virtual issues after populate
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.items.reduce((total, item) => {
        if (item.productVariant && item.productVariant.price) {
            return total + item.productVariant.price * item.quantity;
        }
        return total;
    }, 0);

    res.status(200).json({
        success: true,
        data: {
            items: cart.items,
            totalItems: totalItems,
            totalPrice: totalPrice
        }
    });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { variantId, quantity = 1 } = req.body;

    console.log('addToCart called:', { userId, variantId, quantity });

    if (!variantId) {
        return res.status(400).json({
            success: false,
            message: 'Variant ID is required'
        });
    }

    // Validate variant exists
    const variant = await ProductVariant.findById(variantId);
    console.log('Found variant:', variant ? variant._id : 'NOT FOUND');
    
    if (!variant) {
        return res.status(404).json({
            success: false,
            message: 'Product variant not found'
        });
    }

    // Get or create cart
    let cart = await Cart.findOrCreateByUser(userId);
    console.log('Cart found/created:', cart._id);

    // Add item using cart model method
    try {
        await cart.addItem(variantId, quantity);
        console.log('Item added successfully');
    } catch (error) {
        console.error('Error adding item:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // Populate and return updated cart
    cart = await Cart.findById(cart._id)
        .populate({
            path: 'items.productVariant',
            populate: {
                path: 'product_id',
                select: 'name description category brand'
            }
        });

    // Calculate totals manually to avoid virtual issues
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.items.reduce((total, item) => {
        if (item.productVariant && item.productVariant.price) {
            return total + item.productVariant.price * item.quantity;
        }
        return total;
    }, 0);

    res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: {
            items: cart.items,
            totalItems: totalItems,
            totalPrice: totalPrice
        }
    });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/items/:variantId
 * @access  Private
 */
export const updateCartItem = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { variantId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid quantity is required'
        });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found'
        });
    }

    try {
        await cart.updateItemQuantity(variantId, quantity);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // Populate and return updated cart
    cart = await Cart.findById(cart._id)
        .populate({
            path: 'items.productVariant',
            populate: {
                path: 'product_id',
                select: 'name description category brand'
            }
        });

    res.status(200).json({
        success: true,
        message: 'Cart updated',
        data: {
            items: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        }
    });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:variantId
 * @access  Private
 */
export const removeFromCart = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { variantId } = req.params;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found'
        });
    }

    await cart.removeItem(variantId);

    // Populate and return updated cart
    cart = await Cart.findById(cart._id)
        .populate({
            path: 'items.productVariant',
            populate: {
                path: 'product_id',
                select: 'name description category brand'
            }
        });

    res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: {
            items: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        }
    });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
    const userId = req.userId;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found'
        });
    }

    await cart.clearCart();

    res.status(200).json({
        success: true,
        message: 'Cart cleared',
        data: {
            items: [],
            totalItems: 0,
            totalPrice: 0
        }
    });
});
