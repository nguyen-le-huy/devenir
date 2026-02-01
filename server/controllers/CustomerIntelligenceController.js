import asyncHandler from 'express-async-handler';
import customerIntelligenceService from '../services/customerIntelligence.service.js';

/**
 * Get customer intelligence report
 * GET /api/customers/:userId/intelligence
 * Admin only
 */
export const getCustomerIntelligence = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days } = req.query; // Parsed by Zod

  try {
    const intelligence = await customerIntelligenceService.getIntelligence(userId, days);
    res.status(200).json({ success: true, data: intelligence });
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * Get quick customer insights
 * GET /api/customers/:userId/quick-insights
 */
export const getQuickInsights = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  try {
    const insights = await customerIntelligenceService.getQuickInsights(userId);
    res.status(200).json({ success: true, data: insights });
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * Apply suggested tags
 * POST /api/customers/:userId/apply-tags
 */
export const applySuggestedTags = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { tags } = req.body;

  try {
    const result = await customerIntelligenceService.applyTags(userId, tags);
    res.status(200).json({
      success: true,
      message: `Applied ${tags.length} tags successfully`,
      data: result
    });
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * Apply suggested notes
 * POST /api/customers/:userId/apply-notes
 */
export const applySuggestedNotes = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { notes } = req.body;
  const adminId = req.user._id;

  try {
    const result = await customerIntelligenceService.applyNotes(userId, notes, adminId);
    res.status(200).json({
      success: true,
      message: `Applied ${notes.length} notes successfully`,
      data: result
    });
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});
