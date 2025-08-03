import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../styles/theme';
import { Container, Heading, Text, FlexContainer, Button } from '../styles/components';

// Styled Components
const OnboardingContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary}10 0%, 
    ${({ theme }) => theme.colors.secondary}10 100%
  );
`;

const OnboardingCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xxl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const ProgressFill = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'progress',
})<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, 
    ${({ theme }) => theme.colors.primary}, 
    ${({ theme }) => theme.colors.secondary}
  );
  border-radius: ${({ theme }) => theme.borderRadius.round};
  transition: width 0.5s ease-in-out;
  width: ${({ progress }) => progress}%;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const Step = styled.div.withConfig({
  shouldForwardProp: (prop) => !['active', 'completed'].includes(prop),
})<{ active: boolean; completed: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  transition: all 0.3s ease;
  
  ${({ active, completed, theme }) => {
    if (completed) {
      return `
        background: ${theme.colors.success};
        color: white;
        transform: scale(1.1);
      `;
    }
    if (active) {
      return `
        background: ${theme.colors.primary};
        color: white;
        animation: pulse 2s infinite;
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `;
    }
    return `
      background: ${theme.colors.border};
      color: ${theme.colors.text.secondary};
    `;
  }}
`;

const IconSpinner = styled.div`
  font-size: 2rem;
  animation: spin 2s linear infinite;
  margin: ${({ theme }) => theme.spacing.lg} 0;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ActivityCounter = styled.div`
  background: ${({ theme }) => theme.colors.primary}15;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.lg} 0;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const CounterNumber = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
`;

// Types
export type OnboardingStep = 'connecting' | 'syncing' | 'processing' | 'complete' | 'timeout';

interface StravaOnboardingFlowProps {
  step: OnboardingStep;
  activityCount?: number;
  totalExpected?: number;
  isDarkMode?: boolean;
  onComplete?: () => void;
  showContinueButton?: boolean;
  onContinue?: () => void;
}

// Step configuration
const stepConfig = {
  connecting: {
    icon: '🔗',
    title: 'Connecting to Strava',
    description: 'Establishing secure connection with your Strava account...',
    progress: 25
  },
  syncing: {
    icon: '📊', 
    title: 'Syncing Your Activities',
    description: 'Importing your running history from Strava...',
    progress: 50
  },
  processing: {
    icon: '⚡',
    title: 'Processing Your Data', 
    description: 'Analyzing your performance and generating insights...',
    progress: 85
  },
  complete: {
    icon: '🎉',
    title: 'Welcome to DoubleDash!',
    description: 'Your dashboard is ready with all your running data.',
    progress: 100
  },
  timeout: {
    icon: '⏰',
    title: 'Taking longer than expected...',
    description: 'The connection is taking some time. Please be patient.',
    progress: 75
  }
};

const StravaOnboardingFlow: React.FC<StravaOnboardingFlowProps> = ({
  step,
  activityCount = 0,
  totalExpected = 0,
  isDarkMode = false,
  onComplete,
  showContinueButton = false,
  onContinue
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const currentStep = stepConfig[step];
  
  // Animate activity counter
  useEffect(() => {
    if (activityCount > displayCount) {
      const timer = setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + Math.ceil((activityCount - prev) / 10), activityCount));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activityCount, displayCount]);
  
  // Auto-complete after delay
  useEffect(() => {
    if (step === 'complete' && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  const getStepNumber = (stepName: OnboardingStep): number => {
    const steps: OnboardingStep[] = ['connecting', 'syncing', 'processing', 'complete'];
    return steps.indexOf(stepName) + 1;
  };

  const isStepCompleted = (stepName: OnboardingStep): boolean => {
    const currentStepIndex = getStepNumber(step) - 1;
    const stepIndex = getStepNumber(stepName) - 1;
    return stepIndex < currentStepIndex;
  };

  const isStepActive = (stepName: OnboardingStep): boolean => {
    return stepName === step;
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <OnboardingContainer>
        <OnboardingCard>
          {/* Step Indicators */}
          <StepIndicator>
            {(['connecting', 'syncing', 'processing', 'complete'] as OnboardingStep[]).map((stepName, index) => (
              <Step
                key={stepName}
                active={isStepActive(stepName)}
                completed={isStepCompleted(stepName)}
              >
                {isStepCompleted(stepName) ? '✓' : index + 1}
              </Step>
            ))}
          </StepIndicator>

          {/* Progress Bar */}
          <ProgressBar>
            <ProgressFill progress={currentStep.progress} />
          </ProgressBar>

          {/* Main Content */}
          <IconSpinner>{currentStep.icon}</IconSpinner>
          
          <Heading size="xl" style={{ marginBottom: '16px' }}>
            {currentStep.title}
          </Heading>
          
          <Text size="lg" color="secondary" style={{ marginBottom: '24px' }}>
            {currentStep.description}
          </Text>

          {/* Activity Counter (show during syncing and processing) */}
          {(step === 'syncing' || step === 'processing') && (
            <ActivityCounter>
              <FlexContainer direction="column" gap="xs">
                <Text size="sm" color="secondary">
                  Activities Found
                </Text>
                <CounterNumber>
                  {displayCount.toLocaleString()}
                  {totalExpected > 0 && ` / ${totalExpected.toLocaleString()}`}
                </CounterNumber>
                {step === 'syncing' && (
                  <Text size="xs" color="secondary">
                    Importing your running history...
                  </Text>
                )}
              </FlexContainer>
            </ActivityCounter>
          )}

          {/* Time Estimate */}
          {step !== 'complete' && (
            <Text size="sm" color="secondary" style={{ opacity: 0.8 }}>
              ⏱️ This usually takes 15-30 seconds
            </Text>
          )}

          {/* Success Message */}
          {step === 'complete' && (
            <FlexContainer direction="column" gap="sm" style={{ marginTop: '16px' }}>
              <Text size="md" weight="medium" style={{ color: '#10b981' }}>
                🎯 All done! Redirecting to your dashboard...
              </Text>
              <Text size="sm" color="secondary">
                Found {activityCount.toLocaleString()} activities ready for analysis
              </Text>
            </FlexContainer>
          )}

          {/* Continue Button for stuck onboarding */}
          {showContinueButton && step === 'processing' && onContinue && (
            <FlexContainer direction="column" gap="sm" style={{ marginTop: '24px' }}>
              <Text size="sm" color="secondary" style={{ opacity: 0.8 }}>
                Taking longer than expected?
              </Text>
              <Button 
                variant="primary" 
                size="md" 
                onClick={onContinue}
                style={{ minWidth: '180px' }}
              >
                Continue to Dashboard
              </Button>
            </FlexContainer>
          )}
        </OnboardingCard>
      </OnboardingContainer>
    </ThemeProvider>
  );
};

export default StravaOnboardingFlow;