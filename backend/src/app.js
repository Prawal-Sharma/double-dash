const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const stravaRoutes = require('./routes/strava');

// Import database connection test
const { testConnection } = require('./config/database');

const app = express();

// Trust proxy for Elastic Beanstalk load balancer
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
// app.use(helmet({ // TEMPORARILY DISABLED FOR DEBUGGING
//   crossOriginEmbedderPolicy: false,
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://doubledash.ai', 'https://www.doubledash.ai']
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply general rate limiting
app.use(apiLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    services: {}
  };

  try {
    // Check database connectivity
    const { testConnection } = require('./config/database');
    await testConnection();
    healthCheck.services.database = 'healthy';
  } catch (error) {
    healthCheck.services.database = 'unhealthy';
    healthCheck.status = 'degraded';
  }

  // Check environment variables
  const requiredEnvVars = ['JWT_SECRET', 'STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    healthCheck.services.environment = 'degraded';
    healthCheck.status = 'degraded';
    healthCheck.warnings = [`Missing environment variables: ${missingEnvVars.join(', ')}`];
  } else {
    healthCheck.services.environment = 'healthy';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/strava', stravaRoutes);

// Backward compatibility routes (to be deprecated)
app.use('/register', authRoutes);
app.use('/login', authRoutes);
app.use('/user', authRoutes);
app.use('/exchange_token', stravaRoutes);
app.use('/activities', stravaRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Test database connection on startup
testConnection();

module.exports = app;