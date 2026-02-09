/**
 * User Profiler Service
 * Analyzes user behavior to build personalization profiles
 * 
 * @module UserProfiler
 * @version 3.0.0
 */

import UserProfile from '../../../models/UserProfileModel.js';
import Order from '../../../models/OrderModel.js';
import ChatLog from '../../../models/ChatLogModel.js';
import logger, { logError } from '../utils/logger.js';

class UserProfiler {
    /**
     * Build or update user profile from purchase and chat history
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User profile or null
     */
    async buildProfile(userId) {
        if (process.env.ENABLE_PERSONALIZATION !== 'true') {
            return null;
        }

        try {
            const startTime = Date.now();

            // Fetch user behavior data in parallel
            const [orders, chatLogs] = await Promise.all([
                Order.find({ user: userId })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .lean(),
                ChatLog.find({ userId })
                    .sort({ createdAt: -1 })
                    .limit(100)
                    .lean()
            ]);

            // Extract patterns from orders
            const styleProfile = this.extractStylePreferences(orders);
            const sizeHistory = this.extractSizeHistory(orders);
            const budgetRange = this.calculateBudgetRange(orders);
            const favoriteColors = this.extractColorPreferences(orders);
            const favoriteBrands = this.extractBrandPreferences(orders);

            // Calculate behavioral metrics from chat logs
            const behaviorMetrics = {
                avgSessionLength: this.calculateAvgSessionLength(chatLogs),
                productsViewedPerSession: this.calculateAvgProductsViewed(chatLogs),
                conversionRate: this.calculateConversionRate(orders.length, chatLogs.length),
                lastPurchaseDate: orders[0]?.createdAt || null
            };

            // Update or create profile
            const profile = await UserProfile.findOneAndUpdate(
                { userId },
                {
                    preferences: {
                        styleProfile,
                        sizeHistory,
                        budgetRange,
                        favoriteColors,
                        favoriteBrands
                    },
                    behaviorMetrics,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );

            const duration = Date.now() - startTime;
            logger.info('User profile updated', {
                userId,
                ordersAnalyzed: orders.length,
                chatsAnalyzed: chatLogs.length,
                duration
            });

            return profile;

        } catch (error) {
            logError('Profile building failed', error, { userId });
            return null;
        }
    }

    /**
     * Get existing profile or build new one
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User profile
     */
    async getProfile(userId) {
        try {
            let profile = await UserProfile.findOne({ userId }).lean();

            // If profile doesn't exist or is stale (>7 days), rebuild
            if (!profile || this.isProfileStale(profile.updatedAt)) {
                logger.debug('Profile missing or stale, rebuilding', { userId });
                profile = await this.buildProfile(userId);
            }

            return profile;

        } catch (error) {
            logError('Get profile failed', error, { userId });
            return null;
        }
    }

    /**
     * Update profile after user action
     * @param {string} userId - User ID
     * @param {Object} action - Action data (purchase, view, etc.)
     */
    async updateProfileIncremental(userId, action) {
        if (process.env.ENABLE_PERSONALIZATION !== 'true') {
            return;
        }

        try {
            const profile = await UserProfile.findOne({ userId });
            if (!profile) {
                // Create initial profile
                await this.buildProfile(userId);
                return;
            }

            // Incremental updates based on action type
            if (action.type === 'purchase') {
                await this.updateFromPurchase(userId, action.data);
            } else if (action.type === 'product_view') {
                await this.updateFromView(userId, action.data);
            }

            // Touch updatedAt
            profile.updatedAt = new Date();
            await profile.save();

        } catch (error) {
            logError('Incremental profile update failed', error, { userId });
        }
    }

    // ============================================
    // PATTERN EXTRACTION METHODS
    // ============================================

    /**
     * Extract style preferences from order history
     * @private
     */
    extractStylePreferences(orders) {
        const styleCounts = {};

        for (const order of orders) {
            for (const item of order.orderItems || []) {
                const style = item.product?.style || item.product?.category;
                if (style) {
                    styleCounts[style] = (styleCounts[style] || 0) + 1;
                }
            }
        }

        // Return top 3 styles
        return Object.entries(styleCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([style]) => style);
    }

    /**
     * Extract size history per category
     * @private
     */
    extractSizeHistory(orders) {
        const sizesByCategory = {};

        for (const order of orders) {
            for (const item of order.orderItems || []) {
                const category = item.product?.category;
                const size = item.size;

                if (category && size) {
                    // Most recent size wins
                    sizesByCategory[category] = size;
                }
            }
        }

        return sizesByCategory;
    }

    /**
     * Calculate budget range from purchase history
     * @private
     */
    calculateBudgetRange(orders) {
        if (orders.length === 0) {
            return { min: 0, max: 10000000 }; // Default wide range
        }

        const prices = orders
            .map(o => o.totalPrice)
            .filter(p => p != null)
            .sort((a, b) => a - b);

        if (prices.length === 0) {
            return { min: 0, max: 10000000 };
        }

        // Use 25th and 75th percentile
        const p25Index = Math.floor(prices.length * 0.25);
        const p75Index = Math.floor(prices.length * 0.75);

        const p25 = prices[p25Index];
        const p75 = prices[p75Index];

        // Add 20% buffer on both ends
        return {
            min: Math.max(0, Math.floor(p25 * 0.8)),
            max: Math.ceil(p75 * 1.2)
        };
    }

    /**
     * Extract color preferences from order history
     * @private
     */
    extractColorPreferences(orders) {
        const colorCounts = {};

        for (const order of orders) {
            for (const item of order.orderItems || []) {
                const color = item.color;
                if (color) {
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
            }
        }

        // Return top 5 colors
        return Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color]) => color);
    }

    /**
     * Extract brand preferences from order history
     * @private
     */
    extractBrandPreferences(orders) {
        const brandCounts = {};

        for (const order of orders) {
            for (const item of order.orderItems || []) {
                const brand = item.product?.brand;
                if (brand) {
                    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                }
            }
        }

        // Return top 3 brands
        return Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([brand]) => brand);
    }

    // ============================================
    // BEHAVIORAL METRICS CALCULATION
    // ============================================

    /**
     * Calculate average session length in minutes
     * @private
     */
    calculateAvgSessionLength(chatLogs) {
        if (chatLogs.length === 0) return 0;

        // Group by sessionId
        const sessions = {};
        for (const log of chatLogs) {
            const sessionId = log.sessionId;
            if (!sessionId) continue;

            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    start: log.createdAt,
                    end: log.createdAt
                };
            } else {
                // Update end time (logs are sorted desc, so we need to check)
                if (log.createdAt < sessions[sessionId].start) {
                    sessions[sessionId].start = log.createdAt;
                }
                if (log.createdAt > sessions[sessionId].end) {
                    sessions[sessionId].end = log.createdAt;
                }
            }
        }

        // Calculate durations
        const durations = Object.values(sessions).map(s => {
            const durationMs = new Date(s.end) - new Date(s.start);
            return durationMs / (1000 * 60); // Convert to minutes
        });

        if (durations.length === 0) return 0;

        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        return Math.round(avgDuration * 10) / 10; // Round to 1 decimal
    }

    /**
     * Calculate average products viewed per session
     * @private
     */
    calculateAvgProductsViewed(chatLogs) {
        if (chatLogs.length === 0) return 0;

        const sessionsWithProducts = chatLogs.filter(
            log => log.analytics?.productsShown > 0
        );

        if (sessionsWithProducts.length === 0) return 0;

        const totalProducts = sessionsWithProducts.reduce(
            (sum, log) => sum + (log.analytics.productsShown || 0),
            0
        );

        const avgProducts = totalProducts / sessionsWithProducts.length;
        return Math.round(avgProducts * 10) / 10; // Round to 1 decimal
    }

    /**
     * Calculate conversion rate
     * @private
     */
    calculateConversionRate(orderCount, chatCount) {
        if (chatCount === 0) return 0;

        // Rough estimate: assume ~10 chat sessions per potential purchase intent
        const estimatedSessions = chatCount / 10;
        const conversionRate = estimatedSessions > 0
            ? orderCount / estimatedSessions
            : 0;

        return Math.min(1, Math.round(conversionRate * 100) / 100); // 0-1, 2 decimals
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if profile is stale (>7 days old)
     * @private
     */
    isProfileStale(updatedAt) {
        const STALE_THRESHOLD_DAYS = 7;
        const now = new Date();
        const profileAge = (now - new Date(updatedAt)) / (1000 * 60 * 60 * 24);
        return profileAge > STALE_THRESHOLD_DAYS;
    }

    /**
     * Update profile from purchase action
     * @private
     */
    async updateFromPurchase(userId, purchaseData) {
        const { product, size, color } = purchaseData;

        await UserProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    [`preferences.sizeHistory.${product.category}`]: size,
                    'behaviorMetrics.lastPurchaseDate': new Date()
                },
                $inc: {
                    // Could increment purchase count, etc.
                }
            }
        );
    }

    /**
     * Update profile from product view action
     * @private
     */
    async updateFromView(userId, viewData) {
        // Could track viewed categories, colors, etc.
        // For now, just touch the profile
        await UserProfile.findOneAndUpdate(
            { userId },
            { $set: { updatedAt: new Date() } }
        );
    }

    /**
     * Delete user profile (GDPR compliance)
     * @param {string} userId - User ID
     */
    async deleteProfile(userId) {
        try {
            await UserProfile.deleteOne({ userId });
            logger.info('User profile deleted', { userId });
        } catch (error) {
            logError('Profile deletion failed', error, { userId });
            throw error;
        }
    }
}

// Singleton export
export const userProfiler = new UserProfiler();
export default UserProfiler;
