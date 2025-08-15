import React from 'react';
import styled from 'styled-components';
import { Activity } from '../../types';
import {
  Card,
  Heading,
  Text,
  Grid,
  FlexContainer,
  Badge,
  Button
} from '../../styles/components';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const StatsCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.surface} 0%, ${({ theme }) => theme.colors.background} 100%);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatChange = styled.div<{ positive?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ positive, theme }) => positive ? theme.colors.success : theme.colors.error};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const SectionCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled(Heading)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const ProgressBar = styled.div<{ progress: number; color?: string }>`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 4px;
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  
  &::after {
    content: '';
    display: block;
    width: ${({ progress }) => Math.min(100, progress)}%;
    height: 100%;
    background: ${({ color, theme }) => color || theme.colors.primary};
    transition: width 0.3s ease;
  }
`;

const GoalCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const StreakCard = styled(Card)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}15 0%, ${({ theme }) => theme.colors.surface} 100%);
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.lg};
`;

interface OverviewTabProps {
  activities: Activity[];
  analyticsData: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ activities, analyticsData }) => {
  // Calculate week-over-week changes
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekActivities = activities.filter(a => new Date(a.start_date) >= oneWeekAgo);
  const lastWeekActivities = activities.filter(a => {
    const date = new Date(a.start_date);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });
  
  const thisWeekMiles = thisWeekActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
  const lastWeekMiles = lastWeekActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
  const weekChange = lastWeekMiles > 0 ? ((thisWeekMiles - lastWeekMiles) / lastWeekMiles * 100) : 0;
  
  // Calculate goal progress
  const weeklyGoal = parseFloat(localStorage.getItem('weeklyMileGoal') || '20');
  const monthlyGoal = parseFloat(localStorage.getItem('monthlyMileGoal') || '80');
  const yearlyGoal = parseFloat(localStorage.getItem('yearlyMileGoal') || '1000');
  
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  const monthlyActivities = activities.filter(a => new Date(a.start_date) >= oneMonthAgo);
  const yearlyActivities = activities.filter(a => new Date(a.start_date) >= oneYearAgo);
  
  const monthlyMiles = monthlyActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
  const yearlyMiles = yearlyActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
  
  // Prepare heatmap data
  const heatmapData = activities.map(activity => ({
    date: new Date(activity.start_date).toISOString().split('T')[0],
    count: 1
  }));
  
  // Aggregate by date
  const aggregatedHeatmap = heatmapData.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []);
  
  // Activity type distribution
  const typeDistribution = activities.reduce((acc: any, activity) => {
    const type = activity.type || 'Run';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value: value as number
  }));
  
  const COLORS = ['#fc4c02', '#10b981', '#f59e0b', '#8b5cf6'];
  
  return (
    <>
      {/* Key Metrics */}
      <Grid columns={{ xs: 2, sm: 2, md: 4 }} gap="lg" style={{ marginBottom: '32px' }}>
        <StatsCard>
          <StatValue>{activities.length}</StatValue>
          <StatLabel>Total Runs</StatLabel>
          <StatChange positive={thisWeekActivities.length >= lastWeekActivities.length}>
            {thisWeekActivities.length} this week
          </StatChange>
        </StatsCard>
        
        <StatsCard>
          <StatValue>{(analyticsData?.totalDistance * 0.000621371 || 0).toFixed(1)}</StatValue>
          <StatLabel>Total Miles</StatLabel>
          <StatChange positive={weekChange >= 0}>
            {weekChange > 0 ? '+' : ''}{weekChange.toFixed(0)}% vs last week
          </StatChange>
        </StatsCard>
        
        <StatsCard>
          <StatValue>
            {analyticsData?.avgPace ? 
              `${Math.floor(1609.34 / analyticsData.avgPace / 60)}:${Math.floor((1609.34 / analyticsData.avgPace) % 60).toString().padStart(2, '0')}`
              : '--'
            }
          </StatValue>
          <StatLabel>Avg Pace /mi</StatLabel>
        </StatsCard>
        
        <StatsCard>
          <StatValue>{Math.round((analyticsData?.totalElevation || 0) * 3.28084)}</StatValue>
          <StatLabel>Total Elevation (ft)</StatLabel>
        </StatsCard>
      </Grid>
      
      {/* Goals & Progress */}
      <SectionCard>
        <SectionTitle size="md">Goals & Progress</SectionTitle>
        <Grid columns={{ xs: 1, sm: 1, md: 3 }} gap="lg">
          <GoalCard>
            <Text size="sm" weight="semiBold">Weekly Goal</Text>
            <Text size="lg" weight="bold" style={{ margin: '8px 0' }}>
              {thisWeekMiles.toFixed(1)} / {weeklyGoal} miles
            </Text>
            <ProgressBar progress={(thisWeekMiles / weeklyGoal) * 100} />
            <Text size="xs" color="secondary">
              {((thisWeekMiles / weeklyGoal) * 100).toFixed(0)}% complete
            </Text>
          </GoalCard>
          
          <GoalCard>
            <Text size="sm" weight="semiBold">Monthly Goal</Text>
            <Text size="lg" weight="bold" style={{ margin: '8px 0' }}>
              {monthlyMiles.toFixed(1)} / {monthlyGoal} miles
            </Text>
            <ProgressBar progress={(monthlyMiles / monthlyGoal) * 100} color="#f59e0b" />
            <Text size="xs" color="secondary">
              {((monthlyMiles / monthlyGoal) * 100).toFixed(0)}% complete
            </Text>
          </GoalCard>
          
          <GoalCard>
            <Text size="sm" weight="semiBold">Yearly Goal</Text>
            <Text size="lg" weight="bold" style={{ margin: '8px 0' }}>
              {yearlyMiles.toFixed(0)} / {yearlyGoal} miles
            </Text>
            <ProgressBar progress={(yearlyMiles / yearlyGoal) * 100} color="#10b981" />
            <Text size="xs" color="secondary">
              {((yearlyMiles / yearlyGoal) * 100).toFixed(0)}% complete
            </Text>
          </GoalCard>
        </Grid>
      </SectionCard>
      
      {/* Streaks & Consistency */}
      <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg" style={{ marginBottom: '32px' }}>
        <StreakCard>
          <FlexContainer justify="space-between" align="center">
            <div>
              <Text size="sm" color="secondary">Current Streak</Text>
              <Heading size="lg" style={{ margin: '8px 0' }}>
                {analyticsData?.currentStreak || 0} days
              </Heading>
              <Text size="sm">Keep it going! 🔥</Text>
            </div>
            <div style={{ fontSize: '3rem' }}>🏃</div>
          </FlexContainer>
        </StreakCard>
        
        <StreakCard>
          <FlexContainer justify="space-between" align="center">
            <div>
              <Text size="sm" color="secondary">Consistency Score</Text>
              <Heading size="lg" style={{ margin: '8px 0' }}>
                {analyticsData?.consistencyScore?.toFixed(0) || 0}%
              </Heading>
              <Text size="sm">
                {analyticsData?.consistencyScore > 75 ? 'Excellent!' : 
                 analyticsData?.consistencyScore > 50 ? 'Good progress' : 
                 'Room to improve'}
              </Text>
            </div>
            <div style={{ fontSize: '3rem' }}>📈</div>
          </FlexContainer>
        </StreakCard>
      </Grid>
      
      {/* Activity Calendar */}
      <SectionCard>
        <SectionTitle size="md">Activity Calendar</SectionTitle>
        <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
          Your running consistency over the past year
        </Text>
        <div style={{ height: '200px' }}>
          <CalendarHeatmap
            startDate={new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())}
            endDate={now}
            values={aggregatedHeatmap}
            classForValue={(value: any) => {
              if (!value) return 'color-empty';
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
            tooltipDataAttrs={(value: any) => {
              if (!value || !value.date) return {};
              return {
                'data-tip': `${value.date}: ${value.count} run${value.count > 1 ? 's' : ''}`
              };
            }}
            showWeekdayLabels
          />
        </div>
      </SectionCard>
      
      {/* Activity Distribution */}
      {pieData.length > 0 && (
        <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg">
          <SectionCard>
            <SectionTitle size="md">Activity Types</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <FlexContainer justify="center" gap="md" style={{ marginTop: '16px' }}>
              {pieData.map((entry, index) => (
                <FlexContainer key={entry.name} align="center" gap="xs">
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    background: COLORS[index % COLORS.length],
                    borderRadius: '2px'
                  }} />
                  <Text size="sm">{entry.name} ({entry.value})</Text>
                </FlexContainer>
              ))}
            </FlexContainer>
          </SectionCard>
          
          <SectionCard>
            <SectionTitle size="md">Quick Actions</SectionTitle>
            <FlexContainer direction="column" gap="md">
              <Button variant="primary" style={{ width: '100%' }}>
                📊 Export Data
              </Button>
              <Button variant="secondary" style={{ width: '100%' }}>
                🎯 Update Goals
              </Button>
              <Button variant="secondary" style={{ width: '100%' }}>
                🔄 Sync Activities
              </Button>
            </FlexContainer>
          </SectionCard>
        </Grid>
      )}
    </>
  );
};

export default OverviewTab;