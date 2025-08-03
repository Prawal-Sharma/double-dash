const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // DEBUG: Log what we receive
    console.log('🔍 Auth middleware - headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : 'none'
    });
    
    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET missing');
      return res.status(500).json({ 
        error: 'Server configuration error',
        code: 'JWT_SECRET_MISSING'
      });
    }
    
    // First check for JWT in cookies (more secure)
    let token = req.cookies?.jwt;
    console.log('🔍 Cookie token:', token ? 'exists' : 'none');
    
    // Check request body (POST requests - CloudFront-safe)
    if (!token && req.body?.token) {
      token = req.body.token;
      console.log('🔍 Token from request body:', token ? token.substring(0, 30) + '...' : 'none');
    }
    
    // Check query parameter (CloudFront-safe fallback)
    if (!token && req.query.token) {
      token = req.query.token;
      console.log('🔍 Token from query param:', token ? token.substring(0, 30) + '...' : 'none');
    }
    
    // Check custom header (CloudFront-friendly)
    if (!token) {
      const customAuthHeader = req.headers['x-auth-token'];
      console.log('🔍 X-Auth-Token header:', customAuthHeader ? 'exists' : 'none');
      if (customAuthHeader) {
        token = customAuthHeader;
      }
    }
    
    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers.authorization;
      console.log('🔍 Auth header:', authHeader);
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔍 Extracted token from header:', token ? token.substring(0, 30) + '...' : 'none');
      }
    }

    if (!token) {
      console.warn('❌ No token found in cookies or headers');
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = authMiddleware;