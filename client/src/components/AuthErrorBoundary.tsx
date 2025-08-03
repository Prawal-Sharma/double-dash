import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { lightTheme, darkTheme } from '../styles/theme';
import { Container, Card, Button, Heading, Text, FlexContainer } from '../styles/components';

// Styled Components
const AuthErrorContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.error}10 0%, 
    ${({ theme }) => theme.colors.primary}10 100%
  );
`;

const AuthErrorCard = styled(Card)`
  text-align: center;
  max-width: 500px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xxl};
  border: 2px solid ${({ theme }) => theme.colors.error}30;
  background: ${({ theme }) => theme.colors.surface};
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  opacity: 0.8;
`;

const ErrorTitle = styled(Heading)`
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorMessage = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.6;
`;

const ButtonGroup = styled(FlexContainer)`
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

interface AuthErrorBoundaryProps {
  error?: string;
  isDarkMode?: boolean;
  onRetry?: () => void;
}

const AuthErrorBoundary: React.FC<AuthErrorBoundaryProps> = ({
  error = 'Your session has expired or is invalid',
  isDarkMode = false,
  onRetry
}) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Clear any stale data and redirect to login
    localStorage.removeItem('jwt');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleHome = () => {
    // Clear any stale data and redirect to home
    localStorage.removeItem('jwt');
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry - reload the page
      window.location.reload();
    }
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <AuthErrorContainer>
        <AuthErrorCard>
          <ErrorIcon>🔒</ErrorIcon>
          
          <ErrorTitle size="xl">
            Authentication Required
          </ErrorTitle>
          
          <ErrorMessage size="lg" color="secondary">
            {error}
          </ErrorMessage>
          
          <Text size="md" color="secondary" style={{ marginBottom: '24px' }}>
            Please log in again to continue using DoubleDash.
          </Text>
          
          <ButtonGroup direction="column" align="center">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleLogin}
              style={{ minWidth: '200px' }}
            >
              Go to Login
            </Button>
            
            <ButtonGroup direction="row" justify="center">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={handleHome}
              >
                Back to Home
              </Button>
              
              {onRetry && (
                <Button 
                  variant="secondary" 
                  size="md" 
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
              )}
            </ButtonGroup>
          </ButtonGroup>
          
          <Text size="sm" color="secondary" style={{ marginTop: '24px', opacity: 0.7 }}>
            💡 If you continue to see this error, please clear your browser cache and try again.
          </Text>
        </AuthErrorCard>
      </AuthErrorContainer>
    </ThemeProvider>
  );
};

export default AuthErrorBoundary;