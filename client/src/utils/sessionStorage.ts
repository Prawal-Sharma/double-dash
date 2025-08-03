// Centralized session storage management for DoubleDash

// Storage keys
export const STORAGE_KEYS = {
  STRAVA_EXCHANGE: (code: string) => `strava-exchange-${code}`,
  PROCESSING: (code: string) => `processing-${code}`,
  EXCHANGE_TIMESTAMP: (code: string) => `exchange-timestamp-${code}`,
  DASHBOARD_THEME: 'dashboardTheme',
  ACTIVITIES_CACHE: 'doubledash_activities_cache'
} as const;

// Session storage utilities
export class SessionStorageManager {
  // Set item with error handling
  static setItem(key: string, value: string): boolean {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Failed to set session storage item:', key, error);
      return false;
    }
  }

  // Get item with default value
  static getItem(key: string, defaultValue: string | null = null): string | null {
    try {
      return sessionStorage.getItem(key) ?? defaultValue;
    } catch (error) {
      console.warn('Failed to get session storage item:', key, error);
      return defaultValue;
    }
  }

  // Remove item with error handling
  static removeItem(key: string): boolean {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove session storage item:', key, error);
      return false;
    }
  }

  // Remove multiple items
  static removeItems(keys: string[]): void {
    keys.forEach(key => this.removeItem(key));
  }

  // Check if item exists and is not expired
  static isItemValid(key: string, maxAge: number): boolean {
    const item = this.getItem(key);
    if (!item) return false;

    try {
      const data = JSON.parse(item);
      if (!data.timestamp) return false;
      
      return (Date.now() - data.timestamp) < maxAge;
    } catch {
      return false;
    }
  }

  // Set item with timestamp
  static setItemWithTimestamp(key: string, value: any): boolean {
    const data = {
      value,
      timestamp: Date.now()
    };
    return this.setItem(key, JSON.stringify(data));
  }

  // Get item with timestamp validation
  static getItemWithTimestamp(key: string, maxAge: number): any | null {
    if (!this.isItemValid(key, maxAge)) {
      this.removeItem(key);
      return null;
    }

    try {
      const item = this.getItem(key);
      if (!item) return null;
      
      const data = JSON.parse(item);
      return data.value;
    } catch {
      this.removeItem(key);
      return null;
    }
  }
}

// Specific storage managers
export class StravaExchangeStorage {
  private static getKeys(code: string) {
    return {
      cache: STORAGE_KEYS.STRAVA_EXCHANGE(code),
      processing: STORAGE_KEYS.PROCESSING(code),
      timestamp: STORAGE_KEYS.EXCHANGE_TIMESTAMP(code)
    };
  }

  static isAlreadyProcessed(code: string): boolean {
    const keys = this.getKeys(code);
    return !!SessionStorageManager.getItem(keys.cache);
  }

  static isCurrentlyProcessing(code: string): boolean {
    const keys = this.getKeys(code);
    return !!SessionStorageManager.getItem(keys.processing);
  }

  static isRecentAttempt(code: string, windowMs: number): boolean {
    const keys = this.getKeys(code);
    const lastAttempt = SessionStorageManager.getItem(keys.timestamp);
    
    if (!lastAttempt) return false;
    return (Date.now() - parseInt(lastAttempt)) < windowMs;
  }

  static markAsProcessing(code: string): void {
    const keys = this.getKeys(code);
    SessionStorageManager.setItem(keys.processing, 'true');
    SessionStorageManager.setItem(keys.timestamp, Date.now().toString());
  }

  static setCacheResult(code: string, data: any): void {
    const keys = this.getKeys(code);
    SessionStorageManager.setItem(keys.cache, JSON.stringify(data));
  }

  static getCacheResult(code: string): any | null {
    const keys = this.getKeys(code);
    const cached = SessionStorageManager.getItem(keys.cache);
    return cached ? JSON.parse(cached) : null;
  }

  static cleanup(code: string): void {
    const keys = this.getKeys(code);
    SessionStorageManager.removeItems([keys.cache, keys.processing, keys.timestamp]);
  }

  static finishProcessing(code: string): void {
    const keys = this.getKeys(code);
    SessionStorageManager.removeItem(keys.processing);
  }
}

// Local storage utilities (for persistent data)
export class LocalStorageManager {
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Failed to set local storage item:', key, error);
      return false;
    }
  }

  static getItem(key: string, defaultValue: string | null = null): string | null {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch (error) {
      console.warn('Failed to get local storage item:', key, error);
      return defaultValue;
    }
  }

  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove local storage item:', key, error);
      return false;
    }
  }

  static setJSON(key: string, value: any): boolean {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to set JSON to local storage:', key, error);
      return false;
    }
  }

  static getJSON(key: string, defaultValue: any = null): any {
    try {
      const item = this.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to parse JSON from local storage:', key, error);
      return defaultValue;
    }
  }
}