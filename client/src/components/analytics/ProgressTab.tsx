import React from 'react';
import { Activity } from '../../types';
import ElevationProfileChart from '../charts/ElevationProfileChart';
import CadenceAnalysisChart from '../charts/CadenceAnalysisChart';
import { Grid } from '../../styles/components';

interface ProgressTabProps {
  activities: Activity[];
}

const ProgressTab: React.FC<ProgressTabProps> = ({ activities }) => {
  return (
    <Grid columns={1} gap="xl">
      <ElevationProfileChart activities={activities} />
      <CadenceAnalysisChart activities={activities} />
    </Grid>
  );
};

export default ProgressTab;