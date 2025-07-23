import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SecureStore from 'expo-secure-store';

import { useEffect } from 'react';
import { ActivityIndicator, LogBox, PermissionsAndroid, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
    AddEditCategoryScreenWithNav,
    AddExpenseScreenWithNav,
    AddWalletScreenWithNav,
    ApproveMembersScreenWithNav,
    BudgetDetailScreenWithNav,
    BudgetScreenWithNav,
    CalendarScreenWithNav,
    CategoryReportDetailScreenWithNav,
    ChangePasswordScreenWithNav,
    ChatAIScreenWithNav,
    CreateGroupScreenWithNav,
    EditCategoryScreenWithNav,
    EditGroupScreenWithNav,
    FinanceScreenWithNav,
    GroupDetailTabScreenWithNav,
    GroupManagementScreenWithNav,
    GroupMembersScreenWithNav,
    GroupSettingsScreenWithNav,
    GroupTransactionListScreenWithNav,
    InviteUsersScreenWithNav,
    NotificationDetailScreenWithNav,
    NotificationsScreenWithNav,
    ReportDetailScreenWithNav,
    SelectCategoryScreenWithNav,
    SetBudgetLimitScreenWithNav,
    StatusInviteMemberWithNav,
    UpdateProfileScreenWithNav
} from '../components/ScreenWrappers';
import TokenExpiryProvider from '../components/UserPresenceProvider';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';
import '../i18n';
import { navigationRef } from '../navigation/NavigationService';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import LoginScreen from '../screens/login';
import MainTabScreen from '../screens/MainTabScreen';
import OTPScreen from '../screens/OTPScreen';
import RegisterScreen from '../screens/register';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SelectWalletScreen from '../screens/SelectWalletScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import BranchService from '../services/branchService';
import { getUnreadNotifications, type Notification } from '../services/notificationService';
import { isMockNotificationShown, markMockNotificationAsShown } from '../utils/notificationUtils';
const Stack = createNativeStackNavigator();

// Prevent the splash screen from auto-hiding before asset loading is complete.
// Hide yellow box warnings and red box errors from showing on screen
LogBox.ignoreLogs([
  'Warn: ',
  'Warning: ',
  'ERROR',
  '🔴',
  'AuthService',
  'Email login failed',
  'Google Sign-In failed',
  'Invalid email or password'
]);

// In development, you can also completely disable the error overlay
if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

