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
      enum: ['PayOS', 'Coinbase', 'NowPayments', 'COD'],
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
    inventoryCommitted: {
      type: Boolean,
      default: false,
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
    shippedAt: {
      type: Date,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDeliveryTime: {
      // Minutes from shippedAt to deliveredAt
      type: Number,
      min: [0, 'Actual delivery time cannot be negative'],
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
 * Commit reserved stock -> reduce quantity & reserved; then mark as paid
 * @param {Object} paymentResult - Payment result from gateway
 */
orderSchema.methods.markAsPaid = async function (paymentResult = {}) {
  if (this.status === 'paid') return this;

  const ProductVariant = mongoose.model('ProductVariant');
  const session = await mongoose.startSession();

  await session.withTransaction(async () => {
    for (const item of this.orderItems) {
      const variant = item.productVariant
        ? await ProductVariant.findById(item.productVariant).session(session)
        : await ProductVariant.findOne({ sku: item.sku }).session(session);

      if (!variant) {
        throw new Error(`Product variant ${item.sku} not found when committing payment`);
      }

      if ((variant.quantity ?? 0) < item.quantity) {
        throw new Error(`Insufficient stock for ${item.sku}`);
      }

      const reservedToRelease = Math.min(variant.reserved ?? 0, item.quantity);

      const updated = await ProductVariant.updateOne(
        { _id: variant._id, quantity: { $gte: item.quantity } },
        { $inc: { reserved: -reservedToRelease, quantity: -item.quantity } },
        { session }
      );

      if (updated.modifiedCount === 0) {
        throw new Error(`Failed to commit stock for ${item.sku}`);
      }
    }

    this.status = 'paid';
    this.paidAt = Date.now();
    this.paymentResult = {
      id: paymentResult.id || '',
      status: paymentResult.status || 'success',
      update_time: paymentResult.update_time || new Date().toISOString(),
      email_address: paymentResult.email_address || '',
    };
    this.inventoryCommitted = true;

    await this.save({ session });
  });

  session.endSession();
  return this;
};

/**
 * Mark order as shipped
 */
orderSchema.methods.markAsShipped = async function ({ trackingNumber, estimatedDelivery } = {}) {
  if (this.status !== 'paid') {
    throw new Error('Order must be paid before shipping');
  }

  this.status = 'shipped';
  this.shippedAt = this.shippedAt || Date.now();
  if (trackingNumber) this.trackingNumber = trackingNumber;
  if (estimatedDelivery) this.estimatedDelivery = estimatedDelivery;
  await this.save();
  return this;
};

/**
 * Mark order as delivered
 */
orderSchema.methods.markAsDelivered = async function ({ deliveredAt, actualDeliveryTime } = {}) {
  if (this.status !== 'shipped') {
    throw new Error('Order must be shipped before delivery');
  }

  const ProductVariant = mongoose.model('ProductVariant');
  if (!this.inventoryCommitted) {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      for (const item of this.orderItems) {
        const variant = item.productVariant
          ? await ProductVariant.findById(item.productVariant).session(session)
          : await ProductVariant.findOne({ sku: item.sku }).session(session);

        if (!variant) {
          throw new Error(`Product variant ${item.sku} not found when delivering`);
        }

        const reservedToRelease = Math.min(variant.reserved ?? 0, item.quantity);
        const updated = await ProductVariant.updateOne(
          { _id: variant._id, quantity: { $gte: item.quantity } },
          { $inc: { reserved: -reservedToRelease, quantity: -item.quantity } },
          { session }
        );

        if (updated.modifiedCount === 0) {
          throw new Error(`Insufficient stock for ${item.sku} when delivering`);
        }
      }

      this.inventoryCommitted = true;
      await this.save({ session });
    });
    session.endSession();
  }

  const deliveredTimestamp = deliveredAt || Date.now();
  this.status = 'delivered';
  this.deliveredAt = deliveredTimestamp;
  if (typeof actualDeliveryTime === 'number') {
    this.actualDeliveryTime = actualDeliveryTime;
  } else if (this.shippedAt) {
    this.actualDeliveryTime = Math.max(
      0,
      Math.round((deliveredTimestamp - this.shippedAt) / 60000)
    );
  }
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
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    for (const item of this.orderItems) {
      let variant = null;

      if (item.productVariant) {
        variant = await ProductVariant.findById(item.productVariant).session(session);
      }

      if (!variant) {
        variant = await ProductVariant.findOne({ sku: item.sku }).session(session);
      }

      if (!variant) continue;

      if (this.status === 'pending') {
        // Release reservation
        await ProductVariant.updateOne(
          { _id: variant._id, reserved: { $gte: item.quantity } },
          { $inc: { reserved: -item.quantity } },
          { session }
        );
      } else if (['paid', 'shipped'].includes(this.status)) {
        // Restock committed inventory
        await ProductVariant.updateOne(
          { _id: variant._id },
          { $inc: { quantity: item.quantity } },
          { session }
        );
      }
    }

    this.status = 'cancelled';
    this.cancelledAt = Date.now();
    await this.save({ session });
  });

  session.endSession();
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
        const variantId = item.productVariant;
        const variant = variantId
          ? await ProductVariant.findById(variantId)
          : await ProductVariant.findOne({ sku: item.sku });

        if (!variant) {
          throw new Error(`Product variant ${item.sku} not found`);
        }

        // Reserve stock on new order instead of deducting immediately
        await ProductVariant.updateOne(
          { _id: variant._id },
          { $inc: { reserved: item.quantity } }
        );
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