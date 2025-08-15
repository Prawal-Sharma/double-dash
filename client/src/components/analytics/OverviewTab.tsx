import React, { useState } from 'react';
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
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const GoalInput = styled.input`
  width: 80px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
  background: ${({ theme }) => theme.colors.background};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}15;
  }
`;

const GoalEditButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  margin-left: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  
  &:hover {
    opacity: 0.7;
  }
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
  // Goal state management
  const [editingGoal, setEditingGoal] = useState<'weekly' | 'monthly' | 'yearly' | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(parseFloat(localStorage.getItem('weeklyMileGoal') || '20'));
  const [monthlyGoal, setMonthlyGoal] = useState(parseFloat(localStorage.getItem('monthlyMileGoal') || '80'));
  const [yearlyGoal, setYearlyGoal] = useState(parseFloat(localStorage.getItem('yearlyMileGoal') || '1000'));
  
  const saveGoal = (type: 'weekly' | 'monthly' | 'yearly', value: number) => {
    const key = `${type}MileGoal`;
    localStorage.setItem(key, value.toString());
    setEditingGoal(null);
  };
  
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
        <FlexContainer justify="space-between" align="center" style={{ marginBottom: '24px' }}>
          <SectionTitle size="md" style={{ margin: 0 }}>Goals & Progress</SectionTitle>
          <Text size="sm" color="secondary">Click the edit icon to update your goals</Text>
        </FlexContainer>
        <Grid columns={{ xs: 1, sm: 1, md: 3 }} gap="lg">
          <GoalCard>
            <FlexContainer justify="space-between" align="center" style={{ marginBottom: '12px' }}>
              <Text size="sm" weight="semiBold">Weekly Goal</Text>
              <GoalEditButton 
                onClick={() => setEditingGoal(editingGoal === 'weekly' ? null : 'weekly')}
                title="Edit weekly goal"
              >
                ✏️
              </GoalEditButton>
            </FlexContainer>
            {editingGoal === 'weekly' ? (
              <FlexContainer align="center" gap="sm" style={{ margin: '8px 0' }}>
                <Text size="lg">{thisWeekMiles.toFixed(1)} /</Text>
                <GoalInput 
                  type="number" 
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveGoal('weekly', weeklyGoal)}
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal('weekly', weeklyGoal)}
                  autoFocus
                />
                <Text size="lg">miles</Text>
              </FlexContainer>
            ) : (
              <Text size="lg" weight="bold" style={{ margin: '8px 0' }}>
                {thisWeekMiles.toFixed(1)} / {weeklyGoal} miles
              </Text>
            )}
            <ProgressBar progress={(thisWeekMiles / weeklyGoal) * 100} />
            <FlexContainer justify="space-between" align="center" style={{ marginTop: '8px' }}>
              <Text size="xs" color="secondary">
                {((thisWeekMiles / weeklyGoal) * 100).toFixed(0)}% complete
              </Text>
              {thisWeekMiles >= weeklyGoal && <Badge variant="success">Goal Met! 🎉</Badge>}
            </FlexContainer>
          </GoalCard>
          
          <GoalCard>
            <FlexContainer justify="space-between" align="center" style={{ marginBottom: '12px' }}>
              <Text size="sm" weight="semiBold">Monthly Goal</Text>
              <GoalEditButton 
                onClick={() => setEditingGoal(editingGoal === 'monthly' ? null : 'monthly')}
                title="Edit monthly goal"
              >
                ✏️
              </GoalEditButton>
            </FlexContainer>
            {editingGoal === 'monthly' ? (
              <FlexContainer align="center" gap="sm" style={{ margin: '8px 0' }}>
                <Text size="lg">{monthlyMiles.toFixed(1)} /</Text>
                <GoalInput 
                  type="number" 
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveGoal('monthly', monthlyGoal)}
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal('monthly', monthlyGoal)}
                  autoFocus
                />
                <Text size="lg">miles</Text>
              </FlexContainer>
            ) : (
              <Text size="lg" weight="bold" style={{ margin: '8px 0' }}>
                {monthlyMiles.toFixed(1)} / {monthlyGoal} miles
              </Text>
            )}
            <ProgressBar progress={(monthlyMiles / monthlyGoal) * 100} color="#f59e0b" />
            <FlexContainer justify="space-between" align="center" style={{ marginTop: '8px' }}>
              <Text size="xs" color="secondary">
                {((monthlyMiles / monthlyGoal) * 100).toFixed(0)}% complete
              </Text>
              {monthlyMiles >= monthlyGoal && <Badge variant="success">Goal Met! 🎉</Badge>}
            </FlexContainer>
          </GoalCard>
          
          <GoalCard>
            <FlexContainer justify="space-between" align="center" style={{ marginBottom: '12px' }}>
              <Text size="sm" weight="semiBold">Yearly Goal</Text>
              <GoalEditButton 
                onClick={() => setEditingGoal(editingGoal === 'yearly' ? null : 'yearly')}
                title="Edit yearly goal"
              >
                ✏️
              </GoalEditButton>
            </FlexContainer>
            {editingGoal === 'yearly' ? (
              <FlexContainer align="center" gap="sm" style={{ margin: '8px 0' }}>
                <Text size="lg">{yearlyMiles.toFixed(0)} /</Text>
                <GoalInput 
                  type="number" 
                  value={yearlyGoal}
                  onChange={(e) => setYearlyGoal(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveGoal('yearly', yearlyGoal)}
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal('yearly', yearlyGoal)}
                  autoFocus
                />
                <Text size="lg">miles</Text>
              </FlexContainer>
            ) : (
              <Text size="lg" weight="bold" style={{ margin: '8px 0' }}>
                {yearlyMiles.toFixed(0)} / {yearlyGoal} miles
              </Text>
            )}
            <ProgressBar progress={(yearlyMiles / yearlyGoal) * 100} color="#10b981" />
            <FlexContainer justify="space-between" align="center" style={{ marginTop: '8px' }}>
              <Text size="xs" color="secondary">
                {((yearlyMiles / yearlyGoal) * 100).toFixed(0)}% complete
              </Text>
              {yearlyMiles >= yearlyGoal && <Badge variant="success">Goal Met! 🎉</Badge>}
            </FlexContainer>
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
      
      {/* Recent Performance and Quick Actions */}
      <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg">
        <SectionCard>
          <SectionTitle size="md">Recent Performance</SectionTitle>
          <FlexContainer direction="column" gap="md">
            {activities.slice(0, 3).map((activity, index) => (
              <div key={activity.activityId} style={{
                padding: '12px',
                background: index === 0 ? 'linear-gradient(135deg, #fc4c0210 0%, transparent 100%)' : '#f9fafb',
                borderRadius: '8px',
                borderLeft: `3px solid ${index === 0 ? '#fc4c02' : '#e5e7eb'}`
              }}>
                <FlexContainer justify="space-between" align="center">
                  <div>
                    <Text size="sm" weight="semiBold">{activity.name}</Text>
                    <Text size="xs" color="secondary">
                      {new Date(activity.start_date).toLocaleDateString()} • 
                      {' '}{(activity.distance * 0.000621371).toFixed(1)} mi
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="sm" weight="semiBold">
                      {activity.average_speed > 0 
                        ? `${Math.floor(1609.34 / activity.average_speed / 60)}:${Math.floor((1609.34 / activity.average_speed) % 60).toString().padStart(2, '0')}`
                        : '--'}/mi
                    </Text>
                    {activity.pr_count > 0 && (
                      <Badge variant="success" style={{ marginTop: '4px' }}>
                        {activity.pr_count} PR{activity.pr_count > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </FlexContainer>
              </div>
            ))}
            {activities.length === 0 && (
              <Text size="sm" color="secondary" style={{ textAlign: 'center', padding: '20px 0' }}>
                No recent activities
              </Text>
            )}
          </FlexContainer>
        </SectionCard>
        
        <SectionCard>
          <SectionTitle size="md">Quick Actions</SectionTitle>
          <Button 
            variant="primary" 
            style={{ width: '100%' }}
            onClick={() => {
              // Export activities data as CSV
              const csvContent = [
                ['Date', 'Name', 'Distance (mi)', 'Duration', 'Pace (/mi)', 'Elevation (ft)'].join(','),
                ...activities.map(a => [
                  new Date(a.start_date).toLocaleDateString(),
                  `"${a.name}"`,
                  (a.distance * 0.000621371).toFixed(2),
                  Math.floor(a.moving_time / 60) + ':' + (a.moving_time % 60).toString().padStart(2, '0'),
                  a.average_speed > 0 
                    ? `${Math.floor(1609.34 / a.average_speed / 60)}:${Math.floor((1609.34 / a.average_speed) % 60).toString().padStart(2, '0')}`
                    : '--',
                  Math.round(a.total_elevation_gain * 3.28084)
                ].join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `running_data_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
          >
            📊 Export Data (CSV)
          </Button>
        </SectionCard>
      </Grid>
    </>
  );
};

export default OverviewTab;