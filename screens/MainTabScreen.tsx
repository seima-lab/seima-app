import React, { useState } from 'react';
import { View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import FinanceScreen from './FinanceScreen';
import SettingScreen from './SettingScreen';
import WalletScreen from './WalletScreen';

const MainTabScreen = () => {
  const [activeTab, setActiveTab] = useState<'Finance' | 'Wallet' | 'Setting'>('Finance');

  const renderScreen = () => {
    switch (activeTab) {
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