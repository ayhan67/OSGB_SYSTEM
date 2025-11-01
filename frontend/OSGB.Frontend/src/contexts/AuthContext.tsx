import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getCurrentUser, setAuthToken, setOrganizationId } from '../services/api';

// Define types
interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  organizationId: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  organizationId: number | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrgId] = useState<number | null>(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      fetchCurrentUser();
    }
  }, []);

  // Token expiration check
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expiration = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          
          // If token is expired, logout
          if (now >= expiration) {
            logout();
          } else {
            // Set a timeout to logout when token expires
            const timeout = expiration - now;
            setTimeout(() => {
              logout();
            }, timeout);
          }
        } catch (error) {
          console.error('Error parsing token:', error);
          logout();
        }
      }
    };

    checkTokenExpiration();
  }, [user]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser({
        id: userData.id,
        username: userData.username,
        fullName: userData.fullName,
        role: userData.role,
        organizationId: userData.organizationId
      });
      
      if (userData.organizationId) {
        setOrgId(userData.organizationId);
        setOrganizationId(userData.organizationId);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      logout();
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    if (userData.organizationId) {
      setOrgId(userData.organizationId);
      setOrganizationId(userData.organizationId);
    }
  };

  const logout = () => {
    setUser(null);
    setOrgId(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('organizationId');
    setAuthToken('');
    setOrganizationId(0);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, organizationId }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};