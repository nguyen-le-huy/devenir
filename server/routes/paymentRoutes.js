import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createPayOSPaymentLink,
  handlePayOSWebhook,
  getPayOSOrderStatus,
} from '../controllers/PaymentController.js';

const router = express.Router();

router.post('/payos/session', authenticate, createPayOSPaymentLink);
router.get('/payos/order/:orderCode', authenticate, getPayOSOrderStatus);
router.post('/payos/webhook', handlePayOSWebhook);

export default router;
