import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import config from '../config';
import { Activity, ActivitySummary, ActivitiesResponse, YearlyProgress } from '../types';
import { lightTheme, darkTheme } from '../styles/theme';
import { 
  Container, 
  Card, 
  Grid, 
  FlexContainer, 
  Button, 
  Input, 
  Select, 
  Heading, 
  Text,
  Section,
  Divider
} from '../styles/components';

// Chart components
import MonthlyStatsChart from './charts/MonthlyStatsChart';
import WeeklyVolumeChart from './charts/WeeklyVolumeChart';
import DistributionCharts from './charts/DistributionCharts';
import PersonalRecordsCard from './charts/PersonalRecordsCard';
import HeartRateZoneChart from './charts/HeartRateZoneChart';

// Utils
import { 
  convertMetersToMiles, 
  convertMetersToFeet, 
  convertSecondsToHours,
  calculatePerformanceTrends
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

const ControlsContainer = styled(FlexContainer)`
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary>({} as ActivitySummary);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activitiesPerPage] = useState<number>(30);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<'distance' | 'runs' | 'pace' | 'time'>('distance');

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
        const response = await axios.get<ActivitiesResponse>(`${config.API_BASE_URL}/activities`, {
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
          `${config.API_BASE_URL}/exchange_token`,
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
      const response = await axios.get<ActivitiesResponse>(`${config.API_BASE_URL}/activities/refresh`, {
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

  // Calculate year progress
  const calculateYearProgress = (): YearlyProgress => {
    const year2025Activities = activities.filter(activity => 
      activity.type === 'Run' && new Date(activity.start_date) >= new Date('2025-01-01')
    );
    const totalMiles = year2025Activities.reduce((sum, activity) => 
      sum + convertMetersToMiles(activity.distance), 0
    );
    return {
      totalRuns: year2025Activities.length,
      totalMiles: totalMiles.toFixed(2),
    };
  };

  const yearProgress = calculateYearProgress();
  const goalMiles = 800;
  const progressPercentage = Math.min((parseFloat(yearProgress.totalMiles) / goalMiles) * 100, 100);

  // Performance trends
  const trends = calculatePerformanceTrends(activities);

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
          <Heading size="xl">🏃‍♂️ Your Running Analytics Dashboard</Heading>
          
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

          {/* Controls */}
          <ControlsContainer justify="space-between" wrap>
            <FlexContainer gap="md" wrap>
              <Button 
                onClick={handleRefresh}
                disabled={loading}
                variant="primary"
              >
                {loading ? '⏳ Syncing...' : '🔄 Sync Strava'}
              </Button>
              
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'distance' | 'runs' | 'pace' | 'time')}
              >
                <option value="distance">Monthly Distance</option>
                <option value="runs">Monthly Runs</option>
                <option value="pace">Monthly Pace</option>
                <option value="time">Monthly Time</option>
              </Select>
            </FlexContainer>
            
            <FlexContainer gap="md">
              <Input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '200px' }}
              />
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Run">Run</option>
                <option value="Ride">Ride</option>
                <option value="Walk">Walk</option>
              </Select>
            </FlexContainer>
          </ControlsContainer>

          {/* Personal Records */}
          <PersonalRecordsCard activities={activities} />

          {/* Charts Grid */}
          <ChartGrid>
            {/* Monthly trends */}
            <MonthlyStatsChart activities={activities} metric={selectedMetric} />
            
            {/* Weekly volume */}
            <WeeklyVolumeChart activities={activities} />
            
            {/* Two column layout for distribution charts */}
            <TwoColumnGrid>
              <DistributionCharts activities={activities} />
            </TwoColumnGrid>
            
            {/* Heart rate analysis */}
            <HeartRateZoneChart activities={activities} />
          </ChartGrid>

          {/* Performance Insights */}
          {trends && (
            <Card>
              <Heading size="md">📈 Performance Trends (Month-over-Month)</Heading>
              <Grid columns={4} gap="md">
                <div style={{ textAlign: 'center' }}>
                  <Text size="lg" weight="bold" color={trends.distanceTrend > 0 ? 'primary' : 'secondary'}>
                    {trends.distanceTrend > 0 ? '+' : ''}{trends.distanceTrend.toFixed(1)}%
                  </Text>
                  <Text size="sm" color="secondary">Distance</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="lg" weight="bold" color={trends.paceTrend < 0 ? 'primary' : 'secondary'}>
                    {trends.paceTrend > 0 ? '+' : ''}{trends.paceTrend.toFixed(1)}%
                  </Text>
                  <Text size="sm" color="secondary">Pace</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="lg" weight="bold" color={trends.volumeTrend > 0 ? 'primary' : 'secondary'}>
                    {trends.volumeTrend > 0 ? '+' : ''}{trends.volumeTrend.toFixed(1)}%
                  </Text>
                  <Text size="sm" color="secondary">Volume</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="lg" weight="bold" color={trends.elevationTrend > 0 ? 'primary' : 'secondary'}>
                    {trends.elevationTrend > 0 ? '+' : ''}{trends.elevationTrend.toFixed(1)}%
                  </Text>
                  <Text size="sm" color="secondary">Elevation</Text>
                </div>
              </Grid>
            </Card>
          )}
        </Section>
      </Container>
    </ThemeProvider>
  );
};

export default EnhancedDashboard;