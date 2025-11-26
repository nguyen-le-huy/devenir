import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getProductVariants,
  getAllVariants,
  bulkUpdateVariants,
} from '../controllers/ProductController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============

/**
 * GET /api/products
 * Get all products with pagination and filtering
 * Query params: page, limit, category, brand, status, search
 * Cache: 5 minutes
 */
router.get('/', cacheMiddleware(300), getAllProducts);

// ============ ADMIN ROUTES (Must be before :id routes) ============

/**
 * POST /api/products/admin
 * Create new product (Admin only)
 * Body: { name, description, basePrice, category, brand, images, tags, status, variants }
 */
router.post('/admin', authenticate, isAdmin, createProduct);

/**
 * PUT /api/products/admin/:id
 * Update product (Admin only)
 */
router.put('/admin/:id', authenticate, isAdmin, updateProduct);

/**
 * DELETE /api/products/admin/:id
 * Delete product (Admin only)
 */
router.delete('/admin/:id', authenticate, isAdmin, deleteProduct);

/**
 * GET /api/products/admin/variants
 * Get all variants (Admin only)
 */
router.get('/admin/variants', authenticate, isAdmin, getAllVariants);

/**
 * POST /api/products/admin/:id/variants
 * Create variant (Admin only)
 */
router.post('/admin/:id/variants', authenticate, isAdmin, createVariant);

/**
 * PUT /api/products/admin/variants/:skuOrId
 * Update variant (Admin only)
 */
router.put('/admin/variants/:skuOrId', authenticate, isAdmin, updateVariant);

/**
 * DELETE /api/products/admin/variants/:skuOrId
 * Delete variant (Admin only)
 */
router.delete('/admin/variants/:skuOrId', authenticate, isAdmin, deleteVariant);

/**
 * PUT /api/products/admin/variants/bulk-update
 * Bulk update variants (Admin only)
 * Body: { skus: string[], operation: 'set'|'add'|'subtract', amount: number }
 */
router.put('/admin/variants/bulk-update', authenticate, isAdmin, bulkUpdateVariants);

// ============ PUBLIC DYNAMIC ROUTES ============

/**
 * GET /api/products/:id
 * Get single product with variants
 * Cache: 10 minutes
 */
router.get('/:id', cacheMiddleware(600), getProductById);

/**
 * GET /api/products/:id/variants
 * Get all variants for a product
 * Cache: 5 minutes
 */
router.get('/:id/variants', cacheMiddleware(300), getProductVariants);

export default router;
