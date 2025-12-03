import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please specify the product for this variant'],
    },
    sku: {
      type: String,
      required: [true, 'Please enter the SKU'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Please select a color'],
      trim: true,
    },
    size: {
      type: String,
      required: [true, 'Please select a size'],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size'],
    },
    price: {
      type: Number,
      required: [true, 'Please enter the variant price'],
      min: [0, 'Price must not be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please enter the stock quantity'],
      min: [0, 'Stock must not be negative'],
      default: 0,
    },
    reserved: {
      type: Number,
      min: [0, 'Reserved stock must not be negative'],
      default: 0,
    },
    incoming: {
      type: Number,
      min: [0, 'Incoming stock must not be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Low stock threshold must not be negative'],
      default: 10,
    },
    reorderPoint: {
      type: Number,
      min: [0, 'Reorder point must not be negative'],
      default: 0,
    },
    reorderQuantity: {
      type: Number,
      min: [0, 'Reorder quantity must not be negative'],
      default: 0,
    },
    safetyStock: {
      type: Number,
      min: [0, 'Safety stock must not be negative'],
      default: 0,
    },
    binLocation: {
      type: String,
      trim: true,
    },
    mainImage: {
      type: String,
      required: false,
      trim: true,
    },
    hoverImage: {
      type: String,
      required: false,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============ VIRTUAL FIELDS ============

/**
 * Virtual: stock (alias for quantity)
 */
productVariantSchema.virtual('stock').get(function () {
  return this.quantity;
}).set(function (value) {
  this.quantity = value;
});

productVariantSchema.virtual('available').get(function () {
  const qty = this.quantity ?? 0;
  const reserved = this.reserved ?? 0;
  const available = qty - reserved;
  return available < 0 ? 0 : available;
});

productVariantSchema.virtual('inventoryValue').get(function () {
  return (this.price || 0) * (this.quantity || 0);
});

/**
 * Check if the variant is in stock
 */
productVariantSchema.virtual('inStock').get(function () {
  return this.quantity > 0;
});

// ============ INSTANCE METHODS ============

/**
 * Decrease quantity
 * @param {Number} qty - Quantity to decrease
 */
productVariantSchema.methods.decreaseQuantity = async function (qty) {
  if (this.quantity < qty) {
    throw new Error('Insufficient stock quantity');
  }

  this.quantity -= qty;
  await this.save();

  return this;
};

/**
 * Increase quantity
 * @param {Number} qty - Quantity to increase
 */
productVariantSchema.methods.increaseQuantity = async function (qty) {
  this.quantity += qty;
  await this.save();

  return this;
};

// ============ STATIC METHODS ============

/**
 * Find variants by product ID
 * @param {String} productId - ID of the product
 */
productVariantSchema.statics.findByProduct = function (productId) {
  return this.find({ product_id: productId, isActive: true })
    .populate('product_id', 'name category brand')
    .sort({ createdAt: -1 });
};

/**
 * Find variant by product ID, color and size
 * @param {String} productId - Product ID
 * @param {String} color - Color
 * @param {String} size - Size
 */
productVariantSchema.statics.findByProductAndVariant = function (productId, color, size) {
  return this.findOne({ 
    product_id: productId, 
    color: color, 
    size: size, 
    isActive: true 
  }).populate('product_id', 'name category brand');
};

/**
 * Find variant by SKU
 * @param {String} sku - SKU code
 */
productVariantSchema.statics.findBySKU = function (sku) {
  return this.findOne({ sku: sku.toUpperCase(), isActive: true })
    .populate('product_id', 'name category brand');
};

/**
 * Find all variants in stock
 */
productVariantSchema.statics.findInStock = function () {
  return this.find({ quantity: { $gt: 0 }, isActive: true })
    .populate('product_id', 'name category brand')
    .sort({ createdAt: -1 });
};

/**
 * Find variants by color
 * @param {String} color - Color name
 */
productVariantSchema.statics.findByColor = function (color) {
  return this.find({ color: color, isActive: true })
    .populate('product_id', 'name category brand')
    .sort({ createdAt: -1 });
};

/**
 * Find variants by size
 * @param {String} size - Size
 */
productVariantSchema.statics.findBySize = function (size) {
  return this.find({ size: size, isActive: true })
    .populate('product_id', 'name category brand')
    .sort({ createdAt: -1 });
};

// ============ MIDDLEWARE ============

/**
 * Automatically generate SKU if not provided
 */
productVariantSchema.pre('save', async function (next) {
  if (!this.sku) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product_id);

    let colorCode = 'NOCOLOR';
    if (this.color) {
      colorCode = this.color
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\s+/g, '-');
    }

    this.sku = `${product.name.substring(0, 3).toUpperCase()}-${this.size}-${colorCode}`;
  }

  next();
});

// ============ INDEXES ============

productVariantSchema.index({ product_id: 1 });
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ color: 1 });
productVariantSchema.index({ size: 1 });
productVariantSchema.index({ product_id: 1, color: 1, size: 1 });
productVariantSchema.index({ quantity: 1 });
productVariantSchema.index({ price: 1 });
productVariantSchema.index({ binLocation: 1 });
productVariantSchema.index({ lowStockThreshold: 1 });
productVariantSchema.index({ reorderPoint: 1 });
productVariantSchema.index({ reserved: 1 });

// ============ OPTIONS ============

productVariantSchema.set('toJSON', { virtuals: true });
productVariantSchema.set('toObject', { virtuals: true });

// ============ CREATE & EXPORT MODEL ============

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;