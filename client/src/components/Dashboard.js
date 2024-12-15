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
        console.log('Fetching data with code:', code);

        // NOTE: Eventually, once you've stored activities in DynamoDB,
        // you might switch this endpoint to something like '/activities' 
        // which returns cached data from your database. For now, we keep as is.
        
        // IMPORTANT: If `/exchange_token` now requires auth, you'll need 
        // to include the JWT in the request headers. For now, this code doesn't
        // do that because we haven't integrated login on the frontend yet.
        // When you do, you'd do something like:
        // const token = localStorage.getItem('jwt'); // or however you store it
        // const response = await axios.post('http://localhost:3001/exchange_token', { code }, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        
        const response = await axios.post('http://localhost:3001/exchange_token', { code });
        
        const { activities: fetchedActivities, summary: fetchedSummary } = response.data;
        
        console.log('Fetched activities:', fetchedActivities);
        console.log('Fetched summary:', fetchedSummary);

        setActivities(fetchedActivities);
        setSummary(fetchedSummary);
      } catch (err) {
        console.error('Error fetching data:', err.message);
        setError(err.message);
      }
    };

    if (code) {
      console.log('Code found in URL:', code);
      fetchData();
    } else {
      console.log('No code found in URL.');
    }
  }, [code]);

  if (error) {
    console.error('Rendering error message:', error);
    return <div>Error: {error}</div>;
  }
  if (!activities.length) {
    console.log('Activities not yet loaded, displaying loading message.');
    return <div>Loading data...</div>;
  }

  console.log('Rendering dashboard with activities and summary.');

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
