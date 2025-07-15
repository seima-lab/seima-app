import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Kiểm tra trạng thái notification và permission
 */
export const checkNotificationStatus = async (): Promise<{
  hasPermission: boolean;
  channels: any[];
  mockShown: boolean;
}> => {
  try {
    // Kiểm tra permission (sử dụng cách khác)
    let hasPermission = false;
    try {
      // Thử tạo một notification test để kiểm tra permission
      await notifee.displayNotification({
        id: 'test_permission',
        title: 'Test Permission',
        body: 'Testing permission...',
        android: { channelId: 'default' }
      });
      hasPermission = true;
      // Xóa notification test ngay lập tức
      await notifee.cancelNotification('test_permission');
    } catch (error) {
      hasPermission = false;
    }
    
    console.log('🔔 Notification permission:', hasPermission);
    
    // Lấy danh sách channels (Android)
    const channels = Platform.OS === 'android' ? await notifee.getChannels() : [];
    console.log('🔔 Notification channels:', channels);
    
    // Kiểm tra trạng thái mock notification
    const mockShown = await isMockNotificationShown();
    console.log('🔔 Mock notification shown:', mockShown);
    
    return {
      hasPermission,
      channels,
      mockShown
    };
  } catch (error) {
    console.log('🔴 Lỗi kiểm tra trạng thái notification:', error);
    return {
      hasPermission: false,
      channels: [],
      mockShown: false
    };
  }
};

/**
 * Reset thông báo mock để có thể hiển thị lại
 */
export const resetMockNotification = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('mock_notification_shown');
    console.log('🔄 Đã reset thông báo mock');
  } catch (error) {
    console.log('🔴 Lỗi reset thông báo mock:', error);
  }
};

/**
 * Kiểm tra xem thông báo mock đã được hiển thị chưa
 */
export const isMockNotificationShown = async (): Promise<boolean> => {
  try {
    const mockNotificationShown = await AsyncStorage.getItem('mock_notification_shown');
    return mockNotificationShown === 'true';
  } catch (error) {
    console.log('🔴 Lỗi kiểm tra thông báo mock:', error);
    return false;
  }
};

/**
 * Đánh dấu thông báo mock đã được hiển thị
 */
export const markMockNotificationAsShown = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem('mock_notification_shown', 'true');
    console.log('✅ Đã đánh dấu thông báo mock đã hiển thị');
  } catch (error) {
    console.log('🔴 Lỗi đánh dấu thông báo mock:', error);
  }
};

/**
 * Test hiển thị thông báo ngay lập tức
 */
export const testNotificationImmediately = async (): Promise<void> => {
  try {
    console.log('🔔 Test notification: Bắt đầu hiển thị thông báo test...');
    
    const notificationId = await notifee.displayNotification({
      id: 'test_notification',
      title: '🧪 Test Notification',
      body: 'Đây là thông báo test để kiểm tra hệ thống notification!',
      android: {
        channelId: 'default',
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_launcher',
        color: '#ff6b6b',
        // Cấu hình để hiển thị popup ngay cả khi app đang foreground
        importance: 4, // HIGH importance
        showTimestamp: true,
        timestamp: Date.now(),
        sound: 'default',
        vibrationPattern: [300, 500],
        actions: [
          {
            title: 'OK',
            pressAction: {
              id: 'ok',
            },
          },
        ],
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        interruptionLevel: 'active',
      }
    });
    
    console.log('🔔 Test notification: Đã hiển thị thành công với ID:', notificationId);
  } catch (error) {
    console.log('🔴 Lỗi test notification:', error);
    throw error;
  }
};

/**
 * Test hiển thị thông báo khi app đang background
 */
