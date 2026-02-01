import express from 'express';
import {
    findSimilarProductsSelfHost,
    getSelfHostStats,
    selfHostHealth
} from '../controllers/ImageSearchController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { findSimilarSchema } from '../validators/imageSearch.validator.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES - Self-hosted (CLIP + Qdrant + Redis)
// ============================================

/**
 * POST /api/image-search/find-similar
 * Find visually similar products using self-hosted stack
 * Body: { image: "<base64>", topK: 12, scoreThreshold: 0.3 }
 * 
 * Latency:
 * - First request: ~350ms (CLIP encode + Qdrant search)
 * - Cached request: ~10ms (Redis hit)
 */
router.post('/find-similar', validate(findSimilarSchema), findSimilarProductsSelfHost);

/**
 * GET /api/image-search/health
 * Health check for self-hosted services
 */
router.get('/health', selfHostHealth);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * GET /api/image-search/stats
 * Get self-hosted service statistics (Qdrant, Redis, CLIP)
 */
router.get('/stats', authenticate, isAdmin, getSelfHostStats);

export default router;
