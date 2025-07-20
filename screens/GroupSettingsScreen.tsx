import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomConfirmModal from '../components/CustomConfirmModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import { typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { EligibleMemberResponse, OwnerExitOptionsResponse } from '../services/groupService';

interface Props {
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  groupDescription?: string;
}

const GroupSettingsScreen: React.FC<Props> = ({ 
  groupId, 
  groupName, 
  groupAvatar, 
  groupDescription 
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Exit Group Modal States
  const [leaveGroupModalVisible, setLeaveGroupModalVisible] = useState(false);
  const [ownerExitOptionsModalVisible, setOwnerExitOptionsModalVisible] = useState(false);
  const [ownerLeaveConfirmModalVisible, setOwnerLeaveConfirmModalVisible] = useState(false);
  const [memberSelectionModalVisible, setMemberSelectionModalVisible] = useState(false);
  const [deleteGroupConfirmModalVisible, setDeleteGroupConfirmModalVisible] = useState(false);
  const [ownerExitOptions, setOwnerExitOptions] = useState<OwnerExitOptionsResponse | null>(null);
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMemberResponse[]>([]);
  const [selectedMember, setSelectedMember] = useState<EligibleMemberResponse | null>(null);
  
  // Success Modal States
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');

  const handleEditGroup = async () => {
    try {
      console.log('🔄 [GroupSettingsScreen] Loading group detail for editing...');
      
      // Get full group detail using API
      const { groupService } = await import('../services/groupService');
      const groupDetail = await groupService.getGroupDetail(Number(groupId));
      
      console.log('✅ [GroupSettingsScreen] Group detail loaded:', groupDetail);
      
      // Navigate to CreateGroupScreen with edit mode and full data
      navigation.navigate('CreateGroup', {
        mode: 'edit',
        groupData: groupDetail
      });
    } catch (error: any) {
      console.error('🔴 [GroupSettingsScreen] Failed to load group detail:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('group.settings.errors.updateFailed'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('group.settings.continueAnyway'),
            onPress: () => {
              // Fallback: navigate with basic data in GroupDetailResponse format
              navigation.navigate('CreateGroup', {
                mode: 'edit',
                groupData: {
                  group_id: Number(groupId),
                  group_name: groupName,
                  group_avatar_url: groupAvatar,
                  group_created_date: '',
                  group_is_active: true,
                  group_leader: {
                    user_id: 0,
                    user_full_name: '',
                    user_email: ''
                  },
                  members: [],
                  total_members_count: 0,
                  current_user_role: 'OWNER' as any
                }
              });
            }
          }
        ]
      );
    }
  };

  const handleManageMembers = () => {
    (navigation as any).navigate('GroupMembers', { groupId, groupName });
  };

  const handleLeaveGroup = () => {
    setLeaveGroupModalVisible(true);
  };

  const handleExitGroupConfirm = async () => {
    setLeaveGroupModalVisible(false);
    
    try {
      console.log('🟡 [GroupSettingsScreen] Attempting to exit group:', groupId);
      setLoading(true);
      setLoadingText(t('group.settings.exitingGroup'));

      const { groupService } = await import('../services/groupService');
      await groupService.exitGroup(Number(groupId));

      // Success - exit immediately (ADMIN/MEMBER case)
      console.log('✅ [GroupSettingsScreen] Successfully exited group');
      setLoading(false);

      // Show success modal instead of Alert
      setSuccessModalTitle(t('common.success'));
      setSuccessModalMessage(t('group.settings.exitSuccess'));
      setSuccessModalVisible(true);

    } catch (error: any) {
      setLoading(false);
      console.error('🔴 [GroupSettingsScreen] Exit group error:', error);

      // Check if it's the owner case
      if (error.message?.includes('transfer ownership') || error.message?.includes('delete the group')) {
        // OWNER case - show simplified leave confirmation modal
        try {
          console.log('🟡 [GroupSettingsScreen] Owner detected, getting exit options...');
          const { groupService } = await import('../services/groupService');
          const options = await groupService.getOwnerExitOptions(Number(groupId));
          setOwnerExitOptions(options);
          setOwnerLeaveConfirmModalVisible(true);
        } catch (optionsError: any) {
          console.error('🔴 [GroupSettingsScreen] Failed to get owner options:', optionsError);
          Alert.alert(
            t('common.error'),
            optionsError.message || t('group.settings.exitFailed'),
            [{ text: t('common.ok') }]
          );
        }
      } else {
        // Other errors
        Alert.alert(
          t('common.error'),
          error.message || t('group.settings.exitFailed'),
          [{ text: t('common.ok') }]
        );
      }
    }
  };

  const handleTransferOwnership = async () => {
    setOwnerExitOptionsModalVisible(false);
    
    try {
      console.log('🟡 [GroupSettingsScreen] Getting eligible members for transfer...');
      setLoading(true);
      setLoadingText(t('group.settings.loadingMembers'));

      const { groupService } = await import('../services/groupService');
      const response: any = await groupService.getEligibleMembersForOwnership(Number(groupId));
      
      console.log('🔍 [GroupSettingsScreen] Raw API response:', response);
      
      // Extract members from the response data structure
      let members: EligibleMemberResponse[] = [];
      
      if (response && typeof response === 'object') {
        // Check if response has data.members structure
        if (response.data && Array.isArray(response.data.members)) {
          members = response.data.members;
          console.log('✅ [GroupSettingsScreen] Extracted members from response.data.members:', members);
        }
        // Check if response is directly an array (fallback)
        else if (Array.isArray(response)) {
          members = response;
          console.log('✅ [GroupSettingsScreen] Using response as direct array:', members);
        }
        // Check if response has members property directly
        else if (Array.isArray(response.members)) {
          members = response.members;
          console.log('✅ [GroupSettingsScreen] Extracted members from response.members:', members);
        }
      }
      
      console.log('👥 [GroupSettingsScreen] Final members array:', members);
      console.log('📊 [GroupSettingsScreen] Members count:', members.length);
      
      if (members.length === 0) {
        Alert.alert(
          t('common.error'),
          'Không có thành viên nào đủ điều kiện để chuyển giao quyền sở hữu.',
          [{ text: t('common.ok') }]
        );
        return;
      }
      
      setEligibleMembers(members);
      setLoading(false);
      
      // Delay một chút để đảm bảo state đã update
      setTimeout(() => {
        console.log('🎭 [GroupSettingsScreen] Setting memberSelectionModalVisible to true');
        setMemberSelectionModalVisible(true);
      }, 100);

    } catch (error: any) {
      setLoading(false);
      console.error('🔴 [GroupSettingsScreen] Failed to get eligible members:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('group.settings.loadMembersFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleConfirmTransferOwnership = async () => {
    if (!selectedMember) {
      Alert.alert(t('common.error'), t('group.settings.selectMemberFirst'));
      return;
    }

    setMemberSelectionModalVisible(false);
    
    try {
      console.log('🟡 [GroupSettingsScreen] Transferring ownership to:', selectedMember.user_full_name);
      setLoading(true);
      setLoadingText(t('group.settings.transferringOwnership'));

      const { groupService } = await import('../services/groupService');
      
      // Step 1: Transfer ownership
      await groupService.transferOwnership(Number(groupId), selectedMember.user_id);
      
      // Step 2: Exit group (now as member)
      await groupService.exitGroup(Number(groupId));

      setLoading(false);
      
      // Show success modal instead of Alert
      setSuccessModalTitle(t('common.success'));
      setSuccessModalMessage(t('group.settings.transferAndExitSuccess', { memberName: selectedMember.user_full_name }));
      setSuccessModalVisible(true);

    } catch (error: any) {
      setLoading(false);
      console.error('🔴 [GroupSettingsScreen] Transfer ownership failed:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('group.settings.transferFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleOwnerDeleteGroup = () => {
    setOwnerExitOptionsModalVisible(false);
    setDeleteGroupConfirmModalVisible(true);
  };

  const handleDeleteGroup = () => {
    setDeleteGroupConfirmModalVisible(true);
  };

  const handleConfirmDeleteGroup = async () => {
    setDeleteGroupConfirmModalVisible(false);
    
    try {
      console.log('🗑️ [GroupSettingsScreen] Starting group deletion...');
      setLoading(true);
      setLoadingText(t('group.settings.deletingGroup'));

      // Use deleteGroup API instead of archiveGroup
      const { groupService } = await import('../services/groupService');
      await groupService.deleteGroup(Number(groupId));

      console.log('✅ [GroupSettingsScreen] Group deleted successfully');
      setLoading(false);

      // Show success modal instead of Alert
      setSuccessModalTitle(t('common.success'));
      setSuccessModalMessage(t('group.settings.deleteSuccess'));
      setSuccessModalVisible(true);

    } catch (error: any) {
      console.error('🔴 [GroupSettingsScreen] Failed to delete group:', error);
      setLoading(false);
      
      Alert.alert(
        t('common.error'),
        error.message || t('group.settings.deleteFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleSuccessModalConfirm = () => {
    setSuccessModalVisible(false);
    // Navigate back to MainTab instead of GroupManagement to maintain proper navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'GroupManagement' }],
    });
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    danger = false,
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon 
        name={icon} 
        size={24} 
        color={danger ? '#F44336' : '#4A90E2'} 
        style={styles.settingIcon}
      />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightComponent || (showArrow && (
        <Icon name="chevron-right" size={24} color="#CCCCCC" />
      ))}
    </TouchableOpacity>
  );

  const renderLoadingModal = () => (
    <Modal
      visible={loading}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent closing during loading
    >
      <View style={styles.loadingModalOverlay}>
        <View style={styles.loadingModalContent}>
          {/* Loading Animation */}
          <View style={styles.loadingAnimationContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
          
          {/* Loading Text */}
          <Text style={styles.loadingTitle}>{t('common.loading')}</Text>
          <Text style={styles.loadingMessage}>{loadingText}</Text>
          
          {/* Warning */}
          <Text style={styles.loadingWarning}>
            {t('group.settings.doNotCloseApp')}
          </Text>
        </View>
      </View>
    </Modal>
  );

  const renderOwnerLeaveConfirmModal = () => (
    <Modal
      visible={ownerLeaveConfirmModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setOwnerLeaveConfirmModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.ownerExitModalContent}>
          <View style={styles.ownerExitIconContainer}>
            <Icon name="account-circle" size={48} color="#4A90E2" />
          </View>
          
          <Text style={styles.ownerExitTitle}>{t('group.settings.youAreOwner')}</Text>
          <Text style={styles.ownerExitMessage}>
            {t('group.settings.ownerLeaveMessage', { count: ownerExitOptions?.eligibleMembersCount || 0 })}
          </Text>

          <View style={styles.ownerExitButtonContainer}>
            <TouchableOpacity
              style={[styles.ownerExitButton, styles.transferButton]}
              onPress={() => {
                setOwnerLeaveConfirmModalVisible(false);
                handleTransferOwnership();
              }}
            >
              <Icon name="swap-horiz" size={20} color="#FFFFFF" />
              <Text style={styles.ownerExitButtonText}>
                {t('group.settings.transferOwnership')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ownerExitButton, styles.cancelButton]}
              onPress={() => setOwnerLeaveConfirmModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOwnerExitOptionsModal = () => (
    <Modal
      visible={ownerExitOptionsModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setOwnerExitOptionsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.ownerExitModalContent}>
          <View style={styles.ownerExitIconContainer}>
            <Icon name="account-circle" size={48} color="#4A90E2" />
          </View>
          
          <Text style={styles.ownerExitTitle}>{t('group.settings.youAreOwner')}</Text>
          <Text style={styles.ownerExitMessage}>
            {t('group.settings.ownerExitMessage', { count: ownerExitOptions?.eligibleMembersCount || 0 })}
          </Text>

          <View style={styles.ownerExitButtonContainer}>
            {ownerExitOptions?.canTransferOwnership && (
              <TouchableOpacity
                style={[styles.ownerExitButton, styles.transferButton]}
                onPress={handleTransferOwnership}
              >
                <Icon name="swap-horiz" size={20} color="#FFFFFF" />
                <Text style={styles.ownerExitButtonText}>
                  {t('group.settings.transferOwnership')}
                </Text>
              </TouchableOpacity>
            )}

            {ownerExitOptions?.canDeleteGroup && (
              <TouchableOpacity
                style={[styles.ownerExitButton, styles.deleteButton]}
                onPress={handleOwnerDeleteGroup}
              >
                <Icon name="delete-forever" size={20} color="#FFFFFF" />
                <Text style={styles.ownerExitButtonText}>
                  {t('group.settings.deleteGroup')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.ownerExitButton, styles.cancelButton]}
              onPress={() => setOwnerExitOptionsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMemberSelectionModal = () => {
    console.log('🎭 [GroupSettingsScreen] Rendering member selection modal');
    console.log('👥 [GroupSettingsScreen] EligibleMembers state:', eligibleMembers);
    console.log('📊 [GroupSettingsScreen] EligibleMembers length:', eligibleMembers.length);
    console.log('🏁 [GroupSettingsScreen] Modal visible:', memberSelectionModalVisible);
    
    return (
      <Modal
        visible={memberSelectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMemberSelectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modernMemberSelectionModal}>
            {/* Header với icon */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="swap-horiz" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.modernModalTitle}>
                Chuyển giao quyền chủ nhóm
              </Text>
              <Text style={styles.modernModalSubtitle}>
                Chọn thành viên sẽ trở thành chủ nhóm mới
              </Text>
            </View>

            {/* Members List */}
            <View style={styles.membersContainer}>
              {eligibleMembers.map((item) => (
                <TouchableOpacity
                  key={item.user_id}
                  style={[
                    styles.modernMemberItem,
                    selectedMember?.user_id === item.user_id && styles.modernMemberItemSelected
                  ]}
                  onPress={() => {
                    console.log('👆 [GroupSettingsScreen] Member selected:', item);
                    setSelectedMember(item);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View style={styles.modernAvatarContainer}>
                    {item.user_avatar_url ? (
                      <Image source={{ uri: item.user_avatar_url }} style={styles.modernAvatar} />
                    ) : (
                      <View style={styles.modernAvatarPlaceholder}>
                        <Icon name="person" size={28} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  
                  {/* Member Info */}
                  <View style={styles.modernMemberInfo}>
                    <Text style={styles.modernMemberName}>{item.user_full_name}</Text>
                    <Text style={styles.modernMemberRole}>Thành viên</Text>
                  </View>
                  
                  {/* Selection Indicator */}
                  <View style={styles.modernSelectionIndicator}>
                    {selectedMember?.user_id === item.user_id ? (
                      <View style={styles.modernSelectedCircle}>
                        <Icon name="check" size={16} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.modernUnselectedCircle} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modernButtonContainer}>
              <TouchableOpacity
                style={styles.modernCancelButton}
                onPress={() => setMemberSelectionModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modernCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modernConfirmButton,
                  !selectedMember && styles.modernConfirmButtonDisabled
                ]}
                onPress={handleConfirmTransferOwnership}
                disabled={!selectedMember}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.modernConfirmButtonText,
                  !selectedMember && styles.modernConfirmButtonTextDisabled
                ]}>
                  Xác nhận
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Fixed Header with SafeArea padding */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('group.settings.title')}</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.settings.groupManagement')}</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="edit"
              title={t('group.settings.editGroupInfo')}
              subtitle={t('group.settings.editGroupInfoDesc')}
              onPress={handleEditGroup}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="people"
              title="Management"
              subtitle="Quản lý thành viên nhóm"
              onPress={handleManageMembers}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.settings.dangerZone')}</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="exit-to-app"
              title={t('group.settings.leaveGroup')}
              subtitle={t('group.settings.leaveGroupDesc')}
              onPress={handleLeaveGroup}
              danger={true}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="delete-forever"
              title={t('group.settings.deleteGroup')}
              subtitle={t('group.settings.deleteGroupDesc')}
              onPress={handleDeleteGroup}
              danger={true}
            />
          </View>
        </View>

        {/* Group Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.settings.information')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('group.settings.groupId')}:</Text>
              <Text style={styles.infoValue}>{groupId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('group.settings.groupName')}:</Text>
              <Text style={styles.infoValue}>{groupName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('group.settings.createdDate')}:</Text>
              <Text style={styles.infoValue}>15/11/2024</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('group.settings.version')}:</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderLoadingModal()}
      {renderOwnerLeaveConfirmModal()}
      {renderOwnerExitOptionsModal()}
      {renderMemberSelectionModal()}

      {/* Leave Group Confirmation Modal */}
      <CustomConfirmModal
        visible={leaveGroupModalVisible}
        title={t('group.settings.confirmLeave')}
        message={t('group.settings.confirmLeaveDesc')}
        confirmText={t('group.settings.leave')}
        cancelText={t('common.cancel')}
        onConfirm={handleExitGroupConfirm}
        onCancel={() => setLeaveGroupModalVisible(false)}
        type="warning"
        iconName="exit-to-app"
      />

      {/* Delete Group Confirmation Modal */}
      <CustomConfirmModal
        visible={deleteGroupConfirmModalVisible}
        title={t('group.settings.confirmDelete')}
        message={t('group.settings.confirmDeleteDesc')}
        confirmText={t('group.settings.deleteGroup')}
        cancelText={t('common.cancel')}
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setDeleteGroupConfirmModalVisible(false)}
        type="danger"
        iconName="delete-forever"
      />

      {/* Success Modal */}
      <CustomSuccessModal
        visible={successModalVisible}
        title={successModalTitle}
        message={successModalMessage}
        buttonText={t('common.ok')}
        onConfirm={handleSuccessModalConfirm}
        iconName="check-circle"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: '#333333',
    ...typography.semibold,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    ...typography.regular,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollViewContent: {
    paddingBottom: 24, // Add some padding at the bottom for the last section
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    marginLeft: 4,
    ...typography.medium,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
    ...typography.medium,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666666',
    ...typography.regular,
  },
  dangerText: {
    color: '#F44336',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    ...typography.regular,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    ...typography.medium,
  },
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  loadingAnimationContainer: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 8,
    ...typography.medium,
  },
  loadingMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    ...typography.regular,
  },
  loadingWarning: {
    fontSize: 12,
    color: '#F44336',
    ...typography.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerExitModalContent: {
    ...typography.medium,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  ownerExitIconContainer: {
    marginBottom: 16,
  },
  ownerExitTitle: {
    fontSize: 20,
    color: '#333333',
    marginBottom: 8,
    ...typography.medium,
  },
  ownerExitMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    ...typography.regular,
  },
  ownerExitButtonContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  ownerExitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  transferButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  ownerExitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    ...typography.medium,
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    ...typography.medium,
  },
  memberSelectionModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  memberSelectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  memberSelectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  membersList: {
    width: '100%',
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberItemSelected: {
    backgroundColor: '#E0E0E0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  radioContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#4A90E2',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
  },
  simpleMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
  },
  memberSelectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  memberSelectionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberCancelButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
    marginRight: 6,
  },
  memberCancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  memberConfirmButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
    marginLeft: 6,
  },
  memberConfirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    borderColor: '#CCCCCC',
  },
  memberConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberConfirmButtonTextDisabled: {
    color: '#999999',
    ...typography.regular,
  },
  modernMemberSelectionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  modalIconContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernModalTitle: {
    fontSize: 22,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
    ...typography.semibold,
  },
  modernModalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    ...typography.regular,
  },
  membersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modernMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modernMemberItemSelected: {
    backgroundColor: '#E0E0E0',
    borderColor: '#CCCCCC',
  },
  modernAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  modernAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  modernAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernMemberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modernMemberName: {
    fontSize: 16,
    color: '#333333',
    ...typography.medium,
  },
  modernMemberRole: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    ...typography.regular,
  },
  modernSelectionIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernSelectedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernUnselectedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
  modernButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modernCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modernCancelButtonText: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
    ...typography.medium,
  },
  modernConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modernConfirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    borderColor: '#CCCCCC',
  },
  modernConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...typography.medium,
  },
  modernConfirmButtonTextDisabled: {
    color: '#999999',
    ...typography.regular,
  },
});

export default GroupSettingsScreen; 