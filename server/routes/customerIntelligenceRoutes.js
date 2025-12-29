import express from 'express';
import { 
  getCustomerIntelligence, 
  applySuggestedTags, 
  applySuggestedNotes,
  getQuickInsights
} from '../controllers/CustomerIntelligenceController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Get full intelligence report for a customer
router.get('/:userId/intelligence', getCustomerIntelligence);

// Get quick insights for dashboard widget
router.get('/:userId/quick-insights', getQuickInsights);

// Apply AI-suggested tags
router.post('/:userId/apply-tags', applySuggestedTags);

// Apply AI-suggested notes
router.post('/:userId/apply-notes', applySuggestedNotes);

export default router;
