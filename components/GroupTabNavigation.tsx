import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type TabType = 'overview' | 'members' | 'settings';

interface GroupTabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const GroupTabNavigation: React.FC<GroupTabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => setActiveTab('overview')}
      >
        <Icon 
          name="home" 
          size={24} 
          color={activeTab === 'overview' ? '#4A90E2' : '#999999'} 
        />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
          Tổng quan
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => setActiveTab('members')}
      >
        <Icon 
          name="people" 
          size={24} 
          color={activeTab === 'members' ? '#4A90E2' : '#999999'} 
        />
        <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
          Thành viên
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => setActiveTab('settings')}
      >
        <Icon 
          name="settings" 
          size={24} 
          color={activeTab === 'settings' ? '#4A90E2' : '#999999'} 
        />
        <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
          Cài đặt
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabText: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default GroupTabNavigation; 