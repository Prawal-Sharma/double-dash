import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.3s ease, color 0.3s ease;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  button {
    font-family: inherit;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
    border-radius: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 6px;
    transition: background 0.2s ease;

    &:hover {
      background: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  /* Utility classes */
  .fade-in {
    animation: fadeIn 0.5s ease;
  }

  .slide-in {
    animation: slideIn 0.3s ease;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  /* Loading skeleton */
  .skeleton {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.surface} 0%,
      ${({ theme }) => theme.colors.border} 50%,
      ${({ theme }) => theme.colors.surface} 100%
    );
    background-size: 2000px 100%;
    animation: shimmer 2s infinite;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }

  /* Focus styles */
  *:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* Tooltips */
  [data-tooltip] {
    position: relative;
    cursor: help;
  }

  [data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    background: ${({ theme }) => theme.colors.text.primary};
    color: ${({ theme }) => theme.colors.background};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }

  /* Responsive tables */
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }
  }

  /* Print styles */
  @media print {
    body {
      background: white;
      color: black;
    }

    .no-print {
      display: none !important;
    }
  }

  /* Selection highlight */
  ::selection {
    background: ${({ theme }) => theme.colors.primary}33;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* Calendar heatmap styles */
  .react-calendar-heatmap {
    .color-empty { fill: ${({ theme }) => theme.colors.border}; }
    .color-scale-1 { fill: #ffd4cc; }
    .color-scale-2 { fill: #ff9980; }
    .color-scale-3 { fill: #ff6347; }
    .color-scale-4 { fill: ${({ theme }) => theme.colors.primary}; }
  }
`;