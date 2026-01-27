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
import { validate } from '../middleware/validate.js';
import { analyticsQuerySchema } from '../validators/chatAnalytics.validator.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

/**
 * GET /api/analytics/chatbot/dashboard
 * Comprehensive dashboard data (all metrics in one call)
 */
router.get('/dashboard', validate(analyticsQuerySchema), getChatbotDashboard);

/**
 * GET /api/analytics/chatbot/overview
 * Basic overview metrics
 */
router.get('/overview', validate(analyticsQuerySchema), getChatbotAnalyticsOverview);

/**
 * GET /api/analytics/chatbot/customer-types
 * Customer type distribution
 */
router.get('/customer-types', validate(analyticsQuerySchema), getCustomerTypes);

/**
 * GET /api/analytics/chatbot/intents
 * Intent distribution
 */
router.get('/intents', validate(analyticsQuerySchema), getIntents);

/**
 * GET /api/analytics/chatbot/personalization
 * Personalization effectiveness
 */
router.get('/personalization', validate(analyticsQuerySchema), getPersonalizationMetrics);

/**
 * GET /api/analytics/chatbot/trend
 * Daily usage trend
 */
router.get('/trend', validate(analyticsQuerySchema), getUsageTrend);

/**
 * GET /api/analytics/chatbot/top-products
 * Top products shown in chatbot
 */
router.get('/top-products', validate(analyticsQuerySchema), getTopProducts);

/**
 * GET /api/analytics/chatbot/conversion
 * Conversion metrics (chat to cart/purchase)
 */
router.get('/conversion', validate(analyticsQuerySchema), getConversionMetrics);

export default router;
