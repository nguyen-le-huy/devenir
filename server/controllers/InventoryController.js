import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import ProductVariant from '../models/ProductVariantModel.js';
import InventoryAdjustment from '../models/InventoryAdjustmentModel.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';

const buildObjectId = (value) => {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const buildActorName = (user) => {
  if (!user) return undefined;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || user.email;
};

const HEALTH_STATES = {
  OUT: 'out-of-stock',
  LOW: 'low-stock',
  HEALTHY: 'healthy',
  OVER: 'overstock',
};

const addHealthProjectionStage = () => ({
  $addFields: {
    lowThresholdSafe: { $ifNull: ['$lowStockThreshold', 10] },
    reorderPointSafe: { $ifNull: ['$reorderPoint', 0] },
    reservedSafe: { $ifNull: ['$reserved', 0] },
    available: {
      $max: [
        {
          $subtract: [
            { $ifNull: ['$quantity', 0] },
            { $ifNull: ['$reserved', 0] },
          ],
        },
        0,
      ],
    },
    inventoryValue: {
      $multiply: [
        { $ifNull: ['$price', 0] },
        { $ifNull: ['$quantity', 0] },
      ],
    },
    healthStatus: {
      $switch: {
        branches: [
          {
            case: { $eq: [{ $ifNull: ['$quantity', 0] }, 0] },
            then: HEALTH_STATES.OUT,
          },
          {
            case: {
              $and: [
                { $gt: [{ $ifNull: ['$quantity', 0] }, 0] },
                { $lte: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$lowStockThreshold', 10] }] },
              ],
            },
            then: HEALTH_STATES.LOW,
          },
          {
            case: {
              $and: [
                { $gt: [{ $ifNull: ['$reorderPoint', 0] }, 0] },
                {
                  $gte: [
                    { $ifNull: ['$quantity', 0] },
                    {
                      $multiply: [
                        { $ifNull: ['$reorderPoint', 0] },
                        2,
                      ],
                    },
                  ],
                },
              ],
            },
            then: HEALTH_STATES.OVER,
          },
        ],
        default: HEALTH_STATES.HEALTHY,
      },
    },
  },
});

const baseInventoryPipeline = ({ search, category, brand, productStatus }) => {
  const pipeline = [
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'products',
        localField: 'product_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
  ];

  if (productStatus) {
    pipeline.push({ $match: { 'product.status': productStatus } });
  }

  const categoryId = buildObjectId(category);
  if (categoryId) {
    pipeline.push({ $match: { 'product.category': categoryId } });
  }

  const brandId = buildObjectId(brand);
  if (brandId) {
    pipeline.push({ $match: { 'product.brand': brandId } });
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    pipeline.push({
      $match: {
        $or: [
          { sku: regex },
          { color: regex },
          { size: regex },
          { 'product.name': regex },
        ],
      },
    });
  }

  pipeline.push(addHealthProjectionStage());

  return pipeline;
};

export const getInventoryOverview = asyncHandler(async (req, res) => {
  const overviewPipeline = [
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalSkus: { $sum: 1 },
        totalUnits: { $sum: { $ifNull: ['$quantity', 0] } },
        reservedUnits: { $sum: { $ifNull: ['$reserved', 0] } },
        incomingUnits: { $sum: { $ifNull: ['$incoming', 0] } },
        totalValue: {
          $sum: {
            $multiply: [
              { $ifNull: ['$price', 0] },
              { $ifNull: ['$quantity', 0] },
            ],
          },
        },
        lowStockCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: [{ $ifNull: ['$quantity', 0] }, 0] },
                  { $lte: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$lowStockThreshold', 10] }] },
                ],
              },
              1,
              0,
            ],
          },
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $eq: [{ $ifNull: ['$quantity', 0] }, 0] }, 1, 0],
          },
        },
      },
    },
  ];

  const [overview = {}] = await ProductVariant.aggregate(overviewPipeline);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [outboundStats] = await InventoryAdjustment.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        delta: { $lt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totalOutbound: { $sum: { $abs: '$delta' } },
      },
    },
  ]);

  const avgDailyOutbound = outboundStats ? outboundStats.totalOutbound / 30 : 0;
  const turnoverRate = overview.totalUnits && avgDailyOutbound
    ? Number(((avgDailyOutbound * 365) / overview.totalUnits).toFixed(2))
    : 0;
  const daysOfSupply = avgDailyOutbound
    ? Number((overview.totalUnits / avgDailyOutbound).toFixed(2))
    : null;

  const recentAdjustments = await InventoryAdjustment.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('sku delta reason quantityAfter performedByName note createdAt');

  res.status(200).json({
    success: true,
    data: {
      totalSkus: overview.totalSkus || 0,
      totalUnits: overview.totalUnits || 0,
      reservedUnits: overview.reservedUnits || 0,
      incomingUnits: overview.incomingUnits || 0,
      totalValue: overview.totalValue || 0,
      lowStockCount: overview.lowStockCount || 0,
      outOfStockCount: overview.outOfStockCount || 0,
      turnoverRate,
      daysOfSupply,
      recentAdjustments,
    },
  });
});

