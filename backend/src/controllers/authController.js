const User = require('../models/User');
const Activity = require('../models/Activity');
const stravaAPI = require('../utils/stravaApi');
const { generateTokens, setTokenCookies, clearTokenCookies } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.create({ email, password });

    // Generate tokens with user info
    const { accessToken, refreshToken } = generateTokens(user.userId, user.email);

    // Set secure cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      // Also return token for backward compatibility with frontend
      token: accessToken
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens with user info
    const { accessToken, refreshToken } = generateTokens(user.userId, user.email);

    // Set secure cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      // Also return token for backward compatibility with frontend
      token: accessToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    clearTokenCookies(res);
    
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const existingUser = await User.findByEmail(email);
    
    res.json({
      exists: !!existingUser
    });
  } catch (error) {
    next(error);
  }
};

const registerWithStrava = async (req, res, next) => {
  try {
    const { email, password, stravaCode } = req.body;

    // Step 1: Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists. Please login instead.',
        code: 'USER_EXISTS'
      });
    }

    // Step 2: Exchange Strava code for tokens FIRST (validate Strava auth)
    let tokenData;
    try {
      tokenData = await stravaAPI.exchangeCodeForTokens(stravaCode);
      
      if (!tokenData || !tokenData.access_token) {
        return res.status(400).json({
          error: 'Invalid authorization code',
          message: 'Strava authorization failed. Please try again.',
          code: 'STRAVA_AUTH_FAILED'
        });
      }
    } catch (stravaError) {
      console.error('Strava token exchange error:', stravaError);
      
      if (stravaError.response?.status === 400) {
        return res.status(400).json({
          error: 'Strava authorization failed',
          message: 'The authorization code is invalid or has expired. Please try registering again.',
          code: 'STRAVA_CODE_INVALID'
        });
      }
      
      return res.status(500).json({
        error: 'Strava connection failed',
        message: 'Failed to connect to Strava. Please try again later.',
        code: 'STRAVA_CONNECTION_ERROR'
      });
    }

    const { access_token, refresh_token, expires_at } = tokenData;

    // Step 3: Create user account WITH Strava tokens
    const user = await User.create({ email, password });
    
    // Step 4: Update user with Strava tokens
    await user.updateStravaTokens(access_token, refresh_token, expires_at);

    // Step 5: Fetch initial activities from Strava
    try {
      const allActivities = await stravaAPI.getAllActivities(access_token);
      const runActivities = allActivities.filter(activity => activity.type === 'Run');
      
      if (runActivities.length > 0) {
        const formattedActivities = runActivities.map(activity => 
          stravaAPI.formatActivityForStorage(activity, user.userId)
        );
        await Activity.bulkCreate(formattedActivities);
      }
    } catch (activityError) {
      // Log but don't fail registration if activity fetch fails
      console.error('Failed to fetch initial activities:', activityError);
    }

    // Step 6: Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.userId, user.email);

    // Step 7: Set secure cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Step 8: Return success response
    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      token: accessToken,
      stravaConnected: true
    });

  } catch (error) {
    console.error('Registration with Strava error:', error);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid registration data',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  checkEmail,
  registerWithStrava
};