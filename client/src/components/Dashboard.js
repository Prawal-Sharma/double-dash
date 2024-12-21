import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState(null);

  const code = searchParams.get('code');
  console.log('Dashboard component mounted. Code from URL:', code);

  useEffect(() => {
    const fetchActivitiesFromDB = async (token) => {
      console.log('Fetching activities from DB with token:', token);
      try {
        const response = await axios.get('http://localhost:3001/activities', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Activities fetched from DB:', response.data);
        return response.data;
      } catch (err) {
        console.error('Error fetching activities from DB:', err.message);
        throw err;
      }
    };

    const exchangeTokenAndFetch = async (token, code) => {
      console.log('Exchanging token with code:', code);
      try {
        const response = await axios.post(
          'http://localhost:3001/exchange_token',
          { code },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Token exchanged successfully. Data received:', response.data);
        return response.data;
      } catch (err) {
        console.error('Error exchanging token:', err.message);
        throw err;
      }
    };

    const doFetch = async () => {
      const token = localStorage.getItem('jwt');
      console.log('JWT token retrieved from localStorage:', token);
      if (!token) {
        setError('You must be logged in to view the dashboard.');
        console.error('No JWT token found. User must log in.');
        return;
      }

      try {
        if (code) {
          console.log('Code present. Exchanging token and fetching data.');
          const data = await exchangeTokenAndFetch(token, code);
          console.log("This is the data from the if statement", data);
          const sortedActivities = data.activities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
          setActivities(sortedActivities);
          setSummary(data.summary);
          console.log('Activities and summary set from exchanged token data.');
        } else {
          console.log('No code present. Fetching activities from DB.');
          const data = await fetchActivitiesFromDB(token);
          console.log("This is the data from the else statement", data);
          if (data.activities && data.activities.length > 0) {
            const sortedActivities = data.activities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            setActivities(sortedActivities);
            setSummary(data.summary);
            console.log('Activities and summary set from DB data.');
          } else {
            setActivities([]);
            setSummary({});
            console.log('No activities found in DB.');
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Error during data fetch:', err.message);
      }
    };

    doFetch();
  }, [code]);

  if (error) {
    console.error('Rendering error message:', error);
    return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Error: {error}</div>;
  }

  if (activities.length === 0 && !code) {
    console.log('No activities and no code. Prompting user to connect Strava.');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Your Strava Activities Dashboard</h1>
        <p>No activities found. Please go to <Link to="/">Home</Link> and connect Strava.</p>
      </div>
    );
  }

  if (activities.length === 0 && code) {
    console.log('Activities are loading...');
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>Loading data...</div>;
  }

  const convertMetersToMiles = (meters) => (meters / 1609.34).toFixed(2);
  const convertMetersToFeet = (meters) => (meters * 3.28084).toFixed(2);
  const convertSecondsToHours = (seconds) => (seconds / 3600).toFixed(2);

  console.log('Rendering dashboard with activities and summary.');
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Your Strava Activities Dashboard</h1>
      <div style={{ marginBottom: '40px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h2>Summary</h2>
        <p><strong>Total Activities:</strong> {summary.totalActivities}</p>
        <p><strong>Total Distance:</strong> {convertMetersToMiles(summary.totalDistance)} miles</p>
        <p><strong>Total Elevation Gain:</strong> {convertMetersToFeet(summary.totalElevation)} feet</p>
        <p><strong>Total Moving Time:</strong> {convertSecondsToHours(summary.totalMovingTime)} hours</p>
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
          <p><strong>Distance:</strong> {convertMetersToMiles(activity.distance)} miles</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
