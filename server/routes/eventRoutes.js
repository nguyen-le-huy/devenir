import express from 'express';
import { trackEvents, getUserEventStats, trackSingleEvent } from '../controllers/EventController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { trackEventSchema, userStatsSchema, singleEventSchema } from '../validators/event.validator.js';

const router = express.Router();

// Middleware to parse text body from beacon (sendBeacon sends as text/plain)
// Middleware to parse text body from beacon (sendBeacon sends as text/plain)
// Use '*/*' to ensure we catch whatever the browser sends with sendBeacon
router.use(express.text({ type: '*/*', limit: '1mb' }));

router.use((req, res, next) => {
  // If request is already parsed by global middleware (e.g. application/json via fetch), skip
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }

  // If body is a string (from express.text), try to parse as JSON
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      console.error('[Event] Failed to parse beacon body:', err.message);
      // Return 400 immediately if JSON is invalid, to avoid 500 later
      return res.status(400).json({ success: false, message: 'Invalid JSON body' });
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

