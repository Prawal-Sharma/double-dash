import styled from 'styled-components';
import { Theme } from './theme';

// Container components
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }: { theme: Theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }: { theme: Theme }) => theme.breakpoints.sm}) {
    padding: 0 ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  }
`;

export const Card = styled.div`
  background: ${({ theme }: { theme: Theme }) => theme.colors.background};
  border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.border};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.md};
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }: { theme: Theme }) => theme.shadows.sm};
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${({ theme }: { theme: Theme }) => theme.shadows.md};
  }
`;

export const Grid = styled.div<{ columns?: number; gap?: keyof Theme['spacing'] }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 'auto-fit'}, minmax(200px, 1fr));
  gap: ${({ theme, gap = 'md' }: { theme: Theme; gap?: keyof Theme['spacing'] }) => theme.spacing[gap]};
`;

export const FlexContainer = styled.div<{ 
  direction?: 'row' | 'column'; 
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: keyof Theme['spacing'];
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  justify-content: ${props => props.justify || 'flex-start'};
  align-items: ${props => props.align || 'stretch'};
  gap: ${({ theme, gap = 'md' }: { theme: Theme; gap?: keyof Theme['spacing'] }) => theme.spacing[gap]};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};
`;

// Button components
export const Button = styled.button<{
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-family: ${({ theme }: { theme: Theme }) => theme.typography.fontFamily};
  font-weight: ${({ theme }: { theme: Theme }) => theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  text-decoration: none;
  
  ${({ theme, variant = 'primary', disabled }: { theme: Theme; variant?: string; disabled?: boolean }) => {
    const color = variant === 'primary' ? theme.colors.primary :
                 variant === 'secondary' ? theme.colors.secondary :
                 variant === 'success' ? theme.colors.success :
                 variant === 'warning' ? theme.colors.warning :
                 variant === 'error' ? theme.colors.error :
                 theme.colors.primary;
    
    return `
      background-color: ${disabled ? theme.colors.text.disabled : color};
      color: white;
      
      &:hover {
        background-color: ${disabled ? theme.colors.text.disabled : `${color}dd`};
        transform: ${disabled ? 'none' : 'translateY(-1px)'};
      }
      
      &:active {
        transform: ${disabled ? 'none' : 'translateY(0)'};
      }
    `;
  }}
  
  ${({ theme, size = 'md' }: { theme: Theme; size?: string }) => {
    const sizes = {
      sm: {
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontSize: theme.typography.fontSize.sm,
      },
      md: {
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        fontSize: theme.typography.fontSize.md,
      },
      lg: {
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        fontSize: theme.typography.fontSize.lg,
      },
    };
    
    const sizeStyle = sizes[size as keyof typeof sizes] || sizes.md;
    return `
      padding: ${sizeStyle.padding};
      font-size: ${sizeStyle.fontSize};
    `;
  }}
`;

// Input components
export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.border};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }: { theme: Theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.md};
  background: ${({ theme }: { theme: Theme }) => theme.colors.background};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text.primary};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }: { theme: Theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }: { theme: Theme }) => theme.colors.text.secondary};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.border};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }: { theme: Theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.md};
  background: ${({ theme }: { theme: Theme }) => theme.colors.background};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
  }
