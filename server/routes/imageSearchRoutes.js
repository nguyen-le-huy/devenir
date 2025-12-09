import express from 'express';
import {
    findSimilarProducts,
    getImageSearchStats,
    imageSearchHealth
} from '../controllers/ImageSearchController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============

/**
 * POST /api/image-search/find-similar
 * Find visually similar products by uploading an image
 * Body: { image: "<base64>", topK: 8 }
 */
router.post('/find-similar', findSimilarProducts);

/**
 * GET /api/image-search/health
 * Health check for image search service
 */
router.get('/health', imageSearchHealth);

// ============ ADMIN ROUTES ============

/**
 * GET /api/image-search/stats
 * Get Pinecone index statistics
 */
router.get('/stats', authenticate, isAdmin, getImageSearchStats);

export default router;
