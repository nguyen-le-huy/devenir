import asyncHandler from 'express-async-handler';
import authService from '../services/auth/auth.service.js';

/**
 * Auth Controller
 * - Handles HTTP request/response
 * - Delegates business logic to AuthService
 * - Clean, minimal, and focused on HTTP concerns
 */

// ==================== PUBLIC ROUTES ====================

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, phone, password } = req.body;



  try {
    const user = await authService.register({
      username, email, phone, password,
      clientUrl: process.env.CLIENT_URL
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify.',
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;



  try {
    const { user, token } = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        birthday: user.birthday,
        role: user.role
      }
    });
  } catch (error) {
    const status = error.message.includes('locked') ? 423 :
      error.message.includes('verify') ? 403 : 401;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logout successful' });
});

/**
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;


  try {
    const { user, token } = await authService.googleLogin({ credential });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(401).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;


  await authService.forgotPassword({ email, clientUrl: process.env.CLIENT_URL });

  // Always return success for security (prevent email enumeration)
  res.status(200).json({ success: true, message: 'If email exists, reset instructions sent.' });
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;



  try {
    await authService.resetPassword({ token, newPassword });
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;


  try {
    await authService.verifyEmail(token);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==================== PRIVATE ROUTES ====================

/**
 * @route   POST /api/auth/add-phone
 * @access  Private
 */
export const addPhone = asyncHandler(async (req, res) => {
  const { phone, googleToken } = req.body;



  try {
    const { user, token } = await authService.addPhone({ phone, googleToken });
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, phone: user.phone, role: user.role }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const user = await authService.updateProfile(userId, req.body);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        birthday: user.birthday,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;


  try {
    await authService.changePassword(userId, { currentPassword, newPassword });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const user = await authService.updatePreferences(userId, req.body);
    res.status(200).json({
      success: true,
      user: { id: user._id, preferences: user.preferences }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==================== SHIPPING ADDRESS ====================

/**
 * @route   GET /api/auth/shipping-address
 * @access  Private
 */
export const getShippingAddress = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const address = await authService.getShippingAddress(userId);
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/shipping-address
 * @access  Private
 */
export const saveShippingAddress = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { firstName, lastName, phoneNumber, address, city, district, zipCode } = req.body;


  try {
    const newAddress = await authService.saveShippingAddress(userId, req.body);
    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/shipping-address
 * @access  Private
 */
export const updateShippingAddress = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { firstName, lastName, phoneNumber, address, city, district, zipCode } = req.body;


  try {
    const updatedAddress = await authService.updateShippingAddress(userId, req.body);
    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
