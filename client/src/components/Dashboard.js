import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState(null);

  const code = searchParams.get('code');

  useEffect(() => {
    const fetchActivitiesFromDB = async (token) => {
      try {
        const response = await axios.get('http://localhost:3001/activities', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (err) {
        console.error('Error fetching activities from DB:', err.message);
        throw err;
      }
    };

    const exchangeTokenAndFetch = async (token, code) => {
      try {
        const response = await axios.post(
          'http://localhost:3001/exchange_token',
          { code },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (err) {
        console.error('Error exchanging token:', err.message);
        throw err;
      }
    };

    const doFetch = async () => {
      const token = localStorage.getItem('jwt');
      if (!token) {
        setError('You must be logged in to view the dashboard.');
        return;
      }

      try {
        if (code) {
          const data = await exchangeTokenAndFetch(token, code);
          setActivities(data.activities);
          setSummary(data.summary);
        } else {
          const data = await fetchActivitiesFromDB(token);
          if (data.activities && data.activities.length > 0) {
            setActivities(data.activities);
            setSummary(data.summary);
          } else {
            setActivities([]);
            setSummary({});
          }
        }
      } catch (err) {
        setError(err.message);
      }
    };

    doFetch();
  }, [code]);

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Error: {error}</div>;
  }

  if (activities.length === 0 && !code) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Your Strava Activities Dashboard</h1>
        <p>No activities found. Please go to <Link to="/">Home</Link> and connect Strava.</p>
      </div>
    );
  }

  if (activities.length === 0 && code) {
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>Loading data...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Your Strava Activities Dashboard</h1>
      <div style={{ marginBottom: '40px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
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

      <h2 style={{ marginBottom: '20px' }}>Activities</h2>
      {activities.map((activity) => (
        <div key={activity.activityId} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3>{activity.name}</h3>
          <p><strong>Date:</strong> {new Date(activity.start_date).toLocaleString()}</p>
          <p><strong>Type:</strong> {activity.type}</p>
          <p><strong>Distance:</strong> {(activity.distance / 1000).toFixed(2)} km</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
