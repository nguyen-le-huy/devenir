
import express from 'express';
import SocialController from '../controllers/SocialController.js';

const router = express.Router();

/**
 * @route   POST /api/social/webhook-proxy
 * @desc    Proxy requests to n8n webhook to avoid CORS issues
 * @access  Private (Admin only)
 */
router.post('/webhook-proxy', SocialController.postToFacebook);

export default router;
