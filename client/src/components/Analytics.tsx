import React, { useState, useEffect } from 'react';
import { useActivities } from '../contexts/ActivitiesContext';
import { useTheme as useStyledTheme } from 'styled-components';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
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
  Button,
  Input
} from '../styles/components';
import styled from 'styled-components';
import { format, startOfWeek, parseISO } from 'date-fns';
import ElevationProfileChart from './charts/ElevationProfileChart';
import CadenceAnalysisChart from './charts/CadenceAnalysisChart';
import PRTimelineChart from './charts/PRTimelineChart';
import TrainingLoadChart from './charts/TrainingLoadChart';

// Styled Components
const AnalyticsHeader = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  margin: -${({ theme }) => theme.spacing.xl} -${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const HeaderTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

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

const FilterContainer = styled(FlexContainer)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const HeatmapContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  
  .react-calendar-heatmap {
    text {
      font-size: 10px;
      fill: ${({ theme }) => theme.colors.text.secondary};
    }
    
    .react-calendar-heatmap-month-label {
      font-size: 12px;
    }
    
    rect:hover {
      stroke: ${({ theme }) => theme.colors.primary};
      stroke-width: 2;
    }
  }
`;

const PRCard = styled(Card)`
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const GoalSection = styled(Card)`
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const GoalInput = styled(FlexContainer)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProgressBar = styled.div<{ progress: number; color?: string }>`
  width: 100%;
  height: 24px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => Math.min(props.progress, 100)}%;
    background: ${props => props.color || props.theme.colors.primary};
    transition: width 0.5s ease;
  }
`;

const ProgressText = styled.div`
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 24px;
  font-weight: bold;
  color: white;
  z-index: 1;
  mix-blend-mode: difference;
