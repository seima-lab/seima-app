import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export const useTokenExpiry = () => {
  const { isAuthenticated, logout } = useAuth();
  
  // Only states we need
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  // Only one timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Add ref to track modal state immediately
  const modalShownRef = useRef(false);
  
  // Clear the single timer
  const clearTimer = () => {
    if (timerRef.current) {
      console.log('🔴 Clearing timer');
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Start countdown
  const startCountdown = () => {
    // Check if modal already shown
    if (modalShownRef.current) {
      console.log('⏭️ Modal already shown, skipping');
      return;
    }
    
    // Always clear first
    clearTimer();
    
    console.log('🟡 Starting 60s countdown');
    modalShownRef.current = true;
    setShowModal(true);
    setCountdown(60);
    
    // Single recursive timer
    const tick = (remaining: number) => {
      if (remaining <= 0) {
        console.log('🔴 Time up - logout');
        modalShownRef.current = false;
        setShowModal(false);
        logout();
        return;
      }
      
      console.log(`⏰ ${remaining}s remaining`);
      setCountdown(remaining);
      
      // Schedule next tick
      timerRef.current = setTimeout(() => tick(remaining - 1), 1000);
    };
    
    tick(60);
  };
  
  // User chose to refresh
  const handleRefresh = async () => {
    console.log('🟡 User refresh');
    
    // Stop timer immediately
    clearTimer();
    modalShownRef.current = false;
    setShowModal(false);
    
    try {
      const newToken = await authService.refreshAccessToken();
      if (newToken) {
        console.log('🟢 Token refreshed successfully');
        Alert.alert('Thành công', 'Phiên đăng nhập đã được gia hạn!');
      } else {
        console.log('🔴 Refresh failed');
        logout();
      }
    } catch (error) {
      console.log('🔴 Refresh error');
      logout();
    }
  };
  
  // User chose to logout
  const handleLogout = () => {
    console.log('🟡 User logout');
    clearTimer();
    modalShownRef.current = false;
    setShowModal(false);
    logout();
  };
  
  // Check token status
  const checkToken = async () => {
    // Don't check if modal is already showing or user not authenticated
    if (!isAuthenticated || modalShownRef.current) {
      console.log('⏭️ Skipping check - modal showing or not authenticated');
      return;
    }
    
    try {
      const { isExpired, isNearExpiry } = await authService.checkTokenExpiry();
      
      if (isExpired) {
        console.log('🔴 Token expired');
        logout();
        return;
      }
      
      if (isNearExpiry) {
        console.log('🟡 Token near expiry - showing modal');
        startCountdown();
      }
    } catch (error) {
      console.error('🔴 Check token error:', error);
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    clearTimer();
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    modalShownRef.current = false;
    setShowModal(false);
  };
  
  // Main effect
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🟢 Starting token monitoring');
      
      // Check immediately
      checkToken();
      
      // Check every 30 seconds
      checkIntervalRef.current = setInterval(checkToken, 30000);
      
      return cleanup;
    } else {
      cleanup();
    }
  }, [isAuthenticated]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);
  
  return {
    showTokenExpiryModal: showModal,
    tokenExpiryRemainingTime: countdown,
    handleTokenExpiryRefresh: handleRefresh,
    handleTokenExpiryLogout: handleLogout,
  };
}; 