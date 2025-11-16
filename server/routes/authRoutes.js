import express from 'express';
import { register, login, logout, googleLogin, forgotPassword, resetPassword, verifyEmail, addPhone } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router =express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/verify-email/:token', verifyEmail);
router.post('/add-phone', addPhone);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.post('/logout', authenticate, logout);

export default router;