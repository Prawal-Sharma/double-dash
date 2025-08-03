import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import styled from 'styled-components';
import { Activity } from '../../types';
import { calculateWeeklyStats } from '../../utils/activityUtils';

const ChartContainer = styled.div`
  width: 100%;
  height: 400px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ChartTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
`;

const MetricsRow = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const MetricItem = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const CustomTooltip = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

interface WeeklyVolumeChartProps {
  activities: Activity[];
}

const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({ activities }) => {
  const weeklyStats = calculateWeeklyStats(activities, 12);

  if (weeklyStats.length === 0) {
    return (
      <ChartContainer>
        <ChartTitle>Weekly Training Volume</ChartTitle>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
          No data available
        </div>
      </ChartContainer>
    );
  }

  // Calculate summary metrics
  const recentWeeks = weeklyStats.slice(-4); // Last 4 weeks
  const avgWeeklyDistance = recentWeeks.reduce((sum, week) => sum + week.totalDistance, 0) / recentWeeks.length;
  const avgWeeklyRuns = recentWeeks.reduce((sum, week) => sum + week.totalRuns, 0) / recentWeeks.length;
  const totalDistance = weeklyStats.reduce((sum, week) => sum + week.totalDistance, 0);
  const totalRuns = weeklyStats.reduce((sum, week) => sum + week.totalRuns, 0);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <CustomTooltip>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Week of {data.weekLabel}</p>
          <p style={{ margin: '4px 0', color: '#007bff' }}>
            Distance: {data.totalDistance.toFixed(1)} miles
          </p>
          <p style={{ margin: '4px 0', color: '#28a745' }}>
            Runs: {data.totalRuns}
          </p>
          <p style={{ margin: '4px 0', color: '#ffc107' }}>
            Time: {data.totalTime.toFixed(1)} hours
          </p>
          {data.avgPace > 0 && (
            <p style={{ margin: '4px 0', color: '#dc3545' }}>
              Avg Pace: {Math.floor(data.avgPace)}:{Math.round((data.avgPace - Math.floor(data.avgPace)) * 60).toString().padStart(2, '0')}/mile
            </p>
          )}
        </CustomTooltip>
      );
    }
    return null;
  };

  return (
    <ChartContainer>
      <ChartTitle>Weekly Training Volume (Last 12 Weeks)</ChartTitle>
      
      <MetricsRow>
        <MetricItem>
          <MetricValue>{avgWeeklyDistance.toFixed(1)}</MetricValue>
          <MetricLabel>Avg Weekly Miles</MetricLabel>
        </MetricItem>
        <MetricItem>
          <MetricValue>{avgWeeklyRuns.toFixed(1)}</MetricValue>
          <MetricLabel>Avg Weekly Runs</MetricLabel>
        </MetricItem>
        <MetricItem>
          <MetricValue>{totalDistance.toFixed(0)}</MetricValue>
          <MetricLabel>Total Miles (12w)</MetricLabel>
        </MetricItem>
        <MetricItem>
          <MetricValue>{totalRuns}</MetricValue>
          <MetricLabel>Total Runs (12w)</MetricLabel>
        </MetricItem>
      </MetricsRow>

      <ResponsiveContainer width="100%" height="75%">
        <AreaChart data={weeklyStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007bff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#007bff" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="weekLabel" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Miles', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine 
            y={avgWeeklyDistance} 
            stroke="#ff6b6b" 
            strokeDasharray="5 5"
            label={{ value: `Avg: ${avgWeeklyDistance.toFixed(1)} miles`, position: 'top' }}
          />
          <Area
            type="monotone"
            dataKey="totalDistance"
            stroke="#007bff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#distanceGradient)"
            dot={{ fill: '#007bff', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#007bff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default WeeklyVolumeChart;