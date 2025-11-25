import express from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/CategoryController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============

/**
 * GET /api/categories
 * Get all categories with pagination and filtering
 * Query params: page, limit, parentCategory, isActive
 */
router.get('/', getAllCategories);

/**
 * GET /api/categories/:id
 * Get single category with children
 */
router.get('/:id', getCategoryById);

// ============ ADMIN ROUTES ============

/**
 * POST /api/categories/admin
 * Create new category (Admin only)
 * Body: { name, description, thumbnailUrl, parentCategory, isActive }
 */
router.post('/admin', authenticate, isAdmin, createCategory);

/**
 * PUT /api/categories/admin/:id
 * Update category (Admin only)
 */
router.put('/admin/:id', authenticate, isAdmin, updateCategory);

/**
 * DELETE /api/categories/admin/:id
 * Delete category (Admin only)
 */
router.delete('/admin/:id', authenticate, isAdmin, deleteCategory);

export default router;