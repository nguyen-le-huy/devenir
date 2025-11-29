import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true, // One cart per user
    },
    items: [
      {
        productVariant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariant',
          required: [true, 'Product variant is required'],
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
          default: 1,
        },
        _id: false, // Disable auto-generated _id for sub-documents
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ============ VIRTUAL FIELDS ============

/**
 * Calculate total number of items in cart
 */
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Calculate total price of cart
 * Note: Requires populated productVariant with price field
 */
cartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => {
    if (item.productVariant && item.productVariant.price) {
      return total + item.productVariant.price * item.quantity;
    }
    return total;
  }, 0);
});

// ============ INSTANCE METHODS ============

/**
 * Add item to cart or update quantity if already exists
 * @param {String} productVariantId - ID of product variant
 * @param {Number} quantity - Quantity to add
 */
cartSchema.methods.addItem = async function (productVariantId, quantity = 1) {
  const ProductVariant = mongoose.model('ProductVariant');
  
  // Check if variant exists and has sufficient stock
  const variant = await ProductVariant.findById(productVariantId);
  if (!variant) {
    throw new Error('Product variant not found');
  }
  
  // Find if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    (item) => item.productVariant.toString() === productVariantId
  );
  
  if (existingItemIndex > -1) {
    // Update quantity if item exists
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > variant.quantity) {
      throw new Error('Insufficient stock');
    }
    
    this.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item if doesn't exist
    if (quantity > variant.quantity) {
      throw new Error('Insufficient stock');
    }
    
    this.items.push({
      productVariant: productVariantId,
      quantity,
    });
  }
  
  await this.save();
  return this;
};

/**
 * Remove item from cart
 * @param {String} productVariantId - ID of product variant to remove
 */
cartSchema.methods.removeItem = async function (productVariantId) {
  this.items = this.items.filter(
    (item) => item.productVariant.toString() !== productVariantId
  );
  
  await this.save();
  return this;
};

/**
 * Update item quantity in cart
 * @param {String} productVariantId - ID of product variant
 * @param {Number} quantity - New quantity
 */
cartSchema.methods.updateItemQuantity = async function (
  productVariantId,
  quantity
) {
  const ProductVariant = mongoose.model('ProductVariant');
  
  // Check stock availability
  const variant = await ProductVariant.findById(productVariantId);
  if (!variant) {
    throw new Error('Product variant not found');
  }
  
  if (quantity > variant.quantity) {
    throw new Error('Insufficient stock');
  }
  
  const itemIndex = this.items.findIndex(
    (item) => item.productVariant.toString() === productVariantId
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    return this.removeItem(productVariantId);
  }
  
  this.items[itemIndex].quantity = quantity;
  await this.save();
  return this;
};

/**
 * Clear all items from cart
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  await this.save();
  return this;
};

// ============ STATIC METHODS ============

/**
 * Find cart by user ID or create if doesn't exist
 * @param {String} userId - User ID
 */
cartSchema.statics.findOrCreateByUser = async function (userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

// ============ INDEXES ============

cartSchema.index({ user: 1 });
cartSchema.index({ 'items.productVariant': 1 });

// ============ OPTIONS ============

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// ============ CREATE & EXPORT MODEL ============

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;