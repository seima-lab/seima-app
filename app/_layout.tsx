import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import AddBudgetCategoryScreen from '../screens/AddBudgetCategoryScreen';
import AddEditCategoryScreen from '../screens/AddEditCategoryScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddWalletScreen from '../screens/AddWalletScreen';
import BudgetScreen from '../screens/BudgetScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ChatAIScreen from '../screens/ChatAIScreen';
import EditCategoryScreen from '../screens/EditCategoryScreen';
import FinanceScreen from '../screens/FinanceScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MainTabScreen from '../screens/MainTabScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OTPScreen from '../screens/OTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SetBudgetLimitScreen from '../screens/SetBudgetLimitScreen';
import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import UpdateProfileScreen from '../screens/update-profile';

const Stack = createNativeStackNavigator();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AddExpenseScreen" component={AddExpenseScreen} />
      <Stack.Screen name="EditCategoryScreen" component={EditCategoryScreen} />
      <Stack.Screen name="AddEditCategoryScreen" component={AddEditCategoryScreen} />
      <Stack.Screen name="BudgetScreen" component={BudgetScreen} />
      <Stack.Screen name="AddBudgetCategoryScreen" component={AddBudgetCategoryScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MainTab" component={MainTabScreen} />
      <Stack.Screen name="FinanceScreen" component={FinanceScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ChatAI" component={ChatAIScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="SetBudgetLimitScreen" component={SetBudgetLimitScreen} />
      <Stack.Screen name="AddWalletScreen" component={AddWalletScreen} />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => { 
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
} 