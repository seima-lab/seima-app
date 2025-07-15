import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getNotifications } from '../services/notificationService';

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

interface UseNotificationReturn {
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
}

export const useNotification = (): UseNotificationReturn => {
  const [latestUnreadNotification, setLatestUnreadNotification] = useState<Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load latest unread notification
  const loadLatestUnreadNotification = useCallback(async () => {
    try {
      setError(null);
      const response = await getNotifications({
        page: 0,
        size: 1,
        is_read: false,
      });
      
      const apiData = (response.data && typeof response.data === 'object' && 'content' in response.data) 
        ? (response.data as any).content : [];
      
      if (apiData.length > 0) {
        const notification = apiData[0];
        setLatestUnreadNotification(notification);
        console.log('📱 Latest unread notification loaded:', notification);
      } else {
        setLatestUnreadNotification(null);
      }
    } catch (err) {
      console.log('🔴 Error loading latest unread notification:', err);
      setError('Failed to load latest notification');
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await getNotifications({
        page: 0,
        size: 1000, // Lấy tất cả để đếm
        is_read: false,
      });
      
      const apiData = (response.data && typeof response.data === 'object' && 'content' in response.data) 
        ? (response.data as any).content : [];
      
      setUnreadCount(apiData.length);
    } catch (err) {
      console.log('🔴 Error loading unread count:', err);
    }
  }, []);

  // Load all notifications
  const loadAllNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getNotifications({
        page: 0,
        size: 50, // Lấy 50 notification gần nhất
      });
      
      const apiData = (response.data && typeof response.data === 'object' && 'content' in response.data) 
        ? (response.data as any).content : [];
      
      setNotifications(apiData);
    } catch (err) {
      console.log('🔴 Error loading all notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh all notification data
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      loadLatestUnreadNotification(),
      loadUnreadCount(),
      loadAllNotifications(),
    ]);
  }, [loadLatestUnreadNotification, loadUnreadCount, loadAllNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // TODO: Implement markAsRead API call
      console.log('📝 Marking notification as read:', notificationId);
      
      // Refresh data after marking as read
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error marking notification as read:', err);
    }
  }, [refreshNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // TODO: Implement markAllAsRead API call
      console.log('📝 Marking all notifications as read');
      
      // Refresh data after marking all as read
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error marking all notifications as read:', err);
    }
  }, [refreshNotifications]);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      // TODO: Implement deleteNotification API call
      console.log('🗑️ Deleting notification:', notificationId);
      
      // Refresh data after deletion
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error deleting notification:', err);
    }
  }, [refreshNotifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      // TODO: Implement deleteAllNotifications API call
      console.log('🗑️ Deleting all notifications');
      
      // Refresh data after deletion
      await refreshNotifications();
    } catch (err) {
      console.log('🔴 Error deleting all notifications:', err);
    }
  }, [refreshNotifications]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
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
  }, [refreshNotifications]);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Computed values
  const hasUnreadNotifications = unreadCount > 0;

  return {
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
  };
}; 