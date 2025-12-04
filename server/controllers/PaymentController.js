import asyncHandler from 'express-async-handler';
import payosClient from '../services/payos/payosClient.js';
import Cart from '../models/CartModel.js';
import Order from '../models/OrderModel.js';
import logger from '../config/logger.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

const DELIVERY_OPTIONS = ['standard', 'next', 'nominated'];
const SHIPPING_METHODS = ['home'];
const SHIPPING_FEES = {
  standard: 0,
  next: 5,
  nominated: 10,
};

const PAYOS_DESCRIPTION_LIMIT = 25;
const buildPayOSDescription = (orderCode) => {
  const base = `DN-${orderCode}`;
  return base.length > PAYOS_DESCRIPTION_LIMIT
    ? base.slice(0, PAYOS_DESCRIPTION_LIMIT)
    : base;
};

const DELIVERY_LABELS = {
  standard: 'Standard delivery',
  next: 'Next day delivery',
  nominated: 'Nominated day delivery',
};

const REQUIRED_ADDRESS_FIELDS = ['firstName', 'lastName', 'phoneNumber', 'address', 'city', 'district', 'zipCode'];

const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const getShippingFee = (deliveryWindow) => SHIPPING_FEES[deliveryWindow] ?? 0;

const ensureAddressPayload = (address = {}) => {
  const missing = REQUIRED_ADDRESS_FIELDS.filter((field) => !address[field] || !String(address[field]).trim());
  if (missing.length) {
    throw new Error(`Missing shipping address fields: ${missing.join(', ')}`);
  }
  return address;
};

const buildOrderItems = (cartItems = []) => {
  return cartItems.map((item) => {
    const variant = item.productVariant;
    if (!variant) {
      throw new Error('A variant in your cart is no longer available. Please refresh your cart.');
    }

    const product = variant.product_id;
    const fallbackImage = Array.isArray(variant.images) && variant.images.length > 0
      ? variant.images[0]
      : variant.mainImage || variant.hoverImage || (product?.images?.[0]?.url ?? '');

    return {
      name: product?.name || 'Devenir item',
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      quantity: item.quantity,
      price: variant.price,
      image: fallbackImage,
      mainImage: variant.mainImage || fallbackImage,
      hoverImage: variant.hoverImage || fallbackImage,
      productVariant: variant._id,
      product: product?._id,
    };
  });
};

const generateGatewayOrderCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    const timestampPart = Date.now().toString().slice(-10);
    const randomPart = Math.floor(100 + Math.random() * 900).toString();
    code = Number(`${timestampPart}${randomPart}`);
    exists = await Order.exists({ 'paymentIntent.gatewayOrderCode': code });
  }

  return code;
};

export const createPayOSPaymentLink = asyncHandler(async (req, res) => {
  const user = req.user;
  const userId = req.userId;
  const { shippingMethod, deliveryTime, address: addressPayload, giftCode } = req.body;

  // Check for valid gift code - fixed price 5000 VND
  const VALID_GIFT_CODE = 'emanhhuy';
  const GIFT_CODE_FIXED_PRICE = 5000; // 5000 VND
  const isGiftCodeApplied = giftCode && giftCode.toLowerCase() === VALID_GIFT_CODE;

  if (!SHIPPING_METHODS.includes(shippingMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Currently only home delivery is supported for PayOS payments.',
    });
  }

  if (!DELIVERY_OPTIONS.includes(deliveryTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid delivery option selected.',
    });
  }

  let shippingAddress;
  try {
    shippingAddress = ensureAddressPayload(addressPayload);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.productVariant',
    populate: { path: 'product_id', select: 'name images brand' },
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart is empty. Please add items before checking out.',
    });
  }

  let orderItems;
  try {
    orderItems = buildOrderItems(cart.items);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingFee = getShippingFee(deliveryTime);
  const totalPrice = Number((subtotal + shippingFee).toFixed(2));

  const buyerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
  const buyerAddress = [shippingAddress.address, shippingAddress.district, shippingAddress.city]
    .filter(Boolean)
    .join(', ');
  const streetLine = [shippingAddress.address, shippingAddress.district].filter(Boolean).join(', ');

  const gatewayOrderCode = await generateGatewayOrderCode();

  let orderDoc = null;

  try {
    orderDoc = await Order.create({
      user: userId,
      orderItems,
      shippingAddress: {
        street: streetLine,
        city: shippingAddress.city,
        postalCode: String(shippingAddress.zipCode),
        phone: String(shippingAddress.phoneNumber),
      },
      deliveryMethod: shippingMethod,
      deliveryWindow: deliveryTime,
      paymentMethod: 'Bank',
      paymentGateway: 'PayOS',
      totalPrice: isGiftCodeApplied ? GIFT_CODE_FIXED_PRICE : totalPrice,
      shippingPrice: isGiftCodeApplied ? 0 : shippingFee,
      appliedGiftCode: isGiftCodeApplied ? giftCode : null,
      status: 'pending',
    });

    const payosItems = orderItems.map((item) => ({
      name: `${item.name} (${item.color}/${item.size})`,
      quantity: item.quantity,
      price: Math.round(item.price),
    }));

    if (shippingFee > 0) {
      payosItems.push({
        name: DELIVERY_LABELS[deliveryTime],
        quantity: 1,
        price: Math.round(shippingFee),
      });
    }

    // Calculate payable amount - use fixed price if gift code is applied
    let payableAmount;
    let finalPayosItems;

    if (isGiftCodeApplied) {
      // Gift code applied - fixed price 1000 VND
      payableAmount = GIFT_CODE_FIXED_PRICE;
      finalPayosItems = [{
        name: 'Gift Code Order (emanhhuy)',
        quantity: 1,
        price: GIFT_CODE_FIXED_PRICE,
      }];
    } else {
      payableAmount = payosItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      finalPayosItems = payosItems;
    }

    const paymentDescription = buildPayOSDescription(gatewayOrderCode);

    const paymentLink = await payosClient.paymentRequests.create({
      orderCode: gatewayOrderCode,
      amount: payableAmount,
      description: paymentDescription,
      returnUrl: `${clientBaseUrl}/checkout/payos/success?orderCode=${gatewayOrderCode}`,
      cancelUrl: `${clientBaseUrl}/shipping?payment=cancelled`,
      buyerName,
      buyerEmail: user.email,
      buyerPhone: String(shippingAddress.phoneNumber),
      buyerAddress,
      items: finalPayosItems,
      expiredAt: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    orderDoc.paymentIntent = {
      gatewayOrderCode,
      paymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      rawResponse: paymentLink,
      status: paymentLink.status,
    };
    await orderDoc.save();

    return res.status(201).json({
      success: true,
      message: 'PayOS payment link generated successfully.',
      data: {
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        orderCode: gatewayOrderCode,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        totalPrice,
        shippingFee,
        chargeAmount: payableAmount,
      },
    });
  } catch (error) {
    logger.error('Failed to initiate PayOS payment', {
      userId,
      error: error.message,
    });

    if (orderDoc?._id) {
      await Order.findByIdAndDelete(orderDoc._id);
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to initiate PayOS payment. Please try again later.',
    });
  }
});