`;

// Typography components
export const Heading = styled.h1<{ size?: 'sm' | 'md' | 'lg' | 'xl' }>`
  margin: 0 0 ${({ theme }: { theme: Theme }) => theme.spacing.md} 0;
  font-family: ${({ theme }: { theme: Theme }) => theme.typography.fontFamily};
  font-weight: ${({ theme }: { theme: Theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text.primary};
  line-height: ${({ theme }: { theme: Theme }) => theme.typography.lineHeight.tight};
  
  ${({ theme, size = 'lg' }: { theme: Theme; size?: string }) => {
    const sizes = {
      sm: theme.typography.fontSize.lg,
      md: theme.typography.fontSize.xl,
      lg: theme.typography.fontSize.xxl,
      xl: '2.5rem',
    };
    
    return `font-size: ${sizes[size as keyof typeof sizes] || sizes.lg};`;
  }}
`;

export const Text = styled.p<{ 
  size?: keyof Theme['typography']['fontSize'];
  weight?: keyof Theme['typography']['fontWeight'];
  color?: 'primary' | 'secondary' | 'disabled';
}>`
  margin: 0 0 ${({ theme }: { theme: Theme }) => theme.spacing.sm} 0;
  font-family: ${({ theme }: { theme: Theme }) => theme.typography.fontFamily};
  line-height: ${({ theme }: { theme: Theme }) => theme.typography.lineHeight.normal};
  
  font-size: ${({ theme, size = 'md' }: { theme: Theme; size?: keyof Theme['typography']['fontSize'] }) => theme.typography.fontSize[size]};
  font-weight: ${({ theme, weight = 'normal' }: { theme: Theme; weight?: keyof Theme['typography']['fontWeight'] }) => theme.typography.fontWeight[weight]};
  color: ${({ theme, color = 'primary' }: { theme: Theme; color?: 'primary' | 'secondary' | 'disabled' }) => theme.colors.text[color]};
`;

// Layout components
export const Section = styled.section<{ background?: 'default' | 'surface' }>`
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.xl} 0;
  background: ${({ theme, background = 'default' }: { theme: Theme; background?: 'default' | 'surface' }) => 
    background === 'surface' ? theme.colors.surface : theme.colors.background};
`;

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${({ theme }: { theme: Theme }) => theme.colors.border};
  margin: ${({ theme }: { theme: Theme }) => theme.spacing.lg} 0;
`;

// Progress components
export const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 20px;
  background: ${({ theme }: { theme: Theme }) => theme.colors.surface};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.lg};
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => Math.min(props.progress, 100)}%;
    background: ${({ theme }: { theme: Theme }) => theme.colors.success};
    transition: width 0.3s ease;
  }
`;

export const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }: { theme: Theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text.primary};
  z-index: 1;
`;

// Badge component
export const Badge = styled.span<{ variant?: 'primary' | 'success' | 'warning' | 'error' }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.xs} ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }: { theme: Theme }) => theme.typography.fontWeight.bold};
  color: white;
  
  ${({ theme, variant = 'primary' }: { theme: Theme; variant?: string }) => {
    const color = variant === 'primary' ? theme.colors.primary :
                 variant === 'success' ? theme.colors.success :
                 variant === 'warning' ? theme.colors.warning :
                 variant === 'error' ? theme.colors.error :
                 theme.colors.primary;
    
    return `background-color: ${color};`;
  }}
`;

// Form components
export const FormGroup = styled.div`
  margin-bottom: ${({ theme }: { theme: Theme }) => theme.spacing.lg};
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }: { theme: Theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text.primary};
`;

export const ErrorMessage = styled.div`
  margin-top: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }: { theme: Theme }) => theme.colors.error};
  display: flex;
  align-items: center;
  gap: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
`;

export const SuccessMessage = styled.div`
  margin-top: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }: { theme: Theme }) => theme.colors.success};
  display: flex;
  align-items: center;
  gap: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
`;

export const HelpText = styled.div`
  margin-top: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text.secondary};
`;

// Loading components
export const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }: { theme: Theme }) => theme.colors.border};
  border-top: 2px solid ${({ theme }: { theme: Theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoadingButton = styled(Button)<{ isLoading?: boolean }>`
  position: relative;
  
  ${({ isLoading }) => isLoading && `
    color: transparent;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
  `}
`;

// Modal components
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.md};
`;

export const ModalContent = styled.div`
  background: ${({ theme }: { theme: Theme }) => theme.colors.background};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.lg};
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }: { theme: Theme }) => theme.shadows.lg};
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

// Form layouts
export const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.xl};
`;

export const FormCard = styled(Card)`
  max-width: 400px;
  margin: 0 auto;
`;

// Status indicators
export const StatusIndicator = styled.div<{ status: 'loading' | 'success' | 'error' | 'idle' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: Theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }: { theme: Theme }) => theme.typography.fontWeight.medium};
  
  ${({ theme, status }: { theme: Theme; status: string }) => {
    switch (status) {
      case 'loading':
        return `color: ${theme.colors.info};`;
      case 'success':
        return `color: ${theme.colors.success};`;
      case 'error':
        return `color: ${theme.colors.error};`;
      default:
        return `color: ${theme.colors.text.secondary};`;
    }
  }}
`;