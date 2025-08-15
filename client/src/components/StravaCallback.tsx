import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider, styled, keyframes, css } from 'styled-components';
import config from '../config';
import { lightTheme } from '../styles/theme';
import { 
  getRegistrationData, 
  clearRegistrationData, 
  hasPendingRegistration 
} from '../utils/registrationStorage';
import {
  Container,
  FormCard,
  Heading,
  Text,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  FlexContainer,
  Button,
  ProgressBar,
  ProgressText
} from '../styles/components';

// Animation keyframes
const runAnimation = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(10px); }
  100% { transform: translateX(0); }
`;

const pulseAnimation = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const RunnerIcon = styled.div`
  font-size: 48px;
  animation: ${runAnimation} 1s ease-in-out infinite;
  margin-bottom: 24px;
`;

const StageIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const StageDot = styled.div<{ active: boolean; completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => 
    props.completed ? '#4CAF50' : 
    props.active ? '#FC5200' : 
    '#E0E0E0'
  };
  transition: all 0.3s ease;
  ${props => props.active && css`
    animation: ${pulseAnimation} 1.5s ease-in-out infinite;
  `}
`;

const StageLine = styled.div<{ completed: boolean }>`
  width: 40px;
  height: 2px;
  background: ${props => props.completed ? '#4CAF50' : '#E0E0E0'};
  transition: all 0.3s ease;
`;

const FactCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 24px 0;
  animation: ${fadeIn} 0.5s ease-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FactText = styled.p`
  color: white;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
  text-align: center;
`;

const ActivityCounter = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #FC5200;
  margin: 16px 0;
  animation: ${fadeIn} 0.3s ease-out;
`;

const EnhancedProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
  margin: 20px 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #FC5200 0%, #FFA500 100%);
    transition: width 0.5s ease;
    border-radius: 4px;
  }
`;

const LoadingMessage = styled.h3`
  color: #333;
  font-size: 20px;
  font-weight: 600;
  margin: 12px 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

const CelebrationIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  animation: ${pulseAnimation} 1s ease-in-out;
`;

type CallbackState = 'processing' | 'success' | 'error' | 'no-registration';

type LoadingStage = 'connecting' | 'creating' | 'fetching' | 'finalizing';

const runningFacts = [
  "Did you know? Running can increase your lifespan by up to 3 years!",
  "Fun fact: The average runner takes about 1,500 steps per mile.",
  "Tip: Running releases endorphins, creating the famous 'runner's high'!",
  "Did you know? Your feet can produce up to a pint of sweat per day when running!",
  "Fact: Running strengthens your bones better than other aerobic activities.",
  "Pro tip: Running in the morning can boost your metabolism all day long!",
  "Did you know? The world record marathon pace is faster than most people can sprint!",
  "Fun fact: Running can improve your memory and cognitive function.",
  "Tip: Listening to music can improve running performance by up to 15%!",
  "Did you know? Humans are built for long-distance running - we're natural endurance athletes!",
  "Fact: Running can reduce your risk of heart disease by up to 45%.",
  "Pro tip: Running backwards burns 30% more calories than running forwards!",
];

const loadingMessages: Record<LoadingStage, string> = {
  'connecting': 'Connecting to Strava...',
  'creating': 'Creating your account...',
  'fetching': 'Fetching your running history...',
  'finalizing': 'Preparing your dashboard...'
};

const StravaCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('processing');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('connecting');
  const [currentFact, setCurrentFact] = useState<string>(runningFacts[0]);
  const [activityCount, setActivityCount] = useState<number>(0);
  const processingRef = useRef(false);
  const factIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const code = searchParams.get('code');
  const stravaError = searchParams.get('error');
  const stateParam = searchParams.get('state');

  useEffect(() => {
    // Prevent duplicate API calls in React StrictMode
    if (!processingRef.current) {
      processingRef.current = true;
      handleStravaCallback();
      
      // Start rotating fun facts
      factIntervalRef.current = setInterval(() => {
        setCurrentFact(prev => {
          const currentIndex = runningFacts.indexOf(prev);
          const nextIndex = (currentIndex + 1) % runningFacts.length;
          return runningFacts[nextIndex];
        });
      }, 4000); // Change fact every 4 seconds
    }
    
    return () => {
      if (factIntervalRef.current) {
        clearInterval(factIntervalRef.current);
      }
    };
  }, []);

  const handleStravaCallback = async () => {
    try {
      // Check for Strava errors first
      if (stravaError) {
        setState('error');
        setError('Authorization was denied. Please try again.');
        return;
      }

      // Check if we have a code
      if (!code) {
        setState('error');
        setError('No authorization code received from Strava.');
        return;
      }

      // Check if this is a registration callback
      if (stateParam !== 'registration') {
        // This might be a regular login Strava connection
        // Handle existing user connecting Strava
        await handleExistingUserStravaConnection();
        return;
      }

      // Check for pending registration data
      if (!hasPendingRegistration()) {
        setState('no-registration');
        return;
      }

      // Get registration data
      const registrationData = getRegistrationData();
      if (!registrationData) {
        setState('no-registration');
        return;
      }

      setProgress(10);
      setLoadingStage('connecting');
      
      // Simulate connection progress
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(20);
      
      setLoadingStage('creating');
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(30);

      // Call the backend to complete registration with Strava
      setLoadingStage('fetching');
      setProgress(40);
      
      const response = await axios.post(`${config.API_BASE_URL}/api/auth/register-with-strava`, {
        email: registrationData.email,
        password: registrationData.password,
        stravaCode: code
      });

      setProgress(85);
      setLoadingStage('finalizing');

      if (response.data.token) {
        // Store JWT token
        localStorage.setItem('jwt', response.data.token);
        
        // Clear registration data
        clearRegistrationData();
        
        setProgress(100);
        setState('success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('No token received from server');
      }

    } catch (err: any) {
      console.error('Strava callback error:', err);
      setState('error');
      
      if (err.response?.status === 409) {
        setError('An account with this email already exists. Please login instead.');
      } else if (err.response?.status === 400) {
        if (err.response.data?.message?.includes('Strava')) {
          setError('Strava authorization failed. The code may have expired. Please try again.');
        } else {
          setError(err.response.data?.message || 'Invalid registration data.');
        }
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to complete registration. Please try again.');
      }
      
      // Clear registration data on error
      clearRegistrationData();
    }
  };

  const handleExistingUserStravaConnection = async () => {
    try {
      // For existing users connecting Strava (not implemented yet)
      // This would use the existing exchange_token endpoint
      const token = localStorage.getItem('jwt');
      if (!token) {
        setState('error');
        setError('Please login first before connecting Strava.');
        return;
      }

      // Exchange token with existing endpoint
      await axios.post(
        `${config.API_BASE_URL}/api/strava/exchange_token`,
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setState('success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      setState('error');
      setError('Failed to connect Strava account. Please try again.');
    }
  };

  const getStageStatus = (stage: LoadingStage): { active: boolean; completed: boolean } => {
    const stages: LoadingStage[] = ['connecting', 'creating', 'fetching', 'finalizing'];
    const currentIndex = stages.indexOf(loadingStage);
    const stageIndex = stages.indexOf(stage);
    
    return {
      active: stage === loadingStage,
      completed: stageIndex < currentIndex
    };
  };

  const renderContent = () => {
    switch (state) {
      case 'processing':
        return (
          <>
            <RunnerIcon>🏃‍♂️</RunnerIcon>
            
            <StageIndicator>
              <StageDot {...getStageStatus('connecting')} />
              <StageLine completed={getStageStatus('creating').completed} />
              <StageDot {...getStageStatus('creating')} />
              <StageLine completed={getStageStatus('fetching').completed} />
              <StageDot {...getStageStatus('fetching')} />
              <StageLine completed={getStageStatus('finalizing').completed} />
              <StageDot {...getStageStatus('finalizing')} />
            </StageIndicator>
            
            <LoadingMessage>{loadingMessages[loadingStage]}</LoadingMessage>
            
            <EnhancedProgressBar progress={progress} />
            
            <Text size="sm" color="secondary" style={{ marginBottom: '8px' }}>
              {progress}% Complete
            </Text>
            
            {loadingStage === 'fetching' && activityCount > 0 && (
              <ActivityCounter>
                Found {activityCount} runs so far...
              </ActivityCounter>
            )}
            
            <FactCard key={currentFact}>
              <FactText>{currentFact}</FactText>
            </FactCard>
            
            {loadingStage === 'fetching' && (
              <Text size="xs" color="secondary" style={{ marginTop: '12px' }}>
                This may take a moment if you have many activities
              </Text>
            )}
          </>
        );

      case 'success':
        return (
          <>
            <CelebrationIcon>
              🎉
            </CelebrationIcon>
            <Heading size="lg" style={{ color: '#4CAF50', marginBottom: '16px' }}>
              Welcome to DoubleDash!
            </Heading>
            <Text size="md" weight="medium" style={{ marginBottom: '12px' }}>
              Your account is ready!
            </Text>
            {activityCount > 0 && (
              <ActivityCounter style={{ color: '#4CAF50', fontSize: '20px', marginBottom: '16px' }}>
                We found {activityCount} runs in your Strava history!
              </ActivityCounter>
            )}
            <Text size="sm" color="secondary" style={{ marginTop: '16px' }}>
              Taking you to your personalized dashboard...
            </Text>
            <EnhancedProgressBar progress={100} />
          </>
        );

      case 'error':
        return (
          <>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>
              😔
            </div>
            <Heading size="md" style={{ color: '#f44336' }}>Oops! Something went wrong</Heading>
            <ErrorMessage style={{ 
              marginTop: '16px', 
              padding: '12px 20px',
              background: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: '8px',
              color: '#c62828'
            }}>
              {error}
            </ErrorMessage>
            <Text size="sm" color="secondary" style={{ marginTop: '16px', marginBottom: '24px' }}>
              Don't worry! This happens sometimes. Please try again.
            </Text>
            <FlexContainer direction="column" gap="md">
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  style={{ 
                    width: '240px',
                    background: '#FC5200',
                    border: 'none',
                    padding: '12px 24px',
                    fontWeight: '600'
                  }}
                >
                  Try Registration Again
                </Button>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  style={{ 
                    width: '240px',
                    background: 'transparent',
                    border: '2px solid #FC5200',
                    color: '#FC5200',
                    padding: '12px 24px',
                    fontWeight: '600'
                  }}
                >
                  Go to Login Instead
                </Button>
              </Link>
            </FlexContainer>
          </>
        );

      case 'no-registration':
        return (
          <>
            <Heading size="md">No Registration Data Found</Heading>
            <Text size="sm" color="secondary" style={{ marginTop: '16px' }}>
              Your registration session has expired or was not found.
            </Text>
            <Text size="sm" style={{ marginTop: '8px' }}>
              Please start the registration process again.
            </Text>
            <FlexContainer direction="column" gap="md" style={{ marginTop: '32px' }}>
              <Link to="/register">
                <Button variant="primary" size="lg" style={{ width: '200px' }}>
                  Register
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" style={{ width: '200px' }}>
                  Login
                </Button>
              </Link>
            </FlexContainer>
          </>
        );
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <FormCard style={{ 
          marginTop: '100px', 
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {renderContent()}
        </FormCard>
      </Container>
    </ThemeProvider>
  );
};

export default StravaCallback;