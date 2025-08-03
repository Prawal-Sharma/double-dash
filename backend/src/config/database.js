const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
const awsConfig = {
  region: process.env.AWS_REGION || 'us-west-2',
};

// Use explicit credentials if provided (for production)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}

// For local development, use AWS profile from credentials file
if (process.env.AWS_PROFILE && process.env.NODE_ENV === 'development') {
  // AWS SDK will automatically use the profile from ~/.aws/credentials
  process.env.AWS_PROFILE = process.env.AWS_PROFILE;
}

AWS.config.update(awsConfig);

// Create DynamoDB DocumentClient instance
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Test the connection
const testConnection = async () => {
  try {
    await dynamoDB.scan({
      TableName: 'Users',
      Limit: 1
    }).promise();
    console.log('✅ DynamoDB connection successful');
  } catch (error) {
    console.error('❌ DynamoDB connection failed:', error.message);
  }
};

module.exports = dynamoDB;
module.exports.testConnection = testConnection;