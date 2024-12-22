const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dynamoDB = require('./dynamodb');

AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const clientID = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;

const app = express();
app.use(bodyParser.json());
app.use(cors());

// =====================
// Authentication Helpers
// =====================
async function findUserByEmail(email) {
  console.log('Finding user by email:', email);
  const result = await dynamoDB.scan({
    TableName: 'Users',
    FilterExpression: '#em = :email',
    ExpressionAttributeNames: { '#em': 'email' },
    ExpressionAttributeValues: { ':email': email },
  }).promise();

  console.log('User found:', result.Items.length > 0);
  return result.Items.length > 0 ? result.Items[0] : null;
}

function authMiddleware(req, res, next) {
  console.log('Authenticating request...');
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('authMiddleware, token', token);
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded; // decoded contains userId
    console.log('Token verified, user authenticated:', req.user.userId);
    next();
  });
}

// ================
// User Endpoints
// ================
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  console.log('Registering new user:', email);
  if (!email || !password) {
    console.log('Email and password are required');
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.log('User already exists:', email);
    return res.status(400).json({ error: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  await dynamoDB.put({
    TableName: 'Users',
    Item: {
      userId,
      email,
      hashedPassword,
      createdAt: new Date().toISOString(),
      preferences: {},
    },
  }).promise();

  console.log('User registered successfully:', email);
  res.json({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Logging in user:', email);
  if (!email || !password) {
    console.log('Email and password are required');
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.log('Invalid credentials for user:', email);
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) {
    console.log('Invalid credentials for user:', email);
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('User logged in successfully:', email);
  res.json({ token });
});

app.get('/user/profile', authMiddleware, async (req, res) => {
  console.log('Fetching user profile for user:', req.user.userId);
  const userData = await dynamoDB.get({
    TableName: 'Users',
    Key: { userId: req.user.userId },
  }).promise();

  if (!userData.Item) {
    console.log('User not found:', req.user.userId);
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('User profile fetched successfully:', req.user.userId);
  res.json({
    email: userData.Item.email,
    preferences: userData.Item.preferences
  });
});

// =====================================
// Strava Integration - Token Exchange
// =====================================
app.post('/exchange_token', authMiddleware, async (req, res) => {
  const { code } = req.body;
  console.log('Received code for token exchange:', code);

  try {
    console.log('Exchanging code for access token...');
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientID,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_at } = tokenResponse.data;
    const userId = req.user.userId;

    console.log('Access token received:', access_token);

    // Store the Strava tokens in the Users table
    await dynamoDB.update({
      TableName: 'Users',
      Key: { userId },
      UpdateExpression: 'SET accessToken = :at, refreshToken = :rt, expiresAt = :ea',
      ExpressionAttributeValues: {
        ':at': access_token,
        ':rt': refresh_token,
        ':ea': expires_at
      }
    }).promise();
    console.log('Strava tokens stored for user:', userId);

    // Fetch all activities
    let page = 1;
    let allActivities = [];
    let fetchMore = true;

    console.log('Fetching activities from Strava...');
    while (fetchMore) {
      const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          per_page: 200,
          page: page,
        },
      });

      if (activitiesResponse.data.length > 0) {
        console.log(`Fetched ${activitiesResponse.data.length} activities from page ${page}`);
        allActivities = allActivities.concat(activitiesResponse.data);
        page++;
      } else {
        fetchMore = false;
        console.log('No more activities to fetch.');
      }
    }

    // Filter for run activities as an example
    const runActivities = allActivities.filter(activity => activity.type === 'Run');
    console.log(`Filtered ${runActivities.length} run activities.`);

    // Calculate summary
    const totalDistance = allActivities.reduce((sum, activity) => sum + activity.distance, 0);
    const totalElevation = allActivities.reduce((sum, activity) => sum + activity.total_elevation_gain, 0);
    const totalMovingTime = allActivities.reduce((sum, activity) => sum + activity.moving_time, 0);

    const activityTypes = {};
    allActivities.forEach((activity) => {
      const type = activity.type;
      activityTypes[type] = activityTypes[type] ? activityTypes[type] + 1 : 1;
    });

    const summary = {
      totalActivities: allActivities.length,
      totalDistance,
      totalElevation,
      totalMovingTime,
      activityTypes,
    };

    console.log('Summary calculated:', summary);

    // Store run activities in Activities table
    console.log('Storing activities in DynamoDB...');
    for (const activity of runActivities) {
      await dynamoDB.put({
        TableName: 'Activities',
        Item: {
          userId: userId,
          activityId: activity.id.toString(),
          achievement_count: activity.achievement_count,
          athlete: activity.athlete,
          athlete_count: activity.athlete_count,
          average_cadence: activity.average_cadence,
          average_heartrate: activity.average_heartrate,
          average_speed: activity.average_speed,
          comment_count: activity.comment_count,
          commute: activity.commute,
          display_hide_heartrate_option: activity.display_hide_heartrate_option,
          distance: activity.distance,
          elapsed_time: activity.elapsed_time,
          elev_high: activity.elev_high,
          elev_low: activity.elev_low,
          end_latlng: activity.end_latlng,
          external_id: activity.external_id,
          flagged: activity.flagged,
          from_accepted_tag: activity.from_accepted_tag,
          gear_id: activity.gear_id,
          has_heartrate: activity.has_heartrate,
          has_kudoed: activity.has_kudoed,
          heartrate_opt_out: activity.heartrate_opt_out,
          name: activity.name,
          kudos_count: activity.kudos_count,
          location_city: activity.location_city,
          location_country: activity.location_country,
          location_state: activity.location_state,
          manual: activity.manual,
          map: activity.map,
          max_heartrate: activity.max_heartrate,
          max_speed: activity.max_speed,
          moving_time: activity.moving_time,
          photo_count: activity.photo_count,
          pr_count: activity.pr_count,
          private: activity.private,
          resource_state: activity.resource_state,
          sport_type: activity.sport_type,
          start_date: activity.start_date,
          start_date_local: activity.start_date_local,
          start_latlng: activity.start_latlng,
          suffer_score: activity.suffer_score,
          timezone: activity.timezone,
          total_elevation_gain: activity.total_elevation_gain,
          total_photo_count: activity.total_photo_count,
          trainer: activity.trainer,
          type: activity.type,
          upload_id: activity.upload_id,
          upload_id_str: activity.upload_id_str,
          utc_offset: activity.utc_offset,
          visibility: activity.visibility,
          workout_type: activity.workout_type
        },
      }).promise();
    }
    console.log(`Stored ${runActivities.length} activities for user ${userId} in DynamoDB.`);

    // Return the filtered run activities and summary to the frontend
    res.json({ activities: runActivities, summary });
  } catch (error) {
    console.error('Error exchanging token or fetching data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/activities', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  console.log(`Fetching activities for user ${userId} from DynamoDB...`);

  try {
    const result = await dynamoDB.query({
      TableName: 'Activities',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': userId
      }
    }).promise();

    const activities = result.Items || [];
    if (activities.length === 0) {
      // No activities found
      return res.json({ activities: [], summary: {} });
    }

    // Recalculate summary from stored activities
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const totalMovingTime = activities.reduce((sum, a) => sum + a.moving_time, 0);

    const activityTypes = {};
    for (const a of activities) {
      if (!activityTypes[a.type]) activityTypes[a.type] = 0;
      activityTypes[a.type]++;
    }

    const summary = {
      totalActivities: activities.length,
      totalDistance,
      totalElevation,
      totalMovingTime,
      activityTypes,
    };

    res.json({ activities, summary });
  } catch (err) {
    console.error('Error fetching activities from DynamoDB:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/activities/refresh', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1) Retrieve user from "Users" table
    const userResult = await dynamoDB.get({
      TableName: 'Users',
      Key: { userId },
    }).promise();

    if (!userResult.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    let { refreshToken, expiresAt, accessToken } = userResult.Item;

    // 2) Check if the access token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (expiresAt < currentTime) {
      // Refresh the token using Strava's refresh endpoint
      console.log('Refreshing Strava token...');
      const refreshResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: clientID,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      accessToken = refreshResponse.data.access_token;
      refreshToken = refreshResponse.data.refresh_token;
      expiresAt = refreshResponse.data.expires_at;

      // Update tokens in DynamoDB
      await dynamoDB.update({
        TableName: 'Users',
        Key: { userId },
        UpdateExpression: 'SET accessToken = :at, refreshToken = :rt, expiresAt = :ea',
        ExpressionAttributeValues: {
          ':at': accessToken,
          ':rt': refreshToken,
          ':ea': expiresAt,
        },
      }).promise();
    }

    // 3) Fetch new activities from Strava
    let page = 1;
    let allActivities = [];
    let fetchMore = true;

    console.log(`Fetching updated activities from Strava for user: ${userId}`);
    while (fetchMore) {
      const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          per_page: 200,
          page,
        },
      });

      if (activitiesResponse.data.length > 0) {
        allActivities = allActivities.concat(activitiesResponse.data);
        page++;
      } else {
        fetchMore = false;
      }
    }

    // 4) Upsert them in DynamoDB. For example, store only "Run" activities (adjust if needed).
    const runActivities = allActivities.filter(a => a.type === 'Run');

    for (const activity of runActivities) {
      await dynamoDB.put({
        TableName: 'Activities',
        Item: {
          userId: userId,
          activityId: activity.id.toString(),
          start_date: activity.start_date,
          name: activity.name,
          distance: activity.distance,
          moving_time: activity.moving_time,
          total_elevation_gain: activity.total_elevation_gain,
          type: activity.type,
          // Any additional fields you want...
        },
      }).promise();
    }

    // Recalculate summary for all stored run activities
    const queryResult = await dynamoDB.query({
      TableName: 'Activities',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': userId
      }
    }).promise();

    const storedActivities = queryResult.Items || [];
    const totalDistance = storedActivities.reduce((sum, a) => sum + a.distance, 0);
    const totalElevation = storedActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const totalMovingTime = storedActivities.reduce((sum, a) => sum + a.moving_time, 0);

    const activityTypes = {};
    for (const a of storedActivities) {
      activityTypes[a.type] = (activityTypes[a.type] || 0) + 1;
    }

    const summary = {
      totalActivities: storedActivities.length,
      totalDistance,
      totalElevation,
      totalMovingTime,
      activityTypes,
    };

    return res.json({
      activities: storedActivities,
      summary,
    });
  } catch (err) {
    console.error('Error in refresh endpoint:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Start Express server without Apollo
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