export const getInventoryList = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    brand,
    productStatus,
    stockStatus,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
  const skip = (pageNum - 1) * limitNum;

  const basePipeline = baseInventoryPipeline({ search, category, brand, productStatus });

  const statusMatchStage = stockStatus && stockStatus !== 'all'
    ? [{ $match: { healthStatus: stockStatus } }]
    : [];

  const sortFieldMap = {
    sku: 'sku',
    product: 'product.name',
    quantity: 'quantity',
    available: 'available',
    value: 'inventoryValue',
    updatedAt: 'updatedAt',
  };
  const sortField = sortFieldMap[sortBy] || 'updatedAt';
  const direction = sortOrder === 'asc' ? 1 : -1;

  const dataPipeline = [
    ...basePipeline,
    ...statusMatchStage,
    { $sort: { [sortField]: direction } },
    { $skip: skip },
    { $limit: limitNum },
    {
      $project: {
        _id: 1,
        sku: 1,
        color: 1,
        size: 1,
        price: 1,
        quantity: 1,
        reserved: '$reservedSafe',
        incoming: '$incoming',
        available: 1,
        inventoryValue: 1,
        lowStockThreshold: '$lowThresholdSafe',
        binLocation: 1,
        reorderPoint: '$reorderPointSafe',
        healthStatus: 1,
        updatedAt: 1,
        product: {
          _id: '$product._id',
          name: '$product.name',
          category: '$product.category',
          brand: '$product.brand',
        },
      },
    },
  ];

  const countPipeline = [
    ...basePipeline,
    ...statusMatchStage,
    { $count: 'total' },
  ];

  const aggregatePipeline = [
    ...basePipeline,
    ...statusMatchStage,
    {
      $group: {
        _id: null,
        totalUnits: { $sum: { $ifNull: ['$quantity', 0] } },
        totalValue: { $sum: '$inventoryValue' },
        lowStock: {
          $sum: { $cond: [{ $eq: ['$healthStatus', HEALTH_STATES.LOW] }, 1, 0] },
        },
        outOfStock: {
          $sum: { $cond: [{ $eq: ['$healthStatus', HEALTH_STATES.OUT] }, 1, 0] },
        },
      },
    },
  ];

  const [items, totalResult, aggregateResult] = await Promise.all([
    ProductVariant.aggregate(dataPipeline),
    ProductVariant.aggregate(countPipeline),
    ProductVariant.aggregate(aggregatePipeline),
  ]);

  const total = totalResult[0]?.total || 0;
  const aggregates = aggregateResult[0] || {};

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 0,
    },
    summary: {
      totalUnits: aggregates.totalUnits || 0,
      totalValue: aggregates.totalValue || 0,
      lowStock: aggregates.lowStock || 0,
      outOfStock: aggregates.outOfStock || 0,
    },
  });
});

const buildAlertPayload = async (matchStage, limit = 10, sort) => {
  const pipeline = [
    { $match: { isActive: true } },
    addHealthProjectionStage(),
    matchStage,
    {
      $lookup: {
        from: 'products',
        localField: 'product_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    sort ? { $sort: sort } : { $sort: { updatedAt: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        sku: 1,
        quantity: 1,
        reserved: '$reservedSafe',
        available: 1,
        incoming: '$incoming',
        lowStockThreshold: '$lowThresholdSafe',
        binLocation: 1,
        product: {
          _id: '$product._id',
          name: '$product.name',
          category: '$product.category',
          brand: '$product.brand',
        },
      },
    },
  ];

  return ProductVariant.aggregate(pipeline);
};

