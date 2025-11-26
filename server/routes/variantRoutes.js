import express from 'express';
import { getVariantById } from '../controllers/ProductController.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============

/**
 * GET /api/variants/:id
 * Get variant by ID with product info and sibling variants
 */
router.get('/:id', getVariantById);

export default router;
