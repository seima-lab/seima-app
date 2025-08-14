import notifee, { EventType } from '@notifee/react-native';

import messaging from '@react-native-firebase/messaging';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
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
  PendingGroupsScreenWithNav,
  ReportDetailScreenWithNav,
  ReportScreenWithNav,
  SelectCategoryScreenWithNav,
  SetBudgetLimitScreenWithNav,
  StatusInviteMemberWithNav,
  UpdateProfileScreenWithNav,
  ViewCategoryReportScreenWithNav
} from '../components/ScreenWrappers';
import TokenExpiryProvider from '../components/UserPresenceProvider';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { NotificationProvider } from '../contexts/NotificationContext';
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
import { debugLog } from '../utils/notificationDebugUtils';
import {
  handleFirebaseMessageNavigation,
  handleNotifeeEventNavigation,
  setNavigationRef
} from '../utils/notificationNavigationUtils';

// Cấu hình Stack Navigator
const Stack = createNativeStackNavigator();

// Để ẩn warning và error không cần thiết
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

if (__DEV__) {
  LogBox.ignoreAllLogs(true);
  // console.log = () => {};
  // console.info = () => {};
  // console.warn = () => {};
  // console.error = () => {};
  // console.debug = () => {};
}
if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
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

  if (!isAuthenticated) {
    return (
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator initialRouteName="MainTab" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTab" component={MainTabScreen} />
      <Stack.Screen name="AddExpenseScreen" children={(props) => <AddExpenseScreenWithNav {...props} />} />
      <Stack.Screen name="EditCategoryScreen" children={(props) => <EditCategoryScreenWithNav {...props} />} />
      <Stack.Screen name="AddEditCategoryScreen" children={(props) => <AddEditCategoryScreenWithNav {...props} />} />
      <Stack.Screen name="BudgetScreen" children={(props) => <BudgetScreenWithNav {...props} />} />
      <Stack.Screen name="FinanceScreen" children={(props) => <FinanceScreenWithNav {...props} />} />
      <Stack.Screen name="UpdateProfile" children={(props) => <UpdateProfileScreenWithNav {...props} />} />
      <Stack.Screen name="ChangePassword" children={(props) => <ChangePasswordScreenWithNav {...props} />} />
      <Stack.Screen name="ChatAI" children={(props) => <ChatAIScreenWithNav {...props} />} />
      <Stack.Screen name="GroupManagement" children={(props) => <GroupManagementScreenWithNav {...props} />} />
      <Stack.Screen name="CreateGroup" children={(props) => <CreateGroupScreenWithNav {...props} />} />
      <Stack.Screen name="GroupDetail" children={(props) => <GroupDetailTabScreenWithNav {...props} />} />
      <Stack.Screen name="EditGroup" children={(props) => <EditGroupScreenWithNav {...props} />} />
      <Stack.Screen name="GroupTransactionList" children={(props) => <GroupTransactionListScreenWithNav {...props} />} />
      <Stack.Screen name="Notifications" children={(props) => <NotificationsScreenWithNav {...props} />} />
      <Stack.Screen name="NotificationDetail" children={(props) => <NotificationDetailScreenWithNav {...props} />} />
      <Stack.Screen name="Calendar" children={(props) => <CalendarScreenWithNav {...props} />} />
      <Stack.Screen name="SetBudgetLimitScreen" children={(props) => <SetBudgetLimitScreenWithNav {...props} />} />
      <Stack.Screen name="AddWalletScreen" children={(props) => <AddWalletScreenWithNav {...props} />} />
      <Stack.Screen name="InviteUsers" children={(props) => <InviteUsersScreenWithNav {...props} />} />
      <Stack.Screen name="ApproveMembers" children={(props) => <ApproveMembersScreenWithNav {...props} />} />
      <Stack.Screen name="GroupMembers" children={(props) => <GroupMembersScreenWithNav {...props} />} />
      <Stack.Screen name="GroupSettings" children={({ route }) => <GroupSettingsScreenWithNav route={route} />} />
      <Stack.Screen name="ReportDetailScreen" children={(props) => <ReportDetailScreenWithNav {...props} />} />
      <Stack.Screen name="SelectCategoryScreen" children={(props) => <SelectCategoryScreenWithNav {...props} />} />
      <Stack.Screen name="BudgetDetailScreen" children={(props) => <BudgetDetailScreenWithNav {...props} />} />
      <Stack.Screen name="StatusInviteMember" options={{ headerShown: false }} children={({ route }) => <StatusInviteMemberWithNav route={route} />} />
      <Stack.Screen name="SelectWalletScreen" component={SelectWalletScreen} />
      <Stack.Screen name="CategoryReportDetailScreen" children={(props) => <CategoryReportDetailScreenWithNav {...props} />} />
      <Stack.Screen name="CategoryDetailReportScreen" component={require('../screens/CategoryDetailReportScreen').default} />
      <Stack.Screen name="ViewCategoryReportScreen" children={(props) => <ViewCategoryReportScreenWithNav {...props} />} />
      <Stack.Screen name="WalletTransactionHistory" component={require('../screens/WalletTransactionHistoryScreen').default} />
      <Stack.Screen name="BudgetTransactionHistoryScreen" component={require('../screens/BudgetTransactionHistoryScreen').default} />
      <Stack.Screen name="PendingGroups" children={(props) => <PendingGroupsScreenWithNav {...props} />} />
      <Stack.Screen name="ReportScreen" children={(props) => <ReportScreenWithNav {...props} />} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isLoading } = useLanguage();

  // Set navigation ref when NavigationContainer is ready - MUST be called before any conditional returns
  useEffect(() => {
    if (navigationRef?.current) {
      setNavigationRef(navigationRef.current);
      console.log('✅ [AppNavigator] Navigation ref set for notification navigation');
    }
  }, []);

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
      onReady={() => {
        // Set navigation ref when container is ready
        if (navigationRef?.current) {
          setNavigationRef(navigationRef.current);
          console.log('✅ [NavigationContainer] Ready - Navigation ref set for notification navigation');
        }
      }}
    >
      <AuthNavigator />
    </NavigationContainer>
  );
}

