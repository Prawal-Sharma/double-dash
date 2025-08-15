import React, { useState, useEffect, useMemo } from 'react';
import { useActivities } from '../contexts/ActivitiesContext';
import styled from 'styled-components';
import {
  Container,
  Card,
  Text,
  FlexContainer,
  LoadingSpinner,
  ErrorMessage,
  Select,
  Button
} from '../styles/components';
import 'react-calendar-heatmap/dist/styles.css';

// Tab components - we'll create these
import OverviewTab from './analytics/OverviewTab';
import PerformanceTab from './analytics/PerformanceTab';
import PatternsTab from './analytics/PatternsTab';
import ProgressTab from './analytics/ProgressTab';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const AnalyticsHeader = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  color: white;
  padding: ${({ theme }) => `${theme.spacing.xl} 0 ${theme.spacing.lg}`};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const HeaderContent = styled(Container)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HeaderSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  margin: 0;
  opacity: 0.9;
`;

const TimeRangeSelector = styled(Select)`
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  min-width: 150px;
  
  &:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  option {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background};
  }
`;

const TabContainer = styled.div`
  background: white;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const TabList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 0 ${({ theme }) => theme.spacing.md};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 2px;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background: transparent;
  border: none;
  border-bottom: 3px solid ${({ active, theme }) => active ? theme.colors.primary : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surface};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md}`};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const TabIcon = styled.span`
  margin-right: ${({ theme }) => theme.spacing.xs};
  font-size: 1.2em;
`;

const ContentArea = styled(Container)`
  padding-bottom: ${({ theme }) => theme.spacing.xxl};
  min-height: 60vh;
`;

const MainContent = styled.div<{ withSidebar?: boolean }>`
  display: grid;
  grid-template-columns: ${({ withSidebar }) => withSidebar ? '1fr 320px' : '1fr'};
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const InsightsSidebar = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-top: ${({ theme }) => theme.spacing.xl};
  }
`;

const InsightCard = styled(Card)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}10 0%, ${({ theme }) => theme.colors.surface} 100%);
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InsightTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InsightText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  min-height: 400px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  opacity: 0.5;
`;

const EmptyStateTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EmptyStateMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  max-width: 400px;
`;

const QuickStatsBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const QuickStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const QuickStatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: white;
`;

const QuickStatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'performance', label: 'Performance', icon: '🏃' },
  { id: 'patterns', label: 'Patterns', icon: '📈' },
  { id: 'progress', label: 'Progress', icon: '📅' }
];

interface AnalyticsData {
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  totalActivities: number;
  avgPace: number;
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number;
}

