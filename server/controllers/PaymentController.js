import asyncHandler from 'express-async-handler';
import paymentService from '../services/payment.service.js';
import Order from '../models/OrderModel.js'; // Needed due to simple getter logic not moved yet

const getClientBaseUrl = (req) => {
  const origin = req.get('origin');
  if (origin && origin.startsWith('http')) return origin;
  return process.env.CLIENT_URL || 'http://localhost:5173';
};

/**
 * PayOS Controllers
 */
export const createPayOSPaymentLink = asyncHandler(async (req, res) => {
  try {
    const clientBaseUrl = getClientBaseUrl(req);
    const result = await paymentService.createPayOSSession({
      user: req.user,
      userId: req.userId,
      ...req.body,
      clientBaseUrl
    });
    res.status(201).json({ success: true, message: 'PayOS link created', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export const handlePayOSWebhook = asyncHandler(async (req, res) => {
  const result = await paymentService.handlePayOSWebhook(req.body);
  if (result.order) {
    req.app.get('io')?.to('orders').emit('order:updated', result.order);
  }
  // PayOS requires 200 OK
  res.status(200).json({ success: true, message: result.message });
});

export const getPayOSOrderStatus = asyncHandler(async (req, res) => {
  const orderCode = Number(req.params.orderCode);
  const order = await Order.findOne({ 'paymentIntent.gatewayOrderCode': orderCode, user: req.userId });

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  res.status(200).json({
    success: true,
    data: {
      status: order.status,
      paymentStatus: order.paymentIntent?.status,
      orderCode: order.paymentIntent?.gatewayOrderCode,
      totalPrice: order.totalPrice,
      shippingPrice: order.shippingPrice,
      paymentMethod: order.paymentMethod,
      deliveryMethod: order.deliveryMethod,
      deliveryWindow: order.deliveryWindow,
      paymentResult: order.paymentResult,
      confirmationEmailSentAt: order.confirmationEmailSentAt,
    }
  });
});

/**
 * NowPayments Controllers
 */
export const createNowPaymentsInvoice = asyncHandler(async (req, res) => {
  try {
    const clientBaseUrl = getClientBaseUrl(req);
    const serverBaseUrl = process.env.SERVER_URL || 'http://localhost:3111';

    const result = await paymentService.createNowPaymentsSession({
      user: req.user,
      userId: req.userId,
      ...req.body,
      clientBaseUrl,
      serverBaseUrl
    });
    res.status(201).json({ success: true, message: 'Invoice created', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export const handleNowPaymentsWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-nowpayments-sig'];
  const result = await paymentService.handleNowPaymentsWebhook(req.body, signature);

  if (result.order) {
    req.app.get('io')?.to('orders').emit('order:updated', result.order);
  }
  res.status(200).json({ success: true, message: result.message });
});

export const getNowPaymentsStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, user: req.userId });

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  res.status(200).json({
    success: true,
    data: {
      status: order.status,
      paymentStatus: order.paymentIntent?.status,
      orderId: order._id,
      orderCode: order.paymentIntent?.gatewayOrderCode,
      totalPrice: order.totalPrice,
      shippingPrice: order.shippingPrice,
      paymentMethod: order.paymentMethod,
      paymentGateway: order.paymentGateway,
      deliveryMethod: order.deliveryMethod,
      deliveryWindow: order.deliveryWindow,
      paymentResult: order.paymentResult,
      confirmationEmailSentAt: order.confirmationEmailSentAt,
    },
  });
});
