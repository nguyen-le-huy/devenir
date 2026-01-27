import { generateCustomerIntelligence } from './customerIntelligence.js'; // Import the old logic for now or refactor it completely.
// Ideally, the old `customerIntelligence.js` SHOULD be a class `CustomerIntelligenceService` exporting a singleton.
// However, it currently exports functions.
// We will wrap them into a class here or reuse them until that file is fully refactored to a class structure.
// Given strict instructions to refactor controller, creating a service wrapper is standard.

import User from '../models/UserModel.js';

class CustomerIntelligenceService {

    /**
     * Get Intelligence Report
     */
    async getIntelligence(userId, days = 30) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Use the existing logic from the specialized file
        return generateCustomerIntelligence(userId, {
            days,
            includeAnonymous: true
        });
    }

    /**
     * Get Quick Insights
     */
    async getQuickInsights(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const intelligence = await generateCustomerIntelligence(userId, {
            days: 30,
            includeAnonymous: true
        });

        // Logic from controller moved here
        const isHybrid = intelligence.behavior.dataSource === 'hybrid';
        const isOrderFallback = intelligence.behavior.dataSource === 'orders';

        let stats;
        if (isHybrid) {
            stats = {
                totalViews: intelligence.behavior.browsing.totalViews,
                totalPurchases: intelligence.behavior.shopping.purchases?.count || 0,
                totalSpent: intelligence.behavior.shopping.purchases?.totalSpent || 0,
                cartAbandonment: intelligence.behavior.shopping.cartActions?.abandonmentRate || 0
            };
        } else if (isOrderFallback) {
            stats = {
                totalViews: intelligence.behavior.browsing.totalViews,
                totalPurchases: intelligence.behavior.shopping.purchaseHistory.totalOrders,
                totalSpent: intelligence.behavior.shopping.purchaseHistory.totalSpent,
                cartAbandonment: 0
            };
        } else {
            stats = {
                totalViews: intelligence.behavior.browsing.totalViews,
                totalPurchases: intelligence.behavior.shopping.purchases?.count || 0,
                totalSpent: intelligence.behavior.shopping.purchases?.totalSpent || 0,
                cartAbandonment: intelligence.behavior.shopping.cartActions?.abandonmentRate || 0
            };
        }

        return {
            customerType: intelligence.insights.customerType,
            engagementScore: intelligence.behavior.engagement.engagementScore,
            riskLevel: intelligence.insights.riskLevel.level,
            topTags: intelligence.suggestions.tags.slice(0, 3),
            topNotes: intelligence.suggestions.notes.slice(0, 2),
            nextAction: intelligence.insights.nextBestAction,
            stats,
            dataSource: intelligence.behavior.dataSource
        };
    }

    /**
     * Apply Tags
     */
    async applyTags(userId, tags) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const existingTags = new Set(user.tags || []);
        tags.forEach(tag => existingTags.add(tag.toLowerCase()));

        user.tags = Array.from(existingTags);
        await user.save();

        return {
            userId: user._id,
            tags: user.tags
        };
    }

    /**
     * Apply Notes
     */
    async applyNotes(userId, notes, adminId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        notes.forEach(note => {
            user.customerProfile.notesList.push({
                type: note.type || 'context',
                content: note.content,
                createdBy: adminId,
                createdAt: new Date(),
                isPinned: note.priority === 'high'
            });
        });

        await user.save();

        return {
            userId: user._id,
            notesCount: user.customerProfile.notesList.length
        };
    }
}

export default new CustomerIntelligenceService();
