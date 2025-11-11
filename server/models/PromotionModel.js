import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promotion code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Code must be at least 3 characters'],
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be percentage or fixed',
      },
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Maximum discount amount cannot be negative'],
    },
    usageLimit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ============ VIRTUAL FIELDS ============

/**
 * Check if promotion is currently valid
 */
promotionSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.usageLimit || this.usedCount < this.usageLimit)
  );
});

/**
 * Get remaining uses
 */
promotionSchema.virtual('remainingUses').get(function () {
  if (!this.usageLimit) return Infinity;
  return this.usageLimit - this.usedCount;
});

// ============ INSTANCE METHODS ============

/**
 * Calculate discount amount for an order
 * @param {Number} orderTotal - Total order amount
 * @returns {Number} - Discount amount
 */
promotionSchema.methods.calculateDiscount = function (orderTotal) {
  // Check if order meets minimum value
  if (orderTotal < this.minOrderValue) {
    return 0;
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discountValue) / 100;
    
    // Apply max discount cap if exists
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
    
    // Discount cannot exceed order total
    if (discount > orderTotal) {
      discount = orderTotal;
    }
  }
  
  return Math.round(discount);
};

/**
 * Apply promotion (increment usage count)
 */
promotionSchema.methods.applyPromotion = async function () {
  if (!this.isValid) {
    throw new Error('Promotion is not valid or has expired');
  }
  
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    throw new Error('Promotion usage limit reached');
  }
  
  this.usedCount += 1;
  await this.save();
  
  return this;
};

/**
 * Check if promotion is applicable to specific products
 * @param {Array} productIds - Array of product IDs
 * @returns {Boolean}
 */
promotionSchema.methods.isApplicableToProducts = function (productIds) {
  // If no specific products, promotion applies to all
  if (!this.applicableProducts || this.applicableProducts.length === 0) {
    return true;
  }
  
  // Check if any product ID matches
  return productIds.some((productId) =>
    this.applicableProducts.some(
      (applicableId) => applicableId.toString() === productId.toString()
    )
  );
};

/**
 * Check if promotion is applicable to specific categories
 * @param {Array} categoryIds - Array of category IDs
 * @returns {Boolean}
 */
promotionSchema.methods.isApplicableToCategories = function (categoryIds) {
  // If no specific categories, promotion applies to all
  if (
    !this.applicableCategories ||
    this.applicableCategories.length === 0
  ) {
    return true;
  }
  
  // Check if any category ID matches
  return categoryIds.some((categoryId) =>
    this.applicableCategories.some(
      (applicableId) => applicableId.toString() === categoryId.toString()
    )
  );
};

// ============ STATIC METHODS ============

/**
 * Find promotion by code
 * @param {String} code - Promotion code
 */
promotionSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

/**
 * Find active promotions
 */
promotionSchema.statics.findActive = function () {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ createdAt: -1 });
};

/**
 * Find upcoming promotions
 */
promotionSchema.statics.findUpcoming = function () {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $gt: now },
  }).sort({ startDate: 1 });
};

/**
 * Find expired promotions
 */
promotionSchema.statics.findExpired = function () {
  const now = new Date();
  
  return this.find({
    endDate: { $lt: now },
  }).sort({ endDate: -1 });
};

// ============ MIDDLEWARE ============

/**
 * Validate dates before saving
 */
promotionSchema.pre('save', function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  next();
});

// ============ INDEXES ============

promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ applicableProducts: 1 });
promotionSchema.index({ applicableCategories: 1 });

// ============ OPTIONS ============

promotionSchema.set('toJSON', { virtuals: true });
promotionSchema.set('toObject', { virtuals: true });

// ============ CREATE & EXPORT MODEL ============

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;