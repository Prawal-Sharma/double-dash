import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import styled from 'styled-components';
import { Activity } from '../../types';
import { analyzePaceDistribution, analyzeDistanceDistribution } from '../../utils/activityUtils';

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  height: 400px;
`;

const ChartTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  text-align: center;
`;

const CustomTooltip = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const PACE_COLORS = ['#28a745', '#34ce57', '#6dd388', '#a6dca0', '#d4e8d6', '#ff6b6b'];
const DISTANCE_COLORS = ['#007bff', '#339dff', '#66b3ff', '#99ccff', '#cce0ff'];

interface DistributionChartsProps {
  activities: Activity[];
}

const DistributionCharts: React.FC<DistributionChartsProps> = ({ activities }) => {
  const paceDistribution = analyzePaceDistribution(activities);
  const distanceDistribution = analyzeDistanceDistribution(activities);

  const renderPaceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = paceDistribution.reduce((sum, item) => sum + item.count, 0);
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
      
      return (
        <CustomTooltip>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{data.range}</p>
          <p style={{ margin: '4px 0', color: '#007bff' }}>
            Runs: {data.count}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
            {percentage}% of total runs
          </p>
        </CustomTooltip>
      );
    }
    return null;
  };

  const renderDistanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = distanceDistribution.reduce((sum, item) => sum + item.count, 0);
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
      
      return (
        <CustomTooltip>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{data.range}</p>
          <p style={{ margin: '4px 0', color: '#28a745' }}>
            Runs: {data.count}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
            {percentage}% of total runs
          </p>
        </CustomTooltip>
      );
    }
    return null;
  };

  const renderPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = paceDistribution.reduce((sum, item) => sum + item.count, 0);
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
      
      return (
        <CustomTooltip>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{data.range}</p>
          <p style={{ margin: '4px 0' }}>
            {data.count} runs ({percentage}%)
          </p>
        </CustomTooltip>
      );
    }
    return null;
  };

  if (activities.length === 0) {
    return (
      <ChartsContainer>
        <ChartContainer>
          <ChartTitle>Pace Distribution</ChartTitle>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
            No data available
          </div>
        </ChartContainer>
        <ChartContainer>
          <ChartTitle>Distance Distribution</ChartTitle>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
            No data available
          </div>
        </ChartContainer>
      </ChartsContainer>
    );
  }

  return (
    <ChartsContainer>
      <ChartContainer>
        <ChartTitle>Pace Distribution</ChartTitle>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={paceDistribution}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ range, count }) => count > 0 ? `${range}: ${count}` : ''}
              labelLine={false}
            >
              {paceDistribution.map((entry, index) => (
                <Cell key={`pace-cell-${index}`} fill={PACE_COLORS[index % PACE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={renderPieTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer>
        <ChartTitle>Distance Distribution</ChartTitle>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={distanceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={renderDistanceTooltip} />
            <Bar 
              dataKey="count" 
              fill="#007bff"
              radius={[4, 4, 0, 0]}
            >
              {distanceDistribution.map((entry, index) => (
                <Cell key={`distance-cell-${index}`} fill={DISTANCE_COLORS[index % DISTANCE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartsContainer>
  );
};

export default DistributionCharts;