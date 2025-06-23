import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, UserProfile } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateUserProfile: (updatedUser: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('🟡 Checking auth status...');
      
      const authenticated = await authService.isAuthenticated();
      console.log('🟡 Is authenticated:', authenticated);
      
      if (authenticated) {
        // Try to refresh token to ensure it's valid
        const newToken = await authService.refreshAccessToken();
        if (newToken) {
          console.log('🟢 Token refreshed successfully');
          setIsAuthenticated(true);
          // Fetch user profile
          try {
            const userProfile = await authService.getCurrentUserProfile();
            setUser(userProfile);
            console.log('🟢 User profile loaded:', userProfile.email);
          } catch (profileError) {
            console.error('⚠️ Failed to load user profile:', profileError);
            // Still keep authenticated if token is valid, just without user data
          }
        } else {
          console.log('🔴 Token refresh failed, clearing auth');
          await authService.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('🟡 No valid token found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('🔴 Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = (userData: UserProfile) => {
    console.log('🟢 User logged in:', userData.email);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🟡 Logging out...');
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      console.log('🟢 Logout successful');
    } catch (error) {
      console.error('🔴 Logout error:', error);
    }
  };

  // Update user profile function (for when profile is updated)
  const updateUserProfile = (updatedUser: UserProfile) => {
    console.log('🟢 User profile updated:', updatedUser.email);
    setUser(updatedUser);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    updateUserProfile,
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