const dynamoDB = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.userId = data.userId;
    this.email = data.email;
    this.hashedPassword = data.hashedPassword;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.expiresAt = data.expiresAt;
    this.preferences = data.preferences || {};
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async findByEmail(email) {
    try {
      const result = await dynamoDB.scan({
        TableName: 'Users',
        FilterExpression: '#em = :email',
        ExpressionAttributeNames: { '#em': 'email' },
        ExpressionAttributeValues: { ':email': email },
      }).promise();

      return result.Items.length > 0 ? new User(result.Items[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  static async findById(userId) {
    try {
      const result = await dynamoDB.get({
        TableName: 'Users',
        Key: { userId },
      }).promise();

      return result.Item ? new User(result.Item) : null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { email, password } = userData;
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        const error = new Error('User already exists');
        error.name = 'ValidationError';
        throw error;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = uuidv4();
      const now = new Date().toISOString();

      const newUser = {
        userId,
        email,
        hashedPassword,
        preferences: {},
        createdAt: now,
        updatedAt: now
      };

      await dynamoDB.put({
        TableName: 'Users',
        Item: newUser,
      }).promise();

      return new User(newUser);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateStravaTokens(accessToken, refreshToken, expiresAt) {
    try {
      const updatedAt = new Date().toISOString();
      
      await dynamoDB.update({
        TableName: 'Users',
        Key: { userId: this.userId },
        UpdateExpression: 'SET accessToken = :at, refreshToken = :rt, expiresAt = :ea, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':at': accessToken,
          ':rt': refreshToken,
          ':ea': expiresAt,
          ':ua': updatedAt
        }
      }).promise();

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.expiresAt = expiresAt;
      this.updatedAt = updatedAt;
    } catch (error) {
      throw new Error(`Failed to update Strava tokens: ${error.message}`);
    }
  }

  async updatePreferences(preferences) {
    try {
      const updatedAt = new Date().toISOString();
      
      await dynamoDB.update({
        TableName: 'Users',
        Key: { userId: this.userId },
        UpdateExpression: 'SET preferences = :pref, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':pref': { ...this.preferences, ...preferences },
          ':ua': updatedAt
        }
      }).promise();

      this.preferences = { ...this.preferences, ...preferences };
      this.updatedAt = updatedAt;
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  async updateLastSync() {
    try {
      const lastSyncTime = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      await dynamoDB.update({
        TableName: 'Users',
        Key: { userId: this.userId },
        UpdateExpression: 'SET lastSyncTime = :lst, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':lst': lastSyncTime,
          ':ua': updatedAt
        }
      }).promise();

      this.lastSyncTime = lastSyncTime;
      this.updatedAt = updatedAt;
    } catch (error) {
      throw new Error(`Failed to update last sync time: ${error.message}`);
    }
  }

  async validatePassword(password) {
    return bcrypt.compare(password, this.hashedPassword);
  }

  toJSON() {
    return {
      userId: this.userId,
      email: this.email,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;