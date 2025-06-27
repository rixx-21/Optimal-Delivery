import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API base URL - use environment variable or fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally, verify token with backend here for extra security
      // For now, do not set isAuthenticated to true on page load
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/token`, {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      await axios.post(`${API_BASE_URL}/register`, {
        username,
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    api
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

