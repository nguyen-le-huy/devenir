import asyncHandler from 'express-async-handler';
import eventService from '../services/event.service.js';

/**
 * POST /api/events/track
 * Batch event tracking endpoint
 */
export const trackEvents = asyncHandler(async (req, res) => {
  try {
    const { events } = req.body; // Validated by Zod
    const userId = req.user?._id?.toString() || req.body.userId || 'anonymous';

    const processedCount = await eventService.trackEvents(userId, events);

    res.json({ success: true, processed: processedCount });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/stats/:userId
 * Get event statistics for a user
 */
export const getUserEventStats = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query; // Validated and transformed by Zod

    const stats = await eventService.getUserEventStats(userId, days);

    res.json({ success: true, stats, period: `${days} days` });
  } catch (error) {
    console.error('getUserEventStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Single event endpoint for beacon API
 */
export const trackSingleEvent = async (req, res) => {
  try {
    // Beacon API doesn't wait for response, return 200 immediately
    res.status(200).json({ success: true });

    // Process in background
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    await eventService.trackSingleEvent(req.body, userAgent, ip);

  } catch (error) {
    console.error('[Event Tracking] Error:', error);
    // No response needed as we already returned 200
  }
};
