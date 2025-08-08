import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import config from '../config';
import { Activity, ActivitySummary, ActivitiesResponse, YearlyProgress } from '../types';

const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary>({} as ActivitySummary);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activitiesPerPage] = useState<number>(30);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const code: string | null = searchParams.get('code');

  // Conversion utilities
  const convertMetersToMiles = (meters: number): string => (meters / 1609.34).toFixed(2);
  const convertMetersToFeet = (meters: number): string => (meters * 3.28084).toFixed(2);
  const convertSecondsToHours = (seconds: number): string => (seconds / 3600).toFixed(2);

  useEffect(() => {
    const fetchActivitiesFromDB = async (token: string): Promise<ActivitiesResponse> => {
      try {
        const response = await axios.get<ActivitiesResponse>(`${config.API_BASE_URL}/api/strava/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (err) {
        throw new Error('Failed to fetch activities from database');
      }
    };

    const exchangeTokenAndFetch = async (token: string, code: string): Promise<ActivitiesResponse> => {
      try {
        const response = await axios.post<ActivitiesResponse>(
          `${config.API_BASE_URL}/api/strava/exchange_token`,
          { code },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (err) {
        throw new Error('Failed to exchange Strava token');
      }
    };

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('jwt');
      
      if (!token) {
        setError('You must be logged in to view the dashboard.');
        setLoading(false);
        return;
      }

      try {
        let data;
        if (code) {
          data = await exchangeTokenAndFetch(token, code);
        } else {
          data = await fetchActivitiesFromDB(token);
        }

        if (data.activities && data.activities.length > 0) {
          const sortedActivities = data.activities.sort(
            (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          setActivities(sortedActivities);
          setSummary(data.summary);
        } else {
          setActivities([]);
          setSummary({} as ActivitySummary);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code]);

  const handleRefresh = async () => {
    setLoading(true);
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      setError('You must be logged in to refresh activities.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get<ActivitiesResponse>(`${config.API_BASE_URL}/api/strava/activities/refresh`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.activities) {
        const sortedActivities = response.data.activities.sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        setActivities(sortedActivities);
        setSummary(response.data.summary);
        setCurrentPage(1);
      }
    } catch (err) {
      setError('Failed to refresh activities');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
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
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Calculate runs and miles since a specific date
  const calculateRunsSinceDate = (activities: Activity[], startDate: Date): YearlyProgress => {
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
  const progressPercentage = Math.min((parseFloat(runsSince2025.totalMiles) / goalMiles) * 100, 100);

  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
        Error: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Please wait while we fetch your data.</p>
      </div>
    );
  }

  if (activities.length === 0 && !code) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Your Strava Activities Dashboard</h1>
        <p>No activities found. Please go to <Link to="/">Home</Link> and connect Strava.</p>
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
              {Math.max(0, goalMiles - parseFloat(runsSince2025.totalMiles)).toFixed(2)} miles
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
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh Activities'}
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
            
            {/* View on Strava link */}
            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px',
              borderTop: '1px solid #eee',
              textAlign: 'right'
            }}>
              <a 
                href={`https://www.strava.com/activities/${activity.activityId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#FC5200',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                View on Strava →
              </a>
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

      {filteredActivities.length === 0 && activities.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No activities match your search criteria.</p>
        </div>
      )}
      
      {/* Powered by Strava Footer */}
      <div style={{
        marginTop: '60px',
        paddingTop: '30px',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center'
      }}>
        <a 
          href="https://www.strava.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: '#1a202c',
            fontSize: '14px'
          }}
        >
          <span style={{ marginRight: '8px', fontWeight: '500' }}>Powered by</span>
          <svg width="146" height="30" viewBox="0 0 146 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M41.0365 23.0003C38.3534 23.0003 36.0916 22.1606 34.251 20.4811C32.4104 18.8016 31.4901 16.612 31.4901 13.9124C31.4901 11.2468 32.4019 9.06572 34.2255 7.36918C36.0492 5.67264 38.3534 4.82437 41.1384 4.82437C43.2281 4.82437 44.9645 5.39184 46.3476 6.52678C47.7307 7.66172 48.5904 9.16092 48.9267 11.0245H44.6367C44.3683 10.2103 43.8825 9.55593 43.1794 9.06147C42.4763 8.567 41.6288 8.31977 40.637 8.31977C39.3088 8.31977 38.1928 8.77289 37.289 9.67913C36.3852 10.5854 35.9333 11.9957 35.9333 13.9101C35.9333 15.8244 36.3852 17.2348 37.289 18.141C38.1928 19.0472 39.3003 19.5003 40.6115 19.5003C41.6543 19.5003 42.5357 19.2609 43.2558 18.782C43.9759 18.3031 44.4617 17.5892 44.7131 16.6401H49.0031C48.667 18.5722 47.7902 20.0848 46.3731 21.1779C44.956 22.271 43.169 22.8177 41.0122 22.8177L41.0365 23.0003Z" fill="#FC5200"/>
            <path d="M64.0764 9.14557V22.639H59.8372V19.7694C59.2325 20.7695 58.4154 21.5302 57.3861 22.0514C56.3567 22.5727 55.2509 22.8333 54.0686 22.8333C52.0986 22.8333 50.5334 22.2527 49.373 21.0913C48.2126 19.93 47.6324 18.2475 47.6324 16.0437V9.14557H51.8717V15.4609C51.8717 16.6649 52.1401 17.5892 52.677 18.234C53.2139 18.8787 53.9631 19.201 54.9244 19.201C55.9536 19.201 56.7875 18.8618 57.426 18.1832C58.0646 17.5047 58.3839 16.5294 58.3839 15.2573V9.14557H62.6231H64.0764Z" fill="#FC5200"/>
            <path d="M80.479 16.564H70.1426C70.2275 17.5726 70.5502 18.3757 71.1108 18.9733C71.6714 19.5709 72.4613 19.8697 73.4806 19.8697C74.8534 19.8697 75.8474 19.3316 76.4625 18.2553H80.2096C79.8732 19.6684 79.0393 20.8591 77.7079 21.8273C76.3765 22.7956 74.7088 23.2797 72.7047 23.2797C70.9785 23.2797 69.4391 22.8942 68.0865 22.1233C66.7339 21.3524 65.6752 20.2791 64.9105 18.9034C64.1458 17.5277 63.7635 15.9577 63.7635 14.1933C63.7635 12.429 64.1373 10.859 64.885 9.48327C65.6327 8.10751 66.6744 7.03418 68.01 6.26327C69.3456 5.49236 70.8849 5.1069 72.628 5.1069C74.3202 5.1069 75.8255 5.48387 77.144 6.2378C78.4625 6.99174 79.4871 8.03538 80.2178 9.36872C80.9485 10.7021 81.3138 12.2127 81.3138 13.9005C81.3138 14.6629 81.2289 15.5608 81.0591 16.5947L80.479 16.564ZM74.8789 13.2136C74.8789 12.289 74.6181 11.5417 74.0964 10.9717C73.5747 10.4016 72.8577 10.1166 71.9454 10.1166C71.0331 10.1166 70.2905 10.3932 69.6603 10.9462C69.0301 11.4993 68.6309 12.2635 68.4611 13.2391L74.8789 13.2136Z" fill="#FC5200"/>
            <path d="M89.5394 23.0003C87.9782 23.0003 86.5699 22.6319 85.3145 21.8951C84.0591 21.1583 83.0741 20.1364 82.3594 18.8294C81.6447 17.5224 81.2874 16.0212 81.2874 14.3258C81.2874 12.6304 81.6532 11.1123 82.3849 9.77153C83.1166 8.43073 84.1186 7.39236 85.391 6.65642C86.6634 5.92048 88.0887 5.55251 89.667 5.55251C91.2453 5.55251 92.6536 5.92048 93.8919 6.65642C95.1303 7.39236 96.1068 8.43073 96.8215 9.77153C97.5362 11.1123 97.8935 12.6304 97.8935 14.3258C97.8935 16.0212 97.5277 17.5309 96.796 18.8549C96.0643 20.1789 95.0624 21.1923 93.79 21.8951C92.5177 22.5979 91.0925 22.9494 89.5147 22.9494L89.5394 23.0003ZM89.5394 19.4748C90.2966 19.4748 90.9774 19.2694 91.5816 18.8587C92.1858 18.4479 92.6621 17.8657 93.0105 17.1119C93.3588 16.3581 93.533 15.4753 93.533 14.4636C93.533 13.4518 93.3673 12.5521 93.036 11.7643C92.7046 10.9766 92.2368 10.3688 91.6326 9.94097C91.0284 9.51316 90.3476 9.29925 89.5904 9.29925C88.8331 9.29925 88.1439 9.51316 87.5227 9.94097C86.9015 10.3688 86.4167 10.9766 86.0683 11.7643C85.72 12.5521 85.5458 13.4518 85.5458 14.4636C85.5458 15.4753 85.72 16.3581 86.0683 17.1119C86.4167 17.8657 86.893 18.4479 87.4972 18.8587C88.1014 19.2694 88.7822 19.4748 89.5394 19.4748Z" fill="#FC5200"/>
            <path d="M106.119 23.0003C104.558 23.0003 103.15 22.6319 101.894 21.8951C100.639 21.1583 99.6538 20.1364 98.9391 18.8294C98.2244 17.5224 97.8671 16.0212 97.8671 14.3258C97.8671 12.6304 98.2329 11.1123 98.9646 9.77153C99.6963 8.43073 100.698 7.39236 101.971 6.65642C103.243 5.92048 104.668 5.55251 106.247 5.55251C107.825 5.55251 109.233 5.92048 110.472 6.65642C111.71 7.39236 112.687 8.43073 113.401 9.77153C114.116 11.1123 114.473 12.6304 114.473 14.3258C114.473 16.0212 114.107 17.5309 113.376 18.8549C112.644 20.1789 111.642 21.1923 110.37 21.8951C109.097 22.5979 107.672 22.9494 106.094 22.9494L106.119 23.0003ZM106.119 19.4748C106.876 19.4748 107.557 19.2694 108.161 18.8587C108.766 18.4479 109.242 17.8657 109.59 17.1119C109.939 16.3581 110.113 15.4753 110.113 14.4636C110.113 13.4518 109.947 12.5521 109.616 11.7643C109.284 10.9766 108.817 10.3688 108.212 9.94097C107.608 9.51316 106.927 9.29925 106.17 9.29925C105.413 9.29925 104.724 9.51316 104.103 9.94097C103.481 10.3688 102.996 10.9766 102.648 11.7643C102.3 12.5521 102.126 13.4518 102.126 14.4636C102.126 15.4753 102.3 16.3581 102.648 17.1119C102.996 17.8657 103.473 18.4479 104.077 18.8587C104.681 19.2694 105.362 19.4748 106.119 19.4748Z" fill="#FC5200"/>
            <path d="M14.5716 5.45055L21.0064 18.8634H17.4651L14.5716 12.8332L11.678 18.8634H8.13671L14.5716 5.45055Z" fill="#FC5200"/>
            <path d="M7.33333 18.8634L10.5493 12.8332L12.3199 9.29127H8.77867L7.00801 12.8332L3.46667 18.8634H7.33333Z" fill="#FC5200"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;