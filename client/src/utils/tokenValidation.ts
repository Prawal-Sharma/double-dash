// JWT Token validation utilities

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class TokenValidator {
  /**
   * Decode JWT token without verification (client-side check only)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded;
    } catch (error) {
      console.warn('Failed to decode JWT token:', error);
      return null;
    }
  }

  /**
   * Check if JWT token is expired (client-side check)
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Check if JWT token is valid and not expired
   */
  static isTokenValid(token: string | null): boolean {
    if (!token || token.trim() === '') {
      return false;
    }
    
    return !this.isTokenExpired(token);
  }

  /**
   * Get JWT token from localStorage and validate it
   */
  static getValidToken(): string | null {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      return null;
    }
    
    if (this.isTokenValid(token)) {
      return token;
    }
    
    // Token is invalid/expired, remove it
    this.clearToken();
    return null;
  }

  /**
   * Clear invalid token from localStorage
   */
  static clearToken(): void {
    localStorage.removeItem('jwt');
  }

  /**
   * Get token expiry time in milliseconds
   */
  static getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return decoded.exp * 1000; // Convert to milliseconds
  }

  /**
   * Get time until token expires in milliseconds
   */
  static getTimeUntilExpiry(token: string): number | null {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) {
      return null;
    }
    
    const now = Date.now();
    return Math.max(0, expiry - now);
  }

  /**
   * Check if token will expire within the specified minutes
   */
  static willExpireSoon(token: string, withinMinutes: number = 5): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(token);
    if (timeUntilExpiry === null) {
      return true;
    }
    
    const withinMs = withinMinutes * 60 * 1000;
    return timeUntilExpiry <= withinMs;
  }
}

/**
 * Hook-like function to validate authentication state
 */
export const validateAuthState = (): {
  isAuthenticated: boolean;
  token: string | null;
  shouldRedirectToLogin: boolean;
} => {
  const token = TokenValidator.getValidToken();
  const isAuthenticated = token !== null;
  const shouldRedirectToLogin = !isAuthenticated;
  
  return {
    isAuthenticated,
    token,
    shouldRedirectToLogin
  };
};