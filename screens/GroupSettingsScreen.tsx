import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

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
            text: t('group.continueAnyway'),
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

  const handleManagePermissions = () => {
    Alert.alert(t('group.settings.managePermissions'), t('group.settings.managePermissionsDesc'));
  };

  const handleViewReports = () => {
    Alert.alert(t('group.settings.viewReports'), t('group.settings.viewReportsDesc'));
  };

  const handleExportData = () => {
    Alert.alert(t('group.settings.exportData'), t('group.settings.exportDataDesc'));
  };

  const handleBackupData = () => {
    Alert.alert(t('group.settings.backupData'), t('group.settings.backupDataDesc'));
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      t('group.settings.confirmLeave'),
      t('group.settings.confirmLeaveDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('group.settings.leave'), style: 'destructive', onPress: () => console.log('Left group') }
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      t('group.settings.confirmDelete'),
      t('group.settings.confirmDeleteDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('group.settings.deleteGroup'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🗑️ [GroupSettingsScreen] Starting group deletion...');
              setLoading(true);
              setLoadingText(t('group.settings.deletingGroup'));

              // Import and call archive API
              const { groupService } = await import('../services/groupService');
              await groupService.archiveGroup(Number(groupId));

              console.log('✅ [GroupSettingsScreen] Group archived successfully');
              setLoading(false);

              // Show success message and navigate back
              Alert.alert(
                t('common.success'),
                t('group.settings.deleteSuccess'),
                [
                  {
                    text: t('common.ok'),
                    onPress: () => {
                      // Navigate back to group list
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainTab' }],
                      });
                    }
                  }
                ]
              );

            } catch (error: any) {
              console.error('🔴 [GroupSettingsScreen] Failed to archive group:', error);
              setLoading(false);
              
              Alert.alert(
                t('common.error'),
                error.message || t('group.settings.deleteFailed'),
                [{ text: t('common.ok') }]
              );
            }
          }
        }
      ]
    );
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
            <ActivityIndicator size="large" color="#F44336" />
          </View>
          
          {/* Loading Text */}
          <Text style={styles.loadingTitle}>{t('group.settings.deleteGroup')}</Text>
          <Text style={styles.loadingMessage}>{loadingText}</Text>
          
          {/* Warning */}
          <Text style={styles.loadingWarning}>
            {t('group.settings.doNotCloseApp')}
          </Text>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
              icon="security"
              title={t('group.settings.managePermissions')}
              subtitle={t('group.settings.managePermissionsDesc')}
              onPress={handleManagePermissions}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.settings.notifications')}</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="notifications"
              title={t('group.settings.transactionNotifications')}
              subtitle={t('group.settings.transactionNotificationsDesc')}
              showArrow={false}
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
                />
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="auto-awesome"
              title={t('group.settings.autoApprove')}
              subtitle={t('group.settings.autoApproveDesc')}
              showArrow={false}
              rightComponent={
                <Switch
                  value={autoApproveEnabled}
                  onValueChange={setAutoApproveEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                  thumbColor={autoApproveEnabled ? '#FFFFFF' : '#FFFFFF'}
                />
              }
            />
          </View>
        </View>

        {/* Reports & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.settings.reportsAndData')}</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="assessment"
              title={t('group.settings.viewReports')}
              subtitle={t('group.settings.viewReportsDesc')}
              onPress={handleViewReports}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="file-download"
              title={t('group.settings.exportData')}
              subtitle={t('group.settings.exportDataDesc')}
              onPress={handleExportData}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="backup"
              title={t('group.settings.backupData')}
              subtitle={t('group.settings.backupDataDesc')}
              onPress={handleBackupData}
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
      {renderLoadingModal()}
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    marginLeft: 4,
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
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666666',
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
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
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
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  loadingWarning: {
    fontSize: 12,
    color: '#F44336',
  },
});

export default GroupSettingsScreen; 