import express from 'express';
import {
    getColors,
    createColor,
    updateColor,
    deleteColor,
} from '../controllers/ColorController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getColors)
    .post(authenticate, isAdmin, createColor);

router.route('/:id')
    .put(authenticate, isAdmin, updateColor)
    .delete(authenticate, isAdmin, deleteColor);

export default router;
