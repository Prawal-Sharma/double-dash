import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import { Container, Button } from '../styles/components';

// Hero Section Styles
const HeroSection = styled.section`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  @media (max-width: 768px) {
    padding: 60px 0;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  opacity: 0.95;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  position: relative;
  z-index: 1;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
    
    a, button {
      width: 200px;
    }
  }
`;

const StyledButton = styled(Button)`
  font-size: 1.1rem;
  padding: 14px 32px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }
`;

const SecondaryButton = styled(StyledButton)`
  background: transparent;
  border: 2px solid white;
  color: white;

  &:hover {
    background: white;
    color: #667eea;
  }
`;

// Features Section Styles
const FeaturesSection = styled.section`
  padding: 80px 0;
  background: #f8f9fa;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 3rem;
  color: #1a202c;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: center;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #1a202c;
`;

const FeatureDescription = styled.p`
  color: #4a5568;
  line-height: 1.6;
`;

// Stats Section Styles
const StatsSection = styled.section`
  padding: 80px 0;
  background: white;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
`;

const StatCard = styled.div`
  padding: 1.5rem;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #fc4c02;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  color: #4a5568;
`;

// How It Works Section
const HowItWorksSection = styled.section`
  padding: 80px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  margin-top: 3rem;
`;

const StepCard = styled.div`
  text-align: center;
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  background: #fc4c02;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 auto 1.5rem;
`;

const StepTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #1a202c;
`;

const StepDescription = styled.p`
  color: #4a5568;
  line-height: 1.6;
`;

// Footer Styles
const Footer = styled.footer`
  background: #1a202c;
  color: white;
  padding: 40px 0;
  text-align: center;
`;

const FooterText = styled.p`
  margin: 0.5rem 0;
  opacity: 0.8;
`;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  if (token) {
    // Logged in view
    return (
      <ThemeProvider theme={lightTheme}>
        <HeroSection style={{ padding: '60px 0' }}>
          <Container>
            <HeroTitle>Welcome Back!</HeroTitle>
            <HeroSubtitle>
              Ready to check your running progress?
            </HeroSubtitle>
            <ButtonGroup>
              <Link to="/dashboard">
                <StyledButton variant="primary" size="lg">
                  View Dashboard
                </StyledButton>
              </Link>
              <SecondaryButton onClick={handleLogout} size="lg">
                Logout
              </SecondaryButton>
            </ButtonGroup>
          </Container>
        </HeroSection>
      </ThemeProvider>
    );
  }

  // Landing page for non-logged in users
  return (
    <ThemeProvider theme={lightTheme}>
      {/* Hero Section */}
      <HeroSection>
        <Container>
          <HeroTitle>Transform Your Running Journey</HeroTitle>
          <HeroSubtitle>
            Track, analyze, and optimize your running performance with comprehensive analytics and insights.
          </HeroSubtitle>
          <ButtonGroup>
            <Link to="/register">
              <StyledButton variant="primary" size="lg">
                Get Started Free
              </StyledButton>
            </Link>
            <Link to="/login">
              <SecondaryButton size="lg">
                Sign In
              </SecondaryButton>
            </Link>
          </ButtonGroup>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <FeaturesSection>
        <Container>
          <SectionTitle>Everything You Need to Excel</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <FeatureIcon>📊</FeatureIcon>
              <FeatureTitle>Advanced Analytics</FeatureTitle>
              <FeatureDescription>
                Deep insights into your running performance with detailed metrics, trends, and progress tracking.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🎯</FeatureIcon>
              <FeatureTitle>Goal Tracking</FeatureTitle>
              <FeatureDescription>
                Set ambitious goals and track your progress with visual indicators and milestone celebrations.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>📈</FeatureIcon>
              <FeatureTitle>Performance Trends</FeatureTitle>
              <FeatureDescription>
                Visualize your improvement over time with beautiful charts and comprehensive statistics.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🏃</FeatureIcon>
              <FeatureTitle>Activity Sync</FeatureTitle>
              <FeatureDescription>
                Automatic synchronization of all your running activities with real-time updates.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🏔️</FeatureIcon>
              <FeatureTitle>Elevation Analysis</FeatureTitle>
              <FeatureDescription>
                Track elevation gain and understand how terrain impacts your performance.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>⏱️</FeatureIcon>
              <FeatureTitle>Time Management</FeatureTitle>
              <FeatureDescription>
                Monitor your pace, splits, and overall time to optimize your training sessions.
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </Container>
      </FeaturesSection>

      {/* Stats Section */}
      <StatsSection>
        <Container>
          <SectionTitle>Track What Matters</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatNumber>Distance</StatNumber>
              <StatLabel>Track every mile with precision</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>Elevation</StatNumber>
              <StatLabel>Monitor your climbing achievements</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>Time</StatNumber>
              <StatLabel>Analyze pace and duration</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>Progress</StatNumber>
              <StatLabel>Visualize your improvement</StatLabel>
            </StatCard>
          </StatsGrid>
        </Container>
      </StatsSection>

      {/* How It Works Section */}
      <HowItWorksSection>
        <Container>
          <SectionTitle>How It Works</SectionTitle>
          <StepsContainer>
            <StepCard>
              <StepNumber>1</StepNumber>
              <StepTitle>Connect</StepTitle>
              <StepDescription>
                Create your account and connect your running data source in seconds.
              </StepDescription>
            </StepCard>
            <StepCard>
              <StepNumber>2</StepNumber>
              <StepTitle>Track</StepTitle>
              <StepDescription>
                Automatically sync and monitor all your running activities in one place.
              </StepDescription>
            </StepCard>
            <StepCard>
              <StepNumber>3</StepNumber>
              <StepTitle>Improve</StepTitle>
              <StepDescription>
                Use insights and analytics to optimize your training and reach your goals.
              </StepDescription>
            </StepCard>
          </StepsContainer>
        </Container>
      </HowItWorksSection>

      {/* CTA Section */}
      <HeroSection style={{ padding: '60px 0', background: 'linear-gradient(135deg, #fc4c02 0%, #d63a00 100%)' }}>
        <Container>
          <HeroTitle style={{ fontSize: '2.5rem' }}>Ready to Start Your Journey?</HeroTitle>
          <HeroSubtitle style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            Join runners who are already transforming their performance
          </HeroSubtitle>
          <Link to="/register">
            <StyledButton size="lg" style={{ background: 'white', color: '#fc4c02' }}>
              Get Started Now
            </StyledButton>
          </Link>
        </Container>
      </HeroSection>

      {/* Footer */}
      <Footer>
        <Container>
          <FooterText>© 2025 DoubleDash. All rights reserved.</FooterText>
          <FooterText style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            Empowering runners to achieve their best performance.
          </FooterText>
        </Container>
      </Footer>
    </ThemeProvider>
  );
};

export default Home;