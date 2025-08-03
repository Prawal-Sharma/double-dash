import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import config from '../config';
import { ActivitiesResponse } from '../types';
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
import AuthErrorBoundary from './AuthErrorBoundary';
import { useActivities } from '../contexts/ActivitiesContext';
import { StravaExchangeStorage, LocalStorageManager } from '../utils/sessionStorage';
import { TokenValidator, validateAuthState } from '../utils/tokenValidation';
import { 
  convertMetersToMiles, 
  convertMetersToFeet, 
  convertSecondsToHours
} from '../utils/activityUtils';

// Constants
const ONBOARDING_TIMEOUTS = {
  PROCESSING_DELAY: 300, // Reduced from 1500ms
  COMPLETION_DELAY: 800,  // Reduced from 2000ms  
  TIMEOUT_DELAY: 4000,
  CLEANUP_DELAY: 5 * 60 * 1000, // 5 minutes
  FALLBACK_DELAY: 5000, // Auto-proceed after 5 seconds
  SHOW_CONTINUE_DELAY: 3000 // Show continue button after 3 seconds
} as const;

const RATE_LIMIT_WINDOW = 30000; // 30 seconds

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
  const { state: activitiesState, fetchActivities, refreshActivities, checkAuthAndRedirect, setOnboarding } = useActivities();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Extract data from context
  const { activities, summary, loading, error, lastSyncTime } = activitiesState;
  
  // Onboarding flow state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('connecting');
  const [showContinueButton, setShowContinueButton] = useState<boolean>(false);
  
  // Refs for cleanup
  const timeoutRefs = useRef<Array<NodeJS.Timeout>>([]);
  const mountedRef = useRef(true);
  
  // Debug: Log mountedRef changes
  useEffect(() => {
    console.log('🔧 mountedRef initialized to:', mountedRef.current);
    mountedRef.current = true; // Ensure it's set to true
    console.log('🔧 mountedRef set to:', mountedRef.current);
  }, []);

  const code: string | null = searchParams.get('code');

  // Cleanup helper functions
  const addTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      // Always execute callback - the component is clearly mounted if we're in onboarding
      callback();
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  // Handle onboarding completion with proper sequencing
  const completeOnboarding = useCallback(async () => {
    try {
      // Clear any existing timeouts
      clearAllTimeouts();
      
      // Step 1: Set to completion step
      setOnboardingStep('complete');
      
      // Step 2: Brief delay for UX
      await new Promise(resolve => setTimeout(resolve, ONBOARDING_TIMEOUTS.COMPLETION_DELAY));
      
      // Step 3: Hide onboarding UI
      setShowOnboarding(false);
      setShowContinueButton(false);
      
      // Step 4: Disable onboarding mode in context (critical: do this BEFORE fetchActivities)
      setOnboarding(false);
      
      // Step 5: Brief delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 6: Fetch activities with force refresh
      // DEBUG: Check token before fetching
      const token = localStorage.getItem('jwt');
      console.log('🔍 About to fetch activities. Token exists:', !!token);
      if (token) {
        console.log('🔍 Token length:', token.length, 'First 20 chars:', token.substring(0, 20));
      }
      
      await fetchActivities(true);
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // Fallback: force hide onboarding and show dashboard
      setShowOnboarding(false);
      setShowContinueButton(false);
      setOnboarding(false);
    }
  }, [clearAllTimeouts, setOnboarding, fetchActivities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = LocalStorageManager.getItem('dashboardTheme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    LocalStorageManager.setItem('dashboardTheme', newTheme ? 'dark' : 'light');
  };

  // Token exchange handler
  const handleTokenExchange = useCallback(async (token: string, code: string): Promise<void> => {
    // DEBUG: Check token details before validation
    console.log('🔍 Token exchange starting. Token details:', {
      exists: !!token,
      length: token?.length || 0,
      firstChars: token?.substring(0, 30) || 'none'
    });
    
    // Try to decode token for debugging
    try {
      const decoded = TokenValidator.decodeToken(token);
      console.log('🔍 Decoded token payload:', decoded);
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
    }
    
    // Validate token before proceeding
    if (!TokenValidator.isTokenValid(token)) {
      console.warn('❌ Invalid or expired token during onboarding');
      navigate('/login', { replace: true });
      return;
    }
    
    // Check if this code was already successfully processed
    const cachedResult = StravaExchangeStorage.getCacheResult(code);
    if (cachedResult) {
      navigate('/dashboard', { replace: true });
      if (cachedResult.activities && cachedResult.activities.length > 0) {
        setOnboardingStep('complete');
        addTimeout(() => setShowOnboarding(false), ONBOARDING_TIMEOUTS.COMPLETION_DELAY);
      }
      return;
    }
    
    // Check if already processing
    if (StravaExchangeStorage.isCurrentlyProcessing(code)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Check rate limiting
    if (StravaExchangeStorage.isRecentAttempt(code, RATE_LIMIT_WINDOW)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    try {
      StravaExchangeStorage.markAsProcessing(code);
      setOnboardingStep('syncing');
      
      // Clear URL immediately
      navigate('/dashboard', { replace: true });
      
      const response = await axios.post<ActivitiesResponse>(
        `${config.API_BASE_URL}/api/strava/exchange_token?token=${encodeURIComponent(token)}`,
        { code },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Auth-Token': token  // CloudFront-friendly custom header
          },
          timeout: 60000 // Increased to 60 seconds for better UX
        }
      );
      
      StravaExchangeStorage.setCacheResult(code, response.data);
      
      // DEBUG: Check what we got back from token exchange
      console.log('🔄 Token exchange response:', {
        hasActivities: !!(response.data.activities && response.data.activities.length > 0),
        activityCount: response.data.activities?.length || 0,
        message: response.data.message
      });

      if (response.data.activities && response.data.activities.length > 0) {
        setOnboardingStep('processing');
        
        // Set up fallback mechanisms
        const fallbackTimeoutId = addTimeout(() => {
          completeOnboarding();
        }, ONBOARDING_TIMEOUTS.FALLBACK_DELAY);
        
        const continueButtonTimeoutId = addTimeout(() => {
          setShowContinueButton(true);
        }, ONBOARDING_TIMEOUTS.SHOW_CONTINUE_DELAY);
        
        // Process with shorter delay and complete
        addTimeout(() => {
          clearTimeout(fallbackTimeoutId);
          clearTimeout(continueButtonTimeoutId);
          completeOnboarding().catch(error => {
            console.error('❌ Error in completeOnboarding:', error);
          });
        }, ONBOARDING_TIMEOUTS.PROCESSING_DELAY);
        
      } else {
        // No activities found, but still complete the onboarding  
        setOnboardingStep('processing');
        addTimeout(() => {
          completeOnboarding().catch(error => {
            console.error('❌ Error in completeOnboarding:', error);
          });
        }, ONBOARDING_TIMEOUTS.PROCESSING_DELAY);
      }
      
      // Cleanup session storage
      addTimeout(() => {
        StravaExchangeStorage.cleanup(code);
      }, ONBOARDING_TIMEOUTS.CLEANUP_DELAY);
      
    } catch (error: any) {
      console.error('Token exchange error:', error);
      
      // Handle different types of errors with better UX
      if (error.response?.status === 401) {
        // Authentication error during onboarding
        console.warn('Authentication failed during token exchange');
        TokenValidator.clearToken();
        navigate('/login', { replace: true });
        return;
        
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Show timeout-specific onboarding step
        setOnboardingStep('timeout');
        addTimeout(() => {
          setShowOnboarding(false);
        }, ONBOARDING_TIMEOUTS.TIMEOUT_DELAY);
        
      } else {
        // Other errors - hide onboarding and let context handle
        setShowOnboarding(false);
      }
      
      // Let the context handle the error display for non-auth errors
    } finally {
      StravaExchangeStorage.finishProcessing(code);
    }
  }, [navigate, fetchActivities, addTimeout, setOnboarding, completeOnboarding]);

  useEffect(() => {
    const initializeDashboard = async () => {
      // Check authentication state first
      const { isAuthenticated, token, shouldRedirectToLogin } = validateAuthState();
      
      if (shouldRedirectToLogin) {
        navigate('/login', { replace: true });
        return;
      }

      if (!isAuthenticated || !token) {
        console.warn('No valid authentication found');
        return; // Let the context handle the auth error
      }

      if (code) {
        console.log('Starting onboarding flow for new user');
        setOnboarding(true); // Prevent context from fetching during onboarding
        setShowOnboarding(true);
        setOnboardingStep('connecting');
        await handleTokenExchange(token, code);
      } else {
        // Normal dashboard load - use context
        setOnboarding(false); // Allow context to fetch normally
        await fetchActivities();
      }
    };

    initializeDashboard();
  }, [code, handleTokenExchange, fetchActivities, navigate, setOnboarding]);

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
        showContinueButton={showContinueButton}
        onContinue={completeOnboarding}
      />
    );
  }

  if (error) {
    // Check if this is an authentication error
    const isAuthError = error.includes('Authentication') || 
                       error.includes('expired') || 
                       error.includes('Redirecting to login');
    
    if (isAuthError) {
      return (
        <AuthErrorBoundary 
          error={error}
          isDarkMode={isDarkMode}
          onRetry={() => {
            // Try to check auth and redirect, or reload
            if (!checkAuthAndRedirect()) {
              window.location.reload();
            }
          }}
        />
      );
    }
    
    // Non-auth errors - show regular error container
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