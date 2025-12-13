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

/**
 * Export Inventory Report
 * Generates CSV or Excel file with inventory data
 */
export const exportInventoryReport = asyncHandler(async (req, res) => {
  const {
    fileType = 'csv',
    columns = ['sku', 'productName', 'attributes', 'inventory', 'available', 'unitPrice', 'totalValue', 'status'],
    filters = {},
    sorting = { field: 'updatedAt', order: 'desc' },
    reportType = 'all',
  } = req.body;

  // Validate file type
  if (!['csv', 'excel'].includes(fileType)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILTERS', message: 'Invalid file type. Must be csv or excel' },
    });
  }

  // Build base pipeline
  const { statusFilters = {}, attributeFilters = {}, valueFilters = {}, quantityFilters = {}, dateFilters = {} } = filters;

  const basePipeline = [
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
    addHealthProjectionStage(),
  ];

  // Apply status filters
  if (statusFilters.stockStatus?.length) {
    const statusMap = {
      in_stock: HEALTH_STATES.HEALTHY,
      low_stock: HEALTH_STATES.LOW,
      out_of_stock: HEALTH_STATES.OUT,
    };
    const mappedStatuses = statusFilters.stockStatus.map((s) => statusMap[s] || s);
    basePipeline.push({ $match: { healthStatus: { $in: mappedStatuses } } });
  }

  if (statusFilters.businessStatus?.length) {
    basePipeline.push({ $match: { 'product.status': { $in: statusFilters.businessStatus } } });
  }

  if (statusFilters.hasWarning) {
    basePipeline.push({
      $match: {
        $expr: { $lte: ['$quantity', '$lowThresholdSafe'] },
      },
    });
  }

  // Apply attribute filters
  if (attributeFilters.sizes?.length) {
    basePipeline.push({ $match: { size: { $in: attributeFilters.sizes } } });
  }

  if (attributeFilters.colors?.length) {
    basePipeline.push({ $match: { color: { $in: attributeFilters.colors } } });
  }

  // Apply value filters
  if (valueFilters.unitPriceRange) {
    const priceMatch = {};
    if (valueFilters.unitPriceRange.min !== undefined) {
      priceMatch.$gte = valueFilters.unitPriceRange.min;
    }
    if (valueFilters.unitPriceRange.max !== undefined) {
      priceMatch.$lte = valueFilters.unitPriceRange.max;
    }
    if (Object.keys(priceMatch).length) {
      basePipeline.push({ $match: { price: priceMatch } });
    }
  }

  if (valueFilters.totalValueRange) {
    const valueMatch = {};
    if (valueFilters.totalValueRange.min !== undefined) {
      valueMatch.$gte = valueFilters.totalValueRange.min;
    }
    if (valueFilters.totalValueRange.max !== undefined) {
      valueMatch.$lte = valueFilters.totalValueRange.max;
    }
    if (Object.keys(valueMatch).length) {
      basePipeline.push({ $match: { inventoryValue: valueMatch } });
    }
  }

  // Apply quantity filters
  if (quantityFilters.inventoryRange) {
    const qtyMatch = {};
    if (quantityFilters.inventoryRange.min !== undefined) {
      qtyMatch.$gte = quantityFilters.inventoryRange.min;
    }
    if (quantityFilters.inventoryRange.max !== undefined) {
      qtyMatch.$lte = quantityFilters.inventoryRange.max;
    }
    if (Object.keys(qtyMatch).length) {
      basePipeline.push({ $match: { quantity: qtyMatch } });
    }
  }

  if (quantityFilters.hasOnHold) {
    basePipeline.push({ $match: { reserved: { $gt: 0 } } });
  }

  if (quantityFilters.hasIncoming) {
    basePipeline.push({ $match: { incoming: { $gt: 0 } } });
  }

  if (quantityFilters.availableOnly) {
    basePipeline.push({ $match: { available: { $gt: 0 } } });
  }

  // Apply date filters
  if (dateFilters.lastUpdated) {
    const dateMatch = {};
    if (dateFilters.lastUpdated.from) {
      dateMatch.$gte = new Date(dateFilters.lastUpdated.from);
    }
    if (dateFilters.lastUpdated.to) {
      dateMatch.$lte = new Date(dateFilters.lastUpdated.to);
    }
    if (Object.keys(dateMatch).length) {
      basePipeline.push({ $match: { updatedAt: dateMatch } });
    }
  }

  if (dateFilters.newItemsDays) {
    const daysAgo = new Date(Date.now() - dateFilters.newItemsDays * 24 * 60 * 60 * 1000);
    basePipeline.push({ $match: { createdAt: { $gte: daysAgo } } });
  }

  // Apply special report filters
  if (reportType === 'needs_restock') {
    basePipeline.push({
      $match: {
        $expr: { $lt: ['$quantity', '$lowThresholdSafe'] },
      },
    });
    basePipeline.push({
      $addFields: {
        restockDeficit: { $subtract: ['$lowThresholdSafe', '$quantity'] },
      },
    });
    basePipeline.push({ $sort: { restockDeficit: -1 } });
  } else if (reportType === 'top_value') {
    basePipeline.push({ $sort: { inventoryValue: -1 } });
    basePipeline.push({ $limit: 100 });
  } else if (reportType === 'slow_moving') {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    basePipeline.push({ $match: { updatedAt: { $lt: ninetyDaysAgo } } });
  } else {
    // Apply manual sorting for 'all' and 'custom'
    const sortFieldMap = {
      inventory: 'quantity',
      available: 'available',
      totalValue: 'inventoryValue',
      unitPrice: 'price',
      lastUpdated: 'updatedAt',
    };
    const sortField = sortFieldMap[sorting.field] || 'updatedAt';
    const direction = sorting.order === 'asc' ? 1 : -1;
    basePipeline.push({ $sort: { [sortField]: direction } });
  }

  // Limit to 10,000 rows max
  basePipeline.push({ $limit: 10000 });

  // Project final fields
  basePipeline.push({
    $project: {
      _id: 1,
      sku: 1,
      productName: '$product.name',
      color: 1,
      size: 1,
      quantity: 1,
      reserved: { $ifNull: ['$reserved', 0] },
      incoming: { $ifNull: ['$incoming', 0] },
      available: 1,
      price: 1,
      inventoryValue: 1,
      lowStockThreshold: '$lowThresholdSafe',
      healthStatus: 1,
      updatedAt: 1,
    },
  });

  const items = await ProductVariant.aggregate(basePipeline);

  if (!items.length) {
    return res.status(200).json({
      success: false,
      error: { code: 'NO_DATA', message: 'No data matches the specified filters' },
    });
  }

  // Format data for export
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  const formatStatus = (status) => {
    const statusMap = {
      'healthy': 'Đủ Hàng',
      'low-stock': 'Cảnh Báo',
      'out-of-stock': 'Hết Hàng',
      'overstock': 'Tồn Kho Cao',
    };
    return statusMap[status] || status;
  };

  const columnMapping = {
    sku: { header: 'SKU', getValue: (item) => item.sku },
    productName: { header: 'Tên Sản Phẩm', getValue: (item) => item.productName },
    attributes: { header: 'Thuộc Tính', getValue: (item) => `${item.color || ''} - ${item.size || ''}`.trim() },
    inventory: { header: 'Tồn Kho', getValue: (item) => item.quantity || 0 },
    available: { header: 'Khả Dụng', getValue: (item) => item.available || 0 },
    onHold: { header: 'Đang Giữ', getValue: (item) => item.reserved || 0 },
    incoming: { header: 'Đang Nhập', getValue: (item) => item.incoming || 0 },
    unitPrice: { header: 'Giá Đơn Vị (US$)', getValue: (item) => (item.price || 0).toFixed(2) },
    totalValue: { header: 'Tổng Giá Trị (US$)', getValue: (item) => (item.inventoryValue || 0).toFixed(2) },
    status: { header: 'Trạng Thái', getValue: (item) => formatStatus(item.healthStatus) },
    warningLevel: { header: 'Mức Cảnh Báo', getValue: (item) => item.lowStockThreshold || 0 },
    lastUpdated: { header: 'Cập Nhật Cuối', getValue: (item) => formatDate(item.updatedAt) },
  };

  const selectedColumns = columns.filter((col) => columnMapping[col]);
  const headers = selectedColumns.map((col) => columnMapping[col].header);

  const rows = items.map((item) =>
    selectedColumns.map((col) => {
      const value = columnMapping[col].getValue(item);
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  // Calculate summary
  const totalValue = items.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);
  const totalItems = items.length;

  // Report type mapping for title and filename
  const reportTypeInfo = {
    all: {
      title: 'BÁO CÁO TỒN KHO - TẤT CẢ SẢN PHẨM',
      titleEn: 'INVENTORY REPORT - ALL PRODUCTS',
      filePrefix: 'tat_ca_san_pham',
    },
    top_value: {
      title: 'BÁO CÁO TỒN KHO - TOP SẢN PHẨM GIÁ TRỊ CAO',
      titleEn: 'INVENTORY REPORT - TOP VALUE PRODUCTS',
      filePrefix: 'top_gia_tri_cao',
    },
    needs_restock: {
      title: 'BÁO CÁO TỒN KHO - SẢN PHẨM CẦN NHẬP THÊM',
      titleEn: 'INVENTORY REPORT - PRODUCTS NEED RESTOCK',
      filePrefix: 'can_nhap_them',
    },
    slow_moving: {
      title: 'BÁO CÁO TỒN KHO - HÀNG TỒN LÂU (>90 NGÀY)',
      titleEn: 'INVENTORY REPORT - SLOW MOVING PRODUCTS (>90 DAYS)',
      filePrefix: 'hang_ton_lau',
    },
    custom: {
      title: 'BÁO CÁO TỒN KHO - LỌC TÙY CHỈNH',
      titleEn: 'INVENTORY REPORT - CUSTOM FILTER',
      filePrefix: 'loc_tuy_chinh',
    },
  };

  const reportInfo = reportTypeInfo[reportType] || reportTypeInfo.all;

  // Generate formatted datetime for header
  const now = new Date();
  const exportDateTime = formatDate(now);
  const dateForFile = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeForFile = now.toTimeString().slice(0, 5).replace(':', '');

  // Generate descriptive filename
  const filename = `baocao_kho_${reportInfo.filePrefix}_${dateForFile}_${timeForFile}.csv`;

  // Build CSV content with title header
  let csvContent = '';

  // Add title rows
  csvContent += `"${reportInfo.title}"\n`;
  csvContent += `"Ngày xuất: ${exportDateTime}"\n`;
  csvContent += `"Tổng số SKU: ${totalItems} | Tổng giá trị: $${totalValue.toFixed(2)}"\n`;
  csvContent += '\n'; // Empty row before data

  // Add data headers and rows
  csvContent += headers.join(',') + '\n';
  csvContent += rows.map((row) => row.join(',')).join('\n');

  // Add summary row for Excel-style reports
  if (fileType === 'excel') {
    csvContent += '\n\n';
    csvContent += `"TỔNG CỘNG","${totalItems} SKU","","","","","","$${totalValue.toFixed(2)}"`;
  }

  // Set response headers for file download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  res.status(200).send('\uFEFF' + csvContent); // Add BOM for Excel UTF-8 compatibility
});

