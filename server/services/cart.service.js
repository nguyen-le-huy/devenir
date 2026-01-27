import Cart from '../models/CartModel.js';
import ProductVariant from '../models/ProductVariantModel.js';

class CartService {

    /**
     * Helper: Calculate Cart Totals
     * (Normally CartModel might handle this virtual or pre-save, but service layer ensuring consistency is safer)
     */
    _calculateTotals(cart) {
        // Safe access in case populated fields are missing
        const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
        const totalPrice = cart.items.reduce((total, item) => {
            // Check deep population structure availability
            if (item.productVariant && item.productVariant.price) {
                return total + item.productVariant.price * item.quantity;
            }
            return total;
        }, 0);

        return { totalItems, totalPrice };
    }

    /**
     * Get or Create Cart
     */
    async getCart(userId) {
        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.productVariant',
                select: 'price sku color size mainImage',
                populate: {
                    path: 'product_id',
                    select: 'name description category brand'
                }
            });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
            return {
                items: [],
                totalItems: 0,
                totalPrice: 0
            };
        }

        const { totalItems, totalPrice } = this._calculateTotals(cart);

        return {
            items: cart.items,
            totalItems,
            totalPrice
        };
    }

    /**
     * Add Item to Cart
     */
    async addToCart(userId, { variantId, quantity }) {
        // Validate Variant
        const variant = await ProductVariant.findById(variantId);
        if (!variant) throw new Error('Product variant not found');

        // Logic handled by Model typically, but let's be explicit and robust here or delegate to model methods
        // The controller used cart.addItem, let's assume CartModel has this smart method.
        // Or we implement it here to be explicit about business logic.

        let cart = await Cart.findOrCreateByUser(userId); // Ensure this static method exists or use findOne/Create

        // Business Logic: Check stock? (Optional but good)
        // if (variant.quantity < quantity) throw new Error('Insufficient stock'); 

        await cart.addItem(variantId, quantity); // Delegate to Model method which handles array logic

        // Refetch to populate
        return this.getCart(userId);
    }

    /**
     * Update Item Quantity
     */
    async updateItemQuantity(userId, variantId, quantity) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new Error('Cart not found');

        await cart.updateItemQuantity(variantId, quantity); // Delegate to Model

        return this.getCart(userId);
    }

    /**
     * Remove Item
     */
    async removeItem(userId, variantId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new Error('Cart not found');

        await cart.removeItem(variantId); // Delegate to Model

        return this.getCart(userId);
    }

    /**
     * Clear Cart
     */
    async clearCart(userId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new Error('Cart not found');

        await cart.clearCart();

        return {
            items: [],
            totalItems: 0,
            totalPrice: 0
        };
    }
}

export default new CartService();
