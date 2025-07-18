import { typography } from '@/constants/typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

// Responsive utilities matching FinanceScreen
const responsiveUtils = {
  isSmallScreen: width < 375 || height < 667,
  screenWidth: width,
  screenHeight: height,
  rp: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minSize = size * 0.7;
    const scaledSize = size * scale;
    return Math.max(scaledSize, minSize);
  },
  rf: (fontSize: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minFontScale = 0.85;
    const maxFontScale = 1.15;
    const fontScale = Math.min(Math.max(scale, minFontScale), maxFontScale);
    return fontSize * fontScale;
  },
};

const { rp, rf } = responsiveUtils;

type TabType = 'overview' | 'members' | 'settings';

interface GroupTabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const GroupTabNavigation: React.FC<GroupTabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Icon 
            name="home" 
            size={rp(24)} 
            color={activeTab === 'overview' ? '#4A90E2' : '#999999'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            {t('group.tabs.overview')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('members')}
          activeOpacity={0.7}
        >
          <Icon 
            name="people" 
            size={rp(24)} 
            color={activeTab === 'members' ? '#4A90E2' : '#999999'} 
          />
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            {t('group.tabs.members')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Icon 
            name="settings" 
            size={rp(24)} 
            color={activeTab === 'settings' ? '#4A90E2' : '#999999'} 
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            {t('group.tabs.settings')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: rp(12),
    paddingBottom: rp(12),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(4),
    paddingHorizontal: rp(4),
  },
  tabText: {
    fontSize: rf(11),
    color: '#999999',
    marginTop: rp(4),
    ...typography.semibold,
    textAlign: 'center',
    lineHeight: rf(14),
  },
  tabTextActive: {
    color: '#4A90E2',
    ...typography.semibold,
  },
});

export default GroupTabNavigation; 