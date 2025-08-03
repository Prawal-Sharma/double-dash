const User = require('../models/User');
const { generateTokens, setTokenCookies, clearTokenCookies } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.create({ email, password });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.userId);

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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.userId);

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

module.exports = {
  register,
  login,
  logout,
  getProfile
};