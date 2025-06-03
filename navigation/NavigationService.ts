import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

type RoutePath = keyof RootStackParamList;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useNavigationService = () => {
  const navigation = useNavigation<NavigationProp>();

  return {
    navigate: (name: RoutePath, params?: any) => {
      console.log('NavigationService - navigate:', { name, params });
      navigation.navigate(name, params);
    },
    
    replace: (name: RoutePath, params?: any) => {
      console.log('NavigationService - replace:', { name, params });
      navigation.reset({
        index: 0,
        routes: [{ name, params }],
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