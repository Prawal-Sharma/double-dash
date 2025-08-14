import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.3s ease, color 0.3s ease;
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
    background-color: ${({ theme }) => theme.colors.background};
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  p, span, div {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primaryLight};
    }
  }

  input, textarea, select {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}33;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  button {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    cursor: pointer;
    transition: all 0.2s ease;
  }

  code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primary};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  /* Selection styling */
  ::selection {
    background-color: ${({ theme }) => theme.colors.primary}33;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* Disable default styles for specific elements */
  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin: ${({ theme }) => theme.spacing.lg} 0;
  }
`;