import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from 'styled-components';
import config from '../config';
import { lightTheme } from '../styles/theme';
import {
  Container,
  Card,
  FormGroup,
  Label,
  Input,
  Select,
  Heading,
  Text,
  FlexContainer,
  Grid,
  LoadingSpinner,
  ErrorMessage,
  Badge
} from '../styles/components';
import styled from 'styled-components';

const ActivityCard = styled(Card)`
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const ActivityHeader = styled(FlexContainer)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ActivityStats = styled(Grid)`
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const StatItem = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const SearchContainer = styled(FlexContainer)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

interface Activity {
  activityId: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration'>('date');
  const [filterType, setFilterType] = useState<'all' | 'Run' | 'Ride'>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterAndSortActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, searchTerm, sortBy, filterType]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('jwt');
      if (!token) {
        setError('Please log in to view your activities');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${config.API_BASE_URL}/api/strava/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActivities(response.data.activities || []);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return b.moving_time - a.moving_time;
        default:
          return 0;
      }
    });

    setFilteredActivities(filtered);
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(2)} mi`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatSpeed = (metersPerSecond: number): string => {
    const mph = metersPerSecond * 2.237;
    return `${mph.toFixed(1)} mph`;
  };

  const formatPace = (metersPerSecond: number): string => {
    if (metersPerSecond === 0) return '--';
    const secondsPerMile = 1609.34 / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <ThemeProvider theme={lightTheme}>
        <Container>
          <FlexContainer direction="column" align="center" style={{ marginTop: '100px' }}>
            <LoadingSpinner />
            <Text style={{ marginTop: '16px' }}>Loading your activities...</Text>
          </FlexContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={lightTheme}>
        <Container>
          <ErrorMessage style={{ marginTop: '50px', textAlign: 'center' }}>
            ⚠️ {error}
          </ErrorMessage>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <Heading size="lg" style={{ margin: '32px 0' }}>Your Activities</Heading>
        
        {/* Search and Filter Controls */}
        <SearchContainer direction="row" wrap gap="md">
          <FormGroup style={{ minWidth: '200px', marginBottom: 0 }}>
            <Label>Search Activities</Label>
            <Input
              type="text"
              placeholder="Search by activity name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>
          
          <FormGroup style={{ minWidth: '150px', marginBottom: 0 }}>
            <Label>Activity Type</Label>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'Run' | 'Ride')}
            >
              <option value="all">All Types</option>
              <option value="Run">Running</option>
              <option value="Ride">Cycling</option>
            </Select>
          </FormGroup>
          
          <FormGroup style={{ minWidth: '150px', marginBottom: 0 }}>
            <Label>Sort By</Label>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'distance' | 'duration')}
            >
              <option value="date">Date</option>
              <option value="distance">Distance</option>
              <option value="duration">Duration</option>
            </Select>
          </FormGroup>
        </SearchContainer>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <Card style={{ textAlign: 'center', marginTop: '32px' }}>
            <Text>No activities found matching your criteria.</Text>
          </Card>
        ) : (
          <Grid columns={1} gap="lg" style={{ marginTop: '32px' }}>
            {filteredActivities.map((activity) => (
              <ActivityCard key={activity.activityId}>
                <ActivityHeader justify="space-between" align="center">
                  <div>
                    <Heading size="sm" style={{ margin: 0, marginBottom: '4px' }}>
                      {activity.name}
                    </Heading>
                    <FlexContainer gap="sm" align="center">
                      <Badge variant={activity.type === 'Run' ? 'primary' : 'success'}>
                        {activity.type}
                      </Badge>
                      <Text size="sm" color="secondary">
                        {formatDate(activity.start_date)}
                      </Text>
                    </FlexContainer>
                  </div>
                </ActivityHeader>
                
                <ActivityStats>
                  <StatItem>
                    <StatValue>{formatDistance(activity.distance)}</StatValue>
                    <StatLabel>Distance</StatLabel>
                  </StatItem>
                  
                  <StatItem>
                    <StatValue>{formatDuration(activity.moving_time)}</StatValue>
                    <StatLabel>Duration</StatLabel>
                  </StatItem>
                  
                  <StatItem>
                    <StatValue>{Math.round(activity.total_elevation_gain * 3.28084)} ft</StatValue>
                    <StatLabel>Elevation</StatLabel>
                  </StatItem>
                  
                  <StatItem>
                    <StatValue>
                      {activity.type === 'Run' 
                        ? formatPace(activity.average_speed)
                        : formatSpeed(activity.average_speed)
                      }
                    </StatValue>
                    <StatLabel>
                      {activity.type === 'Run' ? 'Avg Pace' : 'Avg Speed'}
                    </StatLabel>
                  </StatItem>
                  
                  {activity.average_heartrate && (
                    <StatItem>
                      <StatValue>{Math.round(activity.average_heartrate)} bpm</StatValue>
                      <StatLabel>Avg HR</StatLabel>
                    </StatItem>
                  )}
                </ActivityStats>
              </ActivityCard>
            ))}
          </Grid>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default Activities;