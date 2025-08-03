import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import {
  Container,
  Card,
  Heading,
  Text,
  Button,
  FlexContainer,
  ErrorMessage
} from '../styles/components';
import styled from 'styled-components';

const FailureCard = styled(Card)`
  max-width: 500px;
  margin: 50px auto;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const IconContainer = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActionButtons = styled(FlexContainer)`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const StravaAuthFailure: React.FC = () => {
  const navigate = useNavigate();

  const handleRetryAuth = () => {
    // Get Strava client ID from environment
    const clientID = process.env.REACT_APP_STRAVA_CLIENT_ID;
    
    if (!clientID) {
      console.error('REACT_APP_STRAVA_CLIENT_ID environment variable is not set');
      return;
    }
    
    const redirectURI = `${window.location.origin}/exchange_token`;
    const scope = 'read,activity:read';
    const stravaAuthURL = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;
    
    window.location.href = stravaAuthURL;
  };

  const handleContinueWithoutStrava = () => {
    // Clear any existing tokens and redirect to dashboard
    localStorage.removeItem('strava_access_token');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    // Clear all tokens and redirect to home
    localStorage.removeItem('jwt');
    localStorage.removeItem('strava_access_token');
    navigate('/');
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <FailureCard>
          <IconContainer>⚠️</IconContainer>
          
          <Heading size="md">Strava Authorization Failed</Heading>
          
          <Text style={{ marginBottom: '24px' }}>
            We encountered an issue connecting to your Strava account. This could happen for several reasons:
          </Text>
          
          <FlexContainer direction="column" gap="sm" style={{ textAlign: 'left', marginBottom: '24px' }}>
            <Text size="sm">• You declined the authorization request</Text>
            <Text size="sm">• The authorization process was interrupted</Text>
            <Text size="sm">• There was a temporary network issue</Text>
            <Text size="sm">• Your Strava account may have restrictions</Text>
          </FlexContainer>
          
          <ErrorMessage style={{ marginBottom: '24px' }}>
            Without Strava connection, you won't be able to view your activities and analytics.
          </ErrorMessage>
          
          <ActionButtons direction="column" gap="md">
            <Button 
              onClick={handleRetryAuth}
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
            >
              🔄 Try Connecting Again
            </Button>
            
            <Button 
              onClick={handleContinueWithoutStrava}
              variant="secondary"
              size="md"
              style={{ width: '100%' }}
            >
              Continue Without Strava
            </Button>
            
            <FlexContainer justify="center" gap="md">
              <Button 
                onClick={handleLogout}
                variant="secondary"
                size="sm"
              >
                Logout
              </Button>
              
              <Link to="/">
                <Button variant="secondary" size="sm">
                  Go Home
                </Button>
              </Link>
            </FlexContainer>
          </ActionButtons>
          
          <Text size="xs" color="secondary" style={{ marginTop: '24px' }}>
            If you continue to experience issues, please check your Strava account settings or contact support.
          </Text>
        </FailureCard>
      </Container>
    </ThemeProvider>
  );
};

export default StravaAuthFailure;