import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

const NOTIFICATION_PERMISSION_ASKED_KEY = 'notification_permission_asked';

/**
 * Kiểm tra xem đã hỏi quyền notification chưa
 */
export const hasAskedNotificationPermission = async (): Promise<boolean> => {
  try {
    const asked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY);
    return asked === 'true';
  } catch (error) {
    console.error('Error checking notification permission asked status:', error);
    return false;
  }
};

/**
 * Lưu trạng thái đã hỏi quyền notification
 */
export const setNotificationPermissionAsked = async () => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
  } catch (error) {
    console.error('Error saving notification permission asked status:', error);
  }
};

/**
 * Kiểm tra quyền notification hiện tại
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Kiểm tra quyền POST_NOTIFICATIONS cho Android 13+
      if (Platform.Version >= 33) {
        const permission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return permission;
      }
    }
    
    // Kiểm tra quyền Firebase messaging
    const authStatus = await messaging().hasPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

/**
 * Yêu cầu quyền notification
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    console.log('🔔 Requesting notification permission...');
    
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      // Android 13+ - yêu cầu quyền POST_NOTIFICATIONS
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ POST_NOTIFICATIONS permission granted');
      } else {
        console.log('❌ POST_NOTIFICATIONS permission denied');
        return false;
      }
    }
    
    // Yêu cầu quyền Firebase messaging
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (enabled) {
      console.log('✅ Firebase messaging permission granted');
      
             // Tạo notification channel cho Android với heads-up support
       if (Platform.OS === 'android') {
         await notifee.createChannel({
           id: 'default',
           name: 'Default Channel',
           importance: 4, // HIGH - để hiển thị heads-up notification
           sound: 'default',
           vibration: true,
         });
         console.log('✅ Notification channel created with heads-up support');
       }
      
      // Yêu cầu quyền notifee
      await notifee.requestPermission();
      console.log('✅ Notifee permission requested');
      
      return true;
    } else {
      console.log('❌ Firebase messaging permission denied');
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Hiển thị Alert yêu cầu quyền notification
 */
export const showNotificationPermissionAlert = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Cho phép thông báo',
      'Seima cần quyền gửi thông báo để thông báo cho bạn về các giao dịch, ngân sách và các hoạt động quan trọng khác.',
      [
        {
          text: 'Không cho phép',
          style: 'cancel',
          onPress: () => {
            console.log('❌ User denied notification permission');
            resolve(false);
          },
        },
        {
          text: 'Cho phép',
          onPress: async () => {
            console.log('✅ User agreed to notification permission');
            const granted = await requestNotificationPermission();
            resolve(granted);
          },
        },
      ],
      { cancelable: false }
    );
  });
};

/**
 * Kiểm tra và yêu cầu quyền notification nếu cần
 */
export const checkAndRequestNotificationPermission = async (): Promise<void> => {
  try {
    // Kiểm tra xem đã hỏi quyền chưa
    const hasAsked = await hasAskedNotificationPermission();
    if (hasAsked) {
      console.log('🔔 Notification permission already asked, skipping...');
      return;
    }
    
    // Kiểm tra quyền hiện tại
    const hasPermission = await checkNotificationPermission();
    if (hasPermission) {
      console.log('✅ Notification permission already granted');
      await setNotificationPermissionAsked();
      return;
    }
    
    // Hiển thị Alert yêu cầu quyền
    console.log('🔔 Showing notification permission alert...');
    const granted = await showNotificationPermissionAlert();
    
    // Lưu trạng thái đã hỏi
    await setNotificationPermissionAsked();
    
    if (granted) {
      console.log('✅ Notification permission granted successfully');
    } else {
      console.log('❌ Notification permission denied by user');
    }
  } catch (error) {
    console.error('❌ Error in checkAndRequestNotificationPermission:', error);
  }
};
