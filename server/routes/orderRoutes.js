import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
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

// GET /api/admin/orders/stats - Get order statistics (must be before /:id)
router.get('/stats', getOrderStats);

// POST /api/admin/orders/export - Export orders report
router.post('/export', exportOrdersReport);

// GET /api/admin/orders - Get all orders with filters
router.get('/', getOrders);

// GET /api/admin/orders/:id - Get single order by ID
router.get('/:id', getOrderById);

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/:id/status', updateOrderStatus);

// DELETE /api/admin/orders/:id - Cancel/Delete order
router.delete('/:id', deleteOrder);

export default router;
