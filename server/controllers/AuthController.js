import User from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { sendResetEmail } from '../utils/emailService.js';
import asyncHandler from 'express-async-handler';

/**
 * Tạo JWT Token
 * @param {String} userId - User ID
 * @returns {String} - JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

/**
 * Tạo username ngẫu nhiên cho Google OAuth
 * Format: user_XXXXXXXX (8 ký tự random)
 * @returns {String} - Random username
 */
const generateRandomUsername = async () => {
  let username;
  let userExists = true;

  // Tạo username random cho đến khi không trùng
  while (userExists) {
    const randomStr = Math.random().toString(36).substring(2, 10);
    username = `user_${randomStr}`;
    const existingUser = await User.findOne({ username });
    userExists = !!existingUser;
  }

  return username;
}

// Khởi tạo Google OAuth2 Client KHÔNG có redirect URI
// Vì sử dụng Google Identity Services (gsi) client-side flow
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * REGISTRATION - Đăng ký tài khoản mới
 * @route POST /api/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, phone, password } = req.body;

  // valodation - check input
  if (!username || !email || !phone || !password) {
    return res.status(400).json({
      message: 'Please provide all required fields'
    });
  }

  // check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      message: 'Email already in use'
    });
  }

  // check if username already exists
  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    return res.status(400).json({
      message: 'Username already in use'
    });
  }

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // create new user (not verified yet)
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    phone: phone,
    password,
    role: 'user', // default role
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires
  });

  // Send verification email
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendResetEmail({
    email: user.email,
    subject: 'Verify your email - Devenir',
    message: `Please click the link below to verify your email:\n\n${verificationUrl}\n\nThis link expires in 24 hours.`
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    }
  });
});

