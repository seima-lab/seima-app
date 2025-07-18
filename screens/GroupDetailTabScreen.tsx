import { typography } from '@/constants/typography';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GroupTabNavigation from '../components/GroupTabNavigation';
import { RootStackParamList } from '../navigation/types';
import { GroupDetailResponse, groupService } from '../services/groupService';
import GroupMembersScreen from './GroupMembersScreen';
import GroupOverviewScreen from './GroupOverviewScreen';
import GroupSettingsScreen from './GroupSettingsScreen';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type TabType = 'overview' | 'members' | 'settings';

interface Props {
  groupId: string;
  groupName: string;
}

const GroupDetailTabScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRouteProp>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showMenu, setShowMenu] = useState(false);
  const [groupDetail, setGroupDetail] = useState<GroupDetailResponse | null>(null);

  const { groupId, groupName } = route.params;

  const fetchGroupDetail = async () => {
    try {
      const response = await groupService.getGroupDetail(Number(groupId));
      setGroupDetail(response);
      return response;
    } catch (e) {
      return null;
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview':
        return t('group.tabs.overview');
      case 'members':
        return t('group.tabs.members');
      case 'settings':
        return t('group.tabs.settings');
      default:
        return t('group.tabs.overview');
    }
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleEditGroup = async () => {
    setShowMenu(false);
    let detail = groupDetail;
    if (!detail) {
      detail = await fetchGroupDetail();
    }
    if (!detail) return;
    navigation.navigate('CreateGroup', {
      mode: 'edit',
      groupData: {
        ...detail,
        group_id: Number(groupId),
        group_name: groupName,
      }
    });
  };

  const handleLeaveGroup = () => {
    setShowMenu(false);
    Alert.alert(
      t('group.detail.leaveGroup'),
      t('group.settings.confirmLeaveDesc'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('group.settings.leave'),
          style: 'destructive',
          onPress: () => {
            console.log('Leave group:', groupId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'overview':
        return <GroupOverviewScreen groupId={groupId} groupName={groupName} />;
      case 'members':
        return <GroupMembersScreen />;
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
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Icon name="more-vert" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Tab Navigation */}
      <GroupTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditGroup}>
              <Icon name="edit" size={20} color="#333" />
              <Text style={styles.menuItemText}>{t('group.detail.editGroup')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLeaveGroup}>
              <Icon name="exit-to-app" size={20} color="#dc3545" />
              <Text style={[styles.menuItemText, { color: '#dc3545' }]}>{t('group.detail.leaveGroup')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    ...typography.semibold,
    fontSize: 20,

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {

    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default GroupDetailTabScreen; 