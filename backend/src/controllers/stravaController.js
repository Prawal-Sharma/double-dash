const User = require('../models/User');
const Activity = require('../models/Activity');
const stravaAPI = require('../utils/stravaApi');

const exchangeToken = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    // Check if code is provided
    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required',
        message: 'Strava authorization failed - no code provided'
      });
    }

    // Exchange code for access token
    const tokenData = await stravaAPI.exchangeCodeForTokens(code);
    
    // Check if token exchange was successful
    if (!tokenData || !tokenData.access_token) {
      return res.status(400).json({
        error: 'Invalid authorization code',
        message: 'Strava authorization failed - unable to exchange code for tokens'
      });
    }

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
    // Handle specific Strava API errors
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Strava authorization failed',
        message: 'The authorization code is invalid or has expired. Please try connecting again.',
        details: error.response.data
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Strava authorization denied',
        message: 'Access to Strava was denied. Please authorize the application to continue.',
        details: error.response.data
      });
    }

    // Log the error for debugging
    console.error('Strava token exchange error:', error);
    
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

    // Get the most recent activity date to do incremental sync
    const mostRecentActivity = await Activity.findMostRecentByUserId(userId);
    const afterDate = mostRecentActivity ? 
      Math.floor(new Date(mostRecentActivity.start_date).getTime() / 1000) : 
      null;

    // Fetch new activities from Strava (only activities after the most recent one)
    const allActivities = await stravaAPI.getActivitiesSince(accessToken, afterDate);

    // Filter for run activities
    const runActivities = allActivities.filter(activity => activity.type === 'Run');

    // Format and store new activities (avoid duplicates)
    const formattedActivities = runActivities.map(activity => 
      stravaAPI.formatActivityForStorage(activity, userId)
    );

    if (formattedActivities.length > 0) {
      await Activity.bulkCreate(formattedActivities);
    }

    // Update user's last sync timestamp
    await user.updateLastSync();

    // Get all stored activities and recalculate summary
    const storedActivities = await Activity.findByUserId(userId);
    const summary = Activity.calculateSummary(storedActivities);

    res.json({
      message: `Activities refreshed successfully. ${formattedActivities.length} new activities added.`,
      activities: storedActivities,
      summary,
      newActivitiesCount: formattedActivities.length,
      lastSyncTime: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// New endpoint to check if sync is needed
const checkSyncStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.accessToken) {
      return res.json({
        needsSync: false,
        connected: false,
        message: 'No Strava connection found. Please register and connect your Strava account.',
        lastSyncTime: null,
        hoursElapsed: null
      });
    }

    const lastSyncTime = user.lastSyncTime || user.createdAt;
    const now = new Date();
    const timeSinceLastSync = now - new Date(lastSyncTime);
    const hoursElapsed = timeSinceLastSync / (1000 * 60 * 60);

    // Suggest sync if more than 6 hours have passed
    const needsSync = hoursElapsed > 6;

    res.json({
      needsSync,
      connected: true,
      lastSyncTime,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      message: needsSync ? 
        'New activities may be available' : 
        'Data is up to date'
    });
  } catch (error) {
    console.error('Check sync status error:', error);
    res.status(500).json({
      needsSync: false,
      connected: false,
      message: 'Failed to check sync status',
      error: error.message
    });
  }
};

// Auto-sync endpoint that intelligently syncs based on conditions
const autoSync = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.accessToken) {
      return res.json({
        message: 'No Strava connection found. Please register and connect your Strava account.',
        activities: [],
        summary: {
          totalActivities: 0,
          totalDistance: 0,
          totalElevation: 0,
          totalMovingTime: 0,
          activityTypes: {}
        },
        synced: false,
        connected: false,
        lastSyncTime: null,
        hoursElapsed: null
      });
    }

    const lastSyncTime = user.lastSyncTime || user.createdAt;
    const now = new Date();
    const timeSinceLastSync = now - new Date(lastSyncTime);
    const hoursElapsed = timeSinceLastSync / (1000 * 60 * 60);

    // Only auto-sync if more than 24 hours have passed or forced
    const shouldSync = hoursElapsed > 24 || req.query.force === 'true';

    if (!shouldSync) {
      const storedActivities = await Activity.findByUserId(userId);
      const summary = Activity.calculateSummary(storedActivities);
      
      return res.json({
        message: 'Data is already up to date',
        activities: storedActivities,
        summary,
        synced: false,
        connected: true,
        lastSyncTime,
        hoursElapsed: Math.round(hoursElapsed * 10) / 10
      });
    }

    // Perform the sync using the refresh logic
    req.user = { userId }; // Ensure user context is available
    return refreshActivities(req, res, next);

  } catch (error) {
    console.error('Auto-sync error:', error);
    res.status(500).json({
      message: 'Auto-sync failed',
      error: error.message,
      synced: false,
      connected: false
    });
  }
};

module.exports = {
  exchangeToken,
  getActivities,
  refreshActivities,
  checkSyncStatus,
  autoSync
};