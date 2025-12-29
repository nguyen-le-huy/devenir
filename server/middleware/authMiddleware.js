import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import asyncHandler from 'express-async-handler';

/**
 * AUTHENTICATE MIDDLEWARE
 * Kiểm tra JWT token từ header Authorization
 * Nếu hợp lệ, attach user info vào req.user
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // 1️⃣ Lấy token từ header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token không được tìm thấy'
    });
  }

  const token = authHeader.split(' ')[1]; // Lấy phần sau "Bearer "

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3️⃣ Tìm user từ decoded data
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // 4️⃣ Attach user info vào request
    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
});

/**
 * ISADMIN MIDDLEWARE
 * Kiểm tra xem user có role === 'admin' không
 * Phải sử dụng AFTER authenticate middleware
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Token không được tìm thấy'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Yêu cầu quyền Admin'
    });
  }

  next();
};

/**
 * OPTIONAL AUTH MIDDLEWARE
 * Similar to authenticate but doesn't fail if no token
 * Used for tracking endpoints that work for both logged-in and anonymous users
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // If no token, just continue (anonymous user)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
      req.userId = decoded.userId;
    }
  } catch (error) {
    // Token invalid, but continue anyway (treat as anonymous)
    console.log('Optional auth failed, continuing as anonymous:', error.message);
  }
  
  next();
});