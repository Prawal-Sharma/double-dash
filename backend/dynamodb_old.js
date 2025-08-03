// backend/dynamodb.js
const AWS = require('aws-sdk');
require('dotenv').config();

console.log('Configuring AWS SDK with region:', process.env.AWS_REGION);
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

console.log('Creating DynamoDB DocumentClient instance');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
module.exports = dynamoDB;
