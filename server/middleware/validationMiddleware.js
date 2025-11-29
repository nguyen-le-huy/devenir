/**
 * Input Validation & Sanitization Middleware
 * Protects against XSS, SQL Injection, and malformed data
 */

import mongoose from 'mongoose';

/**
 * Sanitize string input to prevent XSS
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName] || req.body[paramName];
        
        if (id && !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`,
            });
        }
        
        next();
    };
};

/**
 * Validate category creation/update input
 */
export const validateCategoryInput = (req, res, next) => {
    const { name, description, slug, parentCategory, sortOrder } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Valid category name is required',
        });
    }
    
    // Sanitize string inputs
    if (name) req.body.name = sanitizeString(name);
    if (description) req.body.description = sanitizeString(description);
    if (slug) req.body.slug = sanitizeString(slug.toLowerCase());
    
    // Validate name length
    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Category name must be between 2-100 characters',
        });
    }
    
    // Validate slug format (if provided)
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
            success: false,
            message: 'Slug must contain only lowercase letters, numbers, and hyphens',
        });
    }
    
    // Validate parentCategory ObjectId
    if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid parent category ID',
        });
    }
    
    // Validate sortOrder
    if (sortOrder !== undefined) {
        const order = parseInt(sortOrder);
        if (isNaN(order) || order < 0 || order > 9999) {
            return res.status(400).json({
                success: false,
                message: 'Sort order must be a number between 0-9999',
            });
        }
        req.body.sortOrder = order;
    }
    
    next();
};

/**
 * Rate limiting per IP (simple in-memory implementation)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per window

export const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const ipData = requestCounts.get(ip);
    
    if (now > ipData.resetTime) {
        // Reset window
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    if (ipData.count >= MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
        });
    }
    
    ipData.count++;
    next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;
    
    if (page) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page must be a positive number',
            });
        }
        req.query.page = pageNum;
    }
    
    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1-100',
            });
        }
        req.query.limit = limitNum;
    }
    
    next();
};

/**
 * Sanitize all string fields in request body
 */
export const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        });
    }
    next();
};
