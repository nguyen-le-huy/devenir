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

import {
    registerSchema,
    loginSchema,
    googleLoginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    addPhoneSchema,
    changePasswordSchema,
    updateProfileSchema,
    shippingAddressSchema
} from '../validators/auth.validator.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleLoginSchema), googleLogin);
router.post('/verify-email/:token', validate(verifyEmailSchema), verifyEmail);
router.post('/add-phone', validate(addPhoneSchema), addPhone);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

router.post('/logout', authenticate, logout);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.put('/preferences', authenticate, updatePreferences);

// Shipping address routes
router.get('/shipping-address', authenticate, getShippingAddress);
router.post('/shipping-address', authenticate, validate(shippingAddressSchema), saveShippingAddress);
router.put('/shipping-address', authenticate, validate(shippingAddressSchema), updateShippingAddress);

export default router;