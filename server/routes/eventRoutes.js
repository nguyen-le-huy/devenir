import express from 'express';
import { trackEvents, getUserEventStats, trackSingleEvent } from '../controllers/EventController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { trackEventSchema, userStatsSchema, singleEventSchema } from '../validators/event.validator.js';

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
router.post('/track', validate(trackEventSchema), trackEvents);

// Single event endpoint for beacon API (no auth required, supports anonymous)
router.post('/', validate(singleEventSchema), trackSingleEvent);

// Admin only - get user event stats
router.get('/stats/:userId', authenticate, isAdmin, validate(userStatsSchema), getUserEventStats);

export default router;

