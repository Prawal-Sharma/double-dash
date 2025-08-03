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
import StravaOnboardingFlow, { OnboardingStep } from './StravaOnboardingFlow';
import { useActivities } from '../contexts/ActivitiesContext';

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
  const { state: activitiesState, fetchActivities, refreshActivities } = useActivities();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Extract data from context
  const { activities, summary, loading, error, lastSyncTime } = activitiesState;
  
  // Onboarding flow state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('connecting');

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

  // Token exchange handler
  const handleTokenExchange = async (token: string, code: string): Promise<void> => {
    const cacheKey = `strava-exchange-${code}`;
    const processingKey = `processing-${code}`;
    const timestampKey = `exchange-timestamp-${code}`;
    
    // Check if this code was already successfully processed
    const cachedResult = sessionStorage.getItem(cacheKey);
    if (cachedResult) {
      console.log('Using cached token exchange result');
      navigate('/dashboard', { replace: true });
      const data = JSON.parse(cachedResult);
      if (data.activities && data.activities.length > 0) {
        setOnboardingStep('complete');
        setTimeout(() => setShowOnboarding(false), 2000);
      }
      return;
    }
    
    // Check if already processing
    if (sessionStorage.getItem(processingKey)) {
      console.log('Token exchange already in progress');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Check rate limiting
    const lastAttempt = sessionStorage.getItem(timestampKey);
    if (lastAttempt && (Date.now() - parseInt(lastAttempt)) < 30000) {
      console.log('Recent token exchange attempt detected');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    try {
      sessionStorage.setItem(processingKey, 'true');
      sessionStorage.setItem(timestampKey, Date.now().toString());
      setOnboardingStep('syncing');
      
      // Clear URL immediately
      navigate('/dashboard', { replace: true });
      
      console.log('Starting Strava token exchange...');
      const response = await axios.post<ActivitiesResponse>(
        `${config.API_BASE_URL}/api/strava/exchange_token`,
        { code },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // Increased to 60 seconds for better UX
        }
      );
      
      console.log('Token exchange successful');
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
      
      if (response.data.activities && response.data.activities.length > 0) {
        setOnboardingStep('processing');
        
        // Force refresh the context data and wait for it to complete
        await fetchActivities(true);
        
        // Give a small delay to ensure UI updates
        setTimeout(() => {
          setOnboardingStep('complete');
          setTimeout(() => {
            setShowOnboarding(false);
          }, 2000);
        }, 1500);
      } else {
        // No activities found, but still complete the onboarding
        setOnboardingStep('complete');
        setTimeout(() => {
          setShowOnboarding(false);
        }, 2000);
      }
      
      // Cleanup
      setTimeout(() => {
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(timestampKey);
      }, 5 * 60 * 1000);
      
    } catch (error: any) {
      console.error('Token exchange failed:', error);
      
      // Handle different types of errors with better UX
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Show timeout-specific onboarding step
        setOnboardingStep('timeout');
        setTimeout(() => {
          setShowOnboarding(false);
        }, 4000);
      } else {
        setShowOnboarding(false);
      }
      
      // Let the context handle the error display
    } finally {
      sessionStorage.removeItem(processingKey);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem('jwt');
      if (!token) {
        return; // Let the context handle the auth error
      }

      if (code) {
        console.log('Starting onboarding flow for new user');
        setShowOnboarding(true);
        setOnboardingStep('connecting');
        await handleTokenExchange(token, code);
      } else {
        // Normal dashboard load - use context
        await fetchActivities();
      }
    };

    initializeDashboard();
  }, [code]); // Only re-run when code changes

  // Handle refresh using context
  const handleRefresh = async () => {
    await refreshActivities();
  };

  // Show onboarding flow for first-time users
  if (showOnboarding) {
    return (
      <StravaOnboardingFlow
        step={onboardingStep}
        activityCount={activities.length}
        isDarkMode={isDarkMode}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

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
            <Heading size="md">🏃‍♂️ Loading Your Dashboard...</Heading>
            <Text>Getting your latest activities</Text>
          </LoadingContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (activities.length === 0 && !code && !loading) {
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
                  disabled={loading}
                  variant="primary"
                  size="sm"
                >
                  {loading ? '⏳ Syncing...' : '🔄 Sync Strava'}
                </Button>
              </FlexContainer>
              
              <FlexContainer direction="column" align="flex-end" gap="xs">
                {lastSyncTime && (
                  <Text size="xs" color="secondary">
                    Last synced: {lastSyncTime.toLocaleString()}
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