import mongoose from 'mongoose';

const financialRecordSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order', 'refund', 'adjustment'],
      required: true,
    },
    revenue: {
      type: Number,
      required: true,
      min: [0, 'Revenue cannot be negative'],
    },
    costOfGoodsSold: {
      type: Number,
      required: true,
      min: [0, 'COGS cannot be negative'],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, 'Platform fee cannot be negative'],
    },
    netProfit: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

financialRecordSchema.index({ date: 1 });
financialRecordSchema.index({ type: 1, date: -1 });
financialRecordSchema.index({ status: 1, date: -1 });

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

export default FinancialRecord;