const AnalyticsV2: React.FC = () => {
  const { state: activitiesState, fetchActivities } = useActivities();
  const { activities, loading, error } = activitiesState;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d' | '1y'>('1y');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  
  // Filter activities based on time range
  const filteredActivities = useMemo(() => {
    if (timeRange === 'all') return activities;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return activities.filter(activity => 
      new Date(activity.start_date) >= cutoffDate
    );
  }, [activities, timeRange]);
  
  // Calculate analytics data
  useEffect(() => {
    if (filteredActivities.length === 0) {
      setAnalyticsData(null);
      return;
    }
    
    const totalDistance = filteredActivities.reduce((sum, a) => sum + a.distance, 0);
    const totalTime = filteredActivities.reduce((sum, a) => sum + a.moving_time, 0);
    const totalElevation = filteredActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const avgPace = filteredActivities.reduce((sum, a) => sum + a.average_speed, 0) / filteredActivities.length;
    
    // Calculate consistency score based on running frequency
    const calculateConsistency = () => {
      if (filteredActivities.length === 0) return 0;
      
      // Group activities by week
      const weekMap = new Map<string, number>();
      filteredActivities.forEach(activity => {
        const date = new Date(activity.start_date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
      });
      
      // Calculate total weeks in range
      const sortedActivities = [...filteredActivities].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      
      if (sortedActivities.length === 0) return 0;
      
      const firstDate = new Date(sortedActivities[0].start_date);
      const lastDate = new Date(sortedActivities[sortedActivities.length - 1].start_date);
      const totalWeeks = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
      
      // Consistency = percentage of weeks with at least one run
      const weeksWithRuns = weekMap.size;
      const consistency = Math.min(100, Math.round((weeksWithRuns / totalWeeks) * 100));
      
      return consistency;
    };
    
    // Calculate streaks
    const calculateStreaks = () => {
      if (filteredActivities.length === 0) return { current: 0, longest: 0 };
      
      const sortedActivities = [...filteredActivities].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      
      // Create set of unique run days
      const runDays = new Set<string>();
      sortedActivities.forEach(activity => {
        const date = new Date(activity.start_date);
        runDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      });
      
      // Convert to sorted array of dates
      const uniqueDays = Array.from(runDays).map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month, day);
      }).sort((a, b) => a.getTime() - b.getTime());
      
      if (uniqueDays.length === 0) return { current: 0, longest: 0 };
      
      // Calculate longest streak
      let longestStreak = 1;
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
      
      let currentStreak = 0;
      if (daysSinceLastRun <= 1) {
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
      
      return { current: currentStreak, longest: longestStreak };
    };
    
    const streaks = calculateStreaks();
    const consistencyScore = calculateConsistency();
    
    setAnalyticsData({
      totalDistance,
      totalTime,
      totalElevation,
      totalActivities: filteredActivities.length,
      avgPace,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      consistencyScore
    });
  }, [filteredActivities]);
  
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);
  
  if (loading) {
    return (
      <PageContainer>
        <FlexContainer direction="column" align="center" style={{ paddingTop: '100px' }}>
          <LoadingSpinner />
          <Text style={{ marginTop: '16px' }}>Loading your analytics...</Text>
        </FlexContainer>
      </PageContainer>
    );
  }
  
  if (error) {
    return (
      <PageContainer>
        <Container>
          <ErrorMessage style={{ marginTop: '50px', textAlign: 'center' }}>
            ⚠️ {error}
          </ErrorMessage>
        </Container>
      </PageContainer>
    );
  }
  
  const renderEmptyState = () => (
    <EmptyStateContainer>
      <EmptyStateIcon>📊</EmptyStateIcon>
      <EmptyStateTitle>No Running Data Available</EmptyStateTitle>
      <EmptyStateMessage>
        {timeRange === 'all' 
          ? "You haven't recorded any runs yet. Connect with Strava to start tracking your running journey!"
          : `No runs found in the selected time period. Try selecting a different time range or sync your recent activities.`
        }
      </EmptyStateMessage>
      <FlexContainer gap="md">
        {timeRange !== 'all' && (
          <Button variant="secondary" onClick={() => setTimeRange('all')}>
            View All Time
          </Button>
        )}
        <Button variant="primary" onClick={() => window.location.href = '/dashboard'}>
          Sync Activities
        </Button>
      </FlexContainer>
    </EmptyStateContainer>
  );
  
  const renderTabContent = () => {
    if (filteredActivities.length === 0) {
      return renderEmptyState();
    }
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab activities={filteredActivities} analyticsData={analyticsData} />;
      case 'performance':
        return <PerformanceTab activities={filteredActivities} />;
      case 'patterns':
        return <PatternsTab activities={filteredActivities} />;
      case 'progress':
        return <ProgressTab activities={filteredActivities} />;
      default:
        return null;
    }
  };
  
  return (
    <PageContainer>
      {/* Header */}
      <AnalyticsHeader>
        <HeaderContent>
          <HeaderTop>
            <div>
              <HeaderTitle>Running Analytics</HeaderTitle>
              <HeaderSubtitle>Deep insights into your running performance</HeaderSubtitle>
            </div>
            <TimeRangeSelector 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </TimeRangeSelector>
          </HeaderTop>
          
          {/* Quick Stats Bar */}
          {analyticsData && (
            <QuickStatsBar>
              <QuickStat>
                <QuickStatValue>{analyticsData.totalActivities}</QuickStatValue>
                <QuickStatLabel>Total Runs</QuickStatLabel>
              </QuickStat>
              <QuickStat>
                <QuickStatValue>
                  {(analyticsData.totalDistance * 0.000621371).toFixed(1)}
                </QuickStatValue>
                <QuickStatLabel>Miles</QuickStatLabel>
              </QuickStat>
              <QuickStat>
                <QuickStatValue>
                  {Math.floor(analyticsData.totalTime / 3600)}h {Math.floor((analyticsData.totalTime % 3600) / 60)}m
                </QuickStatValue>
                <QuickStatLabel>Time</QuickStatLabel>
              </QuickStat>
              <QuickStat>
                <QuickStatValue>
                  {Math.round(analyticsData.totalElevation * 3.28084)}
                </QuickStatValue>
                <QuickStatLabel>Elevation (ft)</QuickStatLabel>
              </QuickStat>
              <QuickStat>
                <QuickStatValue>
                  {analyticsData.consistencyScore.toFixed(0)}%
                </QuickStatValue>
                <QuickStatLabel>Consistency</QuickStatLabel>
              </QuickStat>
            </QuickStatsBar>
          )}
        </HeaderContent>
      </AnalyticsHeader>
      
      {/* Tabs */}
      <TabContainer>
        <Container>
          <TabList>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon>{tab.icon}</TabIcon>
                {tab.label}
              </TabButton>
            ))}
          </TabList>
        </Container>
      </TabContainer>
      
      {/* Content */}
      <ContentArea>
        <MainContent withSidebar={filteredActivities.length > 0}>
          <div>
            {renderTabContent()}
          </div>
          
          {/* Insights Sidebar */}
          {filteredActivities.length > 0 && (
            <InsightsSidebar>
              <InsightCard>
                <InsightTitle>🎯 Your Insights</InsightTitle>
                <InsightText style={{ marginBottom: '12px' }}>
                  Based on your {filteredActivities.length} activities
                </InsightText>
              </InsightCard>
              
              {analyticsData && (
                <>
                  <InsightCard>
                    <InsightTitle>📈 Performance Trend</InsightTitle>
                    <InsightText>
                      {analyticsData.avgPace > 0 
                        ? `Average pace: ${Math.floor(1609.34 / analyticsData.avgPace / 60)}:${Math.floor((1609.34 / analyticsData.avgPace) % 60).toString().padStart(2, '0')}/mi`
                        : 'No pace data available'}
                    </InsightText>
                  </InsightCard>
                  
                  <InsightCard>
                    <InsightTitle>🏃 Consistency</InsightTitle>
                    <InsightText>
                      {analyticsData.consistencyScore > 75 
                        ? "Excellent consistency! Keep it up!"
                        : analyticsData.consistencyScore > 50
                        ? "Good progress. Try to run more regularly."
                        : "Room for improvement. Aim for 3-4 runs per week."}
                    </InsightText>
                  </InsightCard>
                  
                  <InsightCard>
                    <InsightTitle>💡 Recommendation</InsightTitle>
                    <InsightText>
                      {analyticsData.totalActivities < 10
                        ? "Build your base with easy runs"
                        : analyticsData.avgPace < 4
                        ? "Great pace! Consider adding interval training"
                        : "Focus on building endurance with longer runs"}
                    </InsightText>
                  </InsightCard>
                  
                  <InsightCard>
                    <InsightTitle>🎉 Achievement</InsightTitle>
                    <InsightText>
                      You've completed {analyticsData.totalActivities} runs and covered {(analyticsData.totalDistance * 0.000621371).toFixed(0)} miles!
                    </InsightText>
                  </InsightCard>
                </>
              )}
            </InsightsSidebar>
          )}
        </MainContent>
      </ContentArea>
    </PageContainer>
  );
};

export default AnalyticsV2;