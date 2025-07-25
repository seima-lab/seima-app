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
  ReportDetailScreenWithNav,
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
      <Stack.Screen name="ViewCategoryReportScreen" children={(props) => <ViewCategoryReportScreenWithNav {...props} />} />
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
    <NavigationContainer ref={navigationRef}>
      <AuthNavigator />
    </NavigationContainer>
  );
}

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
    async function setupNotification() {
      // Tạo notification channel cho Android
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });
      // Xin quyền notification
      await notifee.requestPermission();
    }
    setupNotification();
    BranchService.init();
    requestPermission();
    messaging().getToken().then(token => {
      console.log('FCM Token:', token);
    });
  messaging().getInitialNotification().then(remoteMessage => {
    if(remoteMessage) {
      console.log('Initial notification:', remoteMessage);
 
    }
  });

  messaging().onMessage(async remoteMessage => {
    console.log('📩 [onMessage - Foreground]', JSON.stringify(remoteMessage));
  
    // Check the structure of the remoteMessage object
    console.log('Notification:', remoteMessage.notification);  // Logs notification content
  
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Default Title',  // fallback title
      body: remoteMessage.notification?.body || 'Default Body',    // fallback body
      android: { channelId: 'default', pressAction: { id: 'default' } },
      data: remoteMessage.data,
    });
  });
  
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification caused app to open from background state:', remoteMessage);
  });
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    switch (type) {
      case EventType.PRESS:
        // Xử lý sự kiện khi người dùng nhấn vào thông báo
        console.log('LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO', detail);
        break;
      default:
        console.log('Sự kiện nền khác:', type);
        break;
    }
  });
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📩 [onBackgroundMessage]', JSON.stringify(remoteMessage));
    
  });
  //   requestPermission();
  //   messaging()
  //   .requestPermission()
  //   .then(authStatus => {
  //     console.log('Notification Permission status:', authStatus);
  //   });

  // // Get FCM token
  // messaging()
  //   .getToken()
  //   .then(token => {
  //     console.log('FCM Token:', token);
  //     // Send this token to backend to register for push notifications
  //   });

  // Handle foreground message
  // const unsubscribeMsg = messaging().onMessage(async remoteMessage => {
  //   console.log('📩 [onMessage - Foreground]', JSON.stringify(remoteMessage));
  //   await notifee.displayNotification({
  //     title: remoteMessage.notification?.title,
  //     body: remoteMessage.notification?.body,
  //     android: { channelId: 'default', pressAction: { id: 'default' } },
  //     data: remoteMessage.data,
  //   });
  // });

  // // Handle background message
  // messaging().setBackgroundMessageHandler(async remoteMessage => {
  //   console.log('📩 [onBackgroundMessage]', JSON.stringify(remoteMessage));
  // });
    return () => {
      BranchService.cleanup();
      // unsubscribeMsg();
    messaging().unsubscribeFromTopic('all');
      // console.log('[Notification] Handlers unsubscribed');
    };
  }, []); // Dependency array rỗng vì bạn chỉ muốn thực thi hàm này một lần khi component mount

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
