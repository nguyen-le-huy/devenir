import asyncHandler from 'express-async-handler';
import {
    getChatbotOverview,
    getCustomerTypeDistribution,
    getIntentDistribution,
    getPersonalizationEffectiveness,
    getDailyUsageTrend,
    getTopChatProducts,
    getChatbotConversionMetrics
} from '../services/chatbotAnalytics.js';

/**
 * @desc    Get chatbot analytics overview
 * @route   GET /api/analytics/chatbot/overview
 * @access  Private/Admin
 */
export const getChatbotAnalyticsOverview = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const overview = await getChatbotOverview(parseInt(days));

    res.json({
        success: true,
        data: overview
    });
});

/**
 * @desc    Get customer type distribution in chat sessions
 * @route   GET /api/analytics/chatbot/customer-types
 * @access  Private/Admin
 */
export const getCustomerTypes = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const distribution = await getCustomerTypeDistribution(parseInt(days));

    res.json({
        success: true,
        data: distribution
    });
});

/**
 * @desc    Get intent distribution
 * @route   GET /api/analytics/chatbot/intents
 * @access  Private/Admin
 */
export const getIntents = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const distribution = await getIntentDistribution(parseInt(days));

    res.json({
        success: true,
        data: distribution
    });
});

/**
 * @desc    Get personalization effectiveness metrics
 * @route   GET /api/analytics/chatbot/personalization
 * @access  Private/Admin
 */
export const getPersonalizationMetrics = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const metrics = await getPersonalizationEffectiveness(parseInt(days));

    res.json({
        success: true,
        data: metrics
    });
});

/**
 * @desc    Get daily usage trend
 * @route   GET /api/analytics/chatbot/trend
 * @access  Private/Admin
 */
export const getUsageTrend = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const trend = await getDailyUsageTrend(parseInt(days));

    res.json({
        success: true,
        data: trend
    });
});

/**
 * @desc    Get top products shown in chatbot
 * @route   GET /api/analytics/chatbot/top-products
 * @access  Private/Admin
 */
export const getTopProducts = asyncHandler(async (req, res) => {
    const { days = 7, limit = 10 } = req.query;

    const products = await getTopChatProducts(parseInt(days), parseInt(limit));

    res.json({
        success: true,
        data: products
    });
});

/**
 * @desc    Get chatbot conversion metrics
 * @route   GET /api/analytics/chatbot/conversion
 * @access  Private/Admin
 */
export const getConversionMetrics = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const metrics = await getChatbotConversionMetrics(parseInt(days));

    res.json({
        success: true,
        data: metrics
    });
});

/**
 * @desc    Get comprehensive chatbot analytics dashboard data
 * @route   GET /api/analytics/chatbot/dashboard
 * @access  Private/Admin
 */
export const getChatbotDashboard = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;
    const parsedDays = parseInt(days);

    // Fetch all analytics in parallel
    const [
        overview,
        customerTypes,
        intents,
        personalization,
        trend,
        topProducts,
        conversion
    ] = await Promise.all([
        getChatbotOverview(parsedDays),
        getCustomerTypeDistribution(parsedDays),
        getIntentDistribution(parsedDays),
        getPersonalizationEffectiveness(parsedDays),
        getDailyUsageTrend(parsedDays),
        getTopChatProducts(parsedDays, 5),
        getChatbotConversionMetrics(parsedDays)
    ]);

    res.json({
        success: true,
        data: {
            overview,
            customerTypes,
            intents,
            personalization,
            trend,
            topProducts,
            conversion,
            period: `Last ${parsedDays} days`
        }
    });
});
