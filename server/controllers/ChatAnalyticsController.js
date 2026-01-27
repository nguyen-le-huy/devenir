import asyncHandler from 'express-async-handler';
import chatbotAnalyticsService from '../services/chatbotAnalytics.service.js';

/**
 * @desc    Get chatbot analytics overview
 * @route   GET /api/analytics/chatbot/overview
 * @access  Private/Admin
 */
export const getChatbotAnalyticsOverview = asyncHandler(async (req, res) => {
    const { days } = req.query; // Parsed by Zod
    const overview = await chatbotAnalyticsService.getChatbotOverview(days);
    res.json({ success: true, data: overview });
});

/**
 * @desc    Get customer type distribution in chat sessions
 * @route   GET /api/analytics/chatbot/customer-types
 * @access  Private/Admin
 */
export const getCustomerTypes = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const distribution = await chatbotAnalyticsService.getCustomerTypeDistribution(days);
    res.json({ success: true, data: distribution });
});

/**
 * @desc    Get intent distribution
 * @route   GET /api/analytics/chatbot/intents
 * @access  Private/Admin
 */
export const getIntents = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const distribution = await chatbotAnalyticsService.getIntentDistribution(days);
    res.json({ success: true, data: distribution });
});

/**
 * @desc    Get personalization effectiveness metrics
 * @route   GET /api/analytics/chatbot/personalization
 * @access  Private/Admin
 */
export const getPersonalizationMetrics = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const metrics = await chatbotAnalyticsService.getPersonalizationEffectiveness(days);
    res.json({ success: true, data: metrics });
});

/**
 * @desc    Get daily usage trend
 * @route   GET /api/analytics/chatbot/trend
 * @access  Private/Admin
 */
export const getUsageTrend = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const trend = await chatbotAnalyticsService.getDailyUsageTrend(days);
    res.json({ success: true, data: trend });
});

/**
 * @desc    Get top products shown in chatbot
 * @route   GET /api/analytics/chatbot/top-products
 * @access  Private/Admin
 */
export const getTopProducts = asyncHandler(async (req, res) => {
    const { days, limit } = req.query;
    const products = await chatbotAnalyticsService.getTopChatProducts(days, limit);
    res.json({ success: true, data: products });
});

/**
 * @desc    Get chatbot conversion metrics
 * @route   GET /api/analytics/chatbot/conversion
 * @access  Private/Admin
 */
export const getConversionMetrics = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const metrics = await chatbotAnalyticsService.getChatbotConversionMetrics(days);
    res.json({ success: true, data: metrics });
});

/**
 * @desc    Get comprehensive chatbot analytics dashboard data
 * @route   GET /api/analytics/chatbot/dashboard
 * @access  Private/Admin
 */
export const getChatbotDashboard = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const data = await chatbotAnalyticsService.getChatbotDashboard(days);
    res.json({ success: true, data });
});
