import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    orderItems: [
      {
        // Product base info (snapshot)
        name: {
          type: String,
          required: [true, 'Product name is required'],
        },
        sku: {
          type: String,
          required: [true, 'SKU is required'],
        },

        // Variant details (snapshot at order time)
        color: {
          type: String,
          required: [true, 'Color is required'],
        },
        size: {
          type: String,
          required: [true, 'Size is required'],
        },

        // Order details
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0, 'Price cannot be negative'],
        },

        // Images (snapshot)
        image: {
          type: String,
          required: [true, 'Product image is required'],
        },
        mainImage: {
          type: String,
        },
        hoverImage: {
          type: String,
        },

        // Reference to original variant (for tracking, optional)
        // Nếu variant bị xóa, order vẫn giữ nguyên thông tin snapshot
        productVariant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariant',
          required: false, // Đổi thành optional vì đã có snapshot
        },

        // Reference to product (for tracking)
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: false,
        },

        _id: false,
      },
    ],
    shippingAddress: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^(\+84|0)[0-9]{9,10}$/, 'Invalid phone number'],
      },
    },
    deliveryMethod: {
      type: String,
      enum: ['home', 'store'],
      default: 'home',
    },
    deliveryWindow: {
      type: String,
      enum: ['standard', 'next', 'nominated'],
      default: 'standard',
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['Bank', 'Crypto', 'COD'],
        message: 'Payment method must be Bank, Crypto, or COD',
      },
    },
    paymentResult: {
      id: String, // Transaction ID from payment gateway
      status: String, // Payment status (success, failed, pending)
      update_time: String, // Last update timestamp
      email_address: String, // Payer email
    },
    paymentGateway: {
      type: String,
      enum: ['PayOS', 'Coinbase', 'COD'],
      default: 'PayOS',
    },
    paymentIntent: {
      type: {
        gatewayOrderCode: Number,
        paymentLinkId: String,
        checkoutUrl: String,
        qrCode: String,
        amount: Number,
        currency: {
          type: String,
          default: 'VND',
        },
        rawResponse: mongoose.Schema.Types.Mixed,
        status: {
          type: String,
          enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED'],
          default: 'PENDING',
        },
      },
      default: () => ({}),
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    originalTotalPrice: {
      type: Number,
      min: [0, 'Original total price cannot be negative'],
      default: null, // Will be set when gift code is applied
    },
    shippingPrice: {
      type: Number,
      required: [true, 'Shipping price is required'],
      min: [0, 'Shipping price cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      required: [true, 'Order status is required'],
      enum: {
        values: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
        message: 'Invalid order status',
      },
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    appliedGiftCode: {
      type: String,
      default: null,
    },
    confirmationEmailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ============ VIRTUAL FIELDS ============

/**
 * Calculate subtotal (total without shipping)
 */
orderSchema.virtual('subtotal').get(function () {
  return this.totalPrice - this.shippingPrice;
});

/**
 * Calculate total items count
 */
orderSchema.virtual('totalItems').get(function () {
  return this.orderItems.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Check if order is paid
 */
orderSchema.virtual('isPaid').get(function () {
  return this.status === 'paid' || this.paidAt !== undefined;
});

/**
 * Check if order is delivered
 */
orderSchema.virtual('isDelivered').get(function () {
  return this.status === 'delivered' && this.deliveredAt !== undefined;
});

// ============ INSTANCE METHODS ============

/**
 * Mark order as paid
 * @param {Object} paymentResult - Payment result from gateway
 */
orderSchema.methods.markAsPaid = async function (paymentResult = {}) {
  this.status = 'paid';
  this.paidAt = Date.now();
  this.paymentResult = {
    id: paymentResult.id || '',
    status: paymentResult.status || 'success',
    update_time: paymentResult.update_time || new Date().toISOString(),
    email_address: paymentResult.email_address || '',
  };

  await this.save();
  return this;
};

/**
 * Mark order as shipped
 */
orderSchema.methods.markAsShipped = async function () {
  if (this.status !== 'paid') {
    throw new Error('Order must be paid before shipping');
  }

  this.status = 'shipped';
  await this.save();
  return this;
};

/**
 * Mark order as delivered
 */
orderSchema.methods.markAsDelivered = async function () {
  if (this.status !== 'shipped') {
    throw new Error('Order must be shipped before delivery');
  }

  this.status = 'delivered';
  this.deliveredAt = Date.now();
  await this.save();
  return this;
};

/**
 * Cancel order
 */
orderSchema.methods.cancelOrder = async function () {
  if (this.status === 'delivered') {
    throw new Error('Cannot cancel delivered order');
  }

  // Restore stock for each item
  const ProductVariant = mongoose.model('ProductVariant');

  for (const item of this.orderItems) {
    // Thử tìm variant bằng reference trước
    let variant = null;

    if (item.productVariant) {
      variant = await ProductVariant.findById(item.productVariant);
    }

    // Nếu không tìm thấy, thử tìm bằng SKU
    if (!variant) {
      variant = await ProductVariant.findOne({ sku: item.sku });
    }

    // Nếu tìm thấy variant, hoàn trả stock
    if (variant) {
      await variant.increaseQuantity(item.quantity);
    }
    // Nếu không tìm thấy, bỏ qua (variant có thể đã bị xóa)
  }

  this.status = 'cancelled';
  this.cancelledAt = Date.now();
  await this.save();
  return this;
};

// ============ STATIC METHODS ============

/**
 * Find orders by user
 * @param {String} userId - User ID
 */
orderSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('user', 'username email');
};

/**
 * Find orders by status
 * @param {String} status - Order status
 */
orderSchema.statics.findByStatus = function (status) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .populate('user', 'username email');
};

/**
 * Get total revenue
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
orderSchema.statics.getTotalRevenue = async function (startDate, endDate) {
  const match = {
    status: { $in: ['paid', 'shipped', 'delivered'] },
  };

  if (startDate) match.createdAt = { $gte: startDate };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: endDate };

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalRevenue: 0, orderCount: 0 };
};

// ============ MIDDLEWARE ============

/**
 * Before saving order, decrease stock for each item
 */
orderSchema.pre('save', async function (next) {
  // Only decrease stock when creating new order (not on update)
  if (this.isNew) {
    const ProductVariant = mongoose.model('ProductVariant');

    try {
      for (const item of this.orderItems) {
        // Nếu có productVariant reference, dùng nó để giảm stock
        if (item.productVariant) {
          const variant = await ProductVariant.findById(item.productVariant);

          if (!variant) {
            throw new Error(`Product variant ${item.sku} not found`);
          }

          // Giảm stock (sử dụng method decreaseQuantity thay vì decreaseStock)
          await variant.decreaseQuantity(item.quantity);
        } else {
          // Fallback: tìm variant bằng SKU nếu không có reference
          const variant = await ProductVariant.findOne({ sku: item.sku });

          if (variant) {
            await variant.decreaseQuantity(item.quantity);
          }
          // Nếu không tìm thấy variant, tiếp tục (vì có thể là variant đã bị xóa)
        }
      }
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// ============ INDEXES ============

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentResult.id': 1 });
orderSchema.index({ 'paymentIntent.gatewayOrderCode': 1 });

// ============ OPTIONS ============

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// ============ CREATE & EXPORT MODEL ============

const Order = mongoose.model('Order', orderSchema);

export default Order;