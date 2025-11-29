import express from 'express';
import {
    getAllCategories,
    getCategoriesTree,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/CategoryController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { cacheMiddleware, clearCache } from '../middleware/cacheMiddleware.js';
import {
    validateObjectId,
    validateCategoryInput,
    validatePagination,
    rateLimiter,
} from '../middleware/validationMiddleware.js';
import logger from '../config/logger.js';

const router = express.Router();

// Apply rate limiting to all routes
router.use(rateLimiter);

// ============ PUBLIC ROUTES ============

/**
 * GET /api/categories/tree
 * Get categories as hierarchical tree with calculated levels
 * CACHED: 10 minutes (tree structure changes rarely)
 */
router.get('/tree', cacheMiddleware(600), getCategoriesTree);

/**
 * GET /api/categories
 * Get all categories with pagination and filtering
 * Query params: page, limit, parentCategory, isActive
 * CACHED: 5 minutes
 */
router.get('/', validatePagination, cacheMiddleware(300), getAllCategories);

/**
 * GET /api/categories/:id
 * Get single category with children
 */
router.get('/:id', validateObjectId('id'), getCategoryById);

// ============ ADMIN ROUTES ============

// Middleware to clear cache after mutations
const clearCategoryCache = (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            clearCache('__express__/api/categories');
            logger.info('Category cache cleared after mutation', { 
                method: req.method, 
                path: req.path,
                status: res.statusCode 
            });
        }
    });
    next();
};

/**
 * POST /api/categories/admin
 * Create new category (Admin only)
 * Body: { name, description, thumbnailUrl, parentCategory, isActive }
 */
router.post('/admin', authenticate, isAdmin, validateCategoryInput, clearCategoryCache, createCategory);

/**
 * PUT /api/categories/admin/:id
 * Update category (Admin only)
 */
router.put('/admin/:id', authenticate, isAdmin, validateObjectId('id'), validateCategoryInput, clearCategoryCache, updateCategory);

/**
 * DELETE /api/categories/admin/:id
 * Delete category (Admin only)
 */
router.delete('/admin/:id', authenticate, isAdmin, validateObjectId('id'), clearCategoryCache, deleteCategory);

export default router;