// Global flag to prevent multiple handler setups
let handlersInitialized = false;

export default function RootLayout() {
  const [loaded] = useFonts({
    Roboto: require('../assets/fonts/Roboto-Regular.ttf'),
    RobotoSemiBold: require('../assets/fonts/Roboto-SemiBold.ttf'),
    RobotoMedium: require('../assets/fonts/Roboto-Medium.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

const requestPermission = async () => {
  const authStatus = await messaging().requestPermission();
  console.log('Notification Permission status:', authStatus);
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    console.log('Notification permission granted');
  } else {
    console.log('Notification permission not granted');
  }
};

  useEffect(() => {
    // Prevent multiple initialization
    if (handlersInitialized) {
      console.log('🚫 [RootLayout] Handlers already initialized, skipping...');
      return;
    }
    let foregroundMessageUnsubscribe: (() => void) | null = null;
    let backgroundMessageUnsubscribe: (() => void) | null = null;
    let notifeeUnsubscribe: any = null;
    let notifeeForegroundUnsubscribe: any = null;
    
    async function setupNotification() {
      // Tạo notification channel cho Android
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });
      // Xin quyền notification
      await notifee.requestPermission();
    }
    
    const initializeNotifications = async () => {
      await setupNotification();
      BranchService.init();
      await requestPermission();
      
      // Set navigation ref for notification navigation
      if (navigationRef && navigationRef.current) {
        setNavigationRef(navigationRef.current);
        console.log('✅ [RootLayout] Navigation ref set for notification navigation');
      }
      
      // Get FCM token
      messaging().getToken().then(token => {
        console.log('FCM Token:', token);
      });
      
      // Setup message handlers
      setupMessageHandlers();
    };
    
    const setupMessageHandlers = () => {
      debugLog('Setting up notification handlers');
      console.log('🔧 [RootLayout] Setting up notification handlers...');
      
      // Handle initial notification (app opened from killed state)
      messaging().getInitialNotification().then(remoteMessage => {
        if(remoteMessage) {
          console.log('📱 [InitialNotification] Handler ID:', Date.now(), 'App opened from notification:', remoteMessage);
          // Handle navigation from initial notification
          setTimeout(() => {
            handleFirebaseMessageNavigation(remoteMessage);
          }, 1000); // Delay to ensure navigation is ready
        }
      });

      // Handle foreground messages
      foregroundMessageUnsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('📩 [onMessage - Foreground] Handler ID:', Date.now(), JSON.stringify(remoteMessage));
      
        // Check the structure of the remoteMessage object
        console.log('Notification:', remoteMessage.notification);  // Logs notification content
      
        console.log('📱 [Foreground] Showing popup for all notifications');
        
        try {
          // Show local notification for ALL notifications (including group notifications)
          await notifee.displayNotification({
            title: remoteMessage.notification?.title || 'Default Title',  // fallback title
            body: remoteMessage.notification?.body || 'Default Body',    // fallback body
            android: { channelId: 'default', pressAction: { id: 'default' } },
            data: remoteMessage.data,
          });
          console.log('✅ [Foreground] Local notification displayed successfully');
        } catch (error) {
          console.error('🔴 [Foreground] Error displaying local notification:', error);
        }
      });
      
      // Handle background to foreground via notification
      backgroundMessageUnsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('📱 [NotificationOpenedApp] Handler ID:', Date.now(), 'Background to foreground via notification:', remoteMessage);
        // Handle navigation when app is opened from background by notification
        handleFirebaseMessageNavigation(remoteMessage);
      });
      
      // Handle local notification events (BACKGROUND)
      notifeeUnsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
        switch (type) {
          case EventType.PRESS:
            console.log('📱 [NotifeeBackgroundEvent] Handler ID:', Date.now(), 'Local notification pressed:', detail);
            // Handle navigation when local notification is pressed
            if (detail?.notification) {
              handleNotifeeEventNavigation(detail.notification);
            }
            break;
          default:
            console.log('📱 [NotifeeBackgroundEvent] Handler ID:', Date.now(), 'Other background event:', type);
            break;
        }
      });
      
      // 🚨 CRITICAL: Handle local notification events (FOREGROUND)
      notifeeForegroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
        switch (type) {
          case EventType.PRESS:
            console.log('📱 [NotifeeForegroundEvent] Handler ID:', Date.now(), 'FOREGROUND notification pressed:', detail);
            // Handle navigation when local notification is pressed in foreground
            if (detail?.notification) {
              console.log('🎯 [ForegroundEvent] Triggering navigation for foreground notification tap');
              handleNotifeeEventNavigation(detail.notification);
            }
            break;
          default:
            console.log('📱 [NotifeeForegroundEvent] Handler ID:', Date.now(), 'Other foreground event:', type);
            break;
        }
      });
      
      
      // Setup background message handler
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('📩 [onBackgroundMessage] Handler ID:', Date.now(), JSON.stringify(remoteMessage));
        // Background messages are handled automatically by Firebase
      });
      
      console.log('✅ [RootLayout] Notification handlers setup complete');
    };

    // Initialize notifications
    initializeNotifications();
    
    // Mark as initialized
    handlersInitialized = true;
    debugLog('Handlers marked as initialized - setup complete');
    console.log('✅ [RootLayout] Handlers marked as initialized');
    
    // Cleanup function
    return () => {
      debugLog('Cleaning up notification handlers');
      console.log('🧹 [RootLayout] Cleaning up notification handlers...');
      
      if (foregroundMessageUnsubscribe) {
        foregroundMessageUnsubscribe();
        debugLog('Foreground message handler unsubscribed');
      }
      if (backgroundMessageUnsubscribe) {
        backgroundMessageUnsubscribe();
        debugLog('Background message handler unsubscribed');
      }
      if (notifeeUnsubscribe) {
        notifeeUnsubscribe();
        debugLog('Notifee background handler unsubscribed');
      }
      if (notifeeForegroundUnsubscribe) {
        notifeeForegroundUnsubscribe();
        debugLog('Notifee foreground handler unsubscribed');
      }
      
      // Reset flag to allow re-initialization if needed
      handlersInitialized = false;
      debugLog('Handlers flag reset - cleanup complete');
      console.log('🧹 [RootLayout] Handlers flag reset');
    };
  }, []);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <TokenExpiryProvider>
              <AppNavigator />
            </TokenExpiryProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
