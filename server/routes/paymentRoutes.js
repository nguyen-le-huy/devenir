import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createPayOSPaymentLink,
  handlePayOSWebhook,
  getPayOSOrderStatus,
  createNowPaymentsInvoice,
  handleNowPaymentsWebhook,
  getNowPaymentsStatus,
} from '../controllers/PaymentController.js';
import { validate } from '../middleware/validate.js';
import { createSessionSchema, payosOrderCodeSchema, nowPaymentsOrderIdSchema } from '../validators/payment.validator.js';

const router = express.Router();

// PayOS routes
router.post('/payos/session', authenticate, validate(createSessionSchema), createPayOSPaymentLink);
router.get('/payos/order/:orderCode', authenticate, validate(payosOrderCodeSchema), getPayOSOrderStatus);
router.post('/payos/webhook', handlePayOSWebhook);

// NowPayments routes
router.post('/nowpayments/session', authenticate, validate(createSessionSchema), createNowPaymentsInvoice);
router.get('/nowpayments/status/:orderId', authenticate, validate(nowPaymentsOrderIdSchema), getNowPaymentsStatus);
router.post('/nowpayments/webhook', handleNowPaymentsWebhook);

export default router;

