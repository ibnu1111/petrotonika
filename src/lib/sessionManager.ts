// Utility for handling offline storage and session persistence

interface StorageItem {
  data: any;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

class SessionManager {
  private static instance: SessionManager;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Store data with optional expiration
  setItem(key: string, data: any, expiresIn?: number): void {
    try {
      const item: StorageItem = {
        data,
        timestamp: Date.now(),
        expiresIn
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  // Get data and check if it's expired
  getItem(key: string): any | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const item: StorageItem = JSON.parse(stored);
      
      // Check if expired
      if (item.expiresIn && Date.now() - item.timestamp > item.expiresIn) {
        this.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  // Remove item
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  }

  // Check if user session is valid
  isSessionValid(): boolean {
    const token = this.getItem('token');
    const user = this.getItem('user');
    return !!(token && user);
  }

  // Store user session with 7 days expiration
  storeUserSession(token: string, user: any): void {
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.setItem('token', token, sevenDays);
    this.setItem('user', user, sevenDays);
    this.setItem('lastActivity', Date.now());
  }

  // Update last activity
  updateActivity(): void {
    this.setItem('lastActivity', Date.now());
  }

  // Check if user has been inactive for too long
  isInactive(maxInactiveTime: number = 24 * 60 * 60 * 1000): boolean {
    const lastActivity = this.getItem('lastActivity');
    if (!lastActivity) return true;
    
    return Date.now() - lastActivity > maxInactiveTime;
  }

  // Clear all session data
  clearSession(): void {
    this.removeItem('token');
    this.removeItem('user');
    this.removeItem('lastActivity');
  }

  // Get debug info about session
  getSessionInfo(): any {
    return {
      hasToken: !!this.getItem('token'),
      hasUser: !!this.getItem('user'),
      lastActivity: this.getItem('lastActivity'),
      isValid: this.isSessionValid(),
      isInactive: this.isInactive()
    };
  }
}

export const sessionManager = SessionManager.getInstance();
export default sessionManager;
