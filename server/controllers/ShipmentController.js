import asyncHandler from 'express-async-handler';
import Order from '../models/OrderModel.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';
import { upsertFinancialRecordForOrder } from './FinancialController.js';
import logger from '../config/logger.js';

const MIN_DELIVERY_MINUTES = Number(process.env.SHIPMENT_MIN_MINUTES || 10);
const MAX_DELIVERY_MINUTES = Number(process.env.SHIPMENT_MAX_MINUTES || 10);
const shipmentTimers = new Map();

const getRandomMinutes = () =>
  Math.floor(Math.random() * (MAX_DELIVERY_MINUTES - MIN_DELIVERY_MINUTES + 1)) + MIN_DELIVERY_MINUTES;

const scheduleAutoDelivery = (req, orderId, minutes) => {
  if (shipmentTimers.has(String(orderId))) {
    clearTimeout(shipmentTimers.get(String(orderId)));
  }

  const timeout = setTimeout(async () => {
    try {
      const order = await Order.findById(orderId);
      if (!order || order.status !== 'shipped') {
        return;
      }
      await order.markAsDelivered();
      await upsertFinancialRecordForOrder({ orderId: order._id, status: 'confirmed' });
      emitRealtimeEvent(req, 'order:status-updated', {
        orderId: order._id,
        status: 'delivered',
        deliveredAt: order.deliveredAt,
        actualDeliveryTime: order.actualDeliveryTime,
      });
    } catch (error) {
      logger.error('Auto-delivery failed', { orderId, error: error.message });
    } finally {
      shipmentTimers.delete(String(orderId));
    }
  }, minutes * 60 * 1000);

  shipmentTimers.set(String(orderId), timeout);
};

export const startShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trackingNumber } = req.body;
  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.status !== 'paid') {
    return res.status(400).json({ success: false, message: 'Order must be paid before shipping' });
  }

  const randomMinutes = getRandomMinutes();
  const estimatedDelivery = new Date(Date.now() + randomMinutes * 60 * 1000);

  await order.markAsShipped({ trackingNumber, estimatedDelivery });

  scheduleAutoDelivery(req, order._id, randomMinutes);

  emitRealtimeEvent(req, 'order:status-updated', {
    orderId: order._id,
    status: 'shipped',
    shippedAt: order.shippedAt,
    estimatedDelivery: order.estimatedDelivery,
    trackingNumber: order.trackingNumber,
  });

  const hydrated = await Order.findById(order._id).lean();
  return res.status(200).json({ success: true, data: hydrated });
});

export const markDelivered = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.status !== 'shipped') {
    return res.status(400).json({ success: false, message: 'Order is not in shipped status' });
  }

  if (shipmentTimers.has(String(order._id))) {
    clearTimeout(shipmentTimers.get(String(order._id)));
    shipmentTimers.delete(String(order._id));
  }

  await order.markAsDelivered();
  await upsertFinancialRecordForOrder({ orderId: order._id, status: 'confirmed' });

  emitRealtimeEvent(req, 'order:status-updated', {
    orderId: order._id,
    status: 'delivered',
    deliveredAt: order.deliveredAt,
    actualDeliveryTime: order.actualDeliveryTime,
  });

  const hydrated = await Order.findById(order._id).lean();
  return res.status(200).json({ success: true, data: hydrated });
});

export const simulateDelivery = asyncHandler(async (req, res) => {
  // Alias to force delivery
  return markDelivered(req, res);
});

export const getShipmentsList = asyncHandler(async (req, res) => {
  const { status = 'shipped', startDate, endDate } = req.query;
  const query = { status: { $in: ['shipped', 'delivered'] } };

  if (status !== 'all') {
    query.status = status;
  }

  if (startDate || endDate) {
    query.shippedAt = {};
    if (startDate) query.shippedAt.$gte = new Date(startDate);
    if (endDate) query.shippedAt.$lte = new Date(endDate);
  }

  const shipments = await Order.find(query)
    .select('user orderItems shippingAddress status shippedAt estimatedDelivery deliveredAt trackingNumber')
    .populate('user', 'firstName lastName username email phone')
    .lean();

  return res.status(200).json({ success: true, data: shipments });
});

export const cancelShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (shipmentTimers.has(String(order._id))) {
    clearTimeout(shipmentTimers.get(String(order._id)));
    shipmentTimers.delete(String(order._id));
  }

  await order.cancelOrder();

  emitRealtimeEvent(req, 'order:status-updated', {
    orderId: order._id,
    status: 'cancelled',
    cancelledAt: order.cancelledAt,
  });

  return res.status(200).json({ success: true, message: 'Shipment cancelled and inventory restored' });
});
