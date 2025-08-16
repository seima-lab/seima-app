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
  refreshTransactions: () => void;
  transactionRefreshTrigger: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [transactionRefreshTrigger, setTransactionRefreshTrigger] = useState(0);

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

  // ✅ Logout function - FIXED: Chỉ clear state, không gọi NavigationService.resetToLogin()
  // VẤN ĐỀ TRƯỚC: Gọi NavigationService.resetToLogin() gây conflict với các service khác
  // GIẢI PHÁP: Chỉ clear state, AuthNavigator sẽ tự động render Login khi isAuthenticated = false
  const logout = async () => {
    try {
      console.log('🟡 Logging out...');
      
      // ✅ Xóa local state trước để UI về Login ngay
      setUser(null);
      setIsAuthenticated(false);
      
      // Gọi logout API
      await authService.logout();
      console.log('🟢 Logout successful');
      
      // ✅ KHÔNG gọi NavigationService.resetToLogin() - AuthNavigator sẽ tự động render Login
      console.log('🔄 State cleared, AuthNavigator will automatically show Login screen');
      
    } catch (error) {
      console.error('🔴 Logout error:', error);
      // ✅ Vẫn không gọi resetToLogin - chỉ clear state
      console.log('🔄 State cleared despite logout error, AuthNavigator will show Login screen');
    }
  };

  // Update user profile function (for when profile is updated)
  const updateUserProfile = (updatedUser: UserProfile) => {
    console.log('🟢 User profile updated:', updatedUser.email);
    setUser(updatedUser);
  };

  const refreshTransactions = () => {
    console.log('🔄 Triggering transaction refresh');
    setTransactionRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    updateUserProfile,
    refreshTransactions,
    transactionRefreshTrigger,
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