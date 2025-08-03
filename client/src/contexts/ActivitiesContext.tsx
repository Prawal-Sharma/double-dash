import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios from 'axios';
import config from '../config';
import { Activity, ActivitySummary, ActivitiesResponse } from '../types';
import { TokenValidator, validateAuthState } from '../utils/tokenValidation';

// Types
interface ActivitiesState {
  activities: Activity[];
  summary: ActivitySummary;
  loading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  isFirstLoad: boolean;
  cacheExpiry: number | null;
  retryCount: number;
  lastFailedAttempt: number | null;
  isOnboarding: boolean;
}

type ActivitiesAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { activities: Activity[]; summary: ActivitySummary; lastSyncTime?: string } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'FETCH_AUTH_ERROR'; payload: string }
  | { type: 'SET_FIRST_LOAD'; payload: boolean }
  | { type: 'SET_ONBOARDING'; payload: boolean }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' };

interface ActivitiesContextType {
  state: ActivitiesState;
  fetchActivities: (forceRefresh?: boolean) => Promise<void>;
  refreshActivities: () => Promise<void>;
  clearCache: () => void;
  isDataFresh: () => boolean;
  checkAuthAndRedirect: () => boolean;
  setOnboarding: (isOnboarding: boolean) => void;
}

// Initial state
const initialState: ActivitiesState = {
  activities: [],
  summary: {} as ActivitySummary,
  loading: false,
  error: null,
  lastSyncTime: null,
  isFirstLoad: true,
  cacheExpiry: null,
  retryCount: 0,
  lastFailedAttempt: null,
  isOnboarding: false
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'doubledash_activities_cache';

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second
const RETRY_COOLDOWN = 30000; // 30 seconds between retry cycles

// Reducer
const activitiesReducer = (state: ActivitiesState, action: ActivitiesAction): ActivitiesState => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'FETCH_SUCCESS':
      const now = Date.now();
      const newState = {
        ...state,
        loading: false,
        error: null,
        activities: action.payload.activities,
        summary: action.payload.summary,
        lastSyncTime: action.payload.lastSyncTime ? new Date(action.payload.lastSyncTime) : new Date(),
        isFirstLoad: false,
        cacheExpiry: now + CACHE_DURATION,
        retryCount: 0, // Reset retry count on success
        lastFailedAttempt: null
      };
      
      // Cache to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...newState,
          timestamp: now
        }));
      } catch (error) {
        console.warn('Failed to cache activities to localStorage:', error);
      }
      
      return newState;
    
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isFirstLoad: false,
        lastFailedAttempt: Date.now()
      };
      
    case 'FETCH_AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isFirstLoad: false,
        lastFailedAttempt: Date.now(),
        retryCount: MAX_RETRY_ATTEMPTS // Prevent retries for auth errors
      };
      
    case 'INCREMENT_RETRY':
      return {
        ...state,
        retryCount: state.retryCount + 1
      };
      
    case 'RESET_RETRY':
      return {
        ...state,
        retryCount: 0,
        lastFailedAttempt: null
      };
    
    case 'SET_FIRST_LOAD':
      return {
        ...state,
        isFirstLoad: action.payload
      };
      
    case 'SET_ONBOARDING':
      return {
        ...state,
        isOnboarding: action.payload
      };
    
    case 'CLEAR_CACHE':
      localStorage.removeItem(STORAGE_KEY);
      return {
        ...initialState,
        isFirstLoad: state.isFirstLoad
      };
    
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(activity =>
          activity.activityId === action.payload.activityId ? action.payload : activity
        )
      };
    
    default:
      return state;
  }
};

// Context
const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

// Custom hook
export const useActivities = (): ActivitiesContextType => {
  const context = useContext(ActivitiesContext);
  if (!context) {
    throw new Error('useActivities must be used within an ActivitiesProvider');
  }
  return context;
};

// Provider component
interface ActivitiesProviderProps {
  children: ReactNode;
}

