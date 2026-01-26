import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types/auth';
import { AuthService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to validate user data
  const isValidUser = (userData: any): userData is User => {
    return userData && 
           typeof userData.id === 'string' &&
           typeof userData.username === 'string' &&
           typeof userData.firstName === 'string' &&
           typeof userData.lastName === 'string' &&
           typeof userData.email === 'string' &&
           typeof userData.role === 'string' &&
           typeof userData.isActive === 'boolean';
  };

  useEffect(() => {
    // Check if user is already logged in on app start
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        const currentUser = AuthService.getCurrentUser();
        
        if (token && currentUser && isValidUser(currentUser)) {
          // Set user from localStorage first for better UX
          setUser(currentUser);
          
          // Try to verify token and refresh user data
          try {
            const profile = await AuthService.getProfile();
            if (isValidUser(profile)) {
              setUser(profile); // Update with fresh data
            }
          } catch (profileError) {
            // If profile call fails, keep the user from localStorage
            // but don't log out - token might still be valid
            console.warn('Failed to refresh user profile:', profileError);
          }
        }
      } catch (error) {
        // Only logout if there's a serious error
        console.error('Auth initialization error:', error);
        AuthService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const authData = await AuthService.login(credentials);
      if (isValidUser(authData.user)) {
        setUser(authData.user);
      } else {
        throw new Error('Invalid user data received from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await AuthService.getProfile();
      if (isValidUser(profile)) {
        setUser(profile);
      } else {
        throw new Error('Invalid user data received from server');
      }
    } catch (error) {
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};