import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
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

        let page = 1;
        let allActivities = [];
        let fetchMore = true;

        // Fetch activities from all pages
        while (fetchMore) {
          const activitiesResponse = await axios.get(
            'https://www.strava.com/api/v3/athlete/activities',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              params: {
                per_page: 200,
                page: page,
              },
            }
          );

          if (activitiesResponse.data.length > 0) {
            allActivities = allActivities.concat(activitiesResponse.data);
            page++;
          } else {
            fetchMore = false;
          }
        }

        setActivities(allActivities);

        // Calculate summary statistics
        const totalDistance = allActivities.reduce((sum, activity) => sum + activity.distance, 0);
        const totalElevation = allActivities.reduce(
          (sum, activity) => sum + activity.total_elevation_gain,
          0
        );
        const totalMovingTime = allActivities.reduce(
          (sum, activity) => sum + activity.moving_time,
          0
        );

        const activityTypes = {};
        allActivities.forEach((activity) => {
          const type = activity.type;
          if (activityTypes[type]) {
            activityTypes[type]++;
          } else {
            activityTypes[type] = 1;
          }
        });

        setSummary({
          totalActivities: allActivities.length,
          totalDistance,
          totalElevation,
          totalMovingTime,
          activityTypes,
        });
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
    return <div>Loading data...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <h1>Your Strava Activities Dashboard</h1>

      <div style={{ marginBottom: '40px' }}>
        <h2>Summary</h2>
        <p><strong>Total Activities:</strong> {summary.totalActivities}</p>
        <p><strong>Total Distance:</strong> {(summary.totalDistance / 1000).toFixed(2)} km</p>
        <p><strong>Total Elevation Gain:</strong> {summary.totalElevation} meters</p>
        <p><strong>Total Moving Time:</strong> {(summary.totalMovingTime / 3600).toFixed(2)} hours</p>
        <h3>Activities by Type:</h3>
        <ul>
          {Object.keys(summary.activityTypes).map((type) => (
            <li key={type}>
              {type}: {summary.activityTypes[type]}
            </li>
          ))}
        </ul>
      </div>

      <h2>Activities</h2>
{activities.map((activity) => (
  <div
    key={activity.id}
    style={{
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '20px',
    }}
  >
    <h3>{activity.name}</h3>
    <p><strong>Date:</strong> {new Date(activity.start_date).toLocaleString()}</p>
    <p><strong>Type:</strong> {activity.type}</p>
    <p><strong>Sport Type:</strong> {activity.sport_type}</p>
    <p><strong>Distance:</strong> {(activity.distance / 1000).toFixed(2)} km</p>
    <p><strong>Moving Time:</strong> {(activity.moving_time / 60).toFixed(2)} minutes</p>
    <p><strong>Elapsed Time:</strong> {(activity.elapsed_time / 60).toFixed(2)} minutes</p>
    <p><strong>Elevation Gain:</strong> {activity.total_elevation_gain} meters</p>
    <p><strong>Average Speed:</strong> {(activity.average_speed * 3.6).toFixed(2)} km/h</p>
    <p><strong>Max Speed:</strong> {(activity.max_speed * 3.6).toFixed(2)} km/h</p>
    <p><strong>Average Cadence:</strong> {activity.average_cadence} rpm</p>
    <p><strong>Average Watts:</strong> {activity.average_watts} W</p>
    <p><strong>Weighted Average Watts:</strong> {activity.weighted_average_watts} W</p>
    <p><strong>Kilojoules:</strong> {activity.kilojoules} kJ</p>
    <p><strong>Average Heartrate:</strong> {activity.average_heartrate} bpm</p>
    <p><strong>Max Heartrate:</strong> {activity.max_heartrate} bpm</p>
    <p><strong>Max Watts:</strong> {activity.max_watts} W</p>
    <p><strong>Suffer Score:</strong> {activity.suffer_score}</p>
    <p><strong>Kudos:</strong> {activity.kudos_count}</p>
    <p><strong>Comments:</strong> {activity.comment_count}</p>
    <p><strong>Photos:</strong> {activity.total_photo_count}</p>
    <p><strong>Location Country:</strong> {activity.location_country}</p>
    <p><strong>Trainer:</strong> {activity.trainer ? 'Yes' : 'No'}</p>
    <p><strong>Commute:</strong> {activity.commute ? 'Yes' : 'No'}</p>
    <p><strong>Manual:</strong> {activity.manual ? 'Yes' : 'No'}</p>
    <p><strong>Private:</strong> {activity.private ? 'Yes' : 'No'}</p>
    <p><strong>Flagged:</strong> {activity.flagged ? 'Yes' : 'No'}</p>
    <p><strong>Gear ID:</strong> {activity.gear_id}</p>
    {activity.description && (
      <p><strong>Description:</strong> {activity.description}</p>
    )}
  </div>
))}
    </div>
  );
};

export default Dashboard;