export const ActivitiesProvider: React.FC<ActivitiesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(activitiesReducer, initialState);
  
  // Retry management - keep track of pending retries so we can cancel them
  const pendingRetries = React.useRef<Set<NodeJS.Timeout>>(new Set());

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          const now = Date.now();
          
          // Check if cache is still valid
          if (data.timestamp && (now - data.timestamp) < CACHE_DURATION) {
            dispatch({
              type: 'FETCH_SUCCESS',
              payload: {
                activities: data.activities || [],
                summary: data.summary || {},
                lastSyncTime: data.lastSyncTime
              }
            });
            dispatch({ type: 'SET_FIRST_LOAD', payload: false });
            return true;
          } else {
            // Cache expired, clear it
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Failed to load cached activities:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
      return false;
    };

    loadCachedData();
  }, []);

  // Check if data is fresh
  const isDataFresh = React.useCallback((): boolean => {
    return state.cacheExpiry ? Date.now() < state.cacheExpiry : false;
  }, [state.cacheExpiry]);

  // Check authentication and redirect if needed
  const checkAuthAndRedirect = React.useCallback((): boolean => {
    const token = localStorage.getItem('jwt');
    console.log('🔍 Dashboard auth check. Token exists:', !!token);
    
    if (token) {
      console.log('🔍 Token length:', token.length, 'First 30 chars:', token.substring(0, 30));
      
      // Try to decode for debugging
      try {
        const decoded = TokenValidator.decodeToken(token);
        console.log('🔍 Decoded dashboard token:', decoded);
        console.log('🔍 Token expiry check:', {
          exp: decoded?.exp,
          currentTime: Math.floor(Date.now() / 1000),
          isExpired: decoded ? decoded.exp < Math.floor(Date.now() / 1000) : 'no-exp'
        });
      } catch (error) {
        console.error('❌ Failed to decode dashboard token:', error);
      }
    }
    
    const { isAuthenticated, shouldRedirectToLogin } = validateAuthState();
    console.log('🔍 Auth state validation result:', { isAuthenticated, shouldRedirectToLogin });
    
    if (shouldRedirectToLogin) {
      console.log('❌ Auth check failed - token invalid/expired. Redirecting to login.');
      // Clear any cached data for security
      dispatch({ type: 'CLEAR_CACHE' });
      
      // Use setTimeout to avoid React state update warnings
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      return false;
    }
    
    return isAuthenticated;
  }, [dispatch]);

  // Fetch activities from API with retry logic
  const fetchActivities = React.useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    // Multiple checks to prevent fetching during onboarding
    
    // Check 1: Onboarding state flag
    if (state.isOnboarding && !forceRefresh) {
      return;
    }
    
    // Check 2: URL parameter fallback (in case flag hasn't been set yet)
    const urlParams = new URLSearchParams(window.location.search);
    const hasCodeParam = urlParams.has('code');
    if (hasCodeParam && !forceRefresh) {
      return;
    }
    
    // Check authentication state first
    if (!checkAuthAndRedirect()) {
      dispatch({ type: 'FETCH_AUTH_ERROR', payload: 'Authentication required. Redirecting to login...' });
      return;
    }
    
    const token = TokenValidator.getValidToken();
    if (!token) {
      dispatch({ type: 'FETCH_AUTH_ERROR', payload: 'Authentication expired. Redirecting to login...' });
      checkAuthAndRedirect(); // This will redirect
      return;
    }

    // Skip fetch if data is fresh and not forced
    if (!forceRefresh && isDataFresh() && state.activities.length > 0) {
      return;
    }

    // Check if we're in retry cooldown
    if (state.lastFailedAttempt && (Date.now() - state.lastFailedAttempt) < RETRY_COOLDOWN) {
      console.log('In retry cooldown, skipping fetch');
      return;
    }

    // Check if we've exceeded max retry attempts
    if (state.retryCount >= MAX_RETRY_ATTEMPTS && !forceRefresh) {
      console.log('Max retry attempts exceeded, skipping fetch');
      return;
    }

    dispatch({ type: 'FETCH_START' });

    try {
      console.log('🔍 Fetching activities from:', `${config.API_BASE_URL}/api/strava/activities`);
      console.log('🔍 Using token for API request:', token.substring(0, 30) + '...');
      
      // Use POST to bypass CloudFront query string/header stripping
      const response = await axios.post<ActivitiesResponse>(
        `${config.API_BASE_URL}/api/strava/activities`,
        { token }, // Send token in request body
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Auth-Token': token  // CloudFront-friendly custom header
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const sortedActivities = response.data.activities.sort(
        (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          activities: sortedActivities,
          summary: response.data.summary,
          lastSyncTime: response.data.lastSyncTime
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch activities:', error);
      console.log('🔍 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        message: error.message
      });
      
      let errorMessage = 'Failed to load activities';
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        console.error('❌ 401 Authentication error - clearing token and redirecting');
        errorMessage = 'Authentication expired. Redirecting to login...';
        
        // Clear invalid token and redirect
        TokenValidator.clearToken();
        dispatch({ type: 'FETCH_AUTH_ERROR', payload: errorMessage });
        checkAuthAndRedirect();
        return; // Exit immediately for auth errors - no retries
        
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        // Don't retry immediately for rate limit errors
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Connection timed out. Please check your connection.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // For non-auth errors, increment retry count and dispatch error
      dispatch({ type: 'INCREMENT_RETRY' });
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
      
      // Schedule retry with exponential backoff (only if under retry limit and not forced)
      if (state.retryCount < MAX_RETRY_ATTEMPTS - 1 && !forceRefresh) {
        const retryDelay = RETRY_DELAY_BASE * Math.pow(2, state.retryCount);
        
        const timeoutId = setTimeout(() => {
          // Remove from pending retries set
          pendingRetries.current.delete(timeoutId);
          
          // Double-check: don't retry if we're now in onboarding mode or URL has code
          const urlParams = new URLSearchParams(window.location.search);
          const hasCodeParam = urlParams.has('code');
          
          if (state.isOnboarding || hasCodeParam) {
            return;
          }
          
          if (state.retryCount < MAX_RETRY_ATTEMPTS) {
            fetchActivities(false);
          }
        }, retryDelay);
        
        // Track this retry timeout so we can cancel it if needed
        pendingRetries.current.add(timeoutId);
      }
    }
  }, [state.isOnboarding, state.retryCount, state.activities.length, state.lastFailedAttempt, checkAuthAndRedirect, dispatch, isDataFresh]);

  // Refresh activities (force refresh)
  const refreshActivities = React.useCallback(async (): Promise<void> => {
    // Check authentication state first
    if (!checkAuthAndRedirect()) {
      dispatch({ type: 'FETCH_AUTH_ERROR', payload: 'Authentication required. Redirecting to login...' });
      return;
    }
    
    const token = TokenValidator.getValidToken();
    if (!token) {
      dispatch({ type: 'FETCH_AUTH_ERROR', payload: 'Authentication expired. Redirecting to login...' });
      checkAuthAndRedirect(); // This will redirect
      return;
    }

    dispatch({ type: 'FETCH_START' });

    try {
      // Use POST to bypass CloudFront query string/header stripping
      const response = await axios.post<ActivitiesResponse>(
        `${config.API_BASE_URL}/api/strava/activities/refresh`,
        { token }, // Send token in request body
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Auth-Token': token  // CloudFront-friendly custom header
          }
        }
      );

      const sortedActivities = response.data.activities.sort(
        (a: Activity, b: Activity) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          activities: sortedActivities,
          summary: response.data.summary,
          lastSyncTime: response.data.lastSyncTime
        }
      });
    } catch (error: any) {
      console.error('Failed to refresh activities:', error);
      let errorMessage = 'Failed to refresh activities';
      let isAuthError = false;
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication expired. Redirecting to login...';
        isAuthError = true;
        
        // Clear invalid token and redirect
        TokenValidator.clearToken();
        checkAuthAndRedirect();
        
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      // Dispatch appropriate error type
      if (isAuthError) {
        dispatch({ type: 'FETCH_AUTH_ERROR', payload: errorMessage });
      } else {
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
      }
    }
  }, [checkAuthAndRedirect, dispatch]);

  // Clear cache
  const clearCache = React.useCallback((): void => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, [dispatch]);

  // Set onboarding mode
  const setOnboarding = React.useCallback((isOnboarding: boolean): void => {
    dispatch({ type: 'SET_ONBOARDING', payload: isOnboarding });
    
    // If entering onboarding mode, cancel all pending retries
    if (isOnboarding) {
      pendingRetries.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      pendingRetries.current.clear();
    }
  }, [dispatch]);

  const contextValue: ActivitiesContextType = React.useMemo(() => ({
    state,
    fetchActivities,
    refreshActivities,
    clearCache,
    isDataFresh,
    checkAuthAndRedirect,
    setOnboarding
  }), [state, fetchActivities, refreshActivities, clearCache, isDataFresh, checkAuthAndRedirect, setOnboarding]);

  return (
    <ActivitiesContext.Provider value={contextValue}>
      {children}
    </ActivitiesContext.Provider>
  );
};

export default ActivitiesContext;