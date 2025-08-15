import React, { useState } from 'react';
import styled from 'styled-components';
import { Activity } from '../types';
import { FlexContainer, Badge, Text } from '../styles/components';

// Styled Components
const CardContainer = styled.div<{ expanded: boolean }>`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  transition: all 0.3s ease;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primary}40;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ theme }) => theme.colors.primary};
    transform: scaleX(${({ expanded }) => expanded ? 1 : 0});
    transition: transform 0.3s ease;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const ActivityTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const DateText = styled(Text)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.md} 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
  }
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ExpandedContent = styled.div<{ expanded: boolean }>`
  max-height: ${({ expanded }) => expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: ${({ expanded, theme }) => expanded ? theme.spacing.md : '0'};
`;

const SocialStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SocialItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const EffortIndicator = styled.div<{ level: 'easy' | 'moderate' | 'hard' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ level, theme }) => {
    switch(level) {
      case 'easy': return '#10b98120';
      case 'moderate': return '#f59e0b20';
      case 'hard': return '#ef444420';
      default: return theme.colors.surface;
    }
  }};
  color: ${({ level }) => {
    switch(level) {
      case 'easy': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return 'inherit';
    }
  }};
`;

const ComparisonText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-style: italic;
`;

const WeatherIcon = styled.span`
  font-size: 1.5rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

// Helper functions
const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371;
  return `${miles.toFixed(2)} mi`;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatPace = (metersPerSecond: number): string => {
  if (metersPerSecond === 0) return '--';
  const secondsPerMile = 1609.34 / metersPerSecond;
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.floor(secondsPerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const getEffortLevel = (activity: Activity): 'easy' | 'moderate' | 'hard' => {
  // Calculate based on pace relative to average or heart rate zones
  const pacePerMile = activity.average_speed > 0 ? 1609.34 / activity.average_speed : 0;
  
  if (activity.average_heartrate) {
    // Use heart rate zones if available
    const maxHR = 220 - 30; // Rough estimate, should be personalized
    const hrPercent = (activity.average_heartrate / maxHR) * 100;
    
    if (hrPercent < 70) return 'easy';
    if (hrPercent < 85) return 'moderate';
    return 'hard';
  }
  
  // Fallback to pace-based estimation
  if (pacePerMile > 600) return 'easy'; // > 10 min/mile
  if (pacePerMile > 480) return 'moderate'; // 8-10 min/mile
  return 'hard'; // < 8 min/mile
};

const getWeatherIcon = (dateString: string): string => {
  // This would ideally fetch actual weather data
  // For now, return seasonal estimates
  const date = new Date(dateString);
  const month = date.getMonth();
  const hour = date.getHours();
  
  // Night runs
  if (hour < 6 || hour > 20) return '🌙';
  
  // Seasonal icons
  if (month >= 11 || month <= 1) return '❄️'; // Winter
  if (month >= 2 && month <= 4) return '🌸'; // Spring
  if (month >= 5 && month <= 7) return '☀️'; // Summer
  return '🍂'; // Fall
};

interface EnhancedActivityCardProps {
  activity: Activity;
  averagePace?: number; // For comparison
  isPersonalBest?: boolean;
}

const EnhancedActivityCard: React.FC<EnhancedActivityCardProps> = ({ 
  activity, 
  averagePace,
  isPersonalBest 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const effortLevel = getEffortLevel(activity);
  const weatherIcon = getWeatherIcon(activity.start_date_local || activity.start_date);
  
  // Calculate comparison to average
  const paceComparison = averagePace && activity.average_speed > 0
    ? ((averagePace - activity.average_speed) / averagePace * 100).toFixed(0)
    : null;

  return (
    <CardContainer expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <HeaderSection>
        <TitleGroup>
          <ActivityTitle>
            {activity.name}
            <WeatherIcon>{weatherIcon}</WeatherIcon>
          </ActivityTitle>
          <MetaInfo>
            <DateText>{formatDate(activity.start_date)}</DateText>
            {activity.location_city && (
              <DateText>📍 {activity.location_city}</DateText>
            )}
            <EffortIndicator level={effortLevel}>
              {effortLevel === 'easy' && '😌'}
              {effortLevel === 'moderate' && '💪'}
              {effortLevel === 'hard' && '🔥'}
              {effortLevel.charAt(0).toUpperCase() + effortLevel.slice(1)} Effort
            </EffortIndicator>
          </MetaInfo>
        </TitleGroup>
        
        <BadgeGroup>
          {isPersonalBest && (
            <Badge variant="primary">🏆 Personal Best</Badge>
          )}
          {activity.pr_count > 0 && (
            <Badge variant="success">
              ⚡ {activity.pr_count} PR{activity.pr_count > 1 ? 's' : ''}
            </Badge>
          )}
          {activity.achievement_count > 0 && (
            <Badge variant="warning">
              🎯 {activity.achievement_count} Achievement{activity.achievement_count > 1 ? 's' : ''}
            </Badge>
          )}
          {activity.commute && (
            <Badge variant="secondary">🚴 Commute</Badge>
          )}
        </BadgeGroup>
      </HeaderSection>

      <StatsGrid>
        <StatItem>
          <StatValue>{formatDistance(activity.distance)}</StatValue>
          <StatLabel>Distance</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{formatDuration(activity.moving_time)}</StatValue>
          <StatLabel>Duration</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{formatPace(activity.average_speed)}</StatValue>
          <StatLabel>Avg Pace</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{Math.round(activity.total_elevation_gain * 3.28084)}</StatValue>
          <StatLabel>Elevation (ft)</StatLabel>
        </StatItem>
        
        {activity.average_heartrate && (
          <StatItem>
            <StatValue>{Math.round(activity.average_heartrate)}</StatValue>
            <StatLabel>Avg HR (bpm)</StatLabel>
          </StatItem>
        )}
        
        {activity.average_cadence && (
          <StatItem>
            <StatValue>{Math.round(activity.average_cadence * 2)}</StatValue>
            <StatLabel>Cadence (spm)</StatLabel>
          </StatItem>
        )}
        
        {activity.max_speed > 0 && (
          <StatItem>
            <StatValue>{formatPace(activity.max_speed)}</StatValue>
            <StatLabel>Best Pace</StatLabel>
          </StatItem>
        )}
        
        {activity.suffer_score && (
          <StatItem>
            <StatValue>{activity.suffer_score}</StatValue>
            <StatLabel>Relative Effort</StatLabel>
          </StatItem>
        )}
      </StatsGrid>

      {paceComparison && (
        <ComparisonText>
          {Number(paceComparison) > 0 
            ? `⚡ ${Math.abs(Number(paceComparison))}% faster than your average`
            : Number(paceComparison) < 0
            ? `${Math.abs(Number(paceComparison))}% slower than your average`
            : 'Right at your average pace!'
          }
        </ComparisonText>
      )}

      <ExpandedContent expanded={expanded}>
        {expanded && (
          <>
            {activity.max_heartrate && (
              <FlexContainer gap="md" style={{ marginBottom: '12px' }}>
                <Text size="sm">
                  <strong>Max Heart Rate:</strong> {activity.max_heartrate} bpm
                </Text>
                {activity.elev_high && activity.elev_low && (
                  <Text size="sm">
                    <strong>Elevation Range:</strong> {Math.round(activity.elev_low * 3.28084)} - {Math.round(activity.elev_high * 3.28084)} ft
                  </Text>
                )}
              </FlexContainer>
            )}
            
            <SocialStats>
              <SocialItem>
                <span>👍</span>
                <Text size="sm">{activity.kudos_count} kudos</Text>
              </SocialItem>
              <SocialItem>
                <span>💬</span>
                <Text size="sm">{activity.comment_count} comments</Text>
              </SocialItem>
              <SocialItem>
                <span>📸</span>
                <Text size="sm">{activity.photo_count} photos</Text>
              </SocialItem>
              {activity.athlete_count > 1 && (
                <SocialItem>
                  <span>👥</span>
                  <Text size="sm">{activity.athlete_count} athletes</Text>
                </SocialItem>
              )}
            </SocialStats>
          </>
        )}
      </ExpandedContent>
    </CardContainer>
  );
};

export default EnhancedActivityCard;