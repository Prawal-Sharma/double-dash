import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [activitiesPerPage] = useState(30);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const code = searchParams.get('code');
  console.log('Dashboard component mounted. Code from URL:', code);

  // Converts for display
  const convertMetersToMiles = (meters) => (meters / 1609.34).toFixed(2);
  const convertMetersToFeet = (meters) => (meters * 3.28084).toFixed(2);
  const convertSecondsToHours = (seconds) => (seconds / 3600).toFixed(2);

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
      console.log('Exchanging token with Strava. Token:', token, 'Code:', code);
      try {
        const response = await axios.post(
          'http://localhost:3001/exchange_token',
          { code },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Token exchanged and activities fetched:', response.data);
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
        console.error('No JWT token found. User must log in.');
        return;
      }

      try {
        let data;
        if (code) {
          // Exchange token with Strava
          console.log('Code found in URL. Exchanging token with Strava.');
          data = await exchangeTokenAndFetch(token, code);
        } else {
          // Fetch existing activities from DB
          console.log('No code found in URL. Fetching existing activities from DB.');
          data = await fetchActivitiesFromDB(token);
        }

        if (data.activities && data.activities.length > 0) {
          // Sort descending by start_date
          console.log('Sorting activities by start_date.');
          const sortedActivities = data.activities.sort(
            (a, b) => new Date(b.start_date) - new Date(a.start_date)
          );
          setActivities(sortedActivities);
          setSummary(data.summary);
          console.log('Activities and summary set in state.');
        } else {
          setActivities([]);
          setSummary({});
          console.log('No activities found. State cleared.');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error during data fetch:', err.message);
      }
    };

    doFetch();
  }, [code]);

  // Handle refresh button
  const handleRefresh = async () => {
    console.log("HANDLE REFRESH");
    const token = localStorage.getItem('jwt');
    if (!token) {
      setError('You must be logged in to refresh activities.');
      console.error('No JWT token found. User must log in.');
      return;
    }

    try {
      console.log('Refreshing activities with token:', token);
      const response = await axios.get('http://localhost:3001/activities/refresh', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.activities) {
        console.log('Activities refreshed:', response.data.activities);
        const sortedActivities = response.data.activities.sort(
          (a, b) => new Date(b.start_date) - new Date(a.start_date)
        );
        setActivities(sortedActivities);
        setSummary(response.data.summary);
        setCurrentPage(1); // Reset to first page
        console.log('Activities and summary set in state after refresh.');
      }
    } catch (err) {
      console.error('Error refreshing activities:', err.message);
      setError(err.message);
    }
  };

  // Filter / Search logic
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? activity.type === filterType : true;
    return matchesSearch && matchesType;
  });

  // Pagination logic
  const indexOfLast = currentPage * activitiesPerPage;
  const indexOfFirst = indexOfLast - activitiesPerPage;
  const currentActivities = filteredActivities.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      console.log('Navigated to next page:', currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      console.log('Navigated to previous page:', currentPage - 1);
    }
  };

  if (error) {
    console.error('Error state detected:', error);
    return (
      <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
        Error: {error}
      </div>
    );
  }

  if (activities.length === 0 && !code) {
    console.log('No activities found and no code in URL.');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Your Strava Activities Dashboard</h1>
        <p>No activities found. Please go to <Link to="/">Home</Link> and connect Strava.</p>
      </div>
    );
  }

  if (activities.length === 0 && code) {
    console.log('Activities are loading...');
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        Loading data...
      </div>
    );
  }

  console.log('Rendering activities and summary.');
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Your Strava Activities Dashboard</h1>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={handleRefresh}
          style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Refresh Activities
        </button>

        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset to first page if searching
            console.log('Search term updated:', e.target.value);
          }}
          style={{ marginRight: '10px', padding: '6px' }}
        />

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1); // reset to first page if filtering
            console.log('Filter type updated:', e.target.value);
          }}
          style={{ padding: '6px' }}
        >
          <option value="">All Types</option>
          <option value="Run">Run</option>
          <option value="Ride">Ride</option>
          <option value="Walk">Walk</option>
          {/* Add more if desired */}
        </select>
      </div>

      <div style={{ marginBottom: '40px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h2>Summary</h2>
        <p><strong>Total Activities:</strong> {summary.totalActivities}</p>
        <p><strong>Total Distance:</strong> {convertMetersToMiles(summary.totalDistance)} miles</p>
        <p><strong>Total Elevation Gain:</strong> {convertMetersToFeet(summary.totalElevation)} feet</p>
        <p><strong>Total Moving Time:</strong> {convertSecondsToHours(summary.totalMovingTime)} hours</p>
        <h3>Activities by Type:</h3>
        <ul>
          {summary.activityTypes && Object.keys(summary.activityTypes).map(type => (
            <li key={type}>{type}: {summary.activityTypes[type]}</li>
          ))}
        </ul>
      </div>

      <h2 style={{ marginBottom: '20px' }}>Activities</h2>
      {currentActivities.map((activity) => (
        <div
          key={activity.activityId}
          style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3>{activity.name}</h3>
          <p><strong>Date:</strong> {new Date(activity.start_date).toLocaleString()}</p>
          <p><strong>Type:</strong> {activity.type}</p>
          <p><strong>Distance:</strong> {convertMetersToMiles(activity.distance)} miles</p>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={goToPrevPage} disabled={currentPage === 1} style={{ marginRight: '10px' }}>
          Previous
        </button>
        <span style={{ fontSize: '1.2em', alignSelf:'center' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} style={{ marginLeft: '10px' }}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
