'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if session is valid using sessionManager
      if (!sessionManager.isSessionValid()) {
        setLoading(false);
        return;
      }

      // Check for inactivity (24 hours)
      if (sessionManager.isInactive()) {
        console.log('Session expired due to inactivity');
        sessionManager.clearSession();
        setLoading(false);
        return;
      }

      // Get user from session manager
      const savedUser = sessionManager.getItem('user');
      if (savedUser) {
        setUser(savedUser);
        sessionManager.updateActivity();
        setLoading(false);
        
        // Verify token in background without blocking UI
        setTimeout(async () => {
          try {
            await authApi.me();
            console.log('Background token verification successful');
            sessionManager.updateActivity();
          } catch (error: any) {
            console.warn('Background token verification failed');
            if (error.response?.status === 401 || error.response?.status === 403) {
              logout();
            }
          }
        }, 2000);
        
        return;
      }

      // If no cached user, verify with backend
      const response = await authApi.me();
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        sessionManager.storeUserSession(sessionManager.getItem('token'), userData);
      } else {
        console.warn('Auth verification failed:', response.data);
        sessionManager.clearSession();
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      
      // Only logout if it's a clear authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication expired, logging out');
        sessionManager.clearSession();
        setUser(null);
      } else {
        // For network errors, keep user logged in with cached data
        console.warn('Network error during auth check, using cached user data');
        const savedUser = sessionManager.getItem('user');
        if (savedUser) {
          setUser(savedUser);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { username });
      const response = await authApi.login({ username, password });
      
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        console.log('Login successful, storing session data');
        sessionManager.storeUserSession(token, userData);
        setUser(userData);
        
        return true;
      } else {
        console.log('Login failed: Invalid response structure');
        return false;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error response:', error.response?.data);
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
