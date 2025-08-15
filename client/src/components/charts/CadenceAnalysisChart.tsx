import React from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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

const InsightBox = styled.div`
  background: ${({ theme }) => theme.colors.primary}10;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

interface CadenceAnalysisChartProps {
  activities: Activity[];
}

const CadenceAnalysisChart: React.FC<CadenceAnalysisChartProps> = ({ activities }) => {
  // Filter activities with cadence data and process
  const cadenceData = activities
    .filter(a => a.average_cadence && a.average_cadence > 0)
    .slice(0, 20)
    .reverse()
    .map((activity) => ({
      date: new Date(activity.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cadence: Math.round((activity.average_cadence || 0) * 2), // Convert to steps per minute
      pace: activity.average_speed > 0 ? (1609.34 / activity.average_speed / 60) : 0, // Minutes per mile
      name: activity.name,
      distance: (activity.distance * 0.000621371).toFixed(1)
    }));

  if (cadenceData.length === 0) {
    return (
      <ChartCard>
        <ChartHeader>
          <Heading size="md">Cadence Analysis</Heading>
          <Text size="sm" color="secondary">
            No cadence data available. Cadence tracking requires a compatible device.
          </Text>
        </ChartHeader>
      </ChartCard>
    );
  }

  const avgCadence = Math.round(cadenceData.reduce((sum, d) => sum + d.cadence, 0) / cadenceData.length);
  const optimalCadence = 180; // Generally recommended cadence
  const trend = cadenceData.length > 1 
    ? cadenceData[cadenceData.length - 1].cadence - cadenceData[0].cadence
    : 0;

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
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Cadence:</strong> {data.cadence} spm
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Pace:</strong> {data.pace.toFixed(1)} min/mi
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Distance:</strong> {data.distance} mi
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard>
      <ChartHeader>
        <Heading size="md">Cadence Analysis</Heading>
        <Text size="sm" color="secondary">
          Steps per minute over recent runs • Average: {avgCadence} spm
        </Text>
      </ChartHeader>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={cadenceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            domain={[150, 200]}
            label={{ value: 'Cadence (spm)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine 
            y={optimalCadence} 
            stroke="#f59e0b" 
            strokeDasharray="5 5"
            label={{ value: "Optimal (180)", position: "right", style: { fontSize: 12, fill: '#f59e0b' } }}
          />
          <ReferenceLine 
            y={avgCadence} 
            stroke="#6b7280" 
            strokeDasharray="3 3"
            label={{ value: `Your Avg (${avgCadence})`, position: "right", style: { fontSize: 12, fill: '#6b7280' } }}
          />
          <Line 
            type="monotone" 
            dataKey="cadence" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Cadence"
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <InsightBox>
        <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
          💡 Cadence Insight
        </Text>
        <Text size="sm">
          {avgCadence < 170 
            ? "Your cadence is below optimal. Try shorter, quicker steps to reduce impact and improve efficiency."
            : avgCadence < 180
            ? "Good cadence! Aim for 180 spm to optimize your running efficiency."
            : "Excellent cadence! You're in the optimal range for efficient running."
          }
          {trend > 5 && " Your cadence is improving! 📈"}
          {trend < -5 && " Your cadence has been decreasing. Focus on maintaining quick turnover. 📉"}
        </Text>
      </InsightBox>
    </ChartCard>
  );
};

export default CadenceAnalysisChart;