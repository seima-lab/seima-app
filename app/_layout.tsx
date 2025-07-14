import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';

import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TokenExpiryProvider from '../components/UserPresenceProvider';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { navigationRef } from '../navigation/NavigationService';
import AddEditCategoryScreen from '../screens/AddEditCategoryScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddWalletScreen from '../screens/AddWalletScreen';
import ApproveMembersScreen from '../screens/ApproveMembersScreen';
import BudgetDetailScreen from '../screens/BudgetDetailScreen';
import BudgetScreen from '../screens/BudgetScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ChatAIScreen from '../screens/ChatAIScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import EditCategoryScreen from '../screens/EditCategoryScreen';
import EditGroupScreen from '../screens/EditGroupScreen';
import FinanceScreen from '../screens/FinanceScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import GroupDetailTabScreen from '../screens/GroupDetailTabScreen';
import GroupManagementScreen from '../screens/GroupManagementScreen';
import GroupMembersScreenContainer from '../screens/GroupMembersScreen';
import GroupTransactionListScreen from '../screens/GroupTransactionListScreen';
import InviteUsersScreen from '../screens/InviteUsersScreen';
import MainTabScreen from '../screens/MainTabScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OTPScreen from '../screens/OTPScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SelectCategoryScreen from '../screens/SelectCategoryScreen';
import SetBudgetLimitScreen from '../screens/SetBudgetLimitScreen';
import StatusInviteMember, { GroupMemberStatus } from '../screens/StatusInviteMember';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import UpdateProfileScreen from '../screens/update-profile';
import BranchService from '../services/branchService';
const Stack = createNativeStackNavigator();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
      <Stack.Screen name="AddExpenseScreen" component={AddExpenseScreen} />
      <Stack.Screen name="EditCategoryScreen" component={EditCategoryScreen} />
      <Stack.Screen name="AddEditCategoryScreen" component={AddEditCategoryScreen} />
      <Stack.Screen name="BudgetScreen" component={BudgetScreen} />
      <Stack.Screen name="FinanceScreen" component={FinanceScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ChatAI" component={ChatAIScreen} />
      <Stack.Screen name="GroupManagement" component={GroupManagementScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailTabScreen} />
      <Stack.Screen name="EditGroup" component={EditGroupScreen} />
      <Stack.Screen name="GroupTransactionList" component={GroupTransactionListScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="SetBudgetLimitScreen" component={SetBudgetLimitScreen} />
      <Stack.Screen name="AddWalletScreen" component={AddWalletScreen} />
      <Stack.Screen name="InviteUsers" component={InviteUsersScreen} />
      <Stack.Screen name="ApproveMembers" component={ApproveMembersScreen} />
      <Stack.Screen name="GroupMembers" component={GroupMembersScreenContainer} />
      <Stack.Screen name="ReportDetailScreen" component={ReportDetailScreen} />
      <Stack.Screen name="SelectCategoryScreen" component={SelectCategoryScreen} />
      <Stack.Screen name="BudgetDetailScreen" component={BudgetDetailScreen} />
      <Stack.Screen 
        name="StatusInviteMember" 
        options={{ headerShown: false }}
        children={({ route }) => (
          <StatusInviteMember {...route.params as { status: GroupMemberStatus }} />
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

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  useEffect(() => {
    BranchService.init();
    return () => {
      BranchService.cleanup();
    };
  }, []); // Dependencies rỗng để chỉ chạy một lần khi component mount
 
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <TokenExpiryProvider>
            <AppNavigator />
          </TokenExpiryProvider>
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
} 