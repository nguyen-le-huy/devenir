import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    chat,
    chatGuest,
    getHistory,
    clearContext,
    healthCheck
} from '../controllers/ChatController.js';

const router = express.Router();

/**
 * POST /api/chat
 * Main chat endpoint
 */
router.post('/', authenticate, chat);

/**
 * POST /api/chat/guest
 * Chat endpoint for guest users (no auth required)
 */
router.post('/guest', chatGuest);

/**
 * GET /api/chat/history
 * Get conversation history
 */
router.get('/history', authenticate, getHistory);

/**
 * DELETE /api/chat/clear
 * Clear conversation context
 */
router.delete('/clear', authenticate, clearContext);

/**
 * GET /api/chat/health
 * Health check for RAG service
 */
router.get('/health', healthCheck);

export default router;
