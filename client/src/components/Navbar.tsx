import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const NavContainer = styled.nav`
  display: flex;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: ${({ theme }) => `${theme.colors.surface}ee`};
`;

const Logo = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const NavLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}22;
    color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const LogoutButton = styled.button`
  color: ${({ theme }) => theme.colors.primary};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    transform: translateY(-1px);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const ThemeToggle = styled.button`
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}22;
    border-color: ${({ theme }) => theme.colors.primary};
    transform: rotate(15deg);
  }
`;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  return (
    <NavContainer>
      <Logo to="/">Double Dash</Logo>
      <NavLinks>
        <NavLink to="/">Home</NavLink>
        {token && (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/activities">Activities</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </>
        )}
        {!token && (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
        <ThemeToggle onClick={toggleTheme} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {isDarkMode ? '☀️' : '🌙'}
        </ThemeToggle>
        {token && (
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
        )}
      </NavLinks>
    </NavContainer>
  );
};

export default Navbar; 