export const testBackgroundNotification = async (): Promise<void> => {
  try {
    console.log('🔔 Background notification: Bắt đầu delay 10 giây...');
    
    // Delay 10 giây trước khi hiển thị notification
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🔔 Background notification: Hiển thị thông báo sau 10 giây...');
    
    const notificationId = await notifee.displayNotification({
      id: 'background_notification',
      title: '🌙 Background Notification (10s)',
      body: 'Thông báo này hiển thị sau 10 giây! Hãy minimize app để thấy popup.',
      android: {
        channelId: 'default',
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_launcher',
        color: '#9c27b0',
        importance: 4,
        showTimestamp: true,
        timestamp: Date.now(),
        sound: 'default',
        vibrationPattern: [300, 500, 300, 500],
        actions: [
          {
            title: 'Mở App',
            pressAction: {
              id: 'open_app',
            },
          },
          {
            title: 'Đóng',
            pressAction: {
              id: 'dismiss',
            },
          },
        ],
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        interruptionLevel: 'active',
      }
    });
    
    console.log('🔔 Background notification: Đã hiển thị thành công với ID:', notificationId);
  } catch (error) {
    console.log('🔴 Lỗi background notification:', error);
    throw error;
  }
};

/**
 * Test hiển thị thông báo khi app đang background (thực sự)
 */
export const testRealBackgroundNotification = async (): Promise<void> => {
  try {
    console.log('🔔 Real background notification: Bắt đầu delay 10 giây...');
    
    // Delay 10 giây trước khi hiển thị notification
    // Trong thời gian này, user nên minimize app
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🔔 Real background notification: Hiển thị thông báo sau 10 giây...');
    
    const notificationId = await notifee.displayNotification({
      id: 'real_background_notification',
      title: '📱 Real Background Test',
      body: 'Thông báo này hiển thị khi app đang chạy nền! Nếu bạn thấy popup này, test thành công!',
      android: {
        channelId: 'default',
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_launcher',
        color: '#ff5722',
        importance: 4,
        showTimestamp: true,
        timestamp: Date.now(),
        sound: 'default',
        vibrationPattern: [300, 500, 300, 500, 300, 500],
        actions: [
          {
            title: 'Mở App',
            pressAction: {
              id: 'open_app',
            },
          },
          {
            title: 'Test OK',
            pressAction: {
              id: 'test_ok',
            },
          },
        ],
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        interruptionLevel: 'active',
      }
    });
    
    console.log('🔔 Real background notification: Đã hiển thị thành công với ID:', notificationId);
  } catch (error) {
    console.log('🔴 Lỗi real background notification:', error);
    throw error;
  }
};

/**
 * Test hiển thị thông báo khi app đang background với đếm ngược
 */
export const testBackgroundNotificationWithCountdown = async (onCountdown?: (seconds: number) => void): Promise<void> => {
  try {
    console.log('🔔 Background notification: Bắt đầu đếm ngược 10 giây...');
    
    // Đếm ngược từ 10 đến 1
    for (let i = 10; i > 0; i--) {
      console.log(`🔔 Background notification: Còn ${i} giây...`);
      if (onCountdown) {
        onCountdown(i);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🔔 Background notification: Hiển thị thông báo!');
    
    const notificationId = await notifee.displayNotification({
      id: 'background_notification_countdown',
      title: '⏰ Background Notification (10s)',
      body: 'Thông báo này hiển thị sau 10 giây đếm ngược!',
      android: {
        channelId: 'default',
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_launcher',
        color: '#ff5722',
        importance: 4,
        showTimestamp: true,
        timestamp: Date.now(),
        sound: 'default',
        vibrationPattern: [300, 500, 300, 500, 300, 500],
        actions: [
          {
            title: 'Mở App',
            pressAction: {
              id: 'open_app',
            },
          },
          {
            title: 'Đóng',
            pressAction: {
              id: 'dismiss',
            },
          },
        ],
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        interruptionLevel: 'active',
      }
    });
    
    console.log('🔔 Background notification: Đã hiển thị thành công với ID:', notificationId);
  } catch (error) {
    console.log('🔴 Lỗi background notification:', error);
    throw error;
  }
}; 