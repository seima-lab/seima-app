import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import WithBottomNavigation from '../components/WithBottomNavigation';
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { getDefaultTab, getScreenForTab, TabType } from '../utils/mainTabUtils';
import FinanceScreen from './FinanceScreen';
import ReportScreen from './ReportScreen';
import SettingScreen from './SettingScreen';
import WalletScreen from './WalletScreen';

const MainTabScreen = React.memo(() => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const route = useRoute();
  const initialTabParam = (route.params as any)?.initialTab as TabType | undefined;
  const [activeTab, setActiveTab] = useState<TabType>(initialTabParam || getDefaultTab());

  console.log('📱 [MainTabScreen] Initialized with:', {
    initialTabParam,
    activeTab,
    routeParams: route.params
  });

  // Lắng nghe param initialTab thay đổi để chuyển tab tương ứng
  useEffect(() => {
    console.log('📱 [MainTabScreen] Tab change effect:', {
      initialTabParam,
      currentActiveTab: activeTab,
      willChange: initialTabParam && initialTabParam !== activeTab
    });
    
    if (initialTabParam && initialTabParam !== activeTab) {
      console.log('✅ [MainTabScreen] Switching to tab:', initialTabParam);
      setActiveTab(initialTabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(route.params as any)?.initialTab]);

  const screenType = useMemo(() => getScreenForTab(activeTab), [activeTab]);

  const renderScreen = useCallback(() => {
    switch (screenType) {
      case 'Finance':
        return <FinanceScreen />;
      case 'Wallet':
        return <WalletScreen />;
      case 'Report':
        return <ReportScreen />;
      case 'Setting':
        return <SettingScreen />;
      default:
        return <FinanceScreen />;
    }
  }, [screenType]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return (
    <WithBottomNavigation initialTab={activeTab}>
      {renderScreen()}
    </WithBottomNavigation>
  );
});

MainTabScreen.displayName = 'MainTabScreen';

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

export default MainTabScreen; 