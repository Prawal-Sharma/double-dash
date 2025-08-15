import React from 'react';
import styled from 'styled-components';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from '../../types';
import { Card, Heading, Text, Badge } from '../../styles/components';

const ChartCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const ChartHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PRList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PRCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
`;

interface PRTimelineChartProps {
  activities: Activity[];
}

const PRTimelineChart: React.FC<PRTimelineChartProps> = ({ activities }) => {
  // Find activities with PRs
  const prActivities = activities
    .filter(a => a.pr_count > 0)
    .map((activity) => {
      const date = new Date(activity.start_date);
      return {
        date: date.getTime(),
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        prCount: activity.pr_count,
        name: activity.name,
        distance: (activity.distance * 0.000621371).toFixed(1),
        pace: activity.average_speed > 0 
          ? `${Math.floor(1609.34 / activity.average_speed / 60)}:${Math.floor((1609.34 / activity.average_speed) % 60).toString().padStart(2, '0')}`
          : '--',
        achievements: activity.achievement_count
      };
    })
    .slice(-20); // Last 20 PRs

  const totalPRs = activities.reduce((sum, a) => sum + a.pr_count, 0);
  const recentPRs = activities
    .filter(a => new Date(a.start_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, a) => sum + a.pr_count, 0);

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
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>{data.dateStr}</p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>🏆 PRs:</strong> {data.prCount}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Distance:</strong> {data.distance} mi
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            <strong>Pace:</strong> {data.pace}/mi
          </p>
          {data.achievements > 0 && (
            <p style={{ margin: '4px 0', fontSize: '12px' }}>
              <strong>🎯 Achievements:</strong> {data.achievements}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get recent best performances
  const recentBests = activities
    .slice(-90) // Last 90 days worth
    .sort((a, b) => b.average_speed - a.average_speed)
    .slice(0, 3);

  return (
    <ChartCard>
      <ChartHeader>
        <Heading size="md">Personal Records Timeline</Heading>
        <Text size="sm" color="secondary">
          Total PRs: {totalPRs} • Last 30 days: {recentPRs}
        </Text>
      </ChartHeader>
      
      {prActivities.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date"
                domain={['dataMin', 'dataMax']}
                type="number"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                dataKey="prCount"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                label={{ value: 'PR Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="PRs" data={prActivities} fill="#f59e0b">
                {prActivities.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.prCount > 2 ? '#ef4444' : entry.prCount > 1 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          <PRList>
            {recentBests.map((activity, index) => (
              <PRCard key={activity.activityId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Badge variant={index === 0 ? 'primary' : index === 1 ? 'warning' : 'success'}>
                    {index === 0 ? '🥇 Fastest' : index === 1 ? '🥈 2nd' : '🥉 3rd'}
                  </Badge>
                  <Text size="xs" color="secondary">
                    {new Date(activity.start_date).toLocaleDateString()}
                  </Text>
                </div>
                <Text size="sm" weight="semiBold" style={{ marginBottom: '4px' }}>
                  {activity.name}
                </Text>
                <Text size="xs" color="secondary">
                  {(activity.distance * 0.000621371).toFixed(1)} mi • 
                  {activity.average_speed > 0 
                    ? ` ${Math.floor(1609.34 / activity.average_speed / 60)}:${Math.floor((1609.34 / activity.average_speed) % 60).toString().padStart(2, '0')}/mi`
                    : ' --'
                  }
                </Text>
              </PRCard>
            ))}
          </PRList>
        </>
      ) : (
        <Text color="secondary" style={{ textAlign: 'center', padding: '40px 0' }}>
          No personal records yet. Keep running to set new PRs!
        </Text>
      )}
    </ChartCard>
  );
};

export default PRTimelineChart;