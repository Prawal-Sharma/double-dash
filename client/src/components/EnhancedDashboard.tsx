import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import config from '../config';
import { Activity, ActivitySummary, ActivitiesResponse } from '../types';
import { lightTheme, darkTheme } from '../styles/theme';
import { 
  Container, 
  Card, 
  Grid, 
  FlexContainer, 
  Button, 
  Heading, 
  Text,
  Section
} from '../styles/components';

// Utils
import { 
  convertMetersToMiles, 
  convertMetersToFeet, 
  convertSecondsToHours
} from '../utils/activityUtils';

const MetricsGrid = styled(Grid)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const MetricCard = styled(Card)`
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  opacity: 0.9;
`;


const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

const ThemeToggle = styled(Button)`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  width: 50px;
  height: 50px;
  padding: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    top: 70px;
    right: 10px;
    width: 40px;
    height: 40px;
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`;

const EnhancedDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary>({} as ActivitySummary);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Dashboard-specific states
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    needsSync: boolean;
    connected: boolean;
    hoursElapsed?: number;
    message: string;
  } | null>(null);
  const [autoSyncing, setAutoSyncing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'token-exchange' | 'sync-check' | 'loading-data'>('idle');

  const code: string | null = searchParams.get('code');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('dashboardTheme', newTheme ? 'dark' : 'light');
  };

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

    const handleTokenExchange = async (token: string, code: string): Promise<ActivitiesResponse | null> => {
      const cacheKey = `strava-exchange-${code}`;
      const processingKey = `processing-${code}`;
      const timestampKey = `exchange-timestamp-${code}`;
      
      // Check if this code was already successfully processed
      const cachedResult = sessionStorage.getItem(cacheKey);
      if (cachedResult) {
        console.log('Using cached token exchange result');
        // Clear URL immediately when using cached result
        navigate('/dashboard', { replace: true });
        return JSON.parse(cachedResult);
      }
      
      // Check if this code is currently being processed
      if (sessionStorage.getItem(processingKey)) {
        console.log('Token exchange already in progress, skipping duplicate request');
        // Clear URL to prevent multiple attempts
        navigate('/dashboard', { replace: true });
        return null;
      }
      
      // Check if this code was recently attempted (within 30 seconds) to prevent spam
      const lastAttempt = sessionStorage.getItem(timestampKey);
      if (lastAttempt && (Date.now() - parseInt(lastAttempt)) < 30000) {
        console.log('Recent token exchange attempt detected, skipping to prevent rate limiting');
        navigate('/dashboard', { replace: true });
        setError('Please wait a moment before trying again.');
        return null;
      }
      
      try {
        // Mark as processing immediately
        sessionStorage.setItem(processingKey, 'true');
        sessionStorage.setItem(timestampKey, Date.now().toString());
        setProcessingStep('token-exchange');
        
        // Clear the code from URL immediately to prevent re-execution
        navigate('/dashboard', { replace: true });
        
        console.log('Starting Strava token exchange...');
        const response = await axios.post<ActivitiesResponse>(
          `${config.API_BASE_URL}/api/strava/exchange_token`,
          { code },
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000 // 30 second timeout
          }
        );
        
        console.log('Token exchange successful, caching result');
        // Cache the successful result
        sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
        
        // Clean up all related cache keys after successful exchange
        setTimeout(() => {
          sessionStorage.removeItem(cacheKey);
          sessionStorage.removeItem(timestampKey);
        }, 5 * 60 * 1000); // Clean up after 5 minutes
        
        return response.data;
      } catch (err: any) {
        console.error('Token exchange failed:', err);
        
        // Check if this is a Strava authorization error (code already used)
        if (err.response?.status === 400) {
          const errorMsg = err.response?.data?.message || '';
          if (errorMsg.includes('invalid') || errorMsg.includes('expired') || errorMsg.includes('used')) {
            setError('This authorization link has already been used or expired. Please register again to get a fresh link.');
          } else {
            setError('Authorization failed. Please try registering again.');
          }
          return null;
        }
        
        // Check for unauthorized access
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again and retry.');
          return null;
        }
        
        // Check for rate limiting
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
          return null;
        }
        
        // Network or timeout errors
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          setError('Connection timeout. Please check your internet and try again.');
          return null;
        }
        
        // Generic error
        setError('Connection failed. Please refresh the page and try again.');
        return null;
      } finally {
        // Clean up processing flag
        sessionStorage.removeItem(processingKey);
        setProcessingStep('idle');
      }
    };

    const checkSyncStatus = async (token: string) => {
      try {
        const response = await axios.get(`${config.API_BASE_URL}/api/strava/sync-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSyncStatus(response.data);
        return response.data;
      } catch (err) {
        console.error('Failed to check sync status:', err);
        return null;
      }
    };

    // Auto-sync function (currently unused but may be needed later)
    // const performAutoSync = async (token: string) => {
    //   try {
    //     setAutoSyncing(true);
    //     const response = await axios.post(`${config.API_BASE_URL}/api/strava/auto-sync`, {}, {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
    //     
    //     if (response.data.synced !== false) {
    //       // Auto-sync actually performed, update activities
    //       if (response.data.activities) {
    //         const sortedActivities = response.data.activities.sort(
    //           (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    //         );
    //         setActivities(sortedActivities);
    //         setSummary(response.data.summary);
    //         setLastSyncTime(new Date(response.data.lastSyncTime));
    //       }
    //     }
    //     
    //     return response.data;
    //   } catch (err) {
    //     console.error('Auto-sync failed:', err);
    //     return null;
    //   } finally {
    //     setAutoSyncing(false);
    //   }
    // };

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('jwt');
      
      if (!token) {
        setError('Please log in to view your dashboard.');
        setLoading(false);
        return;
      }

      try {
        let data: ActivitiesResponse | null = null;
        
        // Step 1: Handle token exchange if code is present
        if (code) {
          console.log('Dashboard loading with Strava authorization code');
          data = await handleTokenExchange(token, code);
          if (!data) {
            // Token exchange failed or was skipped - don't show loading anymore
            setLoading(false);
            return;
          }
          
          // Token exchange successful - update UI immediately
          if (data.activities && data.activities.length > 0) {
            const sortedActivities = data.activities.sort(
              (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            );
            setActivities(sortedActivities);
            setSummary(data.summary);
            setLastSyncTime(data.lastSyncTime ? new Date(data.lastSyncTime) : new Date());
            console.log(`Successfully loaded ${sortedActivities.length} activities from token exchange`);
          }
        } else {
          // Step 2: Normal dashboard load - optimistic loading
          setProcessingStep('sync-check');
          console.log('Dashboard loading in normal mode');
          
          try {
            // First, try to get existing data from database quickly
            data = await fetchActivitiesFromDB(token);
            
            // Update UI immediately with existing data (optimistic loading)
            if (data && data.activities && data.activities.length > 0) {
              const sortedActivities = data.activities.sort(
                (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
              );
              setActivities(sortedActivities);
              setSummary(data.summary);
              setLastSyncTime(data.lastSyncTime ? new Date(data.lastSyncTime) : new Date());
              console.log(`Loaded ${sortedActivities.length} cached activities from database`);
              
              // Stop loading since we have data to show
              setLoading(false);
              setProcessingStep('idle');
              
              // Then check sync status in background (non-blocking)
              checkSyncStatus(token).then(syncStatusData => {
                if (syncStatusData && syncStatusData.connected && syncStatusData.needsSync) {
                  setSyncStatus(syncStatusData);
                  console.log('Sync status: New data available');
                } else if (syncStatusData) {
                  setSyncStatus(syncStatusData);
                  console.log('Sync status: Up to date');
                }
              }).catch(err => {
                console.warn('Background sync status check failed:', err);
              });
              
              return; // Exit early since we have data
            }
            
          } catch (dbErr) {
            console.log('No cached activities found, showing onboarding');
            // No data in database - show onboarding message
            setActivities([]);
            setSummary({} as ActivitySummary);
            setError('Welcome to DoubleDash! Connect your Strava account to get started.');
          }
        }
        
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Unable to load dashboard. Please refresh the page to try again.');
      } finally {
        setLoading(false);
        setProcessingStep('idle');
      }
    };

    loadDashboard();
  }, [code, navigate]); // Only re-run when code or navigate changes

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
        setLastSyncTime(new Date());
      }
    } catch (err) {
      setError('Failed to refresh activities');
    } finally {
      setLoading(false);
    }
  };



  if (error) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <Container>
          <ErrorContainer>
            <Heading size="md">⚠️ Error</Heading>
            <Text>{error}</Text>
            <Button onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
              Try Again
            </Button>
          </ErrorContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (loading && activities.length === 0) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
            <Heading size="md">
              {processingStep === 'token-exchange' ? 'Connecting to Strava...' :
               processingStep === 'sync-check' ? 'Loading Your Dashboard...' :
               'Loading Your Analytics...'}
            </Heading>
            <Text>
              {processingStep === 'token-exchange' ? 'Setting up your account with Strava' :
               processingStep === 'sync-check' ? 'Getting your latest activities' :
               'Crunching your running data'}
            </Text>
          </LoadingContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (activities.length === 0 && !code) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <Container>
          <Section>
            <Heading size="xl">🏃‍♂️ Your Running Analytics Dashboard</Heading>
            <Text size="lg" color="secondary">
              No activities found. Please go to <Link to="/">Home</Link> and connect your Strava account.
            </Text>
          </Section>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Container>
        <ThemeToggle onClick={toggleTheme} variant="secondary">
          {isDarkMode ? '☀️' : '🌙'}
        </ThemeToggle>

        <Section>
          <FlexContainer justify="space-between" align="center" style={{ marginBottom: '32px' }}>
            <div>
              <Heading size="xl">🏃‍♂️ Dashboard</Heading>
              <Text size="md" color="secondary">
                All time activities • {activities.length} total runs
              </Text>
            </div>
            <FlexContainer direction="column" align="flex-end" gap="xs">
              <FlexContainer gap="sm" align="center">
                <Button 
                  onClick={handleRefresh}
                  disabled={loading || autoSyncing || processingStep !== 'idle'}
                  variant="primary"
                  size="sm"
                >
                  {processingStep === 'token-exchange' ? '🔗 Connecting to Strava...' :
                   processingStep === 'sync-check' ? '🔍 Checking for updates...' :
                   loading ? '⏳ Syncing...' : 
                   autoSyncing ? '🔄 Auto-syncing...' : 
                   '🔄 Sync Strava'}
                </Button>
                
                {syncStatus && (
                  <Text 
                    size="xs" 
                    color="secondary"
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: syncStatus.needsSync ? '#fff3cd' : '#d1edff',
                      border: `1px solid ${syncStatus.needsSync ? '#ffeaa7' : '#74b9ff'}`,
                      color: syncStatus.needsSync ? '#856404' : '#0c5460'
                    }}
                  >
                    {syncStatus.needsSync ? '🟡 New data available' : '🟢 Up to date'}
                  </Text>
                )}
              </FlexContainer>
              
              <FlexContainer direction="column" align="flex-end" gap="xs">
                {lastSyncTime && (
                  <Text size="xs" color="secondary">
                    Last synced: {lastSyncTime.toLocaleString()}
                  </Text>
                )}
                {syncStatus?.hoursElapsed && (
                  <Text size="xs" color="secondary">
                    {syncStatus.hoursElapsed < 1 ? 
                      'Less than 1 hour ago' : 
                      `${syncStatus.hoursElapsed.toFixed(1)} hours ago`
                    }
                  </Text>
                )}
              </FlexContainer>
            </FlexContainer>
          </FlexContainer>
          
          {/* Summary Metrics */}
          <MetricsGrid columns={4} gap="lg">
            <MetricCard>
              <MetricValue>{summary.totalActivities || 0}</MetricValue>
              <MetricLabel>Total Runs</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{convertMetersToMiles(summary.totalDistance || 0).toFixed(1)}</MetricValue>
              <MetricLabel>Miles</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{convertSecondsToHours(summary.totalMovingTime || 0).toFixed(1)}</MetricValue>
              <MetricLabel>Hours</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{convertMetersToFeet(summary.totalElevation || 0).toFixed(0)}</MetricValue>
              <MetricLabel>Feet Climbed</MetricLabel>
            </MetricCard>
          </MetricsGrid>

          {/* Auto-sync Status Card */}
          {syncStatus && syncStatus.connected && (
            <Card style={{ 
              marginBottom: '24px',
              background: autoSyncing ? 
                'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' :
                syncStatus.needsSync ? 
                  'linear-gradient(135deg, #fff3e0 0%, #ffcc02 20%)' : 
                  'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              border: `1px solid ${autoSyncing ? '#2196f3' : syncStatus.needsSync ? '#ff9800' : '#4caf50'}`,
            }}>
              <FlexContainer align="center" gap="md">
                <Text size="lg">
                  {autoSyncing ? '🔄' : syncStatus.needsSync ? '🟡' : '🟢'}
                </Text>
                <div style={{ flex: 1 }}>
                  <Text weight="medium" size="md">
                    {autoSyncing ? 'Auto-syncing in progress...' :
                     syncStatus.needsSync ? 'New activities may be available' :
                     'Your data is up to date'}
                  </Text>
                  <Text size="sm" color="secondary">
                    {autoSyncing ? 'Checking for new activities from Strava' :
                     syncStatus.message}
                  </Text>
                </div>
                {syncStatus.needsSync && !autoSyncing && (
                  <Button 
                    onClick={handleRefresh}
                    variant="primary"
                    size="sm"
                  >
                    Sync Now
                  </Button>
                )}
              </FlexContainer>
            </Card>
          )}

          {/* Recent Activities Preview */}
          <Card style={{ marginBottom: '32px' }}>
            <FlexContainer justify="space-between" align="center" style={{ marginBottom: '16px' }}>
              <Heading size="md">Recent Activities</Heading>
              <Link to="/activities">
                <Button variant="secondary" size="sm">View All</Button>
              </Link>
            </FlexContainer>
            {activities.slice(0, 3).map((activity) => (
              <FlexContainer key={activity.activityId} justify="space-between" align="center" style={{ 
                padding: '12px 0', 
                borderBottom: '1px solid #e2e8f0' 
              }}>
                <div>
                  <Text weight="medium">{activity.name}</Text>
                  <Text size="sm" color="secondary">
                    {new Date(activity.start_date).toLocaleDateString()}
                  </Text>
                </div>
                <FlexContainer gap="lg">
                  <div style={{ textAlign: 'center' }}>
                    <Text size="sm" weight="medium">
                      {convertMetersToMiles(activity.distance).toFixed(2)} mi
                    </Text>
                    <Text size="xs" color="secondary">Distance</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Text size="sm" weight="medium">
                      {Math.floor(activity.moving_time / 60)}:{String(activity.moving_time % 60).padStart(2, '0')}
                    </Text>
                    <Text size="xs" color="secondary">Time</Text>
                  </div>
                </FlexContainer>
              </FlexContainer>
            ))}
          </Card>

          {/* Quick Links */}
          <Grid columns={2} gap="lg">
            <Card>
              <Heading size="sm" style={{ marginBottom: '16px' }}>📊 Detailed Analytics</Heading>
              <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                View comprehensive charts, trends, and performance insights
              </Text>
              <Link to="/analytics">
                <Button variant="primary" size="md" style={{ width: '100%' }}>
                  View Analytics
                </Button>
              </Link>
            </Card>
            
            <Card>
              <Heading size="sm" style={{ marginBottom: '16px' }}>🏃‍♂️ All Activities</Heading>
              <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                Browse, search, and filter through all your activities
              </Text>
              <Link to="/activities">
                <Button variant="secondary" size="md" style={{ width: '100%' }}>
                  Browse Activities
                </Button>
              </Link>
            </Card>
          </Grid>
        </Section>
      </Container>
    </ThemeProvider>
  );
};

export default EnhancedDashboard;