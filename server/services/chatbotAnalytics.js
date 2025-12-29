import ChatLog from '../models/ChatLogModel.js';
import User from '../models/UserModel.js';
import EventLog from '../models/EventLogModel.js';

/**
 * Chatbot Analytics Service
 * Track personalization effectiveness and engagement metrics
 */

/**
 * Log chatbot interaction with analytics data
 * @param {Object} data - Analytics data
 */
export async function logChatInteraction(data) {
    try {
        const {
            userId,
            sessionId,
            intent,
            hasPersonalization,
            customerType,
            engagementScore,
            responseTime,
            messageLength,
            productsShown,
            userSatisfaction
        } = data;

        // Create analytics entry in ChatLog
        const chatLogEntry = await ChatLog.create({
            userId: userId !== 'anonymous' && !userId.startsWith('guest_') ? userId : null,
            sessionId,
            messages: [], // Will be populated by conversation manager
            analytics: {
                intent,
                hasPersonalization,
                customerType,
                engagementScore,
                responseTime,
                messageLength,
                productsShown: productsShown || 0,
                userSatisfaction,
                timestamp: new Date()
            }
        });

        return chatLogEntry;
    } catch (error) {
        console.error('❌ Error logging chat interaction:', error);
        // Don't throw - analytics failure shouldn't break chatbot
        return null;
    }
}

/**
 * Get chatbot overview metrics for dashboard
 * @param {Number} days - Number of days to analyze (default 7)
 */
export async function getChatbotOverview(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Aggregate chat logs
        const stats = await ChatLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    personalizedSessions: {
                        $sum: { $cond: ['$analytics.hasPersonalization', 1, 0] }
                    },
                    avgResponseTime: { $avg: '$analytics.responseTime' },
                    avgMessagesPerSession: { $avg: { $size: '$messages' } },
                    totalProductsShown: { $sum: '$analytics.productsShown' }
                }
            }
        ]);

        const result = stats[0] || {
            totalSessions: 0,
            personalizedSessions: 0,
            avgResponseTime: 0,
            avgMessagesPerSession: 0,
            totalProductsShown: 0
        };

        // Calculate personalization rate
        const personalizationRate = result.totalSessions > 0
            ? (result.personalizedSessions / result.totalSessions) * 100
            : 0;

        return {
            period: `${days} days`,
            totalSessions: result.totalSessions,
            personalizationRate: Math.round(personalizationRate),
            avgResponseTime: Math.round(result.avgResponseTime),
            avgMessagesPerSession: Math.round(result.avgMessagesPerSession * 10) / 10,
            totalProductsShown: result.totalProductsShown
        };

    } catch (error) {
        console.error('❌ Error getting chatbot overview:', error);
        throw error;
    }
}

/**
 * Get customer type distribution in chat sessions
 * @param {Number} days - Number of days to analyze
 */
export async function getCustomerTypeDistribution(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const distribution = await ChatLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    'analytics.customerType': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$analytics.customerType',
                    count: { $sum: 1 },
                    avgEngagement: { $avg: '$analytics.engagementScore' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return distribution.map(d => ({
            customerType: d._id,
            sessionCount: d.count,
            avgEngagementScore: Math.round(d.avgEngagement || 0)
        }));

    } catch (error) {
        console.error('❌ Error getting customer type distribution:', error);
        throw error;
    }
}

/**
 * Get intent distribution - which intents are most common
 * @param {Number} days - Number of days to analyze
 */
export async function getIntentDistribution(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const distribution = await ChatLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    'analytics.intent': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$analytics.intent',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$analytics.responseTime' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return distribution.map(d => ({
            intent: d._id,
            count: d.count,
            avgResponseTime: Math.round(d.avgResponseTime)
        }));

    } catch (error) {
        console.error('❌ Error getting intent distribution:', error);
        throw error;
    }
}

/**
 * Measure personalization effectiveness
 * Compare metrics between personalized vs non-personalized sessions
 * @param {Number} days - Number of days to analyze
 */
