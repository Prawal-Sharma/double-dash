const User = require('../models/User');
const Activity = require('../models/Activity');
const stravaAPI = require('../utils/stravaApi');

const exchangeToken = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    // Exchange code for access token
    const tokenData = await stravaAPI.exchangeCodeForTokens(code);
    const { access_token, refresh_token, expires_at } = tokenData;

    // Update user with Strava tokens
    const user = await User.findById(userId);
    await user.updateStravaTokens(access_token, refresh_token, expires_at);

    // Fetch all activities from Strava
    const allActivities = await stravaAPI.getAllActivities(access_token);

    // Filter for run activities
    const runActivities = allActivities.filter(activity => activity.type === 'Run');

    // Format and store activities
    const formattedActivities = runActivities.map(activity => 
      stravaAPI.formatActivityForStorage(activity, userId)
    );

    await Activity.bulkCreate(formattedActivities);

    // Get stored activities and calculate summary
    const storedActivities = await Activity.findByUserId(userId);
    const summary = Activity.calculateSummary(storedActivities);

    res.json({
      message: 'Strava data synchronized successfully',
      activities: storedActivities,
      summary
    });
  } catch (error) {
    next(error);
  }
};

const getActivities = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const activities = await Activity.findByUserId(userId);
    
    if (activities.length === 0) {
      return res.json({
        activities: [],
        summary: {
          totalActivities: 0,
          totalDistance: 0,
          totalElevation: 0,
          totalMovingTime: 0,
          activityTypes: {}
        }
      });
    }

    const summary = Activity.calculateSummary(activities);

    res.json({
      activities,
      summary
    });
  } catch (error) {
    next(error);
  }
};

const refreshActivities = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user.accessToken) {
      return res.status(400).json({
        error: 'No Strava connection found. Please connect to Strava first.',
        code: 'NO_STRAVA_CONNECTION'
      });
    }

    let { accessToken, refreshToken, expiresAt } = user;

    // Check if access token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (expiresAt < currentTime) {
      // Refresh the token
      const tokenData = await stravaAPI.refreshAccessToken(refreshToken);
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      expiresAt = tokenData.expires_at;

      // Update user with new tokens
      await user.updateStravaTokens(accessToken, refreshToken, expiresAt);
    }

    // Fetch new activities from Strava
    const allActivities = await stravaAPI.getAllActivities(accessToken);

    // Filter for run activities
    const runActivities = allActivities.filter(activity => activity.type === 'Run');

    // Format and store new activities
    const formattedActivities = runActivities.map(activity => 
      stravaAPI.formatActivityForStorage(activity, userId)
    );

    await Activity.bulkCreate(formattedActivities);

    // Get all stored activities and recalculate summary
    const storedActivities = await Activity.findByUserId(userId);
    const summary = Activity.calculateSummary(storedActivities);

    res.json({
      message: 'Activities refreshed successfully',
      activities: storedActivities,
      summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exchangeToken,
  getActivities,
  refreshActivities
};