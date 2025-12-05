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

const router = express.Router();

// PayOS routes
router.post('/payos/session', authenticate, createPayOSPaymentLink);
router.get('/payos/order/:orderCode', authenticate, getPayOSOrderStatus);
router.post('/payos/webhook', handlePayOSWebhook);

// NowPayments routes
router.post('/nowpayments/session', authenticate, createNowPaymentsInvoice);
router.get('/nowpayments/status/:orderId', authenticate, getNowPaymentsStatus);
router.post('/nowpayments/webhook', handleNowPaymentsWebhook);

export default router;

