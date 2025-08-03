import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import styled from 'styled-components';
import { Activity } from '../../types';
import { analyzeHeartRateZones } from '../../utils/activityUtils';

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
  text-align: center;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
`;

const HeartIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  opacity: 0.5;
`;

interface HeartRateZoneChartProps {
  activities: Activity[];
}

const HeartRateZoneChart: React.FC<HeartRateZoneChartProps> = ({ activities }) => {
  const hrZones = analyzeHeartRateZones(activities);
  
  // Calculate additional HR stats
  const hrActivities = activities.filter(act => act.has_heartrate && act.average_heartrate && act.max_heartrate);
  const avgHeartRate = hrActivities.length > 0 
    ? hrActivities.reduce((sum, act) => sum + (act.average_heartrate || 0), 0) / hrActivities.length 
    : 0;
  const maxHeartRateOverall = hrActivities.length > 0
    ? Math.max(...hrActivities.map(act => act.max_heartrate || 0))
    : 0;

  if (!hrZones || hrZones.every(zone => zone.count === 0)) {
    return (
      <ChartContainer>
        <ChartTitle>❤️ Heart Rate Zone Distribution</ChartTitle>
        <EmptyState>
          <HeartIcon>💓</HeartIcon>
          <div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>No Heart Rate Data Available</p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Connect a heart rate monitor to your runs to see detailed zone analysis
            </p>
          </div>
        </EmptyState>
      </ChartContainer>
    );
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = hrZones.reduce((sum, zone) => sum + zone.count, 0);
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
      
      return (
        <CustomTooltip>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: data.color }}>
            {data.zone} Zone
          </p>
          <p style={{ margin: '4px 0' }}>
            Runs: {data.count}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
            {percentage}% of HR runs
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
            {data.min}-{data.max === Infinity ? '220+' : data.max} bpm
          </p>
        </CustomTooltip>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    if (value === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <ChartContainer>
      <ChartTitle>❤️ Heart Rate Zone Distribution</ChartTitle>
      
      <StatsContainer>
        <StatCard>
          <StatValue>{Math.round(avgHeartRate)}</StatValue>
          <StatLabel>Average HR (bpm)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{maxHeartRateOverall}</StatValue>
          <StatLabel>Max HR Recorded (bpm)</StatLabel>
        </StatCard>
      </StatsContainer>

      <ResponsiveContainer width="100%" height="70%">
        <PieChart>
          <Pie
            data={hrZones.filter(zone => zone.count > 0)}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="count"
          >
            {hrZones.filter(zone => zone.count > 0).map((entry, index) => (
              <Cell key={`hr-cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => `${entry?.payload?.zone || 'Unknown'} (${entry?.payload?.count || 0} runs)`}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default HeartRateZoneChart;