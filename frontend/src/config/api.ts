import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Ensure consistent response format
    if (response.data && typeof response.data === 'object') {
      // Add timestamp if not present
      if (!response.data.timestamp) {
        response.data.timestamp = new Date().toISOString();
      }
      // Ensure success field is present
      if (typeof response.data.success !== 'boolean') {
        response.data.success = response.status >= 200 && response.status < 300;
      }
    }
    return response;
  },
  (error) => {
    // Don't auto-redirect on 401 for auth endpoints - let the component handle it
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      // Handle unauthorized access for non-auth endpoints
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    
    // Standardize error response format
    if (error.response && error.response.data) {
      if (!error.response.data.success) {
        error.response.data.success = false;
      }
      if (!error.response.data.timestamp) {
        error.response.data.timestamp = new Date().toISOString();
      }
      // Ensure error field exists
      if (!error.response.data.error && !error.response.data.message) {
        error.response.data.error = {
          type: 'unknown',
          message: 'An error occurred'
        };
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;