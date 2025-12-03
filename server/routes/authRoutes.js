import express from 'express';
import {
    register,
    login,
    logout,
    googleLogin,
    forgotPassword,
    resetPassword,
    verifyEmail,
    addPhone,
    updateProfile,
    changePassword,
    updatePreferences,
    getShippingAddress,
    saveShippingAddress,
    updateShippingAddress
} from '../controllers/AuthController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/verify-email/:token', verifyEmail);
router.post('/add-phone', addPhone);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.post('/logout', authenticate, logout);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.put('/preferences', authenticate, updatePreferences);

// Shipping address routes
router.get('/shipping-address', authenticate, getShippingAddress);
router.post('/shipping-address', authenticate, saveShippingAddress);
router.put('/shipping-address', authenticate, updateShippingAddress);

export default router;