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

    const exchangeTokenAndFetch = async (token: string, code: string): Promise<ActivitiesResponse> => {
      try {
        const response = await axios.post<ActivitiesResponse>(
          `${config.API_BASE_URL}/api/strava/exchange_token`,
          { code },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (err: any) {
        // Check if this is a Strava authorization error
        if (err.response?.status === 400 || err.response?.status === 401) {
          // Redirect to auth failure page for user-friendly error handling
          navigate('/auth-failure');
          throw new Error('Strava authorization failed');
        }
        throw new Error('Failed to exchange Strava token');
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

    const performAutoSync = async (token: string) => {
      try {
        setAutoSyncing(true);
        const response = await axios.post(`${config.API_BASE_URL}/api/strava/auto-sync`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.synced !== false) {
          // Auto-sync actually performed, update activities
          if (response.data.activities) {
            const sortedActivities = response.data.activities.sort(
              (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            );
            setActivities(sortedActivities);
            setSummary(response.data.summary);
            setLastSyncTime(new Date(response.data.lastSyncTime));
          }
        }
        
        return response.data;
      } catch (err) {
        console.error('Auto-sync failed:', err);
        return null;
      } finally {
        setAutoSyncing(false);
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
          // Check sync status first (this tells us if Strava is connected)
          const syncStatusData = await checkSyncStatus(token);
          
          if (syncStatusData && syncStatusData.connected) {
            // Only try auto-sync if Strava is connected
            const autoSyncData = await performAutoSync(token);
            
            if (autoSyncData && autoSyncData.synced !== false) {
              // Use auto-sync data if it performed a sync
              data = autoSyncData;
            } else {
              // Fall back to regular database fetch
              data = await fetchActivitiesFromDB(token);
            }
          } else {
            // No Strava connection, just fetch from database
            try {
              data = await fetchActivitiesFromDB(token);
            } catch (dbErr) {
              // If no data in database and no Strava connection, show welcome message
              setActivities([]);
              setSummary({} as ActivitySummary);
              setLastSyncTime(new Date());
              setError('No Strava connection found. Please register and connect your Strava account to see your activities.');
              setLoading(false);
              return;
            }
          }
        }

        if (data && data.activities && data.activities.length > 0) {
          const sortedActivities = data.activities.sort(
            (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          setActivities(sortedActivities);
          setSummary(data.summary);
          setLastSyncTime(data.lastSyncTime ? new Date(data.lastSyncTime) : new Date());
        } else {
          setActivities([]);
          setSummary({} as ActivitySummary);
          setLastSyncTime(new Date());
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
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

  if (loading) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
            <Heading size="md">Loading Your Analytics...</Heading>
            <Text>Crunching your running data</Text>
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
                  disabled={loading || autoSyncing}
                  variant="primary"
                  size="sm"
                >
                  {loading ? '⏳ Syncing...' : 
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