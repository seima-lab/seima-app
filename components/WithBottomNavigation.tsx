import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigationService } from '../navigation/NavigationService';
import { TabType } from '../utils/mainTabUtils';
import BottomNavigation from './BottomNavigation';

interface WithBottomNavigationProps {
  children: React.ReactNode;
  initialTab?: TabType;
  showBottomNav?: boolean;
}

const WithBottomNavigation: React.FC<WithBottomNavigationProps> = ({ 
  children, 
  initialTab = 'Finance',
  showBottomNav = true 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const navigation = useNavigationService();

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    // Navigate về MainTab với tab tương ứng
    navigation.navigate('MainTab', { initialTab: tab });
  }, [navigation]);

  if (!showBottomNav) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {children}
      </View>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenContainer: {
    backgroundColor: '#fff',
    flex: 1,
    overflow: 'hidden',
  },
});

export default WithBottomNavigation; 