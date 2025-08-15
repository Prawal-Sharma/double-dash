import React from 'react';
import styled from 'styled-components';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from '../../types';
import { Card, Heading, Text } from '../../styles/components';
import { startOfWeek, format } from 'date-fns';

const ChartCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const ChartHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LoadIndicator = styled.div<{ level: 'optimal' | 'high' | 'low' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-left: ${({ theme }) => theme.spacing.md};
  background: ${({ level }) => {
    switch(level) {
      case 'optimal': return '#10b98120';
      case 'high': return '#ef444420';
      case 'low': return '#f59e0b20';
    }
  }};
  color: ${({ level }) => {
    switch(level) {
      case 'optimal': return '#10b981';
      case 'high': return '#ef4444';
      case 'low': return '#f59e0b';
    }
  }};
`;

interface TrainingLoadChartProps {
  activities: Activity[];
}

const TrainingLoadChart: React.FC<TrainingLoadChartProps> = ({ activities }) => {
  // Calculate weekly training load
  const weeklyData = new Map<string, { 
    miles: number, 
    hours: number, 
    runs: number, 
    elevation: number,
    intensity: number 
  }>();

  activities.forEach(activity => {
    const weekStart = startOfWeek(new Date(activity.start_date), { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'MMM dd');
    
    const existing = weeklyData.get(weekKey) || { miles: 0, hours: 0, runs: 0, elevation: 0, intensity: 0 };
    
    existing.miles += activity.distance * 0.000621371;
    existing.hours += activity.moving_time / 3600;
    existing.runs += 1;
    existing.elevation += activity.total_elevation_gain * 3.28084;
    
    // Calculate intensity based on pace and heart rate
    const paceIntensity = activity.average_speed > 0 ? activity.average_speed / 4.5 : 0; // Normalize to ~1.0
    const hrIntensity = activity.average_heartrate ? activity.average_heartrate / 150 : paceIntensity;
    existing.intensity += hrIntensity;
    
    weeklyData.set(weekKey, existing);
  });

  // Convert to array and calculate load changes
  const chartData = Array.from(weeklyData.entries())
    .slice(-12) // Last 12 weeks
    .map(([week, data], index, array) => {
      const prevWeek = index > 0 ? array[index - 1][1] : null;
      const weekChange = prevWeek ? ((data.miles - prevWeek.miles) / prevWeek.miles * 100) : 0;
      const avgIntensity = data.runs > 0 ? data.intensity / data.runs : 0;
      
      return {
        week,
        miles: Math.round(data.miles),
        hours: data.hours.toFixed(1),
        runs: data.runs,
        elevation: Math.round(data.elevation),
        weekChange: weekChange.toFixed(0),
        intensity: avgIntensity.toFixed(2),
        load: Math.round(data.miles * avgIntensity * 10) // Training load score
      };
    });

  const currentWeekMiles = chartData.length > 0 ? chartData[chartData.length - 1].miles : 0;
  const prevWeekMiles = chartData.length > 1 ? chartData[chartData.length - 2].miles : 0;
  const weekOverWeekChange = prevWeekMiles > 0 ? ((currentWeekMiles - prevWeekMiles) / prevWeekMiles * 100) : 0;
  
  // Determine load level
  let loadLevel: 'optimal' | 'high' | 'low' = 'optimal';
  if (weekOverWeekChange > 15) loadLevel = 'high';
  else if (weekOverWeekChange < -15) loadLevel = 'low';

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
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>Week of {data.week}</p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Miles:</strong> {data.miles} mi ({data.weekChange > 0 ? '+' : ''}{data.weekChange}%)
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Runs:</strong> {data.runs}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Time:</strong> {data.hours} hours
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Elevation:</strong> {data.elevation} ft
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Training Load:</strong> {data.load}
          </p>
        </div>
      );
    }
    return null;
  };

  const avgMiles = chartData.reduce((sum, d) => sum + d.miles, 0) / chartData.length;

  return (
    <ChartCard>
      <ChartHeader>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Heading size="md">Training Load Balance</Heading>
          <LoadIndicator level={loadLevel}>
            {loadLevel === 'optimal' && '✅ Optimal Load'}
            {loadLevel === 'high' && '⚠️ High Load - Risk of Overtraining'}
            {loadLevel === 'low' && '📉 Reduced Load'}
          </LoadIndicator>
        </div>
        <Text size="sm" color="secondary" style={{ marginTop: '8px' }}>
          Weekly volume with 10% rule guidance • Current: {currentWeekMiles} mi ({weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange.toFixed(0)}% WoW)
        </Text>
      </ChartHeader>
      
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            yAxisId="miles"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Miles', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
          />
          <YAxis 
            yAxisId="load"
            orientation="right"
            fontSize={12}
            tick={{ fill: '#8b5cf6' }}
            label={{ value: 'Training Load', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#8b5cf6' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine 
            yAxisId="miles"
            y={avgMiles} 
            stroke="#6b7280" 
            strokeDasharray="3 3"
            label={{ value: `Avg: ${Math.round(avgMiles)} mi`, position: "left", style: { fontSize: 11, fill: '#6b7280' } }}
          />
          <Bar 
            yAxisId="miles"
            dataKey="miles" 
            fill="#10b981" 
            name="Weekly Miles"
            radius={[4, 4, 0, 0]}
          />
          <Area
            yAxisId="load"
            type="monotone"
            dataKey="load"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#loadGradient)"
            strokeWidth={2}
            name="Training Load"
          />
          <Line
            yAxisId="miles"
            type="monotone"
            dataKey="runs"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3 }}
            name="Run Count"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: loadLevel === 'high' ? '#fef2f2' : '#f0f9ff',
        borderRadius: '8px',
        border: `1px solid ${loadLevel === 'high' ? '#fecaca' : '#bfdbfe'}`
      }}>
        <Text size="sm">
          <strong>💡 Training Tip:</strong> {
            loadLevel === 'high' 
              ? "Your mileage increased significantly. Consider an easy week to prevent injury and allow recovery."
              : loadLevel === 'low'
              ? "Your training volume decreased. If unintentional, try to maintain consistency."
              : "Great job maintaining the 10% rule! Your training load is well-balanced."
          }
        </Text>
      </div>
    </ChartCard>
  );
};

export default TrainingLoadChart;