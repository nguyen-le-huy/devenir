import express from 'express'
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/BrandController.js'
import { authenticate, isAdmin } from '../middleware/authMiddleware.js'
import { cacheMiddleware, clearCache } from '../middleware/cacheMiddleware.js'
import { validate } from '../middleware/validate.js'
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdSchema,
} from '../validators/brand.validator.js'
import logger from '../config/logger.js'

const router = express.Router()

// router.use(rateLimiter) // Global rate limiter might be enough, or restore if needed specific

router.get('/', cacheMiddleware(120), getBrands)
router.get('/:id', validate(brandIdSchema), cacheMiddleware(300), getBrandById)

const clearBrandCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      clearCache('__express__/api/brands')
      logger.info('Brand cache cleared after mutation', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      })
    }
  })
  next()
}

router.post('/admin', authenticate, isAdmin, validate(createBrandSchema), clearBrandCache, createBrand)
router.put('/admin/:id', authenticate, isAdmin, validate(updateBrandSchema), clearBrandCache, updateBrand)
router.delete('/admin/:id', authenticate, isAdmin, validate(brandIdSchema), clearBrandCache, deleteBrand)

export default router
