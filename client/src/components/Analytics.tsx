import React, { useState, useEffect } from 'react';
import { useActivities } from '../contexts/ActivitiesContext';
import { ThemeProvider } from 'styled-components';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { lightTheme } from '../styles/theme';
import { Activity } from '../types';
import {
  Container,
  Card,
  Heading,
  Text,
  FlexContainer,
  Grid,
  LoadingSpinner,
  ErrorMessage,
  Select,
  FormGroup,
  Label,
  Badge
} from '../styles/components';
import styled from 'styled-components';

const StatsCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.surface} 0%, ${({ theme }) => theme.colors.background} 100%);
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ChartContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 400px;
`;

const ChartWrapper = styled.div`
  height: 300px;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const InsightCard = styled(Card)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}15 0%, ${({ theme }) => theme.colors.surface} 100%);
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ComparisonCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
`;

const TrendIndicator = styled.span<{ trend: 'up' | 'down' | 'neutral' }>`
  color: ${({ theme, trend }) => 
    trend === 'up' ? theme.colors.success :
    trend === 'down' ? theme.colors.error :
    theme.colors.text.secondary
  };
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FilterContainer = styled(FlexContainer)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;


interface AnalyticsData {
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  totalActivities: number;
  avgPace: number;
  avgHeartRate: number;
  monthlyStats: Array<{
    month: string;
    distance: number;
    activities: number;
    elevation: number;
  }>;
  weeklyDistribution: Array<{
    day: string;
    count: number;
  }>;
}

