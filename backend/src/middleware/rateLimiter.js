const rateLimit = require('express-rate-limit');

// General API rate limiter (relaxed for better UX)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 200, // Much higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and development endpoints
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    
    // Very relaxed rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return false; // Still apply rate limiting but with higher limits
    }
    
    return false;
  }
});

// Relaxed rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 15, // Much higher limit for development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Optimized rate limiter for Strava API endpoints
const stravaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 200 : 30, // Much higher limit for development
  message: {
    error: 'Too many Strava API requests, please try again later.',
    code: 'STRAVA_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip counting for cached responses
  skip: (req) => {
    // Skip rate limiting for health checks and cached responses
    return req.path === '/health' || req.headers['x-cache-hit'] === 'true';
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  stravaLimiter
};