import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import config from '../config';
import { AuthResponse, ApiError } from '../types';
import { lightTheme } from '../styles/theme';
import {
  Container,
  FormCard,
  FormGroup,
  Label,
  Input,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
  HelpText,
  Heading,
  StatusIndicator,
  LoadingSpinner,
  Text,
  ProgressBar,
  ProgressText,
  FlexContainer
} from '../styles/components';

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'registering' | 'strava-auth'>('form');
  const navigate = useNavigate();

  // Get clientID from environment variable
  const clientID = process.env.REACT_APP_STRAVA_CLIENT_ID;
  
  if (!clientID) {
    console.error('REACT_APP_STRAVA_CLIENT_ID environment variable is not set');
  }
  
  const redirectURI = `${config.FRONTEND_URL}/exchange_token`;
  const scope = 'read,activity:read';
  const stravaAuthURL = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    setRegistrationStep('registering');

    try {
      // Step 1: Register the user
      const registerResponse = await axios.post<AuthResponse>(`${config.API_BASE_URL}/api/auth/register`, { email, password });

      if (registerResponse.data.message === 'User registered successfully') {
        setSuccess('Account created successfully!');
        
        // Step 2: Automatically login to get JWT
        const loginResponse = await axios.post<AuthResponse>(`${config.API_BASE_URL}/api/auth/login`, { email, password });
        const { token } = loginResponse.data;
        localStorage.setItem('jwt', token);

        // Step 3: Prepare for Strava authorization
        setRegistrationStep('strava-auth');
        setSuccess('Preparing Strava connection...');
        
        // Give user a moment to see the progress, then redirect
        setTimeout(() => {
          window.location.href = stravaAuthURL;
        }, 1500);
      }
    } catch (err: any) {
      setIsLoading(false);
      setRegistrationStep('form');
      console.error('Register error:', err);
      
      // Handle specific error types
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        
        // Handle validation errors
        if (errorData.code === 'VALIDATION_ERROR' && errorData.details) {
          const messages = errorData.details.map((detail: any) => detail.message).join(', ');
          setError(`Registration failed: ${messages}`);
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError('Invalid registration data. Please check your email and password.');
        }
      } else if (err.response?.status === 409) {
        setError('An account with this email already exists. Please use a different email or try logging in.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const getProgressPercentage = () => {
    switch (registrationStep) {
      case 'form': return 0;
      case 'registering': return 50;
      case 'strava-auth': return 75;
      default: return 0;
    }
  };

  const getStepDescription = () => {
    switch (registrationStep) {
      case 'form': return 'Enter your details';
      case 'registering': return 'Creating your account...';
      case 'strava-auth': return 'Connecting to Strava...';
      default: return '';
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <FormCard style={{ marginTop: '50px', textAlign: 'center' }}>
          <Heading size="md">Create Your Account</Heading>
          
          {/* Progress indicator */}
          {registrationStep !== 'form' && (
            <FormGroup>
              <FlexContainer direction="column" gap="sm">
                <Text size="sm" weight="medium">{getStepDescription()}</Text>
                <div style={{ position: 'relative' }}>
                  <ProgressBar progress={getProgressPercentage()}>
                    <ProgressText>{getProgressPercentage()}%</ProgressText>
                  </ProgressBar>
                </div>
              </FlexContainer>
            </FormGroup>
          )}
          
          {error && (
            <ErrorMessage>
              ⚠️ {error}
            </ErrorMessage>
          )}
          
          {success && (
            <SuccessMessage>
              ✅ {success}
            </SuccessMessage>
          )}

          {registrationStep === 'form' && (
            <form onSubmit={handleRegister}>
              <FormGroup>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                />
                <HelpText>
                  <strong>Password Requirements:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character (!@#$%^&*)</li>
                  </ul>
                </HelpText>
              </FormGroup>

              <FormGroup>
                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                  size="lg"
                  style={{ width: '100%' }}
                >
                  Register & Connect Strava
                </LoadingButton>
              </FormGroup>
            </form>
          )}

          {registrationStep !== 'form' && (
            <FormGroup>
              <FlexContainer direction="column" gap="md" align="center">
                <LoadingSpinner />
                <Text size="sm" color="secondary">
                  {registrationStep === 'registering' && 'Setting up your account...'}
                  {registrationStep === 'strava-auth' && 'Redirecting to Strava for authorization...'}
                </Text>
              </FlexContainer>
            </FormGroup>
          )}
        </FormCard>
      </Container>
    </ThemeProvider>
  );
};

export default Register;
