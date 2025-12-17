import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import {
  calculateOrderProfit,
  getRevenueStats,
  getDashboardMetrics,
} from '../controllers/FinancialController.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/dashboard-metrics', getDashboardMetrics);
router.get('/stats', getRevenueStats);
router.post('/order/:orderId/calculate', calculateOrderProfit);

export default router;
