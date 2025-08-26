 import React, { createContext, useContext, useState, useEffect } from 'react';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

const AuthContext = createContext();

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
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication on app load
    setIsLoading(true);
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedRole && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(storedRole);
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, userRole, authToken) => {
    setUser(userData);
    setRole(userRole);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
  };

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        // Only logout on authentication errors, not on other errors
        if (response.status === 401 && data.message && data.message.includes('token')) {
          console.log('Token expired or invalid, logging out');
          logout();
        }
        throw new Error(data.message || `API request failed: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      // Don't log network errors as they're common during development
      if (!error.message.includes('fetch')) {
        console.error('API call error:', error);
      }
      throw error;
    }
  };

  const value = {
    user,
    role,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    apiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};