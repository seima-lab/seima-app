import { useState } from 'react';
import { View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { getDefaultTab, getScreenForTab, TabType } from '../utils/mainTabUtils';
import FinanceScreen from './FinanceScreen';
import SettingScreen from './SettingScreen';
import WalletScreen from './WalletScreen';

const MainTabScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab());

  const renderScreen = () => {
    const screenType = getScreenForTab(activeTab);
    
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
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

export default MainTabScreen; 