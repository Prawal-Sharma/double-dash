const rateLimit = require('express-rate-limit');

// General API rate limiter (relaxed for better UX)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased from 100 to 200 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Relaxed rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // increased from 5 to 15 auth requests per windowMs
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
  max: 30, // increased from 10 to 30 Strava requests per minute
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