import mongoose from 'mongoose';

const inventoryAdjustmentSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'manual',
        'cycle_count',
        'damage',
        'return',
        'restock',
        'order_fulfillment',
        'order_cancellation',
        'correction',
        'other',
      ],
      default: 'manual',
    },
    note: {
      type: String,
      trim: true,
    },
    costPerUnit: {
      type: Number,
      min: 0,
    },
    costImpact: {
      type: Number,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performedByName: {
      type: String,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['manual', 'order', 'return', 'purchase_order', 'system', 'other'],
      default: 'manual',
    },
    sourceRef: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

inventoryAdjustmentSchema.index({ variant: 1, createdAt: -1 });
inventoryAdjustmentSchema.index({ sku: 1, createdAt: -1 });
inventoryAdjustmentSchema.index({ reason: 1 });
inventoryAdjustmentSchema.index({ sourceType: 1 });
inventoryAdjustmentSchema.index({ createdAt: -1 });

const InventoryAdjustment = mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);

export default InventoryAdjustment;
