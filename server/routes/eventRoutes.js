import express from 'express';
import jwt from 'jsonwebtoken';
import { trackEvents, getUserEventStats } from '../controllers/EventController.js';
import { authenticate, isAdmin, optionalAuth } from '../middleware/authMiddleware.js';
import EventLog from '../models/EventLogModel.js';

const router = express.Router();

// Middleware to parse text body from beacon (sendBeacon sends as text/plain)
router.use(express.text({ type: 'text/plain' }));
router.use((req, res, next) => {
  // If body is a string, try to parse as JSON
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      console.error('[Event] Failed to parse beacon body:', err.message);
    }
  }
  next();
});

// Public endpoint - can be used by anonymous users (batch events)
router.post('/track', trackEvents);

// Single event endpoint for beacon API (no auth required, supports anonymous)
router.post('/', async (req, res) => {
  try {
    const { type, data, timestamp, token } = req.body;

    if (!type) {
      // Beacon API doesn't wait for response, return 200 anyway
      return res.status(200).json({ success: false });
    }

    // Extract user ID from token or data
    let userId = data?.userId || null;
    
    // Try to get user from token if provided
    if (token && !userId) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch (err) {
        // Token invalid, continue as anonymous
      }
    }

    // Create event log
    await EventLog.create({
      userId: userId || null,
      type,
      data: data || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      sessionId: data?.sessionId || null,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    console.log(`✅ [Event] ${type} - User: ${userId || 'anonymous'}`);

    // Return 200 for beacon (doesn't wait for response)
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Event Tracking] Error:', error);
    // Don't fail beacon requests
    res.status(200).json({ success: false });
  }
});

// Admin only - get user event stats
router.get('/stats/:userId', authenticate, isAdmin, getUserEventStats);

export default router;

