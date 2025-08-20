import axios from 'axios';
import { sessionManager } from './sessionManager';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://simamen.belakanglayar.com/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'https://simamen.belakanglayar.com/api');

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data
    });
    
    const token = sessionManager.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Update activity on each API call
      sessionManager.updateActivity();
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      code: error.code
    });
    
    // Only redirect to login for clear authentication errors
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - clearing session');
      sessionManager.clearSession();
      
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // For network errors, don't auto-logout
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.warn('Network error detected, not logging out user');
    }
    
    return Promise.reject(error);
  }
);

export default api;
