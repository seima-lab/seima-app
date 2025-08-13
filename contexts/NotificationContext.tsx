import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
// Notification API calls disabled per request
import { useAuth } from './AuthContext';

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
  linkToEntity?: string;
  sender?: {
    userId: number;
    userFullName: string;
    userAvatarUrl?: string;
  };
}

interface NotificationContextType {
  // State
  latestUnreadNotification: Notification | null;
  unreadCount: number;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  
  // Utils
  hasUnreadNotifications: boolean;
  // Thêm function để mark notification đã hiển thị
  markNotificationAsDisplayed: (notificationId: number) => Promise<void>;
  isNotificationDisplayed: (notificationId: number) => boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

const DISPLAYED_NOTIFICATIONS_KEY = 'displayed_notifications';

export const  NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [latestUnreadNotification, setLatestUnreadNotification] = useState<Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track notifications đã hiển thị vĩnh viễn (AsyncStorage)
  const [displayedNotifications, setDisplayedNotifications] = useState<Set<number>>(new Set());

  // Load displayed notifications từ AsyncStorage
  const loadDisplayedNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(DISPLAYED_NOTIFICATIONS_KEY);
      if (stored) {
        const displayedIds = JSON.parse(stored);
        setDisplayedNotifications(new Set(displayedIds));
        console.log('📱 Loaded displayed notifications:', displayedIds);
      }
    } catch (err) {
      console.log('🔴 Error loading displayed notifications:', err);
    }
  };

  // Save displayed notifications to AsyncStorage
  const saveDisplayedNotifications = async (notifications: Set<number>) => {
    try {
      const notificationsArray = Array.from(notifications);
      await AsyncStorage.setItem(DISPLAYED_NOTIFICATIONS_KEY, JSON.stringify(notificationsArray));
      console.log('💾 Saved displayed notifications:', notificationsArray);
    } catch (err) {
      console.log('🔴 Error saving displayed notifications:', err);
    }
  };

  // Load latest unread notification
  const loadLatestUnreadNotification = async () => {
    if (!isAuthenticated) return;
    // Disabled: do not call API; clear latest unread
    setError(null);
    setLatestUnreadNotification(null);
  };

  // Load unread count
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    // Disabled: do not call API; set count to 0
    setUnreadCount(0);
  };

  // Load all notifications
  const loadAllNotifications = async () => {
    if (!isAuthenticated) return;
    // Disabled: do not call API; clear list
    setIsLoading(true);
    setError(null);
    setNotifications([]);
    setIsLoading(false);
  };

  // Refresh all notification data
  const refreshNotifications = async () => {
    if (!isAuthenticated) return;
    // Disabled: no API calls; ensure state is consistent
    await loadLatestUnreadNotification();
    await loadUnreadCount();
    await loadAllNotifications();
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: number) => {
    if (!isAuthenticated) return;
    
    try {
      // TODO: Implement markAsRead API call
      console.log('📝 Marking notification as read:', notificationId);
      
      // Refresh data after marking as read
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      // TODO: Implement markAllAsRead API call
      console.log('📝 Marking all notifications as read');
      
      // Refresh data after marking all as read
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error marking all notifications as read:', err);
    }
  };

  // Delete single notification
  const deleteNotification = async (notificationId: number) => {
    if (!isAuthenticated) return;
    
    try {
      // TODO: Implement deleteNotification API call
      console.log('🗑️ Deleting notification:', notificationId);
      
      // Refresh data after deletion
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error deleting notification:', err);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      // TODO: Implement deleteAllNotifications API call
      console.log('🗑️ Deleting all notifications');
      
      // Refresh data after deletion
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error deleting all notifications:', err);
    }
  };

  // Mark notification as displayed (vĩnh viễn)
  const markNotificationAsDisplayed = async (notificationId: number) => {
    const newDisplayedNotifications = new Set([...displayedNotifications, notificationId]);
    setDisplayedNotifications(newDisplayedNotifications);
    await saveDisplayedNotifications(newDisplayedNotifications);
    console.log('✅ Marked notification as displayed (permanent):', notificationId);
  };

  // Check if notification đã được hiển thị
  const isNotificationDisplayed = (notificationId: number): boolean => {
    return displayedNotifications.has(notificationId);
  };

  // Handle app state changes (foreground/background) - chỉ khi authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, refresh notifications
        console.log('🔄 App became active, refreshing notifications...');
        refreshNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]);

  // Initial load - chỉ khi authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔐 User authenticated, loading notifications...');
      // Load displayed notifications trước, sau đó load notifications
      loadDisplayedNotifications().then(() => {
        refreshNotifications();
      });
    } else {
      // Clear notification data when user logs out
      console.log('🔓 User logged out, clearing notifications...');
      setLatestUnreadNotification(null);
      setUnreadCount(0);
      setNotifications([]);
      setError(null);
      // KHÔNG clear displayed notifications khi logout (giữ vĩnh viễn)
    }
  }, [isAuthenticated]);

  // Computed values
  const hasUnreadNotifications = unreadCount > 0;

  const value: NotificationContextType = {
    // State
    latestUnreadNotification,
    unreadCount,
    notifications,
    isLoading,
    error,
    
    // Actions
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    
    // Utils
    hasUnreadNotifications,
    markNotificationAsDisplayed,
    isNotificationDisplayed,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 