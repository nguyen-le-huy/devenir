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
import { validate } from '../middleware/validate.js';
import {
  inventoryQuerySchema,
  inventoryAdjustmentSchema,
  inventoryExportSchema,
  variantIdParamSchema,
  adjustmentQuerySchema,
} from '../validators/inventory.validator.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/overview', getInventoryOverview);
router.get('/alerts', getInventoryAlerts);
router.get('/adjustments', validate(adjustmentQuerySchema), getInventoryAdjustments);
router.post('/adjustments', validate(inventoryAdjustmentSchema), createInventoryAdjustment);
router.post('/export', validate(inventoryExportSchema), exportInventoryReport);
router.get('/variant/:variantId', validate(variantIdParamSchema), getInventoryVariantDetail);
router.get('/', validate(inventoryQuerySchema), getInventoryList);

export default router;

