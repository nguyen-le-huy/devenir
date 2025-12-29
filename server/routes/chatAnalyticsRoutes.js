import express from 'express';
import {
    getChatbotAnalyticsOverview,
    getCustomerTypes,
    getIntents,
    getPersonalizationMetrics,
    getUsageTrend,
    getTopProducts,
    getConversionMetrics,
    getChatbotDashboard
} from '../controllers/ChatAnalyticsController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * GET /api/analytics/chatbot/dashboard
 * Comprehensive dashboard data (all metrics in one call)
 */
router.get('/dashboard', getChatbotDashboard);

/**
 * GET /api/analytics/chatbot/overview
 * Basic overview metrics
 */
router.get('/overview', getChatbotAnalyticsOverview);

/**
 * GET /api/analytics/chatbot/customer-types
 * Customer type distribution
 */
router.get('/customer-types', getCustomerTypes);

/**
 * GET /api/analytics/chatbot/intents
 * Intent distribution
 */
router.get('/intents', getIntents);

/**
 * GET /api/analytics/chatbot/personalization
 * Personalization effectiveness
 */
router.get('/personalization', getPersonalizationMetrics);

/**
 * GET /api/analytics/chatbot/trend
 * Daily usage trend
 */
router.get('/trend', getUsageTrend);

/**
 * GET /api/analytics/chatbot/top-products
 * Top products shown in chatbot
 */
router.get('/top-products', getTopProducts);

/**
 * GET /api/analytics/chatbot/conversion
 * Conversion metrics (chat to cart/purchase)
 */
router.get('/conversion', getConversionMetrics);

export default router;
