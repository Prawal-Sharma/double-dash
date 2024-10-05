import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  const code = searchParams.get('code');
  const clientID = '136786';
  const clientSecret = '1e6da8d0da5464c513c0625fda9f27ce44b32ea1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
          client_id: clientID,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch athlete activities
        const activitiesResponse = await axios.get(
          'https://www.strava.com/api/v3/athlete/activities',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        setActivities(activitiesResponse.data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (code) {
      fetchData();
    }
  }, [code, clientID, clientSecret]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!activities.length) {
    return <div>Loading activities...</div>;
  }

  return (
    <div>
      <h1>Your Activities</h1>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>
            {activity.name} - {activity.distance} meters
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
