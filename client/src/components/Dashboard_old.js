import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import config from '../config';

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
        const response = await axios.get(`${config.API_BASE_URL}/api/strava/activities`, {
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
          `${config.API_BASE_URL}/api/strava/exchange_token`,
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
      const response = await axios.get(`${config.API_BASE_URL}/api/strava/activities/refresh`, {
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

  // Helper function to calculate runs and miles since a specific date
  const calculateRunsSinceDate = (activities, startDate) => {
    const filteredActivities = activities.filter(activity => 
      activity.type === 'Run' && new Date(activity.start_date) >= startDate
    );
    const totalMiles = filteredActivities.reduce((sum, activity) => 
      sum + parseFloat(convertMetersToMiles(activity.distance)), 0
    );
    return {
      totalRuns: filteredActivities.length,
      totalMiles: totalMiles.toFixed(2),
    };
  };

  // Calculate runs and miles since January 1st, 2025
  const runsSince2025 = calculateRunsSinceDate(activities, new Date('2025-01-01'));

  // Calculate progress for the New Year Goal
  const goalMiles = 800;
  const progressPercentage = Math.min((runsSince2025.totalMiles / goalMiles) * 100, 100);

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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading your activities...</h1>
        <p>Please wait while we fetch your Strava data.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Your Strava Activities Dashboard</h1>
      
      {/* Summary Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Activities</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#007bff' }}>
            {summary.totalActivities || 0}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Distance</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
            {convertMetersToMiles(summary.totalDistance || 0)} miles
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Elevation</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ffc107' }}>
            {convertMetersToFeet(summary.totalElevation || 0)} feet
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Time</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#dc3545' }}>
            {convertSecondsToHours(summary.totalMovingTime || 0)} hours
          </p>
        </div>
      </div>

      {/* New Year Goal Section */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🎯 2025 Goal: 800 Miles</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '20px',
          marginBottom: '15px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0' }}>Runs This Year</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1976d2' }}>
              {runsSince2025.totalRuns}
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0' }}>Miles This Year</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1976d2' }}>
              {runsSince2025.totalMiles}
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0' }}>Remaining</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1976d2' }}>
              {Math.max(0, goalMiles - runsSince2025.totalMiles).toFixed(2)} miles
            </p>
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '10px', 
          height: '20px', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            backgroundColor: '#4caf50', 
            height: '100%', 
            width: `${progressPercentage}%`,
            transition: 'width 0.3s ease'
          }} />
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <button 
          onClick={handleRefresh}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Refresh Activities
        </button>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              fontSize: '14px'
            }}
          >
            <option value="">All Types</option>
            <option value="Run">Run</option>
            <option value="Ride">Ride</option>
            <option value="Walk">Walk</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      <div style={{ 
        display: 'grid', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        {currentActivities.map((activity, index) => (
          <div key={activity.activityId || index} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                  {activity.name}
                </h3>
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                  {new Date(activity.start_date).toLocaleDateString()} • {activity.type}
                </p>
              </div>
              <div style={{ 
                backgroundColor: activity.type === 'Run' ? '#28a745' : '#6c757d',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {activity.type}
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '10px',
              fontSize: '14px'
            }}>
              <div>
                <strong>Distance:</strong><br />
                {convertMetersToMiles(activity.distance)} miles
              </div>
              <div>
                <strong>Time:</strong><br />
                {Math.floor(activity.moving_time / 3600)}h {Math.floor((activity.moving_time % 3600) / 60)}m
              </div>
              <div>
                <strong>Elevation:</strong><br />
                {convertMetersToFeet(activity.total_elevation_gain)} ft
              </div>
              {activity.average_speed && (
                <div>
                  <strong>Avg Speed:</strong><br />
                  {(activity.average_speed * 2.237).toFixed(1)} mph
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '10px',
          marginTop: '20px'
        }}>
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: currentPage === 1 ? '#f8f9fa' : '#ffffff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.6 : 1
            }}
          >
            Previous
          </button>
          
          <span style={{ 
            padding: '8px 16px', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#ffffff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.6 : 1
            }}
          >
            Next
          </button>
        </div>
      )}

      {filteredActivities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No activities match your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