`;

interface AnalyticsEnhancedData {
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
  heatmapData: Array<{
    date: string;
    count: number;
  }>;
  paceZones: Array<{
    zone: string;
    count: number;
    percentage: number;
  }>;
  weeklyMileage: Array<{
    week: string;
    miles: number;
    average: number;
  }>;
  personalRecords: {
    fastest5k: number | null;
    fastest10k: number | null;
    fastestHalfMarathon: number | null;
    fastestMarathon: number | null;
    longestRun: number;
    highestElevation: number;
  };
  consistencyScore: number;
  currentStreak: number;
  longestStreak: number;
  timeOfDayDistribution: Array<{
    period: string;
    count: number;
  }>;
  timeOfDayStats?: Record<string, number>;
  consistencyMetrics?: {
    consistencyScore: number;
    currentStreak: number;
    longestStreak: number;
  };
  paceProgression?: Array<{
    date: string;
    pace: number;
  }>;
}

const Analytics: React.FC = () => {
  const { state: activitiesState, fetchActivities } = useActivities();
  const { activities, loading, error } = activitiesState;
  const theme = useStyledTheme();
  
  const [analytics, setAnalytics] = useState<AnalyticsEnhancedData | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d' | '1y'>('1y');
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(parseFloat(localStorage.getItem('weeklyMileGoal') || '20'));
  const [monthlyGoal, setMonthlyGoal] = useState(parseFloat(localStorage.getItem('monthlyMileGoal') || '80'));
  const [yearlyGoal, setYearlyGoal] = useState(parseFloat(localStorage.getItem('yearlyMileGoal') || '1000'));

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (activities.length > 0) {
      calculateEnhancedAnalytics();
    }
  }, [activities, timeRange]);

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

  const calculateEnhancedAnalytics = () => {
    let filtered = filterActivitiesByTimeRange([...activities]);
    setFilteredActivities(filtered);

    if (filtered.length === 0) {
      setAnalytics(null);
      return;
    }

    // Basic totals
    const totalDistance = filtered.reduce((sum, activity) => sum + activity.distance, 0);
    const totalTime = filtered.reduce((sum, activity) => sum + activity.moving_time, 0);
    const totalElevation = filtered.reduce((sum, activity) => sum + activity.total_elevation_gain, 0);
    const totalActivities = filtered.length;

    // Averages
    const avgSpeed = filtered.reduce((sum, activity) => sum + activity.average_speed, 0) / filtered.length;
    const activitiesWithHR = filtered.filter(activity => activity.average_heartrate);
    const avgHeartRate = activitiesWithHR.length > 0 
      ? activitiesWithHR.reduce((sum, activity) => sum + (activity.average_heartrate || 0), 0) / activitiesWithHR.length
      : 0;

    // Monthly stats
    const monthlyData = new Map<string, { distance: number; activities: number; elevation: number }>();
    filtered.forEach(activity => {
      const month = format(parseISO(activity.start_date), 'MMM yyyy');
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

    // Weekly distribution
    const weeklyData = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayNames.forEach(day => weeklyData.set(day, 0));

    filtered.forEach(activity => {
      const dayOfWeek = dayNames[new Date(activity.start_date).getDay()];
      weeklyData.set(dayOfWeek, (weeklyData.get(dayOfWeek) || 0) + 1);
    });

    const weeklyDistribution = Array.from(weeklyData.entries())
      .map(([day, count]) => ({ day: day.slice(0, 3), count }));

    // Heatmap data
    const heatmapData = calculateHeatmapData(filtered);

    // Pace zones
    const paceZones = calculatePaceZones(filtered);

    // Weekly mileage with rolling average
    const weeklyMileage = calculateWeeklyMileage(filtered);

    // Personal records
    const personalRecords = calculatePersonalRecords(filtered);

    // Consistency score and streaks
    const { consistencyScore, currentStreak, longestStreak } = calculateConsistencyMetrics(filtered);

    // Time of day distribution
    const timeOfDayDistribution = calculateTimeOfDayDistribution(filtered);

    setAnalytics({
      totalDistance,
      totalTime,
      totalElevation,
      totalActivities,
      avgPace: avgSpeed,
      avgHeartRate,
      monthlyStats,
      weeklyDistribution,
      heatmapData,
      paceZones,
      weeklyMileage,
      personalRecords,
      consistencyScore,
      currentStreak,
      longestStreak,
      timeOfDayDistribution
    });
  };

  const calculateHeatmapData = (activities: Activity[]) => {
    const dateMap = new Map<string, number>();
    
    activities.forEach(activity => {
      const date = format(parseISO(activity.start_date), 'yyyy-MM-dd');
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  };

  const calculatePaceZones = (activities: Activity[]) => {
    const zones = {
      'Easy (>9:00/mi)': 0,
      'Moderate (7:30-9:00/mi)': 0,
      'Tempo (6:30-7:30/mi)': 0,
      'Threshold (5:30-6:30/mi)': 0,
      'VO2 Max (<5:30/mi)': 0
    };

    activities.forEach(activity => {
      if (activity.average_speed === 0) return;
      const paceSecondsPerMile = 1609.34 / activity.average_speed;
      const paceMinutes = paceSecondsPerMile / 60;

      if (paceMinutes > 9) zones['Easy (>9:00/mi)']++;
      else if (paceMinutes > 7.5) zones['Moderate (7:30-9:00/mi)']++;
      else if (paceMinutes > 6.5) zones['Tempo (6:30-7:30/mi)']++;
      else if (paceMinutes > 5.5) zones['Threshold (5:30-6:30/mi)']++;
      else zones['VO2 Max (<5:30/mi)']++;
    });

    return Object.entries(zones).map(([zone, count]) => ({
      zone,
      count,
      percentage: activities.length > 0 ? (count / activities.length * 100) : 0
    }));
  };

  const calculateWeeklyMileage = (activities: Activity[]) => {
    const weeklyMap = new Map<string, number>();
    
    activities.forEach(activity => {
      const weekStart = startOfWeek(parseISO(activity.start_date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'MMM dd');
      const miles = activity.distance * 0.000621371;
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + miles);
    });

    const sortedWeeks = Array.from(weeklyMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-12); // Last 12 weeks

    // Calculate 4-week rolling average
    return sortedWeeks.map((week, index) => {
      const previousWeeks = sortedWeeks.slice(Math.max(0, index - 3), index + 1);
      const average = previousWeeks.reduce((sum, w) => sum + w[1], 0) / previousWeeks.length;
      
      return {
        week: week[0],
        miles: week[1],
        average: average
      };
    });
  };

  const calculatePersonalRecords = (activities: Activity[]) => {
    let fastest5k: number | null = null;
    let fastest10k: number | null = null;
    let fastestHalfMarathon: number | null = null;
    let fastestMarathon: number | null = null;
    let longestRun = 0;
    let highestElevation = 0;

    activities.forEach(activity => {
      const distanceKm = activity.distance / 1000;
      const timeMinutes = activity.moving_time / 60;

      // Check for PRs based on distance
      if (distanceKm >= 4.9 && distanceKm <= 5.1) {
        if (!fastest5k || timeMinutes < fastest5k) {
          fastest5k = timeMinutes;
        }
      } else if (distanceKm >= 9.9 && distanceKm <= 10.1) {
        if (!fastest10k || timeMinutes < fastest10k) {
          fastest10k = timeMinutes;
        }
      } else if (distanceKm >= 21 && distanceKm <= 21.2) {
        if (!fastestHalfMarathon || timeMinutes < fastestHalfMarathon) {
          fastestHalfMarathon = timeMinutes;
        }
      } else if (distanceKm >= 42 && distanceKm <= 42.3) {
        if (!fastestMarathon || timeMinutes < fastestMarathon) {
          fastestMarathon = timeMinutes;
        }
      }

      if (activity.distance > longestRun) {
        longestRun = activity.distance;
      }

      if (activity.total_elevation_gain > highestElevation) {
        highestElevation = activity.total_elevation_gain;
      }
    });

    return {
      fastest5k,
      fastest10k,
      fastestHalfMarathon,
      fastestMarathon,
      longestRun,
      highestElevation
    };
  };

  const calculateConsistencyMetrics = (activities: Activity[]) => {
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    if (sortedActivities.length === 0) {
      return { consistencyScore: 0, currentStreak: 0, longestStreak: 0 };
    }

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = new Date(sortedActivities[0].start_date);
    lastDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedActivities.length; i++) {
      const currentDate = new Date(sortedActivities[i].start_date);
      currentDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff <= 1) {
        if (daysDiff === 1) tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      
      lastDate = currentDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Check if current streak is still active
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivityDate = new Date(sortedActivities[sortedActivities.length - 1].start_date);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const daysSinceLastRun = Math.floor((today.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000));
    currentStreak = daysSinceLastRun <= 1 ? tempStreak : 0;

    // Calculate consistency score (runs per week average)
    const firstDate = new Date(sortedActivities[0].start_date);
    const lastDate2 = new Date(sortedActivities[sortedActivities.length - 1].start_date);
    const totalDays = Math.max(1, Math.floor((lastDate2.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)));
    const totalWeeks = Math.max(1, totalDays / 7);
    const runsPerWeek = sortedActivities.length / totalWeeks;
    const consistencyScore = Math.min(100, (runsPerWeek / 4) * 100); // 4 runs per week = 100%

    return { consistencyScore, currentStreak, longestStreak };
  };

  const calculateTimeOfDayDistribution = (activities: Activity[]) => {
    const distribution = {
      'Early Morning (5-8am)': 0,
      'Morning (8-12pm)': 0,
      'Afternoon (12-5pm)': 0,
      'Evening (5-8pm)': 0,
      'Night (8pm-5am)': 0
    };

    activities.forEach(activity => {
      const hour = new Date(activity.start_date_local).getHours();
      
      if (hour >= 5 && hour < 8) distribution['Early Morning (5-8am)']++;
      else if (hour >= 8 && hour < 12) distribution['Morning (8-12pm)']++;
      else if (hour >= 12 && hour < 17) distribution['Afternoon (12-5pm)']++;
      else if (hour >= 17 && hour < 20) distribution['Evening (5-8pm)']++;
      else distribution['Night (8pm-5am)']++;
    });

    return Object.entries(distribution).map(([period, count]) => ({ period, count }));
  };

  const saveGoals = () => {
    localStorage.setItem('weeklyMileGoal', weeklyGoal.toString());
    localStorage.setItem('monthlyMileGoal', monthlyGoal.toString());
    localStorage.setItem('yearlyMileGoal', yearlyGoal.toString());
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return miles.toFixed(1);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  /* const formatPace = (metersPerSecond: number): string => {
    if (metersPerSecond === 0) return '--';
    const secondsPerMile = 1609.34 / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }; */

  const formatPRTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container>
        <FlexContainer direction="column" align="center" style={{ marginTop: '100px' }}>
          <LoadingSpinner />
          <Text style={{ marginTop: '16px' }}>Loading your enhanced analytics...</Text>
        </FlexContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage style={{ marginTop: '50px', textAlign: 'center' }}>
          ⚠️ {error}
        </ErrorMessage>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container>
        <Text style={{ marginTop: '50px', textAlign: 'center' }}>
          No running data available for the selected time range.
        </Text>
      </Container>
    );
  }

  // Get current period progress
  const now = new Date();
  const currentWeekActivities = activities.filter(a => {
    const activityDate = new Date(a.start_date);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return activityDate >= weekStart;
  });
  const currentWeekMiles = currentWeekActivities.reduce((sum, a) => sum + a.distance * 0.000621371, 0);

  const currentMonthActivities = activities.filter(a => {
    const activityDate = new Date(a.start_date);
    return activityDate.getMonth() === now.getMonth() && activityDate.getFullYear() === now.getFullYear();
  });
  const currentMonthMiles = currentMonthActivities.reduce((sum, a) => sum + a.distance * 0.000621371, 0);

  const currentYearActivities = activities.filter(a => {
    const activityDate = new Date(a.start_date);
    return activityDate.getFullYear() === now.getFullYear();
  });
  const currentYearMiles = currentYearActivities.reduce((sum, a) => sum + a.distance * 0.000621371, 0);

  return (
    <>
      <AnalyticsHeader>
        <Container>
          <HeaderTitle>Advanced Running Analytics</HeaderTitle>
          <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
            Deep insights into your running performance
          </Text>
        </Container>
      </AnalyticsHeader>

      <Container>
        {/* Filter Controls */}
        <FilterContainer direction="row" wrap gap="md">
          <FormGroup style={{ minWidth: '150px', marginBottom: 0 }}>
            <Label>Time Range</Label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </Select>
          </FormGroup>
        </FilterContainer>

        {/* Key Metrics */}
        <Grid columns={{ xs: 2, sm: 2, md: 4 }} gap="lg" style={{ marginBottom: '32px' }}>
          <StatsCard>
            <StatNumber>{analytics.totalActivities}</StatNumber>
            <StatDescription>Total Runs</StatDescription>
          </StatsCard>
          
          <StatsCard>
            <StatNumber>{formatDistance(analytics.totalDistance)}</StatNumber>
            <StatDescription>Miles</StatDescription>
          </StatsCard>
          
          <StatsCard>
            <StatNumber>{formatTime(analytics.totalTime)}</StatNumber>
            <StatDescription>Time</StatDescription>
          </StatsCard>
          
          <StatsCard>
            <StatNumber>{Math.round(analytics.totalElevation * 3.28084).toLocaleString()}</StatNumber>
            <StatDescription>Elevation (ft)</StatDescription>
          </StatsCard>
        </Grid>

        {/* Goals Section */}
        <GoalSection style={{ marginBottom: '32px' }}>
          <Heading size="md" style={{ marginBottom: '16px' }}>Goals & Progress</Heading>
          
          <GoalInput direction="row" gap="md" align="flex-end">
            <FormGroup style={{ flex: 1, marginBottom: 0 }}>
              <Label>Weekly Goal (miles)</Label>
              <Input
                type="number"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseFloat(e.target.value) || 0)}
                onBlur={saveGoals}
              />
            </FormGroup>
            
            <FormGroup style={{ flex: 1, marginBottom: 0 }}>
              <Label>Monthly Goal (miles)</Label>
              <Input
                type="number"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                onBlur={saveGoals}
              />
            </FormGroup>
            
            <FormGroup style={{ flex: 1, marginBottom: 0 }}>
              <Label>Yearly Goal (miles)</Label>
              <Input
                type="number"
                value={yearlyGoal}
                onChange={(e) => setYearlyGoal(parseFloat(e.target.value) || 0)}
                onBlur={saveGoals}
              />
            </FormGroup>
            
            <Button onClick={saveGoals} size="sm">Save Goals</Button>
          </GoalInput>

          <Grid columns={{ xs: 1, sm: 2, md: 3 }} gap="md" style={{ marginTop: '24px' }}>
            <div>
              <Text size="sm" color="secondary" style={{ marginBottom: '8px' }}>
                This Week: {currentWeekMiles.toFixed(1)} / {weeklyGoal} miles
              </Text>
              <div style={{ position: 'relative' }}>
                <ProgressBar progress={(currentWeekMiles / weeklyGoal) * 100} />
                <ProgressText>{Math.round((currentWeekMiles / weeklyGoal) * 100)}%</ProgressText>
              </div>
            </div>
            
            <div>
              <Text size="sm" color="secondary" style={{ marginBottom: '8px' }}>
                This Month: {currentMonthMiles.toFixed(1)} / {monthlyGoal} miles
              </Text>
              <div style={{ position: 'relative' }}>
                <ProgressBar progress={(currentMonthMiles / monthlyGoal) * 100} color={theme.colors.success} />
                <ProgressText>{Math.round((currentMonthMiles / monthlyGoal) * 100)}%</ProgressText>
              </div>
            </div>
            
            <div>
              <Text size="sm" color="secondary" style={{ marginBottom: '8px' }}>
                This Year: {currentYearMiles.toFixed(1)} / {yearlyGoal} miles
              </Text>
              <div style={{ position: 'relative' }}>
                <ProgressBar progress={(currentYearMiles / yearlyGoal) * 100} color={theme.colors.info} />
                <ProgressText>{Math.round((currentYearMiles / yearlyGoal) * 100)}%</ProgressText>
              </div>
            </div>
          </Grid>
        </GoalSection>

        {/* Consistency Metrics */}
        <Grid columns={{ xs: 1, sm: 2, md: 3 }} gap="lg" style={{ marginBottom: '32px' }}>
          <InsightCard>
            <Heading size="sm" style={{ marginBottom: '8px' }}>🔥 Current Streak</Heading>
            <Text size="xxl" weight="bold" style={{ color: theme.colors.primary }}>
              {analytics.currentStreak} days
            </Text>
          </InsightCard>
          
          <InsightCard>
            <Heading size="sm" style={{ marginBottom: '8px' }}>🏆 Longest Streak</Heading>
            <Text size="xxl" weight="bold" style={{ color: theme.colors.warning }}>
              {analytics.longestStreak} days
            </Text>
          </InsightCard>
          
          <InsightCard>
            <Heading size="sm" style={{ marginBottom: '8px' }}>📊 Consistency Score</Heading>
            <Text size="xxl" weight="bold" style={{ color: theme.colors.success }}>
              {Math.round(analytics.consistencyScore)}%
            </Text>
          </InsightCard>
        </Grid>

        {/* Activity Heatmap */}
        <HeatmapContainer style={{ marginBottom: '32px' }}>
          <Heading size="md" style={{ marginBottom: '16px' }}>Activity Calendar</Heading>
          <Text size="sm" color="secondary" style={{ marginBottom: '24px' }}>
            Your running consistency over the past year
          </Text>
          <CalendarHeatmap
            startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
            endDate={new Date()}
            values={analytics.heatmapData}
            classForValue={(value: any) => {
              if (!value || value.count === 0) return 'color-empty';
              if (value.count === 1) return 'color-scale-1';
              if (value.count === 2) return 'color-scale-2';
              if (value.count === 3) return 'color-scale-3';
              return 'color-scale-4';
            }}
            tooltipDataAttrs={(value: any) => {
              if (!value || !value.date) return {};
              return {
                'data-tip': value.count 
                  ? `${value.date}: ${value.count} run${value.count > 1 ? 's' : ''}`
                  : `${value.date}: No runs`
              };
            }}
            showWeekdayLabels
          />
          <style>{`
            .color-empty { fill: ${theme.colors.border}; }
            .color-scale-1 { fill: #ffd4cc; }
            .color-scale-2 { fill: #ff9980; }
            .color-scale-3 { fill: #ff6347; }
            .color-scale-4 { fill: ${theme.colors.primary}; }
          `}</style>
        </HeatmapContainer>

        {/* Personal Records */}
        <div style={{ marginBottom: '32px' }}>
          <Heading size="md" style={{ marginBottom: '16px' }}>Personal Records</Heading>
          <Grid columns={{ xs: 1, sm: 2, md: 3 }} gap="lg">
            {analytics.personalRecords.fastest5k && (
              <PRCard>
                <Text size="sm" style={{ marginBottom: '8px', opacity: 0.9 }}>5K</Text>
                <Text size="xl" weight="bold">{formatPRTime(analytics.personalRecords.fastest5k)}</Text>
              </PRCard>
            )}
            
            {analytics.personalRecords.fastest10k && (
              <PRCard>
                <Text size="sm" style={{ marginBottom: '8px', opacity: 0.9 }}>10K</Text>
                <Text size="xl" weight="bold">{formatPRTime(analytics.personalRecords.fastest10k)}</Text>
              </PRCard>
            )}
            
            {analytics.personalRecords.fastestHalfMarathon && (
              <PRCard>
                <Text size="sm" style={{ marginBottom: '8px', opacity: 0.9 }}>Half Marathon</Text>
                <Text size="xl" weight="bold">{formatPRTime(analytics.personalRecords.fastestHalfMarathon)}</Text>
              </PRCard>
            )}
            
            <PRCard style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
              <Text size="sm" style={{ marginBottom: '8px', opacity: 0.9 }}>Longest Run</Text>
              <Text size="xl" weight="bold">{formatDistance(analytics.personalRecords.longestRun)} mi</Text>
            </PRCard>
            
            <PRCard style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' }}>
              <Text size="sm" style={{ marginBottom: '8px', opacity: 0.9 }}>Highest Elevation</Text>
              <Text size="xl" weight="bold">{Math.round(analytics.personalRecords.highestElevation * 3.28084)} ft</Text>
            </PRCard>
          </Grid>
        </div>

        {/* Charts Grid */}
        <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg" style={{ marginBottom: '32px' }}>
          {/* Weekly Mileage Trend */}
          <ChartContainer>
            <Heading size="sm" style={{ marginBottom: '8px' }}>Weekly Mileage Trend</Heading>
            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
              Miles per week with 4-week rolling average
            </Text>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyMileage}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 11 }}
                    stroke={theme.colors.text.secondary}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke={theme.colors.text.secondary}
                  />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="miles" 
                    stroke={theme.colors.primary}
                    fill={theme.colors.primary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name="Weekly Miles"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke={theme.colors.warning}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="4-Week Average"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartContainer>

          {/* Pace Zone Distribution */}
          <ChartContainer>
            <Heading size="sm" style={{ marginBottom: '8px' }}>Pace Zone Distribution</Heading>
            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
              Time spent in different training zones
            </Text>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.paceZones.filter(z => z.count > 0)}
                    dataKey="count"
                    nameKey="zone"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ zone, percentage }) => `${percentage.toFixed(0)}%`}
                  >
                    {analytics.paceZones.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index]
                      } />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartContainer>

          {/* Time of Day Analysis */}
          <ChartContainer>
            <Heading size="sm" style={{ marginBottom: '8px' }}>Time of Day Preference</Heading>
            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
              When you prefer to run
            </Text>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timeOfDayDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke={theme.colors.text.secondary}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke={theme.colors.text.secondary}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    fill={theme.colors.primary}
                    radius={[4, 4, 0, 0]}
                    name="Runs"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartContainer>

          {/* Weekly Activity Pattern */}
          <ChartContainer>
            <Heading size="sm" style={{ marginBottom: '8px' }}>Weekly Activity Pattern</Heading>
            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
              Your most active days
            </Text>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analytics.weeklyDistribution}>
                  <PolarGrid stroke={theme.colors.border} />
                  <PolarAngleAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    stroke={theme.colors.text.secondary}
                  />
                  <PolarRadiusAxis 
                    angle={90}
                    tick={{ fontSize: 10 }}
                    stroke={theme.colors.text.secondary}
                  />
                  <Radar 
                    name="Activities" 
                    dataKey="count" 
                    stroke={theme.colors.primary}
                    fill={theme.colors.primary}
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </ChartContainer>
        </Grid>

        {/* Monthly Progress (existing chart enhanced) */}
        <ChartContainer style={{ marginBottom: '32px' }}>
          <Heading size="sm" style={{ marginBottom: '8px' }}>Monthly Progress</Heading>
          <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
            Distance, activities, and elevation over time
          </Text>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyStats.map(stat => ({
                month: stat.month,
                distance: (stat.distance * 0.000621371).toFixed(1),
                activities: stat.activities,
                elevation: Math.round(stat.elevation * 3.28084 / 100) // Scaled down for visibility
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  stroke={theme.colors.text.secondary}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  stroke={theme.colors.text.secondary}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke={theme.colors.text.secondary}
                />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="distance" 
                  stroke={theme.colors.primary} 
                  strokeWidth={3}
                  name="Distance (miles)"
                  dot={{ fill: theme.colors.primary, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="activities" 
                  stroke={theme.colors.success} 
                  strokeWidth={3}
                  name="Activities"
                  dot={{ fill: theme.colors.success, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="elevation" 
                  stroke={theme.colors.warning} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Elevation (ft/100)"
                  dot={{ fill: theme.colors.warning, strokeWidth: 1, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartContainer>

        {/* New Analytics Charts */}
        <Grid columns={1} gap="xl" style={{ marginTop: '32px' }}>
          {/* Training Load Balance */}
          <TrainingLoadChart activities={filteredActivities} />
          
          {/* Elevation Profile */}
          <ElevationProfileChart activities={filteredActivities} />
          
          {/* PR Timeline */}
          <PRTimelineChart activities={filteredActivities} />
          
          {/* Cadence Analysis */}
          <CadenceAnalysisChart activities={filteredActivities} />
        </Grid>
        
        {/* Data-Driven Insights Panel */}
        <InsightCard style={{ marginTop: '32px' }}>
          <Heading size="md" style={{ marginBottom: '16px' }}>
            📊 Your Personalized Insights
          </Heading>
          <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="md">
            {analytics.timeOfDayStats && (
              <div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  ⏰ Best Performance Time
                </Text>
                <Text size="sm">
                  {Object.entries(analytics.timeOfDayStats).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                  {' - You tend to run faster during this time'}
                </Text>
              </div>
            )}
            
            {analytics.consistencyMetrics && (
              <div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  📈 Consistency Score
                </Text>
                <Text size="sm">
                  {analytics.consistencyMetrics.consistencyScore.toFixed(0)}% - 
                  {analytics.consistencyMetrics.consistencyScore > 75 
                    ? ' Excellent consistency!'
                    : analytics.consistencyMetrics.consistencyScore > 50
                    ? ' Good, but room for improvement'
                    : ' Try to run more regularly'}
                </Text>
              </div>
            )}
            
            {analytics.weeklyMileage && analytics.weeklyMileage.length > 4 && (
              <div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  🎯 Weekly Average
                </Text>
                <Text size="sm">
                  {(analytics.weeklyMileage.reduce((sum, w) => sum + w.miles, 0) / analytics.weeklyMileage.length).toFixed(1)} miles
                  {' - Your typical weekly volume'}
                </Text>
              </div>
            )}
            
            {analytics.paceProgression && analytics.paceProgression.length > 0 && (
              <div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  🏃 Pace Trend
                </Text>
                <Text size="sm">
                  {analytics.paceProgression[analytics.paceProgression.length - 1].pace < 
                   analytics.paceProgression[0].pace 
                    ? '📈 Improving - Getting faster!'
                    : '📉 Slower recently - Consider rest or easy runs'}
                </Text>
              </div>
            )}
            
            {analytics.personalRecords && analytics.personalRecords.longestRun > 0 && (
              <div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  🏆 Next PR Target
                </Text>
                <Text size="sm">
                  {analytics.personalRecords.fastest5k 
                    ? `Beat your 5K time of ${formatPRTime(analytics.personalRecords.fastest5k)}`
                    : 'Complete a 5K run to set a baseline'}
                </Text>
              </div>
            )}
            
            {filteredActivities.length > 10 && (
              <div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  💡 Recovery Insight
                </Text>
                <Text size="sm">
                  {analytics.consistencyMetrics && analytics.consistencyMetrics.currentStreak > 3
                    ? 'Consider a rest day after long streaks'
                    : 'Your recovery pattern looks good'}
                </Text>
              </div>
            )}
          </Grid>
        </InsightCard>
      </Container>
    </>
  );
};

export default Analytics;