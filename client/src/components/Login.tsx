import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import config from '../config';
import { AuthResponse } from '../types';
import { lightTheme } from '../styles/theme';
import {
  Container,
  FormCard,
  FormGroup,
  Label,
  Input,
  LoadingButton,
  ErrorMessage,
  Heading,
  StatusIndicator,
  LoadingSpinner
} from '../styles/components';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔍 Attempting login to:', `${config.API_BASE_URL}/api/auth/login`);
      const response = await axios.post<AuthResponse>(`${config.API_BASE_URL}/api/auth/login`, { email, password });
      
      console.log('🔍 Login response:', {
        status: response.status,
        hasToken: !!(response.data.token),
        tokenLength: response.data.token?.length || 0,
        responseData: response.data
      });
      
      const { token } = response.data;
      
      if (!token) {
        console.error('❌ No token received from login response');
        setError('Login failed - no token received');
        setIsLoading(false);
        return;
      }
      
      console.log('🔍 Storing token in localStorage:', token.substring(0, 30) + '...');
      
      // Store JWT in localStorage
      localStorage.setItem('jwt', token);
      
      // Verify it was stored
      const storedToken = localStorage.getItem('jwt');
      console.log('🔍 Token verification after storage:', {
        stored: !!storedToken,
        matches: storedToken === token,
        storedLength: storedToken?.length || 0
      });
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      setIsLoading(false);
      console.error('Login error:', err);
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <FormCard style={{ marginTop: '50px', textAlign: 'center' }}>
          <Heading size="md">Welcome Back</Heading>
          
          {error && (
            <ErrorMessage>
              ⚠️ {error}
            </ErrorMessage>
          )}

          <form onSubmit={handleLogin}>
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
                placeholder="Enter your password"
                required
              />
            </FormGroup>

            <FormGroup>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                size="lg"
                style={{ width: '100%' }}
              >
                {isLoading ? (
                  <StatusIndicator status="loading">
                    <LoadingSpinner />
                    Logging in...
                  </StatusIndicator>
                ) : (
                  'Login'
                )}
              </LoadingButton>
            </FormGroup>
          </form>
        </FormCard>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