export const handlePayOSWebhook = asyncHandler(async (req, res) => {
  try {
    // Handle PayOS webhook test/ping (empty body or test data)
    if (!req.body || Object.keys(req.body).length === 0) {
      logger.info('PayOS webhook test ping received');
      return res.status(200).json({ success: true, message: 'Webhook is active' });
    }

    // Handle PayOS webhook confirmation test
    if (req.body.code === 'test' || req.body.desc === 'test') {
      logger.info('PayOS webhook confirmation test received');
      return res.status(200).json({ success: true, message: 'Webhook confirmed' });
    }

    let verifiedData;
    try {
      verifiedData = await payosClient.webhooks.verify(req.body);
    } catch (verifyError) {
      // If verification fails but has orderCode, it might be a test or malformed request
      logger.warn('PayOS webhook verification failed', {
        error: verifyError.message,
        body: req.body,
      });
      // Return 200 to acknowledge receipt (PayOS expects 200)
      return res.status(200).json({ success: true, message: 'Webhook received but verification failed' });
    }

    const order = await Order.findOne({ 'paymentIntent.gatewayOrderCode': verifiedData.orderCode }).populate('user', 'email firstName lastName username');

    if (!order) {
      logger.error('PayOS webhook received for unknown order', {
        orderCode: verifiedData.orderCode,
      });
      return res.status(200).json({ success: true });
    }

    if (order.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Order already processed.' });
    }

    const paymentLinkId = verifiedData.paymentLinkId || order.paymentIntent?.paymentLinkId || '';

    if (verifiedData.code !== '00') {
      order.paymentIntent = {
        ...order.paymentIntent,
        status: 'FAILED',
        rawResponse: verifiedData,
      };
      order.paymentResult = {
        id: paymentLinkId,
        status: 'failed',
        update_time: verifiedData.transactionDateTime,
        email_address: order.user.email,
      };
      await order.save();
      return res.status(200).json({ success: true, message: 'Payment marked as failed.' });
    }

    await order.markAsPaid({
      id: paymentLinkId,
      status: 'success',
      update_time: verifiedData.transactionDateTime,
      email_address: order.user.email,
    });

    order.paymentIntent = {
      ...order.paymentIntent,
      status: 'PAID',
      amount: verifiedData.amount || order.paymentIntent?.amount,
      rawResponse: verifiedData,
    };

    const cart = await Cart.findOne({ user: order.user._id });
    if (cart) {
      try {
        cart.items = [];
        await cart.save();
      } catch (cartError) {
        logger.error('Failed to clear cart after PayOS success', {
          orderCode: order.paymentIntent?.gatewayOrderCode,
          error: cartError.message,
        });
      }
    }

    if (!order.confirmationEmailSentAt) {
      try {
        await sendOrderConfirmationEmail({
          email: order.user.email,
          order,
        });
        order.confirmationEmailSentAt = new Date();
      } catch (emailError) {
        logger.error('Failed to send confirmation email', {
          orderCode: order.paymentIntent?.gatewayOrderCode,
          error: emailError.message,
        });
      }
    }

    await order.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('PayOS webhook verification failed', {
      error: error.message,
      payload: req.body,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
});

export const getPayOSOrderStatus = asyncHandler(async (req, res) => {
  const orderCode = Number(req.params.orderCode);

  if (!orderCode) {
    return res.status(400).json({ success: false, message: 'Order code is required.' });
  }

  const order = await Order.findOne({
    'paymentIntent.gatewayOrderCode': orderCode,
    user: req.userId,
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  return res.status(200).json({
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
    },
  });
});
