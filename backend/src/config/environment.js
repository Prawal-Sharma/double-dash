// Environment variable validation and configuration

// Load environment variables from .env file first
require('dotenv').config();

const requiredEnvVars = {
  // AWS Configuration
  AWS_REGION: 'AWS region for DynamoDB and other services',
  
  // Strava API Configuration
  STRAVA_CLIENT_ID: 'Strava OAuth client ID',
  STRAVA_CLIENT_SECRET: 'Strava OAuth client secret',
  
  // JWT Configuration
  JWT_SECRET: 'Secret key for JWT token signing',
  JWT_REFRESH_SECRET: 'Secret key for JWT refresh token signing',
};

// AWS credentials are only required in development (production uses IAM roles)
const developmentOnlyEnvVars = {
  AWS_ACCESS_KEY_ID: 'AWS access key for DynamoDB access',
  AWS_SECRET_ACCESS_KEY: 'AWS secret key for DynamoDB access',
};

const optionalEnvVars = {
  NODE_ENV: { default: 'development', description: 'Application environment' },
  PORT: { default: '3001', description: 'Server port' },
  JWT_EXPIRES_IN: { default: '15m', description: 'JWT token expiration time' },
  JWT_REFRESH_EXPIRES_IN: { default: '7d', description: 'JWT refresh token expiration time' },
};

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validate() {
    console.log('🔍 Validating environment configuration...');
    
    // Check required variables
    this.validateRequiredVars();
    
    // Set defaults for optional variables
    this.setOptionalDefaults();
    
    // Validate specific configurations
    this.validateSpecificConfigs();
    
    // Report results
    this.reportResults();
    
    if (this.errors.length > 0) {
      throw new Error(`Environment validation failed with ${this.errors.length} error(s)`);
    }
  }

  validateRequiredVars() {
    // Check always-required variables
    Object.entries(requiredEnvVars).forEach(([key, description]) => {
      if (!process.env[key]) {
        this.errors.push(`Missing required environment variable: ${key} (${description})`);
      } else if (process.env[key].trim() === '') {
        this.errors.push(`Empty required environment variable: ${key} (${description})`);
      }
    });
    
    // Check development-only variables (AWS credentials)
    if (process.env.NODE_ENV === 'development') {
      Object.entries(developmentOnlyEnvVars).forEach(([key, description]) => {
        if (!process.env[key]) {
          this.errors.push(`Missing required environment variable: ${key} (${description})`);
        } else if (process.env[key].trim() === '') {
          this.errors.push(`Empty required environment variable: ${key} (${description})`);
        }
      });
    } else {
      // In production, we expect IAM roles instead of credentials
      this.warnings.push('Production environment detected - using IAM roles for AWS access');
    }
  }

  setOptionalDefaults() {
    Object.entries(optionalEnvVars).forEach(([key, config]) => {
      if (!process.env[key]) {
        process.env[key] = config.default;
        this.warnings.push(`Using default value for ${key}: ${config.default}`);
      }
    });
  }

  validateSpecificConfigs() {
    // Validate JWT secrets are strong enough
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      this.warnings.push('JWT_SECRET should be at least 32 characters long for security');
    }

    if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
      this.warnings.push('JWT_REFRESH_SECRET should be at least 32 characters long for security');
    }

    // Validate NODE_ENV
    const validEnvironments = ['development', 'production', 'test'];
    if (!validEnvironments.includes(process.env.NODE_ENV)) {
      this.warnings.push(`NODE_ENV "${process.env.NODE_ENV}" is not a standard environment. Expected: ${validEnvironments.join(', ')}`);
    }

    // Validate PORT
    const port = parseInt(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      this.errors.push(`Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535`);
    }

    // Validate AWS region format
    if (process.env.AWS_REGION && !/^[a-z]+-[a-z]+-\d+$/.test(process.env.AWS_REGION)) {
      this.warnings.push(`AWS_REGION "${process.env.AWS_REGION}" doesn't match standard AWS region format`);
    }

    // Validate Strava Client ID format (should be numeric)
    if (process.env.STRAVA_CLIENT_ID && !/^\d+$/.test(process.env.STRAVA_CLIENT_ID)) {
      this.warnings.push('STRAVA_CLIENT_ID should be numeric');
    }
  }

  reportResults() {
    if (this.warnings.length > 0) {
      console.warn('⚠️  Environment warnings:');
      this.warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.error('❌ Environment errors:');
      this.errors.forEach(error => console.error(`   - ${error}`));
    } else {
      console.log('✅ Environment validation passed');
    }
  }
}

// Export configuration object with validated environment variables
const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT),
  
  // AWS (conditional based on environment)
  AWS_REGION: process.env.AWS_REGION,
  ...(process.env.NODE_ENV === 'development' && {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  }),
  
  // Strava
  STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  
  // Computed values
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

// Initialize and validate environment
const validator = new EnvironmentValidator();
validator.validate();

module.exports = config;