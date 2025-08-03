import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios from 'axios';
import config from '../config';
import { Activity, ActivitySummary, ActivitiesResponse } from '../types';

// Types
interface ActivitiesState {
  activities: Activity[];
  summary: ActivitySummary;
  loading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  isFirstLoad: boolean;
  cacheExpiry: number | null;
}

type ActivitiesAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { activities: Activity[]; summary: ActivitySummary; lastSyncTime?: string } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_FIRST_LOAD'; payload: boolean }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity };

interface ActivitiesContextType {
  state: ActivitiesState;
  fetchActivities: (forceRefresh?: boolean) => Promise<void>;
  refreshActivities: () => Promise<void>;
  clearCache: () => void;
  isDataFresh: () => boolean;
}

// Initial state
const initialState: ActivitiesState = {
  activities: [],
  summary: {} as ActivitySummary,
  loading: false,
  error: null,
  lastSyncTime: null,
  isFirstLoad: true,
  cacheExpiry: null
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'doubledash_activities_cache';

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
        cacheExpiry: now + CACHE_DURATION
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
        isFirstLoad: false
      };
    
    case 'SET_FIRST_LOAD':
      return {
        ...state,
        isFirstLoad: action.payload
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
            console.log('Loading activities from cache');
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
  const isDataFresh = (): boolean => {
    return state.cacheExpiry ? Date.now() < state.cacheExpiry : false;
  };

  // Fetch activities from API
  const fetchActivities = async (forceRefresh: boolean = false): Promise<void> => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Authentication required' });
      return;
    }

    // Skip fetch if data is fresh and not forced
    if (!forceRefresh && isDataFresh() && state.activities.length > 0) {
      console.log('Using fresh cached data, skipping API call');
      return;
    }

    dispatch({ type: 'FETCH_START' });

    try {
      console.log('Fetching activities from API');
      const response = await axios.get<ActivitiesResponse>(
        `${config.API_BASE_URL}/api/strava/activities`,
        {
          headers: { Authorization: `Bearer ${token}` }
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
      console.error('Failed to fetch activities:', error);
      let errorMessage = 'Failed to load activities';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  };

  // Refresh activities (force refresh)
  const refreshActivities = async (): Promise<void> => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Authentication required' });
      return;
    }

    dispatch({ type: 'FETCH_START' });

    try {
      console.log('Refreshing activities from Strava');
      const response = await axios.get<ActivitiesResponse>(
        `${config.API_BASE_URL}/api/strava/activities/refresh`,
        {
          headers: { Authorization: `Bearer ${token}` }
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
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  };

  // Clear cache
  const clearCache = (): void => {
    dispatch({ type: 'CLEAR_CACHE' });
  };

  const contextValue: ActivitiesContextType = {
    state,
    fetchActivities,
    refreshActivities,
    clearCache,
    isDataFresh
  };

  return (
    <ActivitiesContext.Provider value={contextValue}>
      {children}
    </ActivitiesContext.Provider>
  );
};

export default ActivitiesContext;