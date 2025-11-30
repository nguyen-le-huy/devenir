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
import {
  validateObjectId,
  validateBrandInput,
  rateLimiter,
  sanitizeBody,
} from '../middleware/validationMiddleware.js'
import logger from '../config/logger.js'

const router = express.Router()

router.use(rateLimiter)

router.get('/', cacheMiddleware(120), getBrands)
router.get('/:id', validateObjectId('id'), cacheMiddleware(300), getBrandById)

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

router.post('/admin', authenticate, isAdmin, sanitizeBody, validateBrandInput, clearBrandCache, createBrand)
router.put('/admin/:id', authenticate, isAdmin, sanitizeBody, validateObjectId('id'), validateBrandInput, clearBrandCache, updateBrand)
router.delete('/admin/:id', authenticate, isAdmin, validateObjectId('id'), clearBrandCache, deleteBrand)

export default router
