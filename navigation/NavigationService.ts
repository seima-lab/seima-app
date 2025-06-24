import { createNavigationContainerRef, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

type RoutePath = keyof RootStackParamList;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Create a ref that can be used outside of React components
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const NavigationService = {
  resetToLogin: () => {
    if (navigationRef.isReady()) {
      console.log('NavigationService - resetToLogin');
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' as RoutePath }],
      });
    } else {
      console.warn('NavigationService - navigation not ready');
    }
  },
  
  navigate: (name: string, params?: any) => {
    if (navigationRef.isReady()) {
      console.log('NavigationService - navigate:', { name, params });
      // Use type assertion to handle the complex union type
      (navigationRef as any).navigate(name, params);
    }
  },
};

export const useNavigationService = () => {
  const navigation = useNavigation<NavigationProp>();

  return {
    navigate: (name: RoutePath, params?: any) => {
      console.log('NavigationService - navigate:', { name, params });
      (navigation as any).navigate(name, params);
    },
    
    replace: (name: RoutePath, params?: any) => {
      console.log('NavigationService - replace:', { name, params });
      navigation.reset({
        index: 0,
        routes: [{ name, params } as any],
      });
    },

    goBack: () => {
      console.log('NavigationService - goBack');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        console.warn('NavigationService - cannot go back');
      }
    },
  };
}; 