const Analytics: React.FC = () => {
  const { state: activitiesState, fetchActivities } = useActivities();
  const { activities, loading, error } = activitiesState;
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [activityType, setActivityType] = useState<'all' | 'Run' | 'Ride'>('all');

  useEffect(() => {
    // Fetch activities using context on mount
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (activities.length > 0) {
      calculateAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, timeRange, activityType]);


  const filterActivitiesByTimeRange = (activities: Activity[]): Activity[] => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return activities;
    }

    return activities.filter(activity => new Date(activity.start_date) >= cutoffDate);
  };

  const calculateAnalytics = () => {
    let filtered = [...activities];

    // Filter by activity type
    if (activityType !== 'all') {
      filtered = filtered.filter(activity => activity.type === activityType);
    }

    // Filter by time range
    filtered = filterActivitiesByTimeRange(filtered);

    if (filtered.length === 0) {
      setAnalytics({
        totalDistance: 0,
        totalTime: 0,
        totalElevation: 0,
        totalActivities: 0,
        avgPace: 0,
        avgHeartRate: 0,
        monthlyStats: [],
        weeklyDistribution: []
      });
      return;
    }

    // Calculate totals
    const totalDistance = filtered.reduce((sum, activity) => sum + activity.distance, 0);
    const totalTime = filtered.reduce((sum, activity) => sum + activity.moving_time, 0);
    const totalElevation = filtered.reduce((sum, activity) => sum + activity.total_elevation_gain, 0);
    const totalActivities = filtered.length;

    // Calculate averages
    const avgSpeed = filtered.reduce((sum, activity) => sum + activity.average_speed, 0) / filtered.length;
    const activitiesWithHR = filtered.filter(activity => activity.average_heartrate);
    const avgHeartRate = activitiesWithHR.length > 0 
      ? activitiesWithHR.reduce((sum, activity) => sum + (activity.average_heartrate || 0), 0) / activitiesWithHR.length
      : 0;

    // Calculate monthly stats
    const monthlyData = new Map<string, { distance: number; activities: number; elevation: number }>();
    filtered.forEach(activity => {
      const month = new Date(activity.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const current = monthlyData.get(month) || { distance: 0, activities: 0, elevation: 0 };
      monthlyData.set(month, {
        distance: current.distance + activity.distance,
        activities: current.activities + 1,
        elevation: current.elevation + activity.total_elevation_gain
      });
    });

    const monthlyStats = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Calculate weekly distribution
    const weeklyData = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayNames.forEach(day => weeklyData.set(day, 0));

    filtered.forEach(activity => {
      const dayOfWeek = dayNames[new Date(activity.start_date).getDay()];
      weeklyData.set(dayOfWeek, (weeklyData.get(dayOfWeek) || 0) + 1);
    });

    const weeklyDistribution = Array.from(weeklyData.entries())
      .map(([day, count]) => ({ day, count }));

    setAnalytics({
      totalDistance,
      totalTime,
      totalElevation,
      totalActivities,
      avgPace: avgSpeed,
      avgHeartRate,
      monthlyStats,
      weeklyDistribution
    });
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return miles.toFixed(0);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  const formatPace = (metersPerSecond: number): string => {
    if (metersPerSecond === 0) return '--';
    const secondsPerMile = 1609.34 / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (metersPerSecond: number): string => {
    const mph = metersPerSecond * 2.237;
    return `${mph.toFixed(1)}`;
  };

  // Chart data preparation
  const prepareMonthlyData = () => {
    if (!analytics?.monthlyStats) return [];
    
    return analytics.monthlyStats.map(stat => ({
      month: stat.month,
      distance: (stat.distance * 0.000621371).toFixed(1), // Convert to miles
      activities: stat.activities,
      elevation: Math.round(stat.elevation * 3.28084) // Convert to feet
    }));
  };

  const prepareWeeklyData = () => {
    if (!analytics?.weeklyDistribution) return [];
    
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayOrder.map(day => {
      const dayData = analytics.weeklyDistribution.find(d => d.day === day) || { day, count: 0 };
      return {
        day: day.slice(0, 3), // Abbreviate day names
        activities: dayData.count
      };
    });
  };

  const prepareActivityTypeData = () => {
    const typeMap = new Map<string, number>();
    activities.forEach(activity => {
      typeMap.set(activity.type, (typeMap.get(activity.type) || 0) + 1);
    });
    
    return Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / activities.length) * 100).toFixed(1)
    }));
  };

  const preparePaceData = () => {
    if (activities.length === 0) return [];
    
    const paceData = activities
      .filter(activity => activity.type === 'Run' && activity.average_speed > 0)
      .slice(0, 20) // Last 20 runs
      .reverse()
      .map((activity, index) => {
        const pace = 1609.34 / activity.average_speed; // seconds per mile
        const minutes = Math.floor(pace / 60);
        const seconds = Math.floor(pace % 60);
        return {
          run: `Run ${index + 1}`,
          pace: parseFloat(pace.toFixed(2)),
          paceDisplay: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          date: new Date(activity.start_date).toLocaleDateString()
        };
      });
    
    return paceData;
  };

  const calculateComparisons = () => {
    if (activities.length === 0) return null;
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthActivities = activities.filter(a => new Date(a.start_date) >= thisMonth);
    const lastMonthActivities = activities.filter(a => 
      new Date(a.start_date) >= lastMonth && new Date(a.start_date) <= lastMonthEnd
    );
    
    const thisMonthDistance = thisMonthActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
    const lastMonthDistance = lastMonthActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
    
    const distanceChange = lastMonthDistance > 0 ? 
      ((thisMonthDistance - lastMonthDistance) / lastMonthDistance * 100) : 0;
    
    const activityChange = lastMonthActivities.length > 0 ?
      ((thisMonthActivities.length - lastMonthActivities.length) / lastMonthActivities.length * 100) : 0;
    
    return {
      thisMonthDistance: thisMonthDistance.toFixed(1),
      lastMonthDistance: lastMonthDistance.toFixed(1),
      distanceChange: distanceChange.toFixed(1),
      thisMonthActivities: thisMonthActivities.length,
      lastMonthActivities: lastMonthActivities.length,
      activityChange: activityChange.toFixed(1)
    };
  };

  const monthlyData = prepareMonthlyData();
  const weeklyData = prepareWeeklyData();
  const activityTypeData = prepareActivityTypeData();
  const paceData = preparePaceData();
  const comparisons = calculateComparisons();

  const chartColors = [lightTheme.colors.primary, lightTheme.colors.success, lightTheme.colors.warning, lightTheme.colors.error];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: `1px solid ${lightTheme.colors.border}`,
          borderRadius: lightTheme.borderRadius.sm,
          boxShadow: lightTheme.shadows.md
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <ThemeProvider theme={lightTheme}>
        <Container>
          <FlexContainer direction="column" align="center" style={{ marginTop: '100px' }}>
            <LoadingSpinner />
            <Text style={{ marginTop: '16px' }}>Loading your analytics...</Text>
          </FlexContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={lightTheme}>
        <Container>
          <ErrorMessage style={{ marginTop: '50px', textAlign: 'center' }}>
            ⚠️ {error}
          </ErrorMessage>
        </Container>
      </ThemeProvider>
    );
  }

  if (!analytics) {
    return (
      <ThemeProvider theme={lightTheme}>
        <Container>
          <Text style={{ marginTop: '50px', textAlign: 'center' }}>
            No analytics data available.
          </Text>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <Heading size="lg" style={{ margin: '32px 0' }}>Analytics Dashboard</Heading>
        
        {/* Filter Controls */}
        <FilterContainer direction="row" wrap gap="md">
          <FormGroup style={{ minWidth: '150px', marginBottom: 0 }}>
            <Label>Time Range</Label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'all' | '30d' | '90d' | '1y')}
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </Select>
          </FormGroup>
          
          <FormGroup style={{ minWidth: '150px', marginBottom: 0 }}>
            <Label>Activity Type</Label>
            <Select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as 'all' | 'Run' | 'Ride')}
            >
              <option value="all">All Types</option>
              <option value="Run">Running</option>
              <option value="Ride">Cycling</option>
            </Select>
          </FormGroup>
        </FilterContainer>

        {/* Summary Stats */}
        <Grid columns={4} gap="lg" style={{ marginBottom: '32px' }}>
          <StatsCard>
            <StatNumber>{analytics.totalActivities}</StatNumber>
            <StatDescription>Total Activities</StatDescription>
          </StatsCard>
          
          <StatsCard>
            <StatNumber>{formatDistance(analytics.totalDistance)}</StatNumber>
            <StatDescription>Miles Covered</StatDescription>
          </StatsCard>
          
          <StatsCard>
            <StatNumber>{formatTime(analytics.totalTime)}</StatNumber>
            <StatDescription>Time Spent</StatDescription>
          </StatsCard>
          
          <StatsCard>
            <StatNumber>{Math.round(analytics.totalElevation * 3.28084).toLocaleString()}</StatNumber>
            <StatDescription>Elevation Gained (ft)</StatDescription>
          </StatsCard>
        </Grid>

        {/* Performance Metrics */}
        <Grid columns={2} gap="lg" style={{ marginBottom: '32px' }}>
          <StatsCard>
            <StatNumber>
              {activityType === 'Run' || (activityType === 'all' && activities.some(a => a.type === 'Run'))
                ? `${formatPace(analytics.avgPace)}/mi`
                : `${formatSpeed(analytics.avgPace)} mph`
              }
            </StatNumber>
            <StatDescription>
              {activityType === 'Run' || (activityType === 'all' && activities.some(a => a.type === 'Run'))
                ? 'Average Pace'
                : 'Average Speed'
              }
            </StatDescription>
          </StatsCard>
          
          {analytics.avgHeartRate > 0 && (
            <StatsCard>
              <StatNumber>{Math.round(analytics.avgHeartRate)}</StatNumber>
              <StatDescription>Average Heart Rate (bpm)</StatDescription>
            </StatsCard>
          )}
        </Grid>

        {/* Month-over-Month Comparison */}
        {comparisons && (
          <Grid columns={2} gap="lg" style={{ marginBottom: '32px' }}>
            <ComparisonCard>
              <Heading size="sm" style={{ marginBottom: '16px' }}>This Month vs Last Month</Heading>
              <FlexContainer direction="column" gap="md">
                <div>
                  <Text size="lg" weight="bold">{comparisons.thisMonthDistance} mi</Text>
                  <Text size="sm" color="secondary">This Month</Text>
                  <TrendIndicator trend={parseFloat(comparisons.distanceChange) > 0 ? 'up' : parseFloat(comparisons.distanceChange) < 0 ? 'down' : 'neutral'}>
                    {parseFloat(comparisons.distanceChange) > 0 ? '↗' : parseFloat(comparisons.distanceChange) < 0 ? '↘' : '→'} {Math.abs(parseFloat(comparisons.distanceChange))}%
                  </TrendIndicator>
                </div>
                <div>
                  <Text size="lg" weight="bold">{comparisons.thisMonthActivities} runs</Text>
                  <Text size="sm" color="secondary">This Month</Text>
                  <TrendIndicator trend={parseFloat(comparisons.activityChange) > 0 ? 'up' : parseFloat(comparisons.activityChange) < 0 ? 'down' : 'neutral'}>
                    {parseFloat(comparisons.activityChange) > 0 ? '↗' : parseFloat(comparisons.activityChange) < 0 ? '↘' : '→'} {Math.abs(parseFloat(comparisons.activityChange))}%
                  </TrendIndicator>
                </div>
              </FlexContainer>
            </ComparisonCard>

            <InsightCard>
              <Heading size="sm" style={{ marginBottom: '16px' }}>💡 Insights</Heading>
              <FlexContainer direction="column" gap="sm">
                {parseFloat(comparisons.distanceChange) > 10 && (
                  <Text size="sm">🚀 Great progress! You're running {comparisons.distanceChange}% more distance than last month.</Text>
                )}
                {parseFloat(comparisons.activityChange) > 20 && (
                  <Text size="sm">⚡ Consistency boost! You're running {comparisons.activityChange}% more frequently.</Text>
                )}
                {parseFloat(comparisons.distanceChange) < -10 && (
                  <Text size="sm">💪 Consider setting a weekly distance goal to get back on track.</Text>
                )}
                {analytics.avgHeartRate > 0 && (
                  <Text size="sm">❤️ Average heart rate: {Math.round(analytics.avgHeartRate)} bpm</Text>
                )}
              </FlexContainer>
            </InsightCard>
          </Grid>
        )}

        {/* Charts Section */}
        <Grid columns={1} gap="lg">
          {/* Monthly Progress Chart */}
          <ChartContainer>
            <Heading size="sm" style={{ marginBottom: '8px' }}>Monthly Progress</Heading>
            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
              Distance and activity trends over time
            </Text>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={lightTheme.colors.border} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke={lightTheme.colors.text.secondary}
                  />
                  <YAxis 
                    yAxisId="distance"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    stroke={lightTheme.colors.text.secondary}
                  />
                  <YAxis 
                    yAxisId="activities"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke={lightTheme.colors.text.secondary}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    yAxisId="distance"
                    type="monotone" 
                    dataKey="distance" 
                    stroke={lightTheme.colors.primary} 
                    strokeWidth={3}
                    name="Distance (miles)"
                    dot={{ fill: lightTheme.colors.primary, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="activities"
                    type="monotone" 
                    dataKey="activities" 
                    stroke={lightTheme.colors.success} 
                    strokeWidth={3}
                    name="Activities"
                    dot={{ fill: lightTheme.colors.success, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartContainer>

          {/* Weekly Distribution Chart */}
          <ChartContainer>
            <Heading size="sm" style={{ marginBottom: '8px' }}>Weekly Activity Distribution</Heading>
            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
              Which days you're most active
            </Text>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={lightTheme.colors.border} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    stroke={lightTheme.colors.text.secondary}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke={lightTheme.colors.text.secondary}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="activities" 
                    fill={lightTheme.colors.primary}
                    radius={[4, 4, 0, 0]}
                    name="Activities"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartContainer>

          {/* Two column layout for smaller charts */}
          <Grid columns={2} gap="lg">
            {/* Activity Type Distribution */}
            {activityTypeData.length > 1 && (
              <ChartContainer>
                <Heading size="sm" style={{ marginBottom: '8px' }}>Activity Types</Heading>
                <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                  Distribution of activity types
                </Text>
                <ChartWrapper>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityTypeData}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ type, percentage }) => `${type}: ${percentage}%`}
                      >
                        {activityTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </ChartContainer>
            )}

            {/* Pace Progression for Runs */}
            {paceData.length > 0 && (
              <ChartContainer>
                <Heading size="sm" style={{ marginBottom: '8px' }}>Pace Progression</Heading>
                <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                  Your last {paceData.length} runs
                </Text>
                <ChartWrapper>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={lightTheme.colors.border} />
                      <XAxis 
                        dataKey="run" 
                        tick={{ fontSize: 10 }}
                        stroke={lightTheme.colors.text.secondary}
                      />
                      <YAxis 
                        domain={['dataMin - 30', 'dataMax + 30']}
                        tick={{ fontSize: 12 }}
                        stroke={lightTheme.colors.text.secondary}
                        tickFormatter={(value) => {
                          const minutes = Math.floor(value / 60);
                          const seconds = Math.floor(value % 60);
                          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: 'white',
                                padding: '12px',
                                border: `1px solid ${lightTheme.colors.border}`,
                                borderRadius: lightTheme.borderRadius.sm,
                                boxShadow: lightTheme.shadows.md
                              }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                <p style={{ margin: 0, color: lightTheme.colors.primary }}>
                                  Pace: {data.paceDisplay}/mi
                                </p>
                                <p style={{ margin: 0, color: lightTheme.colors.text.secondary }}>
                                  {data.date}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pace" 
                        stroke={lightTheme.colors.warning} 
                        strokeWidth={2}
                        dot={{ fill: lightTheme.colors.warning, strokeWidth: 2, r: 3 }}
                        name="Pace (seconds/mile)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </ChartContainer>
            )}
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Analytics;