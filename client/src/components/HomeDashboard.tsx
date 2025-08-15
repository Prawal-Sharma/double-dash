import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useActivities } from '../contexts/ActivitiesContext';
import { Activity } from '../types';
import {
  Container,
  Card,
  Heading,
  Text,
  FlexContainer,
  Grid,
  Button,
  Badge,
  LoadingSpinner
} from '../styles/components';

// Styled components for the dashboard
const DashboardHeader = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  margin: -${({ theme }) => theme.spacing.xl} -${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin: -${({ theme }) => theme.spacing.xl} -${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.xl} 0;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  position: relative;
  z-index: 1;
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  opacity: 0.95;
  position: relative;
  z-index: 1;
`;

const StatsCard = styled(Card)`
  text-align: center;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
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
`;

const QuickActionCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: ${({ theme }) => theme.colors.surface};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const ActionIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const RecentActivityCard = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    transform: translateX(4px);
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => Math.min(props.progress, 100)}%;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight});
    transition: width 0.5s ease;
  }
`;

const StreakBadge = styled(Badge)`
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  font-weight: bold;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

const InsightCard = styled(Card)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.info}15, ${({ theme }) => theme.colors.surface});
  border-left: 4px solid ${({ theme }) => theme.colors.info};
`;

interface DashboardStats {
  weeklyMiles: number;
  weeklyRuns: number;
  monthlyMiles: number;
  yearlyMiles: number;
  currentStreak: number;
  longestStreak: number;
  averagePace: number;
  lastRunDaysAgo: number;
  weeklyGoalProgress: number;
  recentActivities: Activity[];
}

const HomeDashboard: React.FC = () => {
  const { state: activitiesState, fetchActivities } = useActivities();
  const { activities, loading } = activitiesState;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      calculateDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  const calculateDashboardStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Filter activities by time periods
    const weeklyActivities = activities.filter(a => new Date(a.start_date) >= oneWeekAgo);
    const monthlyActivities = activities.filter(a => new Date(a.start_date) >= oneMonthAgo);
    const yearlyActivities = activities.filter(a => new Date(a.start_date) >= oneYearAgo);

    // Calculate miles
    const weeklyMiles = weeklyActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
    const monthlyMiles = monthlyActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;
    const yearlyMiles = yearlyActivities.reduce((sum, a) => sum + a.distance, 0) * 0.000621371;

    // Calculate streaks - Fixed algorithm
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (sortedActivities.length > 0) {
      // Create a set of unique days with activities
      const runDays = new Set<string>();
      sortedActivities.forEach(activity => {
        const date = new Date(activity.start_date);
        const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        runDays.add(dateStr);
      });
      
      // Convert to sorted array of dates
      const uniqueDays = Array.from(runDays).map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month, day);
      }).sort((a, b) => a.getTime() - b.getTime());
      
      // Calculate longest streak
      let tempStreak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const daysDiff = Math.floor((uniqueDays[i].getTime() - uniqueDays[i-1].getTime()) / (24 * 60 * 60 * 1000));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Calculate current streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastRunDate = uniqueDays[uniqueDays.length - 1];
      const daysSinceLastRun = Math.floor((today.getTime() - lastRunDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastRun <= 1) {
        // Count backwards from last run to find current streak
        currentStreak = 1;
        for (let i = uniqueDays.length - 2; i >= 0; i--) {
          const daysDiff = Math.floor((uniqueDays[i + 1].getTime() - uniqueDays[i].getTime()) / (24 * 60 * 60 * 1000));
          if (daysDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate average pace
    const totalSpeed = weeklyActivities.reduce((sum, a) => sum + a.average_speed, 0);
    const averagePace = weeklyActivities.length > 0 ? totalSpeed / weeklyActivities.length : 0;

    // Calculate last run days ago
    const lastRunDaysAgo = sortedActivities.length > 0
      ? Math.floor((now.getTime() - new Date(sortedActivities[0].start_date).getTime()) / (24 * 60 * 60 * 1000))
      : -1;

    // Weekly goal progress (default 20 miles/week)
    const weeklyGoal = parseFloat(localStorage.getItem('weeklyMileGoal') || '20');
    const weeklyGoalProgress = (weeklyMiles / weeklyGoal) * 100;

    setStats({
      weeklyMiles,
      weeklyRuns: weeklyActivities.length,
      monthlyMiles,
      yearlyMiles,
      currentStreak,
      longestStreak,
      averagePace,
      lastRunDaysAgo,
      weeklyGoalProgress,
      recentActivities: sortedActivities.slice(0, 5)
    });
  };

  const formatPace = (metersPerSecond: number): string => {
    if (metersPerSecond === 0) return '--:--';
    const secondsPerMile = 1609.34 / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(2)} mi`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading || !stats) {
    return (
      <Container>
        <FlexContainer direction="column" align="center" style={{ marginTop: '100px' }}>
          <LoadingSpinner />
          <Text style={{ marginTop: '16px' }}>Loading your dashboard...</Text>
        </FlexContainer>
      </Container>
    );
  }

  return (
    <>
      <DashboardHeader>
        <Container>
          <WelcomeTitle>{greeting}, Runner! 🏃</WelcomeTitle>
          <WelcomeSubtitle>
            {stats.lastRunDaysAgo === 0 ? "Great job on today's run!" :
             stats.lastRunDaysAgo === 1 ? "You ran yesterday - keep the momentum going!" :
             stats.lastRunDaysAgo > 0 ? `It's been ${stats.lastRunDaysAgo} days since your last run` :
             "Welcome to DoubleDash!"}
          </WelcomeSubtitle>
        </Container>
      </DashboardHeader>

      <Container>
        {/* Current Streak Banner */}
        {stats.currentStreak > 0 && (
          <FlexContainer justify="center" style={{ marginBottom: '32px' }}>
            <StreakBadge>
              🔥 {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'} Streak!
            </StreakBadge>
          </FlexContainer>
        )}

        {/* Key Stats */}
        <Grid columns={{ xs: 2, sm: 2, md: 4 }} gap="lg" style={{ marginBottom: '32px' }}>
          <StatsCard>
            <StatValue>{stats.weeklyMiles.toFixed(1)}</StatValue>
            <StatLabel>Miles This Week</StatLabel>
            <ProgressBar progress={stats.weeklyGoalProgress} style={{ marginTop: '8px' }} />
          </StatsCard>
          
          <StatsCard>
            <StatValue>{stats.weeklyRuns}</StatValue>
            <StatLabel>Runs This Week</StatLabel>
          </StatsCard>
          
          <StatsCard>
            <StatValue>{formatPace(stats.averagePace)}</StatValue>
            <StatLabel>Avg Pace (This Week)</StatLabel>
          </StatsCard>
          
          <StatsCard>
            <StatValue>{stats.yearlyMiles.toFixed(0)}</StatValue>
            <StatLabel>Miles This Year</StatLabel>
          </StatsCard>
        </Grid>

        {/* Quick Actions */}
        <Heading size="md" style={{ marginBottom: '16px' }}>Quick Actions</Heading>
        <Grid columns={4} gap="md" style={{ marginBottom: '32px' }}>
          <Link to="/activities" style={{ textDecoration: 'none' }}>
            <QuickActionCard>
              <ActionIcon>📊</ActionIcon>
              <Heading size="sm">View Activities</Heading>
              <Text size="sm" color="secondary">Browse all your runs</Text>
            </QuickActionCard>
          </Link>
          
          <Link to="/analytics" style={{ textDecoration: 'none' }}>
            <QuickActionCard>
              <ActionIcon>📈</ActionIcon>
              <Heading size="sm">Analytics</Heading>
              <Text size="sm" color="secondary">Deep dive into stats</Text>
            </QuickActionCard>
          </Link>
          
          <Link to="/analytics" style={{ textDecoration: 'none' }}>
            <QuickActionCard>
              <ActionIcon>🎯</ActionIcon>
              <Heading size="sm">Goals</Heading>
              <Text size="sm" color="secondary">Track your progress</Text>
            </QuickActionCard>
          </Link>
          
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <QuickActionCard>
              <ActionIcon>🔄</ActionIcon>
              <Heading size="sm">Sync Strava</Heading>
              <Text size="sm" color="secondary">Update activities</Text>
            </QuickActionCard>
          </Link>
        </Grid>

        <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg">
          {/* Recent Activities */}
          <div>
            <FlexContainer justify="space-between" align="center" style={{ marginBottom: '16px' }}>
              <Heading size="md">Recent Activities</Heading>
              <Link to="/activities">
                <Button size="sm" variant="secondary">View All</Button>
              </Link>
            </FlexContainer>
            
            {stats.recentActivities.map(activity => (
              <RecentActivityCard key={activity.activityId}>
                <div>
                  <Text weight="semiBold">{activity.name}</Text>
                  <Text size="sm" color="secondary">
                    {formatDate(activity.start_date)} • {formatDistance(activity.distance)} • {formatPace(activity.average_speed)}/mi
                  </Text>
                </div>
                {activity.pr_count > 0 && (
                  <Badge variant="success">🏆 {activity.pr_count} PR{activity.pr_count > 1 ? 's' : ''}</Badge>
                )}
              </RecentActivityCard>
            ))}
            
            {stats.recentActivities.length === 0 && (
              <Card style={{ textAlign: 'center' }}>
                <Text color="secondary">No recent activities. Time to go for a run!</Text>
              </Card>
            )}
          </div>

          {/* Insights & Tips */}
          <div>
            <Heading size="md" style={{ marginBottom: '16px' }}>Insights & Motivation</Heading>
            
            <InsightCard style={{ marginBottom: '16px' }}>
              <Heading size="sm" style={{ marginBottom: '8px' }}>💪 This Month</Heading>
              <Text>You've run {stats.monthlyMiles.toFixed(1)} miles in the last 30 days!</Text>
            </InsightCard>
            
            {stats.longestStreak > stats.currentStreak && (
              <InsightCard style={{ marginBottom: '16px' }}>
                <Heading size="sm" style={{ marginBottom: '8px' }}>🏆 Personal Best Streak</Heading>
                <Text>Your longest streak was {stats.longestStreak} days. Can you beat it?</Text>
              </InsightCard>
            )}
            
            {stats.weeklyGoalProgress < 50 && (
              <InsightCard style={{ marginBottom: '16px' }}>
                <Heading size="sm" style={{ marginBottom: '8px' }}>🎯 Weekly Goal</Heading>
                <Text>You're {(100 - stats.weeklyGoalProgress).toFixed(0)}% away from your weekly goal!</Text>
              </InsightCard>
            )}
            
            {stats.weeklyGoalProgress >= 100 && (
              <InsightCard style={{ marginBottom: '16px' }}>
                <Heading size="sm" style={{ marginBottom: '8px' }}>🎉 Goal Achieved!</Heading>
                <Text>Congratulations! You've hit your weekly mileage goal!</Text>
              </InsightCard>
            )}
            
            <InsightCard>
              <Heading size="sm" style={{ marginBottom: '8px' }}>💡 Tip of the Day</Heading>
              <Text size="sm">
                {[
                  "Remember to warm up before your runs and cool down after!",
                  "Consistency is key - even short runs count!",
                  "Stay hydrated before, during, and after your runs.",
                  "Mix up your routes to keep things interesting!",
                  "Listen to your body and take rest days when needed.",
                  "Track your progress to stay motivated!",
                  "Set realistic goals and celebrate small wins!"
                ][new Date().getDay()]}
              </Text>
            </InsightCard>
          </div>
        </Grid>
      </Container>
    </>
  );
};

export default HomeDashboard;