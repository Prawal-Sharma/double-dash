import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useActivities } from '../contexts/ActivitiesContext';
import { Activity } from '../types';
import EnhancedActivityCard from './EnhancedActivityCard';
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
  LoadingSpinner,
  ErrorMessage,
  Badge,
  Button
} from '../styles/components';

const SearchContainer = styled(FlexContainer)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Activities: React.FC = () => {
  const { state: activitiesState, fetchActivities } = useActivities();
  const { activities, loading, error } = activitiesState;
  
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate average pace for comparison
  const averagePace = useMemo(() => {
    if (activities.length === 0) return 0;
    const totalSpeed = activities.reduce((sum, a) => sum + a.average_speed, 0);
    return totalSpeed / activities.length;
  }, [activities]);
  
  // Find personal bests
  const personalBests = useMemo(() => {
    const bests = {
      longestRun: '',
      fastestPace: '',
      mostElevation: ''
    };
    
    if (activities.length === 0) return bests;
    
    const longest = activities.reduce((max, a) => a.distance > max.distance ? a : max);
    const fastest = activities.reduce((max, a) => a.average_speed > max.average_speed ? a : max);
    const mostElev = activities.reduce((max, a) => a.total_elevation_gain > max.total_elevation_gain ? a : max);
    
    bests.longestRun = longest.activityId;
    bests.fastestPace = fastest.activityId;
    bests.mostElevation = mostElev.activityId;
    
    return bests;
  }, [activities]);

  useEffect(() => {
    // Fetch activities using context on mount
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    filterAndSortActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, searchTerm, sortBy]);

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // All activities are already filtered to running only on backend

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


  if (loading) {
    return (
      <Container>
        <FlexContainer direction="column" align="center" style={{ marginTop: '100px' }}>
          <LoadingSpinner />
          <Text style={{ marginTop: '16px' }}>Loading your running activities...</Text>
        </FlexContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage style={{ marginTop: '50px', textAlign: 'center' }}>
          ⚠️ {error}
        </ErrorMessage>
      </Container>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smart pagination range function
  const getPaginationRange = (): (number | string)[] => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    // Generate the range of pages to display
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    // Add dots where there are gaps
    range.forEach((i) => {
      if (l && typeof i === 'number' && typeof l === 'number') {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i as number;
    });

    return rangeWithDots;
  };

  return (
    <Container>
      <FlexContainer direction="row" justify="space-between" align="center" style={{ margin: '32px 0' }}>
        <div>
          <Heading size="lg">Your Running Activities</Heading>
          <Text style={{ color: '#6b7280', marginTop: '8px' }}>Track and analyze your running performance</Text>
        </div>
        <Badge style={{ background: '#fc4c02', color: 'white', padding: '8px 16px', fontSize: '14px' }}>
          🏃 Running Only Platform
        </Badge>
      </FlexContainer>
        
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
        <Text style={{ marginBottom: '16px', color: '#6b7280' }}>
          Showing {startIndex + 1} - {Math.min(endIndex, filteredActivities.length)} of {filteredActivities.length} runs
        </Text>
        
        {currentActivities.length === 0 ? (
          <Card style={{ textAlign: 'center', marginTop: '32px' }}>
            <Text>No activities found matching your criteria.</Text>
          </Card>
        ) : (
          <div style={{ marginTop: '32px' }}>
            {currentActivities.map((activity) => {
              const isPersonalBest = 
                activity.activityId === personalBests.longestRun ||
                activity.activityId === personalBests.fastestPace ||
                activity.activityId === personalBests.mostElevation;
              
              return (
                <EnhancedActivityCard
                  key={activity.activityId}
                  activity={activity}
                  averagePace={averagePace}
                  isPersonalBest={isPersonalBest}
                />
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card style={{ marginTop: '40px', marginBottom: '40px', padding: '20px' }}>
            <FlexContainer direction="column" align="center" gap="md">
              {/* Page info */}
              <Text size="sm" color="secondary">
                Page {currentPage} of {totalPages} • {filteredActivities.length} total runs
              </Text>
              
              {/* Pagination buttons */}
              <FlexContainer direction="row" justify="center" align="center" gap="xs">
                {/* First button */}
                {currentPage > 2 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePageChange(1)}
                    style={{ minWidth: '60px' }}
                  >
                    First
                  </Button>
                )}
                
                {/* Previous button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ minWidth: '80px' }}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <FlexContainer direction="row" gap="xs" align="center">
                  {getPaginationRange().map((item, index) => {
                    if (item === '...') {
                      return (
                        <Text
                          key={`dots-${index}`}
                          style={{
                            padding: '8px 4px',
                            color: '#9ca3af',
                            userSelect: 'none'
                          }}
                        >
                          •••
                        </Text>
                      );
                    }
                    
                    const pageNum = item as number;
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={pageNum === currentPage ? 'primary' : 'secondary'}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          minWidth: '40px',
                          fontWeight: pageNum === currentPage ? 'bold' : 'normal'
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </FlexContainer>
                
                {/* Next button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: '80px' }}
                >
                  Next
                </Button>
                
                {/* Last button */}
                {currentPage < totalPages - 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePageChange(totalPages)}
                    style={{ minWidth: '60px' }}
                  >
                    Last
                  </Button>
                )}
              </FlexContainer>
            </FlexContainer>
          </Card>
        )}
      </Container>
  );
};

export default Activities;