/**
 * LOGIN - Đăng nhập
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validation - check input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password is required!'
    });
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password!'
    });
  }

  // Check if account is locked
  if (user.isLocked()) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    return res.status(423).json({
      success: false,
      message: `Account is locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
    });
  }

  // check password
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    // Increment login attempts
    const isNowLocked = await user.incLoginAttempts();

    if (isNowLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to too many failed login attempts. Please try again in 2 hours.'
      });
    }

    const remainingAttempts = 5 - user.loginAttempts;
    return res.status(401).json({
      success: false,
      message: `Invalid password! ${remainingAttempts} attempts remaining before account lock.`
    });
  }

  // Reset login attempts after successful login
  await user.resetLoginAttempts();

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first. Check your inbox for the verification link.'
    });
  }

  // create token
  const token = generateToken(user._id, user.role);
  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      birthday: user.birthday,
      role: user.role,
      lastLogin: user.lastLogin,
    }
  });
});

/**
* LOGOUT - Đăng xuất
* @route POST /api/auth/logout
* @access Private
*/
export const logout = asyncHandler(async (req, res, next) => {
  // JWT không có state ở server, logout chỉ cần xóa token ở client
  res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

/**
 * GOOGLE OAUTH LOGIN
 * @route POST /api/auth/google
 * @access Public
 */
export const googleLogin = asyncHandler(async (req, res, next) => {
  const { credential } = req.body; // credential từ Google Identity API

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: 'Google credential không được tìm thấy'
    });
  }

  try {
    // 1️⃣ Verify credential với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture, aud, iss, azp } = payload;

    // Log để debug (chỉ trong development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Google token verified:', {
        email,
        aud,
        iss,
        azp,
        expectedAudience: process.env.GOOGLE_CLIENT_ID
      });
    }

    // 2️⃣ Kiểm tra user theo googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // User đã tồn tại với googleId
      const token = generateToken(user._id, user.role);
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
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
    }

    // 3️⃣ Kiểm tra xem email có tồn tại không (đăng ký truyền thống)
    user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Email tồn tại nhưng chưa có googleId
      // Cập nhật googleId cho user này và tự động verify email (vì Google đã xác nhận)
      user.googleId = googleId;
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      const token = generateToken(user._id, user.role);
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
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
    }

    // 4️⃣ Tạo user mới
    // Lấy username từ phần trước @ của email
    // Nếu trùng, thêm số random ở cuối
    let username = email.split('@')[0].toLowerCase();
    let userExists = await User.findOne({ username });
    let counter = 1;
    while (userExists) {
      username = `${email.split('@')[0].toLowerCase()}${counter}`;
      userExists = await User.findOne({ username });
      counter++;
    }

    user = await User.create({
      username,
      email: email.toLowerCase(),
      googleId,
      // Password để trống cho OAuth accounts
      password: undefined,
      role: 'user',
      // Auto-verify email cho Google OAuth users vì Google đã xác nhận
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Đăng ký và đăng nhập thành công',
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
    // 🔍 Enhanced debug logging to identify audience mismatch
    let decodedPayload = null;
    try {
      // Decode token payload without verification to see what's inside
      if (credential) {
        const payloadBase64 = credential.split('.')[1];
        decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      }
    } catch (decodeError) {
      // Ignore decode errors
    }

    console.error('❌ Google verification error:', {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      serverClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      serverClientIdValue: process.env.GOOGLE_CLIENT_ID || 'MISSING',
      credentialLength: credential ? credential.length : 0,
      credentialPrefix: credential ? credential.substring(0, 50) : 'none',
      // Show token payload to compare aud/azp with server's GOOGLE_CLIENT_ID
      tokenPayload: decodedPayload ? {
        aud: decodedPayload.aud,
        azp: decodedPayload.azp,
        iss: decodedPayload.iss,
        email: decodedPayload.email
      } : null,
      mismatchDetected: decodedPayload && process.env.GOOGLE_CLIENT_ID &&
        (decodedPayload.aud !== process.env.GOOGLE_CLIENT_ID)
    });

    // Trả về thông tin lỗi chi tiết hơn để debug
    let errorMessage = 'Google authentication thất bại';
    if (error.message?.includes('Token used too late') || error.message?.includes('expired')) {
      errorMessage = 'Token đã hết hạn, vui lòng thử lại';
    } else if (error.message?.includes('Invalid token signature')) {
      errorMessage = 'Token không hợp lệ';
    } else if (error.message?.includes('audience') || error.message?.includes('aud')) {
      errorMessage = 'Cấu hình Google Client ID không khớp với domain';
    } else if (error.message?.includes('azp')) {
      errorMessage = 'Authorized party (azp) mismatch - kiểm tra OAuth client setup';
    }

    return res.status(401).json({
      success: false,
      message: errorMessage,
      debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * FORGOT PASSWORD
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email là bắt buộc'
    });
  }

  // 1️⃣ Tìm user bằng email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Không trả về "user không tồn tại" vì bảo mật
    return res.status(200).json({
      success: true,
      message: 'Nếu email tồn tại, bạn sẽ nhận được email reset'
    });
  }

  // 2️⃣ Tạo reset token
  // Token là một chuỗi ngẫu nhiên được hash
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 3️⃣ Lưu token vào database
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  await user.save();

  // 4️⃣ Gửi email
  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendResetEmail({
      email: user.email,
      subject: 'Devenir - Reset Your Password',
      message: `You requested to reset your password. Click the link below:\n\n${resetLink}\n\nThis link expires in 1 hour.`
    });

    res.status(200).json({
      success: true,
      message: 'Email reset password đã được gửi'
    });
  } catch (error) {
    // Xóa token nếu gửi email thất bại
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi email'
    });
  }
});

/**
 * RESET PASSWORD
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password mới là bắt buộc'
    });
  }

  // 1️⃣ Hash token để so sánh với database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // 2️⃣ Tìm user với token hợp lệ và chưa hết hạn
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }

  // 3️⃣ Cập nhật password mới
  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save(); // Password sẽ được hash tự động

  // 4️⃣ Trả về response
  res.status(200).json({
    success: true,
    message: 'Mật khẩu đã được cập nhật thành công'
  });
});

/**
 * VERIFY EMAIL
 * @route POST /api/auth/verify-email/:token
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  console.log('Verifying token:', token);
  console.log('Current time:', Date.now());

  // Find user with valid token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  console.log('User found:', user ? `${user.email}` : 'NOT FOUND');

  if (!user) {
    // Try to find without expiry check to debug
    const userNoExpiry = await User.findOne({
      emailVerificationToken: token
    });
    console.log('User without expiry check:', userNoExpiry ? `${userNoExpiry.email}, expires at: ${userNoExpiry.emailVerificationExpires}` : 'NOT FOUND');

    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. Please log in with your account.'
  });
});

/**
 * ADD PHONE NUMBER - For Google OAuth users or after email verification
 * @route POST /api/auth/add-phone
 * @access Private
 */
