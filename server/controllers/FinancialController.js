import asyncHandler from 'express-async-handler';
import FinancialRecord from '../models/FinancialRecordModel.js';
import Order from '../models/OrderModel.js';
import ProductVariant from '../models/ProductVariantModel.js';
import logger from '../config/logger.js';

// Platform fee disabled as requested
const PLATFORM_FEE_RATE = 0;

// Simple in-memory cache for dashboard metrics to avoid heavy aggregation on every hit
const metricsCache = {
  value: null,
  expiresAt: 0,
};
const METRICS_TTL_MS = 60 * 1000; // 60s cache window

const computeOrderFinancials = async (order) => {
  if (!order) {
    throw new Error('Order not found');
  }

  const variantIds = order.orderItems
    .map((item) => item.productVariant)
    .filter(Boolean);

  const variants = variantIds.length
    ? await ProductVariant.find({ _id: { $in: variantIds } })
        .select('_id costPrice sku')
        .lean()
    : [];

  const variantMap = new Map(variants.map((v) => [String(v._id), v]));

  let costOfGoodsSold = 0;
  for (const item of order.orderItems) {
    const variant = item.productVariant ? variantMap.get(String(item.productVariant)) : null;
    const costPrice = variant?.costPrice ?? 0;
    costOfGoodsSold += (item.quantity || 0) * costPrice;
  }

  const revenue = order.totalPrice || 0;
  const shippingCost = order.shippingPrice || 0;
  const platformFee = 0;
  const netProfit = Number((revenue - costOfGoodsSold - platformFee - shippingCost).toFixed(2));

  return {
    revenue,
    costOfGoodsSold,
    platformFee,
    shippingCost,
    netProfit,
  };
};

export const calculateOrderProfit = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).lean();

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const financials = await computeOrderFinancials(order);

  const record = await FinancialRecord.findOneAndUpdate(
    { orderId: order._id, type: 'order' },
    {
      ...financials,
      orderId: order._id,
      type: 'order',
      status: 'confirmed',
      date: new Date(),
    },
    { new: true, upsert: true }
  );

  return res.status(200).json({ success: true, data: record });
});

export const getRevenueStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const match = { type: 'order', status: 'confirmed' };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const [agg] = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$revenue' },
        costs: { $sum: '$costOfGoodsSold' },
        shipping: { $sum: '$shippingCost' },
        platformFee: { $sum: '$platformFee' },
        netProfit: { $sum: '$netProfit' },
        orders: { $sum: 1 },
      },
    },
  ]);

  return res.status(200).json({ success: true, data: agg || {
    revenue: 0,
    costs: 0,
    shipping: 0,
    platformFee: 0,
    netProfit: 0,
    orders: 0,
  } });
});

const buildWindow = (start) => ({ start, end: new Date() });

const aggregateWindow = async ({ start, end }) => {
  const [agg] = await FinancialRecord.aggregate([
    {
      $match: {
        type: 'order',
        status: 'confirmed',
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$revenue' },
        costs: { $sum: '$costOfGoodsSold' },
        netProfit: { $sum: '$netProfit' },
        orders: { $sum: 1 },
      },
    },
  ]);

  return agg || { revenue: 0, costs: 0, netProfit: 0, orders: 0 };
};

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const nowTs = Date.now();
  if (metricsCache.value && metricsCache.expiresAt > nowTs) {
    return res.status(200).json({ success: true, data: metricsCache.value, cached: true });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [today, thisMonth, thisYear, revenueByDay] = await Promise.all([
    aggregateWindow(buildWindow(startOfToday)),
    aggregateWindow(buildWindow(startOfMonth)),
    aggregateWindow(buildWindow(startOfYear)),
    FinancialRecord.aggregate([
      {
        $match: {
          type: 'order',
          status: 'confirmed',
          date: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            y: { $year: '$date' },
            m: { $month: '$date' },
            d: { $dayOfMonth: '$date' },
          },
          revenue: { $sum: '$revenue' },
          costs: { $sum: '$costOfGoodsSold' },
          netProfit: { $sum: '$netProfit' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]),
  ]);

  const payload = {
    today,
    thisMonth,
    thisYear,
    revenueByDay,
  };

  metricsCache.value = payload;
  metricsCache.expiresAt = Date.now() + METRICS_TTL_MS;

  return res.status(200).json({ success: true, data: payload, cached: false });
});

export const upsertFinancialRecordForOrder = async ({ orderId, status = 'confirmed' }) => {
  try {
    const order = await Order.findById(orderId).lean();
    if (!order) return null;
    const financials = await computeOrderFinancials(order);
    const record = await FinancialRecord.findOneAndUpdate(
      { orderId: order._id, type: 'order' },
      {
        ...financials,
        orderId: order._id,
        type: 'order',
        status,
        date: new Date(),
      },
      { new: true, upsert: true }
    );
    return record;
  } catch (error) {
    logger.error('Failed to upsert financial record for order', { orderId, error: error.message });
    return null;
  }
};
