import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import '../i18n';
import AddEditCategoryScreen from '../screens/AddEditCategoryScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import EditCategoryScreen from '../screens/EditCategoryScreen';
import MainTabScreen from '../screens/MainTabScreen';
import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import UpdateProfileScreen from '../screens/update-profile';

const Stack = createNativeStackNavigator();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    <LanguageProvider>
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
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTab" component={MainTabScreen} />
        <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      </Stack.Navigator>
    </LanguageProvider>
  );
} 