export const addPhone = asyncHandler(async (req, res) => {
  const { phone, googleToken } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  // Validate phone format
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }

  // If googleToken provided (after Google signup), use it to find/create user
  if (googleToken) {
    try {
      // Verify the credential
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { email, name, sub: googleId } = payload;

      // Check if user already has phone
      let user = await User.findOne({ googleId });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add phone number
      user.phone = phone;
      await user.save();

      // Generate token for auto-login
      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        success: true,
        message: 'Phone number added successfully',
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
      console.error('Google verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed'
      });
    }
  }

  res.status(400).json({
    success: false,
    message: 'Google token is required'
  });
});

/**
 * UPDATE PROFILE - Cập nhật thông tin cá nhân
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { username, phone, firstName, lastName, birthday } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Validate phone format
  if (phone && !/^(\+84|0)[0-9]{9,10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }

  // Check if username is unique (if changing)
  if (username) {
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: userId }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already in use'
      });
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        username: username || undefined,
        phone: phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        birthday: birthday || undefined,
      }
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
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
});

/**
 * CHANGE PASSWORD - Đổi mật khẩu
 * @route POST /api/auth/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isPasswordMatch = await user.matchPassword(currentPassword);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * UPDATE PREFERENCES - Cập nhật sở thích nhận thông báo
 * @route PUT /api/auth/preferences
 * @access Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { channels, interests } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'preferences.channels': channels,
        'preferences.interests': interests
      }
    },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    preferences: user.preferences
  });
});

/**
 * GET SHIPPING ADDRESS - Lấy địa chỉ giao hàng
 * @route GET /api/auth/shipping-address
 * @access Private
 */
export const getShippingAddress = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Find default address or first address
  const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];

  res.status(200).json({
    success: true,
    data: defaultAddress || null
  });
});

/**
 * SAVE SHIPPING ADDRESS - Lưu địa chỉ giao hàng mới
 * @route POST /api/auth/shipping-address
 * @access Private
 */
export const saveShippingAddress = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { firstName, lastName, phoneNumber, address, city, district, zipCode } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Validate required fields
  if (!firstName || !lastName || !phoneNumber || !address || !city || !district || !zipCode) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Create new address object
  const newAddress = {
    fullName: `${firstName} ${lastName}`,
    phone: phoneNumber,
    street: address,
    city,
    district,
    postalCode: zipCode,
    isDefault: user.addresses.length === 0 // First address is default
  };

  // If this is not the first address, unset other default addresses
  if (user.addresses.length > 0) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    newAddress.isDefault = true; // Latest address becomes default
  }

  user.addresses.push(newAddress);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Shipping address saved successfully',
    data: newAddress
  });
});

/**
 * UPDATE SHIPPING ADDRESS - Cập nhật địa chỉ giao hàng
 * @route PUT /api/auth/shipping-address
 * @access Private
 */
export const updateShippingAddress = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { firstName, lastName, phoneNumber, address, city, district, zipCode } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Validate required fields
  if (!firstName || !lastName || !phoneNumber || !address || !city || !district || !zipCode) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Find default address or first address
  const defaultAddressIndex = user.addresses.findIndex(addr => addr.isDefault);
  const targetIndex = defaultAddressIndex !== -1 ? defaultAddressIndex : 0;

  if (user.addresses.length === 0) {
    // No address exists, create new one
    const newAddress = {
      fullName: `${firstName} ${lastName}`,
      phone: phoneNumber,
      street: address,
      city,
      district,
      postalCode: zipCode,
      isDefault: true
    };
    user.addresses.push(newAddress);
  } else {
    // Update existing address
    user.addresses[targetIndex] = {
      fullName: `${firstName} ${lastName}`,
      phone: phoneNumber,
      street: address,
      city,
      district,
      postalCode: zipCode,
      isDefault: true
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Shipping address updated successfully',
    data: user.addresses[targetIndex]
  });
});

export default {
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
};

