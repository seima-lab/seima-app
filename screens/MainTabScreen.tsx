import React, { useState } from 'react';
import { View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import FinanceScreen from './FinanceScreen';
import SettingScreen from './SettingScreen';

const MainTabScreen = () => {
  const [activeTab, setActiveTab] = useState<'Finance' | 'Setting'>('Finance');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'Finance' ? <FinanceScreen /> : <SettingScreen />}
      </View>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

export default MainTabScreen; 