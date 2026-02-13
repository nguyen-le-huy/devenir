import asyncHandler from 'express-async-handler';
import { ragService } from '../services/rag/index.js';

/**
 * Chat Controller
 * Handles RAG-powered chat requests
 * Delegates business logic to RAGService
 */

/**
 * @desc    Process chat message (authenticated users)
 * @route   POST /api/chat
 * @access  Private
 */
export const chat = asyncHandler(async (req, res) => {
    const { message, conversation_history = [] } = req.body;
    const userId = req.user?._id?.toString() || 'anonymous';

    // Basic validation
    if (!message || message.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Message is required'
        });
    }

    // Delegate to service
    const result = await ragService.chat(userId, message, conversation_history);

    res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
    });
});

/**
 * @desc    Process chat message (guest users)
 * @route   POST /api/chat/guest
 * @access  Public
 */
export const chatGuest = asyncHandler(async (req, res) => {
    const { message, conversation_history = [], session_id } = req.body;
    const guestId = session_id || `guest_${Date.now()}`;

    // Basic validation
    if (!message || message.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Message is required'
        });
    }

    // Delegate to service
    const result = await ragService.chat(guestId, message, conversation_history);

    res.status(200).json({
        success: true,
        session_id: guestId,
        ...result,
        timestamp: new Date().toISOString()
    });
});

/**
 * @desc    Get conversation history
 * @route   GET /api/chat/history
 * @access  Private
 */
export const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const limit = parseInt(req.query.limit) || 20;

    const history = await ragService.getHistory(userId, limit);

    res.status(200).json({
        success: true,
        history
    });
});

/**
 * @desc    Clear conversation context
 * @route   DELETE /api/chat/clear
 * @access  Private
 */
export const clearContext = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();

    await ragService.clearContext(userId);

    res.status(200).json({
        success: true,
        message: 'Conversation cleared'
    });
});

/**
 * @desc    Health check for RAG service
 * @route   GET /api/chat/health
 * @access  Public
 */
export const healthCheck = asyncHandler(async (req, res) => {
    const health = ragService.getHealth();

    res.status(200).json({
        success: true,
        service: 'RAG Chat Service',
        ...health,
        timestamp: new Date().toISOString()
    });
});
