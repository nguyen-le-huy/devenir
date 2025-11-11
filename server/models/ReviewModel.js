import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the user who wrote the review'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please specify the product'],
    },
    rating: {
      type: Number,
      required: [true, 'Please specify the rating'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating must be at most 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Please enter the review content'],
      trim: true,
      minlength: [10, 'Review content must be at least 10 characters'],
      maxlength: [1000, 'Review content must not exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ============ COMPOUND INDEX ============

/**
 * Ensure each user can only review a product once
 */
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// ============ MIDDLEWARE ============

/**
 * Sau khi tạo review, cập nhật averageRating của product
 */
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  
  if (product) {
    await product.calculateAverageRating();
  }
});

/**
 * After deleting a review, update the product's averageRating
 */
reviewSchema.post('remove', async function () {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  
  if (product) {
    await product.calculateAverageRating();
  }
});

// ============ STATIC METHODS ============

/**
 * Get all reviews for a product
 * @param {String} productId - ID of the product
 */
reviewSchema.statics.findByProduct = function (productId) {
  return this.find({ product: productId })
    .populate('user', 'username email')
    .sort({ createdAt: -1 });
};

/**
 * Get all reviews for a user
 * @param {String} userId - ID of the user
 */
reviewSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId })
    .populate('product', 'name images basePrice')
    .sort({ createdAt: -1 });
};

// ============ CREATE & EXPORT MODEL ============

const Review = mongoose.model('Review', reviewSchema);

export default Review;