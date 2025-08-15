import React from 'react';
import { Activity } from '../../types';
import { Grid } from '../../styles/components';

interface PatternsTabProps {
  activities: Activity[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({ activities }) => {
  // Placeholder for now - will add pattern analysis charts
  return (
    <Grid columns={1} gap="xl">
      <div>Patterns analysis coming soon...</div>
    </Grid>
  );
};

export default PatternsTab;