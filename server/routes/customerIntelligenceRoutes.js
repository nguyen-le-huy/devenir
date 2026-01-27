import express from 'express';
import {
  getCustomerIntelligence,
  applySuggestedTags,
  applySuggestedNotes,
  getQuickInsights
} from '../controllers/CustomerIntelligenceController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  customerIntelligenceParamSchema,
  intelligenceQuerySchema,
  applyTagsSchema,
  applyNotesSchema
} from '../validators/customerIntelligence.validator.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get full intelligence report for a customer
router.get('/:userId/intelligence', validate(customerIntelligenceParamSchema), validate(intelligenceQuerySchema), getCustomerIntelligence);

// Get quick insights for dashboard widget
router.get('/:userId/quick-insights', validate(customerIntelligenceParamSchema), getQuickInsights);

// Apply AI-suggested tags
router.post('/:userId/apply-tags', validate(applyTagsSchema), applySuggestedTags);

// Apply AI-suggested notes
router.post('/:userId/apply-notes', validate(applyNotesSchema), applySuggestedNotes);

export default router;