export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const [lowStock, outOfStock, overstock, reservationIssues] = await Promise.all([
    buildAlertPayload({ $match: { healthStatus: HEALTH_STATES.LOW } }, 15, { quantity: 1 }),
    buildAlertPayload({ $match: { healthStatus: HEALTH_STATES.OUT } }, 15, { updatedAt: -1 }),
    buildAlertPayload({ $match: { healthStatus: HEALTH_STATES.OVER } }, 10, { quantity: -1 }),
    buildAlertPayload({
      $match: {
        $expr: {
          $gt: [{ $ifNull: ['$reserved', 0] }, { $ifNull: ['$quantity', 0] }],
        },
      },
    }, 10, { reserved: -1 }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      lowStock,
      outOfStock,
      overstock,
      reservationIssues,
    },
  });
});

export const createInventoryAdjustment = asyncHandler(async (req, res) => {
  const {
    variantId,
    operation,
    quantity,
    reason = 'manual',
    note,
    costPerUnit,
    sourceType = 'manual',
    sourceRef,
    metadata,
  } = req.body;

  if (!variantId || !operation) {
    return res.status(400).json({ success: false, message: 'variantId and operation are required' });
  }

  const allowedOperations = ['set', 'add', 'subtract'];
  if (!allowedOperations.includes(operation)) {
    return res.status(400).json({ success: false, message: 'Unsupported operation' });
  }

  if (quantity === undefined || quantity === null || Number.isNaN(Number(quantity))) {
    return res.status(400).json({ success: false, message: 'quantity is required and must be a number' });
  }

  if (operation !== 'set' && Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const variant = await ProductVariant.findById(variantId).session(session);
    if (!variant) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    const numericQty = Number(quantity);
    const beforeQty = variant.quantity ?? 0;
    let nextQty = beforeQty;

    if (operation === 'set') {
      if (numericQty < 0) {
        throw new Error('Resulting quantity cannot be negative');
      }
      nextQty = numericQty;
    } else if (operation === 'add') {
      nextQty = beforeQty + numericQty;
    } else {
      nextQty = beforeQty - numericQty;
    }

    if (nextQty < 0) {
      throw new Error('Resulting quantity cannot be negative');
    }

    variant.quantity = nextQty;
    await variant.save({ session });

    const delta = nextQty - beforeQty;
    const costImpact = costPerUnit ? Number(costPerUnit) * delta : undefined;

    const [adjustment] = await InventoryAdjustment.create([
      {
        variant: variant._id,
        product: variant.product_id,
        sku: variant.sku,
        delta,
        quantityBefore: beforeQty,
        quantityAfter: nextQty,
        reason,
        note,
        costPerUnit,
        costImpact,
        performedBy: req.user?._id,
        performedByName: buildActorName(req.user),
        sourceType,
        sourceRef,
        metadata,
      },
    ], { session });

    await session.commitTransaction();

    const variantWithProduct = await ProductVariant.findById(variant._id)
      .populate('product_id', 'name category brand')
      .lean();

    emitRealtimeEvent(req, 'inventory:adjusted', {
      variantId: variant._id,
      sku: variant.sku,
      delta,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: {
        variant: variantWithProduct,
        adjustment,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getInventoryAdjustments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    reason,
    sourceType,
    variantId,
    sku,
    dateFrom,
    dateTo,
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
    filter.variant = variantId;
  }
  if (sku) {
    filter.sku = sku.toUpperCase();
  }
  if (reason) {
    filter.reason = reason;
  }
  if (sourceType) {
    filter.sourceType = sourceType;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { note: regex },
      { performedByName: regex },
      { sourceRef: regex },
      { sku: regex },
    ];
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      filter.createdAt.$lte = new Date(dateTo);
    }
  }

  const [adjustments, total] = await Promise.all([
    InventoryAdjustment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('product', 'name')
      .lean(),
    InventoryAdjustment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: adjustments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 0,
    },
  });
});

export const getInventoryVariantDetail = asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    return res.status(400).json({ success: false, message: 'Invalid variant id' });
  }

  const variant = await ProductVariant.findById(variantId)
    .populate('product_id', 'name category brand')
    .lean();

  if (!variant) {
    return res.status(404).json({ success: false, message: 'Variant not found' });
  }

  const adjustments = await InventoryAdjustment.find({ variant: variantId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      variant,
      adjustments,
    },
  });
});
