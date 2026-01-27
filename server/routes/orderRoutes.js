import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
    getOrdersSchema,
    orderIdParamSchema,
    updateOrderStatusSchema,
    getOrderStatsSchema,
    exportOrdersSchema,
} from '../validators/order.validator.js';
import {
    getOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    deleteOrder,
    exportOrdersReport,
} from '../controllers/OrderController.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

// GET /api/admin/orders/stats - Get order statistics
router.get('/stats', validate(getOrderStatsSchema), getOrderStats);

// POST /api/admin/orders/export - Export orders report
router.post('/export', validate(exportOrdersSchema), exportOrdersReport);

// GET /api/admin/orders - Get all orders
router.get('/', validate(getOrdersSchema), getOrders);

// GET /api/admin/orders/:id - Get single order
router.get('/:id', validate(orderIdParamSchema), getOrderById);

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);

// DELETE /api/admin/orders/:id - Cancel/Delete order
router.delete('/:id', validate(orderIdParamSchema), deleteOrder);

export default router;
