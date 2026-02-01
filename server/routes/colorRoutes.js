import express from 'express';
import {
    getColors,
    createColor,
    updateColor,
    deleteColor,
} from '../controllers/ColorController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
    createColorSchema,
    updateColorSchema,
    colorIdParamSchema
} from '../validators/color.validator.js';

const router = express.Router();

// Public
router.get('/', getColors);

// Admin
router.post('/', authenticate, isAdmin, validate(createColorSchema), createColor);
router.put('/:id', authenticate, isAdmin, validate(updateColorSchema), updateColor);
router.delete('/:id', authenticate, isAdmin, validate(colorIdParamSchema), deleteColor);

export default router;
