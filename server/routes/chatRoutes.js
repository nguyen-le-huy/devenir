import express from 'express';
import { RAGService } from '../services/rag/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
const ragService = new RAGService();

/**
 * POST /api/chat
 * Main chat endpoint
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { message, conversation_history = [] } = req.body;
        const userId = req.user?._id?.toString() || 'anonymous';

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Call RAG service
        const result = await ragService.chat(userId, message, conversation_history);

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/chat/guest
 * Chat endpoint for guest users (no auth required)
 */
router.post('/guest', async (req, res) => {
    try {
        const { message, conversation_history = [], session_id } = req.body;
        const guestId = session_id || `guest_${Date.now()}`;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Call RAG service with guest ID
        const result = await ragService.chat(guestId, message, conversation_history);

        res.json({
            success: true,
            session_id: guestId,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Guest Chat Error:', error);
        res.status(500).json({
            success: false,
            error: 'Đã có lỗi xảy ra. Vui lòng thử lại.'
        });
    }
});

/**
 * GET /api/chat/history
 * Get conversation history
 */
router.get('/history', authenticate, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const limit = parseInt(req.query.limit) || 20;

        const history = await ragService.getHistory(userId, limit);

        res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error('History Route Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/chat/clear
 * Clear conversation context
 */
router.delete('/clear', authenticate, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        await ragService.clearContext(userId);

        res.json({
            success: true,
            message: 'Conversation cleared'
        });

    } catch (error) {
        console.error('Clear Route Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/chat/health
 * Health check for RAG service
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'RAG Chat Service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

export default router;
