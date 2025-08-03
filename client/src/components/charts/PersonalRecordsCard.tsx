import React from 'react';
import styled from 'styled-components';
import { Activity } from '../../types';
import { findPersonalRecords } from '../../utils/activityUtils';

const PRContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PRTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
`;

const PRGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const PRCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }
`;

const DistanceLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TimeDisplay = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
`;

const PaceDisplay = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  opacity: 0.9;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const DateDisplay = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  opacity: 0.8;
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const TrophyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

interface PersonalRecordsCardProps {
  activities: Activity[];
}

const PersonalRecordsCard: React.FC<PersonalRecordsCardProps> = ({ activities }) => {
  const personalRecords = findPersonalRecords(activities);

  const getGradient = (index: number) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 1 Mile
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // 5K
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // 10K
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Half Marathon
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Marathon
    ];
    return gradients[index % gradients.length];
  };

  const getTrophyEmoji = (index: number) => {
    const trophies = ['🥇', '🏃‍♂️', '🏃‍♀️', '🏆', '👑'];
    return trophies[index % trophies.length];
  };

  if (personalRecords.length === 0) {
    return (
      <PRContainer>
        <PRTitle>🏆 Personal Records</PRTitle>
        <EmptyState>
          Complete more runs to see your personal records here!
        </EmptyState>
      </PRContainer>
    );
  }

  return (
    <PRContainer>
      <PRTitle>🏆 Personal Records</PRTitle>
      <PRGrid>
        {personalRecords.map((record, index) => (
          <PRCard key={record.distance} style={{ background: getGradient(index) }}>
            <TrophyIcon>{getTrophyEmoji(index)}</TrophyIcon>
            <DistanceLabel>{record.distanceLabel}</DistanceLabel>
            <TimeDisplay>{record.timeFormatted}</TimeDisplay>
            <PaceDisplay>{record.pace}/mile</PaceDisplay>
            <DateDisplay>{record.date}</DateDisplay>
          </PRCard>
        ))}
      </PRGrid>
    </PRContainer>
  );
};

export default PersonalRecordsCard;