export async function getPersonalizationEffectiveness(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const comparison = await ChatLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$analytics.hasPersonalization',
                    sessionCount: { $sum: 1 },
                    avgMessageCount: { $avg: { $size: '$messages' } },
                    avgResponseTime: { $avg: '$analytics.responseTime' },
                    avgProductsShown: { $avg: '$analytics.productsShown' },
                    avgEngagement: { $avg: '$analytics.engagementScore' }
                }
            }
        ]);

        const personalized = comparison.find(c => c._id === true) || {};
        const nonPersonalized = comparison.find(c => c._id === false) || {};

        return {
            personalized: {
                sessions: personalized.sessionCount || 0,
                avgMessages: Math.round((personalized.avgMessageCount || 0) * 10) / 10,
                avgResponseTime: Math.round(personalized.avgResponseTime || 0),
                avgProducts: Math.round((personalized.avgProductsShown || 0) * 10) / 10,
                avgEngagement: Math.round(personalized.avgEngagement || 0)
            },
            nonPersonalized: {
                sessions: nonPersonalized.sessionCount || 0,
                avgMessages: Math.round((nonPersonalized.avgMessageCount || 0) * 10) / 10,
                avgResponseTime: Math.round(nonPersonalized.avgResponseTime || 0),
                avgProducts: Math.round((nonPersonalized.avgProductsShown || 0) * 10) / 10,
                avgEngagement: Math.round(nonPersonalized.avgEngagement || 0)
            },
            improvement: {
                messageIncrease: personalized.avgMessageCount && nonPersonalized.avgMessageCount
                    ? Math.round(((personalized.avgMessageCount - nonPersonalized.avgMessageCount) / nonPersonalized.avgMessageCount) * 100)
                    : 0,
                engagementIncrease: personalized.avgEngagement && nonPersonalized.avgEngagement
                    ? Math.round(((personalized.avgEngagement - nonPersonalized.avgEngagement) / nonPersonalized.avgEngagement) * 100)
                    : 0
            }
        };

    } catch (error) {
        console.error('❌ Error measuring personalization effectiveness:', error);
        throw error;
    }
}

/**
 * Get daily chatbot usage trend
 * @param {Number} days - Number of days to analyze
 */
export async function getDailyUsageTrend(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trend = await ChatLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    sessions: { $sum: 1 },
                    personalizedSessions: {
                        $sum: { $cond: ['$analytics.hasPersonalization', 1, 0] }
                    },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        return trend.map(t => ({
            date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
            sessions: t.sessions,
            personalizedSessions: t.personalizedSessions,
            uniqueUsers: t.uniqueUsers.filter(u => u !== null).length
        }));

    } catch (error) {
        console.error('❌ Error getting daily usage trend:', error);
        throw error;
    }
}

/**
 * Get top performing products shown in chatbot
 * Products that appear most frequently in chat sessions
 * @param {Number} days - Number of days to analyze
 * @param {Number} limit - Number of top products to return
 */
export async function getTopChatProducts(days = 7, limit = 10) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // This requires tracking product IDs in ChatLog messages
        // For now, we'll use EventLog to track product views from chat
        const topProducts = await EventLog.aggregate([
            {
                $match: {
                    eventType: 'product_view',
                    'metadata.source': 'chatbot',
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$metadata.productId',
                    viewCount: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $sort: { viewCount: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: '$product'
            },
            {
                $project: {
                    productId: '$_id',
                    productName: '$product.name',
                    viewCount: 1,
                    uniqueUsers: { $size: '$uniqueUsers' }
                }
            }
        ]);

        return topProducts;

    } catch (error) {
        console.error('❌ Error getting top chat products:', error);
        throw error;
    }
}

/**
 * Get chatbot conversion metrics
 * Track how many chat sessions lead to cart additions or purchases
 * @param {Number} days - Number of days to analyze
 */
export async function getChatbotConversionMetrics(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get all chat sessions with user IDs
        const chatSessions = await ChatLog.find({
            createdAt: { $gte: startDate },
            userId: { $exists: true, $ne: null }
        }).distinct('userId');

        if (chatSessions.length === 0) {
            return {
                totalChatUsers: 0,
                usersWithCartAdditions: 0,
                usersWithPurchases: 0,
                cartConversionRate: 0,
                purchaseConversionRate: 0
            };
        }

        // Check how many added to cart after chatting
        const cartAdditions = await EventLog.countDocuments({
            userId: { $in: chatSessions },
            eventType: 'add_to_cart',
            timestamp: { $gte: startDate }
        });

        // Check how many made purchases after chatting
        const purchases = await EventLog.countDocuments({
            userId: { $in: chatSessions },
            eventType: 'purchase',
            timestamp: { $gte: startDate }
        });

        return {
            totalChatUsers: chatSessions.length,
            usersWithCartAdditions: cartAdditions,
            usersWithPurchases: purchases,
            cartConversionRate: Math.round((cartAdditions / chatSessions.length) * 100),
            purchaseConversionRate: Math.round((purchases / chatSessions.length) * 100)
        };

    } catch (error) {
        console.error('❌ Error getting chatbot conversion metrics:', error);
        throw error;
    }
}
