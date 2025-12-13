import express from 'express';
import {
  getInventoryOverview,
  getInventoryList,
  getInventoryAlerts,
  createInventoryAdjustment,
  getInventoryAdjustments,
  getInventoryVariantDetail,
  exportInventoryReport,
} from '../controllers/InventoryController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/overview', getInventoryOverview);
router.get('/alerts', getInventoryAlerts);
router.get('/adjustments', getInventoryAdjustments);
router.post('/adjustments', createInventoryAdjustment);
router.post('/export', exportInventoryReport);
router.get('/variant/:variantId', getInventoryVariantDetail);
router.get('/', getInventoryList);

export default router;

