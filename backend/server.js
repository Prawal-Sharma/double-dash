const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const clientID = process.env.STRAVA_CLIENT_ID;       // Store in .env file
const clientSecret = process.env.STRAVA_CLIENT_SECRET; // Store in .env file

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo Server!',
  },
};

const app = express();
app.use(bodyParser.json());
app.use(cors());

// New endpoint for token exchange and data fetching
app.post('/exchange_token', async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange the code for an access token
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientID,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch all activities
    let page = 1;
    let allActivities = [];
    let fetchMore = true;

    while (fetchMore) {
      const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          per_page: 200,
          page: page,
        },
      });

      if (activitiesResponse.data.length > 0) {
        allActivities = allActivities.concat(activitiesResponse.data);
        page++;
      } else {
        fetchMore = false;
      }
    }

    // Filter for run activities as an example (or just return all if desired)
    const runActivities = allActivities.filter(activity => activity.type === 'Run');

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

    // Send back the filtered activities and summary
    res.json({ activities: runActivities, summary });
  } catch (error) {
    console.error('Error exchanging token or fetching data:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = new ApolloServer({ typeDefs, resolvers });
server.start().then(() => {
  server.applyMiddleware({ app });
  app.listen(3001, () => {
    console.log('Server running on http://localhost:3001' + server.graphqlPath);
  });
});
