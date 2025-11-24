import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    product: {
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
    size: {
      type: String,
      required: [true, 'Please select a size'],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size'],
    },
    color: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    price: {
      type: Number,
      required: [true, 'Please enter the variant price'],
      min: [0, 'Price must not be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Please enter the stock quantity'],
      min: [0, 'Stock must not be negative'],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    weight: {
      type: Number,
      default: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    barcode: {
      type: String,
      trim: true,
    },
    comparePrice: {
      type: Number,
      default: null,
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
 * Check if the variant is in stock
 */
productVariantSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// ============ INSTANCE METHODS ============

/**
 * Decrease stock quantity
 * @param {Number} quantity - Quantity to decrease
 */
productVariantSchema.methods.decreaseStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock quantity');
  }
  
  this.stock -= quantity;
  await this.save();
  
  return this;
};

/**
 * Increase stock quantity
 * @param {Number} quantity - Quantity to increase
 */
productVariantSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;
  await this.save();
  
  return this;
};

// ============ STATIC METHODS ============

/**
 * Find variants by product ID
 * @param {String} productId - ID of the product
 */
productVariantSchema.statics.findByProduct = function (productId) {
  return this.find({ product: productId, isActive: true })
    .populate('product', 'name basePrice')
    .sort({ createdAt: -1 });
};

/**
 * Tìm variant theo SKU
 * @param {String} sku - Mã SKU
 */
productVariantSchema.statics.findBySKU = function (sku) {
  return this.findOne({ sku: sku.toUpperCase(), isActive: true })
    .populate('product', 'name basePrice category brand');
};

/**
 * Find variants in stock
 */
productVariantSchema.statics.findInStock = function () {
  return this.find({ stock: { $gt: 0 }, isActive: true })
    .populate('product', 'name basePrice')
    .sort({ createdAt: -1 });
};

/**
 * Find variants by size
 * @param {String} size - Size
 */
productVariantSchema.statics.findBySize = function (size) {
  return this.find({ size, isActive: true })
    .populate('product', 'name basePrice')
    .sort({ createdAt: -1 });
};

/**
 * Find variants by color
 * @param {String} colorName - Color name
 */
productVariantSchema.statics.findByColor = function (colorName) {
  return this.find({ 'color.name': colorName, isActive: true })
    .populate('product', 'name basePrice')
    .sort({ createdAt: -1 });
};

// ============ MIDDLEWARE ============

/**
 * Automatically generate SKU if not provided (optional)
 */
productVariantSchema.pre('save', async function (next) {
  if (!this.sku) {
    // Format: PRODUCT_ID-SIZE-COLOR (e.g., DEVENIR-M-WHITE)
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    
    const colorCode = this.color.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '-');
    
    this.sku = `${product.name.substring(0, 3).toUpperCase()}-${this.size}-${colorCode}-${Date.now()}`;
  }
  
  next();
});

// ============ INDEXES ============

productVariantSchema.index({ product: 1 });
productVariantSchema.index({ size: 1 });
productVariantSchema.index({ 'color.name': 1 });
productVariantSchema.index({ stock: 1 });
productVariantSchema.index({ price: 1 });

// ============ OPTIONS ============

productVariantSchema.set('toJSON', { virtuals: true });
productVariantSchema.set('toObject', { virtuals: true });

// ============ CREATE & EXPORT MODEL ============

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;