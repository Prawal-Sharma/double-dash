import React from 'react';
import styled from 'styled-components';
import { Activity } from '../../types';
import TrainingLoadChart from '../charts/TrainingLoadChart';
import PRTimelineChart from '../charts/PRTimelineChart';
import { Grid } from '../../styles/components';

interface PerformanceTabProps {
  activities: Activity[];
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ activities }) => {
  return (
    <Grid columns={1} gap="xl">
      <TrainingLoadChart activities={activities} />
      <PRTimelineChart activities={activities} />
    </Grid>
  );
};

export default PerformanceTab;