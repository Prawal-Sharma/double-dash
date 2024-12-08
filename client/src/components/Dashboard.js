import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState(null);

  const code = searchParams.get('code');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Instead of calling Strava directly, call your own backend.
        const response = await axios.post('http://localhost:3001/exchange_token', { code });
        
        // The backend will return an object with { activities, summary }
        const { activities: fetchedActivities, summary: fetchedSummary } = response.data;
        
        setActivities(fetchedActivities);
        setSummary(fetchedSummary);
      } catch (err) {
        setError(err.message);
      }
    };

    if (code) {
      fetchData();
    }
  }, [code]);

  if (error) return <div>Error: {error}</div>;
  if (!activities.length) return <div>Loading data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Strava Activities Dashboard</h1>
      <div style={{ marginBottom: '40px' }}>
        <h2>Summary</h2>
        <p><strong>Total Activities:</strong> {summary.totalActivities}</p>
        <p><strong>Total Distance:</strong> {(summary.totalDistance / 1000).toFixed(2)} km</p>
        <p><strong>Total Elevation Gain:</strong> {summary.totalElevation} meters</p>
        <p><strong>Total Moving Time:</strong> {(summary.totalMovingTime / 3600).toFixed(2)} hours</p>
        <h3>Activities by Type:</h3>
        <ul>
          {Object.keys(summary.activityTypes || {}).map((type) => (
            <li key={type}>{type}: {summary.activityTypes[type]}</li>
          ))}
        </ul>
      </div>

      <h2>Activities</h2>
      {activities.map((activity) => (
        <div key={activity.id} style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <h3>{activity.name}</h3>
          <p><strong>Date:</strong> {new Date(activity.start_date).toLocaleString()}</p>
          <p><strong>Type:</strong> {activity.type}</p>
          <p><strong>Distance:</strong> {(activity.distance / 1000).toFixed(2)} km</p>
          {/* Add other activity fields as needed */}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
