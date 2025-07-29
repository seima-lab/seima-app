import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomConfirmModal from '../components/CustomConfirmModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import { typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { groupService, PendingGroupResponse } from '../services/groupService';

const PendingGroupsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [pendingGroups, setPendingGroups] = useState<PendingGroupResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PendingGroupResponse | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load pending groups when screen comes into focus
  const loadPendingGroups = useCallback(async () => {
    console.log('🔄 [PendingGroupsScreen] loadPendingGroups called, auth status:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ [PendingGroupsScreen] Cannot load pending groups: user not authenticated');
      setLoading(false);
      return;
    }

    console.log('⏳ [PendingGroupsScreen] Starting to load pending groups...');
    setLoading(true);
    try {
      console.log('🟡 Loading pending groups...');
      const groups = await groupService.getPendingGroups();
      console.log('🟢 Pending groups loaded:', groups);
      
      setPendingGroups(groups || []);
      console.log('✅ [PendingGroupsScreen] Pending groups state updated successfully');
    } catch (error: any) {
      console.error('🔴 Error loading pending groups:', error);
      console.error('💥 [PendingGroupsScreen] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to load pending groups',
        [{ text: t('common.ok') }]
      );
      setPendingGroups([]);
      console.log('🗑️ [PendingGroupsScreen] Pending groups state cleared due to error');
    } finally {
      setLoading(false);
      console.log('🏁 [PendingGroupsScreen] Load pending groups completed, loading state reset');
    }
  }, [isAuthenticated, t]);

  const formatDate = useCallback((dateString: string) => {
    console.log('📅 [PendingGroupsScreen] Formatting date:', dateString);
    try {
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      console.log('📆 [PendingGroupsScreen] Date formatted:', formatted);
      return formatted;
    } catch (error) {
      console.warn('⚠️ [PendingGroupsScreen] Invalid date format:', dateString);
      return dateString;
    }
  }, []);

  const getAvatarSource = useCallback((avatarUrl?: string) => {
    console.log('🖼️ [PendingGroupsScreen] Getting avatar source for URL:', avatarUrl);
    if (avatarUrl) {
      console.log('✅ [PendingGroupsScreen] Using provided avatar URL');
      return { uri: avatarUrl };
    }
    console.log('🎭 [PendingGroupsScreen] Using default avatar');
    return require('../assets/images/Unknown.jpg');
  }, []);

  const handleBackPress = useCallback(() => {
    console.log('⬅️ [PendingGroupsScreen] Back button pressed');
    navigation.goBack();
  }, [navigation]);

  const handleGroupPress = useCallback((group: PendingGroupResponse) => {
    console.log('🎯 [PendingGroupsScreen] Group pressed:', {
      groupId: group.group_id || 'unknown',
      groupName: group.group_name || 'Unknown Group',
      memberCount: group.active_member_count || 0
    });
    
    setSelectedGroup(group);
    setShowRejectModal(true);
  }, []);

  const handleRejectGroup = useCallback(async () => {
    console.log('🎯 [PendingGroupsScreen] handleRejectGroup called');
    
    if (!selectedGroup) {
      console.log('❌ [PendingGroupsScreen] No selectedGroup, returning early');
      return;
    }
    
    console.log('❌ [PendingGroupsScreen] Rejecting group:', selectedGroup.group_id);
    console.log('❌ [PendingGroupsScreen] Group name:', selectedGroup.group_name);
    setShowRejectModal(false);
    
    try {
      console.log('🟡 [PendingGroupsScreen] Calling groupService.cancelPendingGroup...');
      await groupService.cancelPendingGroup(selectedGroup.group_id);
      console.log('🟢 [PendingGroupsScreen] cancelPendingGroup completed successfully');
      
      setSuccessMessage(`${t('group.rejectGroupSuccess')} "${selectedGroup.group_name}"`);
      setShowSuccessModal(true);
      
      // Reload pending groups after rejection
      console.log('🔄 [PendingGroupsScreen] Reloading pending groups...');
      await loadPendingGroups();
      console.log('✅ [PendingGroupsScreen] Pending groups reloaded');
    } catch (error: any) {
      console.error('🔴 [PendingGroupsScreen] Error rejecting group:', error);
      console.error('🔴 [PendingGroupsScreen] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to reject group',
        [{ text: t('common.ok') }]
      );
    }
  }, [selectedGroup, loadPendingGroups, t]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    setSelectedGroup(null);
  }, []);

  const renderPendingGroupItem = useCallback(({ item }: { item: PendingGroupResponse }) => {
    console.log('📋 [PendingGroupsScreen] Rendering pending group item:', {
      groupId: item.group_id || 'unknown',
      groupName: item.group_name || 'Unknown Group',
      memberCount: item.active_member_count || 0,
      hasAvatar: !!item.group_avatar_url
    });
    
    return (
      <TouchableOpacity style={styles.groupItem} onPress={() => handleGroupPress(item)}>
        <View style={styles.groupItemLeft}>
          <View style={styles.groupIcon}>
            {item.group_avatar_url ? (
              <Image 
                source={{ uri: item.group_avatar_url }}
                style={styles.groupAvatarImage}
              />
            ) : (
              <Icon name="group" size={24} color="#4A90E2" />
            )}
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.group_name}</Text>
            <Text style={styles.groupDate}>{formatDate(item.requested_at)}</Text>
            <Text style={styles.pendingStatus}>
              {t('group.pendingApproval')}
            </Text>
          </View>
        </View>
        <View style={styles.groupItemRight}>
          <Text style={styles.memberCount}>
            {item.active_member_count} {item.active_member_count === 1 ? 'member' : 'members'}
          </Text>
          <Text style={styles.statusText}>
            {item.group_is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleGroupPress, formatDate]);

  // Load data when component mounts
  useEffect(() => {
    loadPendingGroups();
  }, [loadPendingGroups]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('group.pendingGroupsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Pending Groups List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>{t('group.loadingPendingGroups')}</Text>
          </View>
        ) : pendingGroups.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Icon name="pending" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>{t('group.noPendingGroups')}</Text>
            <Text style={styles.emptyStateDescription}>
              {t('group.noPendingGroupsDesc')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingGroups}
            renderItem={renderPendingGroupItem}
                keyExtractor={(item) => item.group_id?.toString() || item.group_name || 'pending-group'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.groupsList}
            ListHeaderComponent={() => (
              <View style={styles.headerSection}>
                            <Text style={styles.welcomeText}>{t('group.pendingGroupsTitle')}</Text>
            <Text style={styles.subtitleText}>
              {pendingGroups.length} {pendingGroups.length === 1 ? t('group.member') : t('group.members')} {t('group.pendingApproval')}
            </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Custom Modals */}
      <CustomConfirmModal
        visible={showRejectModal}
        title={t('group.rejectGroup')}
        message={`Bạn có chắc chắn muốn từ chối nhóm "${selectedGroup?.group_name}"?`}
        confirmText={t('group.rejectGroup')}
        cancelText={t('common.cancel')}
        onConfirm={handleRejectGroup}
        onCancel={() => setShowRejectModal(false)}
        type="danger"
        iconName="cancel"
      />

      <CustomSuccessModal
        visible={showSuccessModal}
        title={t('common.success')}
        message={successMessage}
        buttonText={t('common.ok')}
        onConfirm={handleSuccessModalClose}
        iconName="check-circle"
      />
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
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
    ...typography.medium,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    ...typography.regular,
  },
  groupsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'space-between',
  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  groupAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupInfo: {
    flex: 1,
    marginRight: 8,
  },
  groupName: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
    ...typography.medium,
  },
  groupDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    ...typography.regular,
  },
  pendingStatus: {
    fontSize: 12,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    color: '#856404',
    alignSelf: 'flex-start',
    textAlign: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    ...typography.regular,
  },
  groupItemRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  memberCount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    ...typography.regular,
  },
  statusText: {
    fontSize: 15,
    color: 'green',
    textAlign: 'right',
    ...typography.regular,
  },
  headerSection: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
    ...typography.medium,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666666',
    ...typography.regular,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    ...typography.medium,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    ...typography.regular,
  },
});

export default PendingGroupsScreen;

PendingGroupsScreen.displayName = 'PendingGroupsScreen'; 