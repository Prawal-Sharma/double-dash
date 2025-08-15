/**
 * Utility for temporarily storing registration data during Strava OAuth flow
 * This prevents orphaned accounts by deferring account creation until after Strava auth
 */

interface RegistrationData {
  email: string;
  password: string;
  timestamp: number;
}

const STORAGE_KEY = 'dd_pending_registration';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Simple encoding/decoding for registration data
 * In production, consider using crypto-js for proper encryption
 */
const encode = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

const decode = (data: string): string => {
  return decodeURIComponent(atob(data));
};

/**
 * Save registration data temporarily during OAuth flow
 */
export const saveRegistrationData = (email: string, password: string): void => {
  const data: RegistrationData = {
    email,
    password,
    timestamp: Date.now()
  };
  
  const encoded = encode(JSON.stringify(data));
  localStorage.setItem(STORAGE_KEY, encoded);
};

/**
 * Retrieve registration data if it exists and hasn't expired
 */
export const getRegistrationData = (): { email: string; password: string } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const decoded = decode(stored);
    const data: RegistrationData = JSON.parse(decoded);
    
    // Check if data has expired
    if (Date.now() - data.timestamp > EXPIRY_TIME) {
      clearRegistrationData();
      return null;
    }
    
    return {
      email: data.email,
      password: data.password
    };
  } catch (error) {
    console.error('Error retrieving registration data:', error);
    clearRegistrationData();
    return null;
  }
};

/**
 * Clear registration data from storage
 */
export const clearRegistrationData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Check if there's pending registration data
 */
export const hasPendingRegistration = (): boolean => {
  const data = getRegistrationData();
  return data !== null;
};

/**
 * Get time remaining before registration data expires (in minutes)
 */
export const getTimeRemaining = (): number | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const decoded = decode(stored);
    const data: RegistrationData = JSON.parse(decoded);
    
    const elapsed = Date.now() - data.timestamp;
    const remaining = EXPIRY_TIME - elapsed;
    
    if (remaining <= 0) {
      clearRegistrationData();
      return null;
    }
    
    return Math.floor(remaining / 60000); // Convert to minutes
  } catch (error) {
    return null;
  }
};