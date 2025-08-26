'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/services/api';
import { sessionManager } from '@/lib/sessionManager';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      // Check if session is valid using sessionManager
      if (!sessionManager.isSessionValid()) {
        console.log('Session invalid - no token or user found');
        setLoading(false);
        return;
      }

      // Check for inactivity (24 hours) - but be more lenient
      if (sessionManager.isInactive(48 * 60 * 60 * 1000)) { // 48 hours instead of 24
        console.log('Session expired due to inactivity (48 hours)');
        sessionManager.clearSession();
        setLoading(false);
        return;
      }

      // Get user from session manager
      const savedUser = sessionManager.getItem('user');
      if (savedUser) {
        setUser(savedUser as User);
        sessionManager.updateActivity();
        setLoading(false);
        
        // Verify token in background without blocking UI - only if online
        if (navigator.onLine) {
          setTimeout(async () => {
            try {
              await authApi.me();
              console.log('Background token verification successful');
              sessionManager.updateActivity();
            } catch (error: unknown) {
              console.warn('Background token verification failed:', error);
              const errorResponse = error as { response?: { status?: number; data?: unknown } };
              // Only logout for clear auth errors, not network issues
              if (errorResponse.response?.status === 401) {
                console.log('Token expired (401), logging out');
                logout();
              } else if (errorResponse.response?.status === 403) {
                console.log('Access forbidden (403), logging out');
                logout();
              } else {
                console.log('Non-auth error during background verification, keeping user logged in');
              }
            }
          }, 3000); // Increased delay to 3 seconds
        }
        
        return;
      }

      // If no cached user, verify with backend only if online
      if (navigator.onLine) {
        const response = await authApi.me();
        if (response.data.success) {
          const userData = response.data.data as unknown as User;
          setUser(userData);
          const token = sessionManager.getItem('token');
          if (typeof token === 'string') {
            sessionManager.storeUserSession(token, response.data.data);
          }
        } else {
          console.warn('Auth verification failed:', response.data);
          sessionManager.clearSession();
        }
      }
    } catch (error: unknown) {
      console.error('Auth check failed:', error);
      
      // Only logout if it's a clear authentication error
      const errorResponse = error as { response?: { status?: number } };
      if (errorResponse.response?.status === 401 || errorResponse.response?.status === 403) {
        console.log('Authentication expired, logging out');
        sessionManager.clearSession();
        setUser(null);
      } else {
        // For network errors, keep user logged in with cached data
        console.warn('Network error during auth check, using cached user data');
        const savedUser = sessionManager.getItem('user');
        if (savedUser && typeof savedUser === 'object') {
          setUser(savedUser as User);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    // Add activity listeners to keep session alive
    const updateActivity = () => {
      if (sessionManager.isSessionValid()) {
        sessionManager.updateActivity();
      }
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity updates to once per minute
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // 1 minute
        updateActivity();
        lastUpdate = now;
      }
    };
    
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, true);
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate, true);
      });
    };
  }, [checkAuthStatus]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { username });
      const response = await authApi.login({ username, password });
      
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        console.log('Login successful, storing session data');
        sessionManager.storeUserSession(token, userData);
        setUser(userData as unknown as User);
        
        return true;
      } else {
        console.log('Login failed: Invalid response structure');
        return false;
      }
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const errorResponse = error as { response?: { data?: unknown } };
      console.error('Error response:', errorResponse.response?.data);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out user');
    sessionManager.clearSession();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
