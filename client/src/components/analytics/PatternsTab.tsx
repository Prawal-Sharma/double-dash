import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Activity } from '../../types';
import { 
  Card, 
  Grid, 
  Heading, 
  Text 
} from '../../styles/components';
import { 
  BarChart, 
  Bar, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const ChartCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ChartTitle = styled(Heading)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ChartSubtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

interface PatternsTabProps {
  activities: Activity[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({ activities }) => {
  // Time of Day Analysis
  const timeOfDayData = useMemo(() => {
    const distribution = {
      'Early Morning (5-8am)': 0,
      'Morning (8-12pm)': 0,
      'Afternoon (12-5pm)': 0,
      'Evening (5-8pm)': 0,
      'Night (8pm+)': 0
    };
    
    activities.forEach(activity => {
      const hour = new Date(activity.start_date_local || activity.start_date).getHours();
      
      if (hour >= 5 && hour < 8) distribution['Early Morning (5-8am)']++;
      else if (hour >= 8 && hour < 12) distribution['Morning (8-12pm)']++;
      else if (hour >= 12 && hour < 17) distribution['Afternoon (12-5pm)']++;
      else if (hour >= 17 && hour < 20) distribution['Evening (5-8pm)']++;
      else distribution['Night (8pm+)']++;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.split(' ')[0] + ' ' + name.split(' ')[1],
      value,
      fullName: name
    }));
  }, [activities]);
  
  // Weekly Pattern Analysis
  const weeklyPatternData = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution: Record<string, number> = dayNames.reduce((acc, day) => ({ ...acc, [day]: 0 }), {} as Record<string, number>);
    
    activities.forEach(activity => {
      const day = new Date(activity.start_date).getDay();
      distribution[dayNames[day]]++;
    });
    
    return dayNames.map(day => ({
      day: day.substring(0, 3),
      runs: distribution[day],
      fullDay: day
    }));
  }, [activities]);
  
  // Pace Distribution
  const paceDistribution = useMemo(() => {
    const zones = {
      'Easy (> 11 min/mi)': 0,
      'Moderate (9-11 min/mi)': 0,
      'Tempo (7-9 min/mi)': 0,
      'Fast (< 7 min/mi)': 0
    };
    
    activities.forEach(activity => {
      if (activity.average_speed > 0) {
        const paceMinPerMile = 1609.34 / activity.average_speed / 60;
        
        if (paceMinPerMile > 11) zones['Easy (> 11 min/mi)']++;
        else if (paceMinPerMile >= 9) zones['Moderate (9-11 min/mi)']++;
        else if (paceMinPerMile >= 7) zones['Tempo (7-9 min/mi)']++;
        else zones['Fast (< 7 min/mi)']++;
      }
    });
    
    return Object.entries(zones)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.split(' ')[0],
        value,
        fullName: name
      }));
  }, [activities]);
  
  // Monthly Pattern
  const monthlyPatternData = useMemo(() => {
    const monthlyRuns = new Array(31).fill(0);
    
    activities.forEach(activity => {
      const day = new Date(activity.start_date).getDate() - 1; // 0-indexed
      if (day >= 0 && day < 31) {
        monthlyRuns[day]++;
      }
    });
    
    return monthlyRuns.map((runs, index) => ({
      day: index + 1,
      runs
    }));
  }, [activities]);
  
  const COLORS = ['#fc4c02', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];
  
  // Find most active time and day
  const mostActiveTime = timeOfDayData.reduce((max, curr) => 
    curr.value > max.value ? curr : max, timeOfDayData[0]);
  const mostActiveDay = weeklyPatternData.reduce((max, curr) => 
    curr.runs > max.runs ? curr : max, weeklyPatternData[0]);
  
  return (
    <Grid columns={1} gap="xl">
      {/* Time of Day Pattern */}
      <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg">
        <ChartCard>
          <ChartTitle size="md">Time of Day Preference</ChartTitle>
          <ChartSubtitle>When you prefer to run</ChartSubtitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeOfDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: any) => [`${value} runs`, 'Count']}
                labelFormatter={(label: any) => {
                  const item = timeOfDayData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="value" fill="#fc4c02" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Text size="sm" style={{ marginTop: '16px', textAlign: 'center' }}>
            Most active: <strong>{mostActiveTime?.fullName}</strong>
          </Text>
        </ChartCard>
        
        {/* Weekly Pattern */}
        <ChartCard>
          <ChartTitle size="md">Weekly Activity Pattern</ChartTitle>
          <ChartSubtitle>Your most active days</ChartSubtitle>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={weeklyPatternData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="day" fontSize={12} />
              <PolarRadiusAxis fontSize={10} />
              <Radar name="Runs" dataKey="runs" stroke="#fc4c02" fill="#fc4c02" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <Text size="sm" style={{ marginTop: '16px', textAlign: 'center' }}>
            Most active: <strong>{mostActiveDay?.fullDay}</strong> ({mostActiveDay?.runs} runs)
          </Text>
        </ChartCard>
      </Grid>
      
      {/* Pace Distribution and Monthly Pattern */}
      <Grid columns={{ xs: 1, sm: 1, md: 2 }} gap="lg">
        <ChartCard>
          <ChartTitle size="md">Pace Zone Distribution</ChartTitle>
          <ChartSubtitle>Time spent in different training zones</ChartSubtitle>
          {paceDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      const item = paceDistribution.find(d => d.name === name);
                      return [`${value} runs`, item?.fullName || name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                {paceDistribution.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: COLORS[index % COLORS.length],
                      borderRadius: '2px'
                    }} />
                    <Text size="sm">{entry.fullName}</Text>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Text size="sm" color="secondary" style={{ textAlign: 'center', padding: '40px 0' }}>
              No pace data available
            </Text>
          )}
        </ChartCard>
        
        {/* Monthly Pattern */}
        <ChartCard>
          <ChartTitle size="md">Monthly Pattern</ChartTitle>
          <ChartSubtitle>Activity by day of month</ChartSubtitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyPatternData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                fontSize={10}
                interval={2}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="runs" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
    </Grid>
  );
};

export default PatternsTab;