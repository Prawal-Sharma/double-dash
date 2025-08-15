import React, { useState } from 'react';
import axios from 'axios';
import { ThemeProvider } from 'styled-components';
import config from '../config';
import { lightTheme } from '../styles/theme';
import { saveRegistrationData } from '../utils/registrationStorage';
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
  const [registrationStep, setRegistrationStep] = useState<'form' | 'validating' | 'strava-redirect'>('form');

  // Get clientID from environment variable
  const clientID = process.env.REACT_APP_STRAVA_CLIENT_ID;
  
  if (!clientID) {
    console.error('REACT_APP_STRAVA_CLIENT_ID environment variable is not set');
  }
  
  // Updated redirect URI to point to our callback handler
  const redirectURI = `${config.FRONTEND_URL}/strava-callback`;
  const scope = 'read,activity:read';
  const stravaAuthURL = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}&state=registration`;

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    
    return errors;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    setRegistrationStep('validating');

    try {
      // Step 1: Validate email format
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        setRegistrationStep('form');
        return;
      }

      // Step 2: Validate password strength
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setError(passwordErrors.join('. '));
        setIsLoading(false);
        setRegistrationStep('form');
        return;
      }

      // Step 3: Check if email already exists (optional - can skip this for true 2-phase)
      try {
        const checkResponse = await axios.post(`${config.API_BASE_URL}/api/auth/check-email`, { email });
        if (checkResponse.data.exists) {
          setError('An account with this email already exists. Please login instead.');
          setIsLoading(false);
          setRegistrationStep('form');
          return;
        }
      } catch (checkError) {
        // If check fails, continue anyway (backend might not have this endpoint yet)
        console.log('Email check skipped:', checkError);
      }

      // Step 4: Save registration data temporarily
      saveRegistrationData(email, password);
      
      // Step 5: Prepare for Strava redirect
      setRegistrationStep('strava-redirect');
      setSuccess('Redirecting to Strava for authorization...');
      
      // Step 6: Redirect to Strava
      setTimeout(() => {
        window.location.href = stravaAuthURL;
      }, 1500);
      
    } catch (err: any) {
      setIsLoading(false);
      setRegistrationStep('form');
      console.error('Registration validation error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const getProgressPercentage = () => {
    switch (registrationStep) {
      case 'form': return 0;
      case 'validating': return 33;
      case 'strava-redirect': return 66;
      default: return 0;
    }
  };

  const getStepDescription = () => {
    switch (registrationStep) {
      case 'form': return 'Enter your details';
      case 'validating': return 'Validating information...';
      case 'strava-redirect': return 'Connecting to Strava...';
      default: return '';
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <FormCard style={{ marginTop: '50px', textAlign: 'center' }}>
          <Heading size="md">Create Your Account</Heading>
          <Text size="sm" color="secondary" style={{ marginBottom: '20px' }}>
            Your account will be created after connecting with Strava
          </Text>
          
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
                  style={{ 
                    width: '100%',
                    background: '#FC5200',
                    border: 'none',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      Continue with 
                      <span style={{ 
                        fontWeight: '700',
                        letterSpacing: '0.5px'
                      }}>
                        STRAVA
                      </span>
                    </>
                  )}
                </LoadingButton>
              </FormGroup>

              <Text size="sm" color="secondary" style={{ marginTop: '16px' }}>
                By continuing, you'll be redirected to Strava to authorize DoubleDash.
                Your account will only be created after successful authorization.
              </Text>
            </form>
          )}

          {registrationStep !== 'form' && (
            <FormGroup>
              <FlexContainer direction="column" gap="md" align="center">
                <LoadingSpinner />
                <Text size="sm" color="secondary">
                  {registrationStep === 'validating' && 'Validating your information...'}
                  {registrationStep === 'strava-redirect' && 'Redirecting to Strava for authorization...'}
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