import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { calculateOrderProfitSchema, revenueStatsSchema } from '../validators/financial.validator.js';
import {
  calculateOrderProfit,
  getRevenueStats,
  getDashboardMetrics,
} from '../controllers/FinancialController.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/dashboard-metrics', getDashboardMetrics);
router.get('/stats', validate(revenueStatsSchema), getRevenueStats);
router.post('/order/:orderId/calculate', validate(calculateOrderProfitSchema), calculateOrderProfit);

export default router;
