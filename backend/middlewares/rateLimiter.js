// middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

// General rate limiter for most routes
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for product creation
export const createProductLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 product creations per hour
  message: {
    success: false,
    message: 'Too many products created from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});