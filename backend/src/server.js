// Load and validate environment configuration first
const config = require('./config/environment');
const app = require('./app');

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${config.IS_PRODUCTION ? 'doubledash.ai' : 'localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = server;