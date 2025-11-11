import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [200, 'Product name must not exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please enter product description'],
      trim: true,
      minlength: [10, 'Product description must be at least 10 characters'],
      maxlength: [2000, 'Product description must not exceed 2000 characters'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Please enter product price'],
      min: [0, 'Product price must not be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please choose category'],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: false,
    },
    images: {
      type: [String],
      required: [true, 'Please add at least one image'],
      validate: {
        validator: function (arr) {
          return arr.length > 1;
        },
        message: 'Product must have at least two images',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Min rate is 0'],
      max: [5, 'Max rate is 5'],
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
 * Virtual field to get the total number of reviews
 * Usage: product.reviewCount
 */
productSchema.virtual('reviewCount').get(function () {
  return this.reviews.length;
});

// ============ INSTANCE METHODS ============

/**
 * Update average rating
 * This method will be called after a new review is added
 */
productSchema.methods.calculateAverageRating = async function () {
  const Review = mongoose.model('Review');
  
  const stats = await Review.aggregate([
    {
      $match: { product: this._id },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal place
  } else {
    this.averageRating = 0;
  }

  await this.save();
};

// ============ STATIC METHODS ============

/**
 * Find products by category
 * @param {String} categoryId - ID of the category
 * @returns {Promise<Array>} - List of products
 */
productSchema.statics.findByCategory = function (categoryId) {
  return this.find({ category: categoryId, isActive: true })
    .populate('category', 'name')
    .populate('brand', 'name logoUrl')
    .sort({ createdAt: -1 });
};

/**
 * Find products by brand
 * @param {String} brandId - ID of the brand
 * @returns {Promise<Array>} - List of products
 */
productSchema.statics.findByBrand = function (brandId) {
  return this.find({ brand: brandId, isActive: true })
    .populate('category', 'name')
    .populate('brand', 'name logoUrl')
    .sort({ createdAt: -1 });
};

/**
 * Find products by tags
 * @param {Array} tags - Array of tags
 * @returns {Promise<Array>} - List of products
 */
productSchema.statics.findByTags = function (tags) {
  return this.find({ tags: { $in: tags }, isActive: true })
    .populate('category', 'name')
    .populate('brand', 'name logoUrl')
    .sort({ createdAt: -1 });
};

/**
 * Find top-rated products
 * @param {Number} minRating - Minimum rating (default 4.0)
 * @returns {Promise<Array>} - List of products
 */
productSchema.statics.findTopRated = function (minRating = 4.0) {
  return this.find({ averageRating: { $gte: minRating }, isActive: true })
    .populate('category', 'name')
    .populate('brand', 'name logoUrl')
    .sort({ averageRating: -1 })
    .limit(10);
};

/**
 * Search products by name (case-insensitive)
 * @param {String} searchTerm - Search keyword
 * @returns {Promise<Array>} - List of products
 */
productSchema.statics.searchByName = function (searchTerm) {
  return this.find({
    name: { $regex: searchTerm, $options: 'i' }, // case-insensitive
    isActive: true,
  })
    .populate('category', 'name')
    .populate('brand', 'name logoUrl')
    .sort({ createdAt: -1 });
};

// ============ MIDDLEWARE (Pre-hooks) ============

/**
 * Middleware runs before deleting a product
 * Deletes all related reviews
 */
productSchema.pre('remove', async function (next) {
  const Review = mongoose.model('Review');
  await Review.deleteMany({ product: this._id });
  next();
});

// ============ INDEXES ============

/**
 * Create indexes to optimize queries
 */
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ createdAt: -1 });

// Text index cho full-text search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ============ OPTIONS ============

/**
 * Enable virtuals when converting to JSON/Object
 */
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// ============ CREATE & EXPORT MODEL ============

const Product = mongoose.model('Product', productSchema);

export default Product;