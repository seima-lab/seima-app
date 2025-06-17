import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GroupTabNavigation from '../components/GroupTabNavigation';
import { RootStackParamList } from '../navigation/types';
import GroupMembersScreen from './GroupMembersScreen';
import GroupOverviewScreen from './GroupOverviewScreen';
import GroupSettingsScreen from './GroupSettingsScreen';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type TabType = 'overview' | 'members' | 'settings';

const GroupDetailTabScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRouteProp>();
  const [activeTab, setActiveTab] = useState<TabType>('members');

  const { groupId, groupName } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'overview':
        return <GroupOverviewScreen groupId={groupId} groupName={groupName} />;
      case 'members':
        return <GroupMembersScreen groupId={groupId} groupName={groupName} />;
      case 'settings':
        return <GroupSettingsScreen groupId={groupId} groupName={groupName} />;
      default:
        return <GroupOverviewScreen groupId={groupId} groupName={groupName} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vert" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Tab Navigation */}
      <GroupTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
});

export default GroupDetailTabScreen; 