function AuthNavigator() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  // Determine screens based on authentication state
  if (!isAuthenticated) {
    // Unauthenticated stack - only auth screens
    return (
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  // Authenticated stack - all app screens
  return (
    <Stack.Navigator 
      initialRouteName="MainTab"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        statusBarStyle: 'light',
        statusBarBackgroundColor: 'transparent',
        gestureEnabled: false,
      }}
    >
      {/* Main app screens - only available when authenticated */}
      <Stack.Screen name="MainTab" component={MainTabScreen} />
      <Stack.Screen 
        name="AddExpenseScreen" 
        children={(props) => (
          <AddExpenseScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="EditCategoryScreen" 
        children={(props) => (
          <EditCategoryScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="AddEditCategoryScreen" 
        children={(props) => (
          <AddEditCategoryScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="BudgetScreen" 
        children={(props) => (
          <BudgetScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="FinanceScreen" 
        children={(props) => (
          <FinanceScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="UpdateProfile" 
        children={(props) => (
          <UpdateProfileScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="ChangePassword" 
        children={(props) => (
          <ChangePasswordScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="ChatAI" 
        children={(props) => (
          <ChatAIScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="GroupManagement" 
        children={(props) => (
          <GroupManagementScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="CreateGroup" 
        children={(props) => (
          <CreateGroupScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="GroupDetail" 
        children={(props) => (
          <GroupDetailTabScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="EditGroup" 
        children={(props) => (
          <EditGroupScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="GroupTransactionList" 
        children={(props) => (
          <GroupTransactionListScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="Notifications" 
        children={(props) => (
          <NotificationsScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="NotificationDetail" 
        children={(props) => (
          <NotificationDetailScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="Calendar" 
        children={(props) => (
          <CalendarScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="SetBudgetLimitScreen" 
        children={(props) => (
          <SetBudgetLimitScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="AddWalletScreen" 
        children={(props) => (
          <AddWalletScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="InviteUsers" 
        children={(props) => (
          <InviteUsersScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="ApproveMembers" 
        children={(props) => (
          <ApproveMembersScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="GroupMembers" 
        children={(props) => (
          <GroupMembersScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="GroupSettings" 
        children={({ route }) => (
          <GroupSettingsScreenWithNav route={route} />
        )}
      />
      <Stack.Screen 
        name="ReportDetailScreen" 
        children={(props) => (
          <ReportDetailScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="SelectCategoryScreen" 
        children={(props) => (
          <SelectCategoryScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="BudgetDetailScreen" 
        children={(props) => (
          <BudgetDetailScreenWithNav {...props} />
        )}
      />
      <Stack.Screen 
        name="StatusInviteMember" 
        options={{ headerShown: false }}
        children={({ route }) => (
          <StatusInviteMemberWithNav route={route} />
        )}
      />
      <Stack.Screen 
        name="SelectWalletScreen" 
        component={SelectWalletScreen} 
      />
      <Stack.Screen 
        name="CategoryReportDetailScreen" 
        children={(props) => (
          <CategoryReportDetailScreenWithNav {...props} />
        )}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isLoading } = useLanguage();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      theme={{
        dark: false,
        colors: {
          primary: '#1e90ff',
          background: '#fff',
          card: '#fff',
          text: '#000',
          border: 'transparent',
          notification: '#ff453a',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '800',
          },
        },
      }}
    >
      <AuthNavigator />
    </NavigationContainer>
  );
}

// Component để xử lý notification khi app khởi động
const NotificationHandler = () => {
  const { isAuthenticated } = useAuth();
  const { 
    markNotificationAsDisplayed, 
    isNotificationDisplayed,
    markAsRead 
  } = useNotification();

  // Debug function để xem tất cả notification ID đã lưu
  const debugDisplayedNotifications = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const stored = await AsyncStorage.getItem('displayed_notifications');
      if (stored) {
        const displayedIds = JSON.parse(stored);
        console.log('🗃️ ASYNCSTORAGE DEBUG: Danh sách notification ID đã lưu vĩnh viễn:', displayedIds);
        console.log('📊 ASYNCSTORAGE DEBUG: Tổng số notification đã hiển thị:', displayedIds.length);
      } else {
        console.log('🗃️ ASYNCSTORAGE DEBUG: Chưa có notification nào được lưu');
      }
    } catch (error) {
      console.log('🔴 ASYNCSTORAGE DEBUG ERROR:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Hàm để hiển thị tất cả notification chưa đọc
      const displayAllUnreadNotifications = async () => {
        try {
          console.log('🔔 Đang lấy danh sách notification chưa đọc...');
          console.log('📱 AsyncStorage: Đang load danh sách notification đã hiển thị từ thiết bị...');
          
          // Debug: Hiển thị tất cả notification ID đã lưu
          await debugDisplayedNotifications();
          
          // Lấy tất cả notification chưa đọc
          const response = await getUnreadNotifications({ size: 50 }); // Giới hạn 50 notification
          
          // Safely access the paginated response data
          const responseData = response?.data as any;
          const unreadNotifications: Notification[] = Array.isArray(responseData?.content) ? responseData.content : [];
          
          console.log('🔔 Số lượng notification chưa đọc:', unreadNotifications.length);
          console.log('🔔 Chi tiết notifications:', unreadNotifications);
          console.log('🔔 Full API response:', responseData);
          
          if (unreadNotifications.length > 0) {
            let displayedCount = 0;
            let skippedCount = 0;
            
            // Hiển thị từng notification một
            for (let i = 0; i < unreadNotifications.length; i++) {
              const notification = unreadNotifications[i];
              const notificationId = notification.notification_id;
              
              // Kiểm tra xem notification này đã hiển thị chưa
              const alreadyDisplayed = isNotificationDisplayed(notificationId);
              console.log(`🔔 Notification ID ${notificationId}: "${notification.title}" - Đã hiển thị: ${alreadyDisplayed ? '✅ CÓ' : '❌ CHƯA'}`);
              
              if (!alreadyDisplayed) {
                // Delay giữa các notification để tránh spam
                if (displayedCount > 0) {
                  console.log(`⏳ Delay 1 giây trước khi hiển thị notification tiếp theo...`);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 giây
                }
                
                console.log(`🔔 Hiển thị notification ${displayedCount + 1} - ID: ${notificationId} - "${notification.title}"`);
                
                await notifee.displayNotification({
                  id: `unread_${notificationId}_${Date.now()}`, // Thêm timestamp để đảm bảo unique
                  title: notification.title || 'Thông báo mới',
                  body: notification.message || 'Bạn có thông báo mới',
                  data: {
                    notificationId: notificationId.toString(),
                    type: notification.notification_type,
                    linkToEntity: notification.link_to_entity || ''
                  },
                  android: {
                    channelId: 'default',
                    pressAction: {
                      id: 'default',
                    },
                    smallIcon: 'ic_launcher',
                    color: '#1e90ff',
                    importance: 4, // HIGH importance
                    showTimestamp: true,
                    timestamp: new Date(notification.created_at).getTime(),
                    // Thêm sound và vibration để đảm bảo notification được chú ý
                    sound: 'default',
                    vibrationPattern: [300, 500],
                  },
                  ios: {
                    foregroundPresentationOptions: {
                      badge: true,
                      sound: true,
                      banner: true,
                      list: true,
                    },
                    // Thêm interruptionLevel để đảm bảo hiển thị
                    interruptionLevel: 'active',
                  }
                });
                
                console.log(`✅ Đã hiển thị notification ID: ${notificationId} - "${notification.title}"`);
                
                // Đánh dấu đã hiển thị và lưu vào AsyncStorage
                console.log(`💾 Bắt đầu lưu trạng thái vào AsyncStorage cho notification ID: ${notificationId}`);
                await markNotificationAsDisplayed(notificationId);
                console.log(`✅ Đã lưu VĨNH VIỄN vào AsyncStorage - Notification ID: ${notificationId} sẽ không hiển thị lần nữa`);
                
                displayedCount++;
              } else {
                console.log(`⏭️ Bỏ qua notification ID: ${notificationId} - "${notification.title}" (đã hiển thị trước đó)`);
                skippedCount++;
              }
            }
            
            console.log(`🎯 Tổng kết: Hiển thị ${displayedCount} notification mới, bỏ qua ${skippedCount} notification đã hiển thị`);
            console.log('🔔 Đã xử lý tất cả notification chưa đọc khi app khởi động');
          } else {
            console.log('🔔 Không có notification chưa đọc nào');
          }
        } catch (error) {
          console.log('🔴 Lỗi khi hiển thị notification chưa đọc:', error);
        }
      };
      
      // Delay 2 giây để đảm bảo app đã load xong
      const timer = setTimeout(displayAllUnreadNotifications, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  return null; // Component này không render gì
};

// Component để hiển thị thông báo mock một lần duy nhất
const MockNotificationHandler = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔔 MockNotificationHandler: User đã đăng nhập, chuẩn bị hiển thị thông báo mock...');
      
      const showMockNotification = async () => {
        try {
          console.log('🔔 MockNotificationHandler: Bắt đầu kiểm tra trạng thái thông báo mock...');
          
          // Kiểm tra xem đã hiển thị thông báo mock chưa
          const mockNotificationShown = await isMockNotificationShown();
          console.log('🔔 MockNotificationHandler: Trạng thái thông báo mock:', mockNotificationShown);
          
          if (!mockNotificationShown) {
            console.log('🔔 MockNotificationHandler: Chuẩn bị hiển thị thông báo mock...');
            
            // Tạo thông báo mock với cấu hình hiển thị popup
            const notificationId = await notifee.displayNotification({
              id: 'mock_notification',
              title: '🎉 Chào mừng đến với Seima!',
              body: 'Đây là thông báo demo. Bạn sẽ chỉ thấy nó một lần duy nhất.',
              android: {
                channelId: 'default',
                pressAction: {
                  id: 'default',
                },
                // Thêm icon và màu sắc
                smallIcon: 'ic_launcher',
                color: '#1e90ff',
                // Cấu hình để hiển thị popup ngay cả khi app đang foreground
                importance: 4, // HIGH importance
                // Thêm action buttons
                actions: [
                  {
                    title: 'Xem chi tiết',
                    pressAction: {
                      id: 'view_details',
                    },
                  },
                  {
                    title: 'Đóng',
                    pressAction: {
                      id: 'dismiss',
                    },
                  },
                ],
                // Cấu hình để hiển thị popup
                showTimestamp: true,
                timestamp: Date.now(),
                // Thêm sound và vibration
                sound: 'default',
                vibrationPattern: [300, 500],
              },
              ios: {
                foregroundPresentationOptions: {
                  badge: true,
                  sound: true,
                  banner: true,
                  list: true,
                },
                // Thêm cấu hình để hiển thị popup trên iOS
                interruptionLevel: 'active',
              }
            });
            
            console.log('🔔 MockNotificationHandler: Notification ID:', notificationId);
            
            // Đánh dấu đã hiển thị thông báo mock
            await markMockNotificationAsShown();
            
            console.log('🔔 Đã hiển thị thông báo mock thành công!');
          } else {
            console.log('🔔 Thông báo mock đã được hiển thị trước đó');
          }
        } catch (error) {
          console.log('🔴 Lỗi hiển thị thông báo mock:', error);
        }
      };
      
      // Delay 3 giây để đảm bảo app đã load xong và permission đã được xử lý
      console.log('🔔 MockNotificationHandler: Đặt timer 3 giây để hiển thị thông báo...');
      const timer = setTimeout(showMockNotification, 3000);
      
      return () => {
        console.log('🔔 MockNotificationHandler: Clear timer');
        clearTimeout(timer);
      };
    } else {
      console.log('🔔 MockNotificationHandler: User chưa đăng nhập');
    }
  }, [isAuthenticated]);

  return null; // Component này không render gì
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Roboto: require('../assets/fonts/Roboto-Regular.ttf'),
    RobotoSemiBold: require('../assets/fonts/Roboto-SemiBold.ttf'),
    RobotoMedium: require('../assets/fonts/Roboto-Medium.ttf'),

    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    BranchService.init();
    
    const init = async () => {
      try {
        // Tạo notification channel cho Android
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            sound: 'default',
            importance: 4, // HIGH importance
            vibration: true,
            vibrationPattern: [300, 500],
          });
          console.log('📱 Đã tạo notification channel cho Android');
        }

        await messaging().registerDeviceForRemoteMessages();
  
        // Request notification permission cho Android 13+
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Thông báo',
              message: 'Ứng dụng cần quyền gửi thông báo.',
              buttonPositive: 'Cho phép',
              buttonNegative: 'Không cho phép',
              buttonNeutral: 'Hỏi sau'
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('🔴 Quyền thông báo bị từ chối');
            return;
          }
          console.log('✅ Quyền thông báo đã được cấp');
        }
        
        // Request FCM permission
        const authStatus = await messaging().requestPermission();
        console.log('📨 FCM Permission status:', authStatus);
        
        if (
          authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
          authStatus !== messaging.AuthorizationStatus.PROVISIONAL
        ) {
          console.log('🔴 FCM permission bị từ chối');
          return;
        }
  
        const fcmToken = await messaging().getToken();
        console.log('📨 FCM Token:', fcmToken);
        // TODO: gửi token lên backend
      } catch (error) {
        console.log('🔴 Lỗi khởi tạo notification:', error);
      }
    };
  
    init();
    return () => {
      BranchService.cleanup();
    };
  }, []); // Dependencies rỗng để chỉ chạy một lần khi component mount
 
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('access_token');
      console.log('🔑 ACCESS TOKEN:', token);
    })();
  }, []);

  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <TokenExpiryProvider>
              <AppNavigator />
              <NotificationHandler />
              <MockNotificationHandler />
            </TokenExpiryProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
} 