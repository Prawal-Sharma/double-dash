import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import styled from 'styled-components';
import { Activity } from '../../types';
import { calculateMonthlyStats } from '../../utils/activityUtils';

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

const CustomTooltip = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

interface MonthlyStatsChartProps {
  activities: Activity[];
  metric: 'distance' | 'runs' | 'pace' | 'time';
}

const MonthlyStatsChart: React.FC<MonthlyStatsChartProps> = ({ activities, metric }) => {
  const monthlyStats = calculateMonthlyStats(activities);

  if (monthlyStats.length === 0) {
    return (
      <ChartContainer>
        <ChartTitle>Monthly {metric.charAt(0).toUpperCase() + metric.slice(1)} Trends</ChartTitle>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
          No data available
        </div>
      </ChartContainer>
    );
  }

  const getDataKey = () => {
    switch (metric) {
      case 'distance': return 'totalDistance';
      case 'runs': return 'totalRuns';
      case 'pace': return 'avgPace';
      case 'time': return 'totalTime';
      default: return 'totalDistance';
    }
  };

  const getUnit = () => {
    switch (metric) {
      case 'distance': return 'miles';
      case 'runs': return 'runs';
      case 'pace': return 'min/mile';
      case 'time': return 'hours';
      default: return '';
    }
  };

  const getColor = () => {
    switch (metric) {
      case 'distance': return '#28a745';
      case 'runs': return '#007bff';
      case 'pace': return '#ffc107';
      case 'time': return '#dc3545';
      default: return '#007bff';
    }
  };

  const formatTooltipValue = (value: number) => {
    if (metric === 'pace') {
      const minutes = Math.floor(value);
      const seconds = Math.round((value - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return value.toFixed(1);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <CustomTooltip>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{data.monthName}</p>
          <p style={{ margin: '4px 0', color: getColor() }}>
            {metric.charAt(0).toUpperCase() + metric.slice(1)}: {formatTooltipValue(payload[0].value)} {getUnit()}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
            Total Runs: {data.totalRuns}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
            Avg Distance: {data.avgDistance.toFixed(1)} miles
          </p>
        </CustomTooltip>
      );
    }
    return null;
  };

  // Calculate average for reference line
  const average = monthlyStats.reduce((sum, stat) => {
    const value = stat[getDataKey() as keyof typeof stat];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0) / monthlyStats.length;

  return (
    <ChartContainer>
      <ChartTitle>Monthly {metric.charAt(0).toUpperCase() + metric.slice(1)} Trends</ChartTitle>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="monthName" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={metric === 'pace' ? ['dataMin - 0.5', 'dataMax + 0.5'] : [0, 'dataMax + 5']}
          />
          <Tooltip content={customTooltip} />
          <Legend />
          <ReferenceLine 
            y={average} 
            stroke={getColor()} 
            strokeDasharray="5 5" 
            label={{ value: `Avg: ${formatTooltipValue(average)} ${getUnit()}`, position: 'top' }}
          />
          <Line
            type="monotone"
            dataKey={getDataKey()}
            stroke={getColor()}
            strokeWidth={3}
            dot={{ fill: getColor(), strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: getColor(), strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default MonthlyStatsChart;