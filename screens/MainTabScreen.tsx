import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { getDefaultTab, getScreenForTab, TabType } from '../utils/mainTabUtils';
import FinanceScreen from './FinanceScreen';
import SettingScreen from './SettingScreen';
import WalletScreen from './WalletScreen';

const MainTabScreen = React.memo(() => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab());

  const screenType = useMemo(() => getScreenForTab(activeTab), [activeTab]);

  const renderScreen = useCallback(() => {
    switch (screenType) {
      case 'Finance':
        return <FinanceScreen />;
      case 'Wallet':
        return <WalletScreen />;
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
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
    </View>
  );
});

MainTabScreen.displayName = 'MainTabScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default MainTabScreen; 