import { generateCustomerIntelligence } from '../services/customerIntelligence.js';
import User from '../models/UserModel.js';

/**
 * Get customer intelligence report
 * GET /api/customers/:userId/intelligence
 * Admin only - Requires authentication + isAdmin
 */
export const getCustomerIntelligence = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    // Validate userId
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate intelligence report
    const intelligence = await generateCustomerIntelligence(userId, { 
      days: parseInt(days),
      includeAnonymous: true 
    });

    res.status(200).json({
      success: true,
      data: intelligence
    });

  } catch (error) {
    console.error('[CustomerIntelligence] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customer intelligence',
      error: error.message
    });
  }
};

/**
 * Apply suggested tags to customer
 * POST /api/customers/:userId/apply-tags
 * Body: { tags: ['interested:shirts', 'brand:burberry'] }
 */
export const applySuggestedTags = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tags } = req.body;

    console.log('[Apply Tags] Request received:', { userId, tags, bodyKeys: Object.keys(req.body) });

    if (!Array.isArray(tags) || tags.length === 0) {
      console.log('[Apply Tags] Validation failed: tags not array or empty');
      return res.status(400).json({
        success: false,
        message: 'Tags array is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('[Apply Tags] User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add tags (deduplicate)
    const existingTags = new Set(user.tags || []);
    tags.forEach(tag => existingTags.add(tag.toLowerCase()));
    
    user.tags = Array.from(existingTags);
    await user.save();

    console.log('[Apply Tags] Success:', { userId: user._id, tagsCount: user.tags.length });

    res.status(200).json({
      success: true,
      message: `Applied ${tags.length} tags successfully`,
      data: {
        userId: user._id,
        tags: user.tags
      }
    });

  } catch (error) {
    console.error('[CustomerIntelligence] Apply tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply tags',
      error: error.message
    });
  }
};

/**
 * Apply suggested notes to customer
 * POST /api/customers/:userId/apply-notes
 * Body: { notes: [{ type: 'opportunity', content: '...' }] }
 */
export const applySuggestedNotes = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notes array is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add notes to notesList
    const adminId = req.user._id; // From auth middleware
    
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

    res.status(200).json({
      success: true,
      message: `Applied ${notes.length} notes successfully`,
      data: {
        userId: user._id,
        notesCount: user.customerProfile.notesList.length
      }
    });

  } catch (error) {
    console.error('[CustomerIntelligence] Apply notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply notes',
      error: error.message
    });
  }
};

/**
 * Get quick customer insights for dashboard widget
 * GET /api/customers/:userId/quick-insights
 * Returns: Top 3 tags, top 2 notes, customer type, engagement score
 */
export const getQuickInsights = async (req, res) => {
  try {
    const { userId } = req.params;

    const intelligence = await generateCustomerIntelligence(userId, { 
      days: 30,
      includeAnonymous: true 
    });

    // Handle all data sources: hybrid, eventlog, orders
    const isHybrid = intelligence.behavior.dataSource === 'hybrid';
    const isOrderFallback = intelligence.behavior.dataSource === 'orders';
    
    let stats;
    if (isHybrid) {
      // BEST: Hybrid data (EventLog behavior + Orders transactions)
      stats = {
        totalViews: intelligence.behavior.browsing.totalViews,
        totalPurchases: intelligence.behavior.shopping.purchases?.count || 0,
        totalSpent: intelligence.behavior.shopping.purchases?.totalSpent || 0,
        cartAbandonment: intelligence.behavior.shopping.cartActions?.abandonmentRate || 0
      };
    } else if (isOrderFallback) {
      // FALLBACK: Orders only
      stats = {
        totalViews: intelligence.behavior.browsing.totalViews,
        totalPurchases: intelligence.behavior.shopping.purchaseHistory.totalOrders,
        totalSpent: intelligence.behavior.shopping.purchaseHistory.totalSpent,
        cartAbandonment: 0 // Not available in Order data
      };
    } else {
      // EventLog only (rare case - no orders yet)
      stats = {
        totalViews: intelligence.behavior.browsing.totalViews,
        totalPurchases: intelligence.behavior.shopping.purchases?.count || 0,
        totalSpent: intelligence.behavior.shopping.purchases?.totalSpent || 0,
        cartAbandonment: intelligence.behavior.shopping.cartActions?.abandonmentRate || 0
      };
    }

    // Extract quick insights
    const quickInsights = {
      customerType: intelligence.insights.customerType,
      engagementScore: intelligence.behavior.engagement.engagementScore,
      riskLevel: intelligence.insights.riskLevel.level,
      topTags: intelligence.suggestions.tags.slice(0, 3),
      topNotes: intelligence.suggestions.notes.slice(0, 2),
      nextAction: intelligence.insights.nextBestAction,
      stats,
      dataSource: intelligence.behavior.dataSource // For debugging
    };

    res.status(200).json({
      success: true,
      data: quickInsights
    });

  } catch (error) {
    console.error('[CustomerIntelligence] Quick insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quick insights',
      error: error.message
    });
  }
};
