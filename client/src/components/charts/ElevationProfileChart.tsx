import React from 'react';
import styled from 'styled-components';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from '../../types';
import { Card, Heading, Text } from '../../styles/components';

const ChartCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const ChartHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

interface ElevationProfileChartProps {
  activities: Activity[];
}

const ElevationProfileChart: React.FC<ElevationProfileChartProps> = ({ activities }) => {
  // Process activities to get elevation data
  const elevationData = activities
    .slice(0, 30) // Last 30 activities
    .reverse()
    .map((activity, index) => ({
      run: index + 1,
      elevation: Math.round(activity.total_elevation_gain * 3.28084), // Convert to feet
      distance: (activity.distance * 0.000621371).toFixed(1),
      name: activity.name,
      date: new Date(activity.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      elevLow: activity.elev_low ? Math.round(activity.elev_low * 3.28084) : 0,
      elevHigh: activity.elev_high ? Math.round(activity.elev_high * 3.28084) : 0
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>{data.name}</p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>{data.date}</p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Elevation Gain:</strong> {data.elevation} ft
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Distance:</strong> {data.distance} mi
          </p>
          {data.elevHigh > 0 && (
            <p style={{ margin: '4px 0', fontSize: '12px' }}>
              <strong>Range:</strong> {data.elevLow} - {data.elevHigh} ft
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const maxElevation = Math.max(...elevationData.map(d => d.elevation));
  const avgElevation = elevationData.reduce((sum, d) => sum + d.elevation, 0) / elevationData.length;

  return (
    <ChartCard>
      <ChartHeader>
        <Heading size="md">Elevation Profile</Heading>
        <Text size="sm" color="secondary">
          Last 30 runs • Avg: {Math.round(avgElevation)} ft • Max: {maxElevation} ft
        </Text>
      </ChartHeader>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={elevationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Elevation (ft)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="elevation" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#elevationGradient)" 
            strokeWidth={2}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default ElevationProfileChart;