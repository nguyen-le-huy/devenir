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
import { cacheMiddleware, clearCache } from '../middleware/cacheMiddleware.js';
import logger from '../config/logger.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  bulkUpdateVariantsSchema
} from '../validators/product.validator.js';

const router = express.Router();

// ============ HELPERS ============

const clearProductCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const clearedCount = clearCache('__express__/api/products');
      const clearedVariantCount = clearCache('__express__/api/products/admin/variants');
      const clearedCategoryCount = clearCache('__express__/api/categories');
      logger.info('Product cache cleared after mutation', {
        path: req.originalUrl,
        method: req.method,
        status: res.statusCode,
        clearedCount,
        clearedVariantCount,
        clearedCategoryCount,
      });
    }
  });
  next();
};

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
router.post('/admin', authenticate, isAdmin, validate(createProductSchema), clearProductCache, createProduct);

/**
 * PUT /api/products/admin/:id
 * Update product (Admin only)
 */
router.put('/admin/:id', authenticate, isAdmin, validate(updateProductSchema), clearProductCache, updateProduct);

/**
 * DELETE /api/products/admin/:id
 * Delete product (Admin only)
 */
router.delete('/admin/:id', authenticate, isAdmin, clearProductCache, deleteProduct);

/**
 * GET /api/products/admin/variants
 * Get all variants (Admin only)
 */
router.get('/admin/variants', authenticate, isAdmin, getAllVariants);

/**
 * POST /api/products/admin/:id/variants
 * Create variant (Admin only)
 */
router.post('/admin/:id/variants', authenticate, isAdmin, validate(createVariantSchema), clearProductCache, createVariant);

/**
 * PUT /api/products/admin/variants/:skuOrId
 * Update variant (Admin only)
 */
router.put('/admin/variants/:skuOrId', authenticate, isAdmin, validate(updateVariantSchema), clearProductCache, updateVariant);

/**
 * DELETE /api/products/admin/variants/:skuOrId
 * Delete variant (Admin only)
 */
router.delete('/admin/variants/:skuOrId', authenticate, isAdmin, clearProductCache, deleteVariant);

/**
 * PUT /api/products/admin/variants/bulk-update
 * Bulk update variants (Admin only)
 * Body: { skus: string[], operation: 'set'|'add'|'subtract', amount: number }
 */
router.put('/admin/variants/bulk-update', authenticate, isAdmin, validate(bulkUpdateVariantsSchema), clearProductCache, bulkUpdateVariants);

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
