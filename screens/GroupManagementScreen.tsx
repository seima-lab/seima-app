import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { GroupMemberRole, groupService, UserJoinedGroupResponse } from '../services/groupService';

const GroupManagementScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<UserJoinedGroupResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Initial component logging
  console.log('📱 [GroupManagementScreen] Component initialized');
  console.log('🔐 [GroupManagementScreen] Auth status:', isAuthenticated);
  console.log('📊 [GroupManagementScreen] Current state:', {
    groupsCount: groups.length,
    loading,
  });

  // Load groups when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 [GroupManagementScreen] Screen focused, auth status:', isAuthenticated);
      if (isAuthenticated) {
        loadGroups();
      } else {
        console.log('⚠️ [GroupManagementScreen] User not authenticated, skipping group load');
      }
    }, [isAuthenticated])
  );

  const loadGroups = async () => {
    console.log('🔄 [GroupManagementScreen] loadGroups called, auth status:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ [GroupManagementScreen] Cannot load groups: user not authenticated');
      setLoading(false);
      return;
    }

    console.log('⏳ [GroupManagementScreen] Starting to load groups...');
    setLoading(true);
    try {
      console.log('🟡 Loading user joined groups...');
      const userGroups = await groupService.getUserJoinedGroups();
      console.log('🟢 User joined groups loaded:', userGroups);
      console.log('📈 [GroupManagementScreen] Groups data structure:', {
        isArray: Array.isArray(userGroups),
        length: userGroups?.length || 0,
        firstGroup: userGroups?.[0] || null,
        groupIds: userGroups?.map(g => g.group_id) || []
      });
      
      setGroups(userGroups || []);
      console.log('✅ [GroupManagementScreen] Groups state updated successfully');
    } catch (error: any) {
      console.error('🔴 Error loading groups:', error);
      console.error('💥 [GroupManagementScreen] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      Alert.alert(
        t('common.error'),
        error.message || t('group.errorLoadingGroups'),
        [{ text: t('common.ok') }]
      );
      setGroups([]);
      console.log('🗑️ [GroupManagementScreen] Groups state cleared due to error');
    } finally {
      setLoading(false);
      console.log('🏁 [GroupManagementScreen] Load groups completed, loading state reset');
    }
  };

  const formatCurrency = useCallback((amount: number) => {
    console.log('💰 [GroupManagementScreen] Formatting currency:', amount);
    const formatted = amount.toLocaleString('vi-VN');
    console.log('💱 [GroupManagementScreen] Currency formatted:', formatted);
    return formatted;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    console.log('📅 [GroupManagementScreen] Formatting date:', dateString);
    try {
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      console.log('📆 [GroupManagementScreen] Date formatted:', formatted);
      return formatted;
    } catch (error) {
      console.warn('⚠️ [GroupManagementScreen] Invalid date format:', dateString);
      return dateString;
    }
  }, []);

  const getAvatarSource = useCallback((avatarUrl?: string) => {
    console.log('🖼️ [GroupManagementScreen] Getting avatar source for URL:', avatarUrl);
    if (avatarUrl) {
      console.log('✅ [GroupManagementScreen] Using provided avatar URL');
      return { uri: avatarUrl };
    }
    console.log('🎭 [GroupManagementScreen] Using default avatar');
    return require('../assets/images/Unknown.jpg');
  }, []);

  const getRoleColor = useCallback((role: GroupMemberRole) => {
    console.log('🎨 [GroupManagementScreen] Getting role color for:', role);
    
    const colors = (() => {
      switch (role) {
        case GroupMemberRole.OWNER:
          return {
            backgroundColor: '#FFE6CC', // Light orange background
            textColor: '#D4621C',       // Dark orange text
            borderColor: '#F4A261'      // Medium orange border
          };
        case GroupMemberRole.ADMIN:
          return {
            backgroundColor: '#E8F0FE', // Light blue background  
            textColor: '#1565C0',       // Dark blue text
            borderColor: '#4A90E2'      // Medium blue border
          };
        case GroupMemberRole.MEMBER:
          return {
            backgroundColor: '#E8F5E8', // Light green background
            textColor: '#2E7D32',       // Dark green text
            borderColor: '#66BB6A'      // Medium green border
          };
        default:
          console.warn('⚠️ [GroupManagementScreen] Unknown role for color:', role);
          // Fallback colors for unknown roles
          const roleString = String(role).toUpperCase();
          switch (roleString) {
            case 'OWNER':
              return {
                backgroundColor: '#FFE6CC',
                textColor: '#D4621C',
                borderColor: '#F4A261'
              };
            case 'ADMIN':
              return {
                backgroundColor: '#E8F0FE',
                textColor: '#1565C0',
                borderColor: '#4A90E2'
              };
            case 'MEMBER':
              return {
                backgroundColor: '#E8F5E8',
                textColor: '#2E7D32',
                borderColor: '#66BB6A'
              };
            default:
              return {
                backgroundColor: '#F0F0F0', // Gray background for unknown
                textColor: '#666666',       // Gray text
                borderColor: '#CCCCCC'      // Gray border
              };
          }
      }
    })();
    
    console.log('🌈 [GroupManagementScreen] Role colors resolved:', colors);
    return colors;
  }, []);

  const getRoleText = useCallback((role: GroupMemberRole) => {
    console.log('👤 [GroupManagementScreen] Getting role text for:', role);
    console.log('🔍 [GroupManagementScreen] Role type:', typeof role, 'Raw value:', JSON.stringify(role));
    
    const roleText = (() => {
      switch (role) {
        case GroupMemberRole.OWNER:
          return t('group.owner');
        case GroupMemberRole.ADMIN:
          return t('group.admin');
        case GroupMemberRole.MEMBER:
          return t('group.member');
        default:
          console.warn('⚠️ [GroupManagementScreen] Unknown role received:', role);
          // Fallback - check if it's a string value that matches our expected roles
          const roleString = String(role).toUpperCase();
          switch (roleString) {
            case 'OWNER':
              return t('group.owner');
            case 'ADMIN':
              return t('group.admin');
            case 'MEMBER':
              return t('group.member');
            default:
              console.warn('⚠️ [GroupManagementScreen] Unhandled role value:', role);
              return String(role); // Return as-is if we don't recognize it
          }
      }
    })();
    
    console.log('🏷️ [GroupManagementScreen] Role text resolved:', roleText);
    return roleText;
  }, [t]);

  const handleBackPress = useCallback(() => {
    console.log('⬅️ [GroupManagementScreen] Back button pressed');
    navigation.goBack();
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    console.log('⚙️ [GroupManagementScreen] Settings button pressed');
    // Navigate to group settings
    Alert.alert(t('group.settings'), t('group.groupSettings'));
  }, [t]);

  const handleCreateGroup = useCallback(() => {
    console.log('➕ [GroupManagementScreen] Create group button pressed');
    console.log('🧭 [GroupManagementScreen] Navigating to CreateGroup screen');
    // Navigate to create group screen
    navigation.navigate('CreateGroup');
  }, [navigation]);

  const handleGroupPress = useCallback(async (group: UserJoinedGroupResponse) => {
    console.log('🎯 [GroupManagementScreen] Group pressed:', {
      groupId: group.group_id,
      groupName: group.group_name,
      userRole: group.user_role,
      memberCount: group.total_members_count
    });
    
    try {
      console.log('⏳ [GroupManagementScreen] Loading group detail for navigation...');
      
      // Show loading state (you could add a loading indicator here if needed)
      const groupDetail = await groupService.getGroupDetail(group.group_id);
      console.log('✅ [GroupManagementScreen] Group detail loaded successfully:', groupDetail);
      
      console.log('🧭 [GroupManagementScreen] Navigating to GroupDetail screen with data');
      // Navigate to group detail screen with the loaded data
      navigation.navigate('GroupDetail', { 
        groupId: group.group_id.toString(), 
        groupName: group.group_name,
        groupData: groupDetail
      });
    } catch (error: any) {
      console.error('🔴 [GroupManagementScreen] Failed to load group detail:', error);
      
      // Show error and still navigate with basic data
      Alert.alert(
        t('common.error'),
        error.message || t('group.errorLoadingDetail'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel'
          },
          {
            text: t('group.continueAnyway'),
            onPress: () => {
              console.log('🧭 [GroupManagementScreen] Continuing with basic data after error');
              navigation.navigate('GroupDetail', { 
                groupId: group.group_id.toString(), 
                groupName: group.group_name 
              });
            }
          }
        ]
      );
    }
  }, [navigation, t]);

  const renderGroupItem = useCallback(({ item }: { item: UserJoinedGroupResponse }) => {
    console.log('📋 [GroupManagementScreen] Rendering group item:', {
      groupId: item.group_id,
      groupName: item.group_name,
      memberCount: item.total_members_count,
      userRole: item.user_role,
      hasAvatar: !!item.group_avatar_url
    });
    
    const roleColor = getRoleColor(item.user_role);
    
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
            <Text style={styles.groupDate}>{formatDate(item.group_created_date)}</Text>
            <Text style={[styles.userRole, { backgroundColor: roleColor.backgroundColor, borderColor: roleColor.borderColor, color: roleColor.textColor }]}>
              {getRoleText(item.user_role)}
            </Text>
          </View>
        </View>
        <View style={styles.groupItemRight}>
          <Text style={styles.memberCount}>
            {item.total_members_count} {item.total_members_count === 1 ? t('group.member') : t('group.members')}
          </Text>
          <Text style={styles.leaderText}>
            {t('group.leader')}: {item.group_leader.user_full_name}
          </Text>
          <Text style={styles.joinedDate}>
            {t('group.joined')}: {formatDate(item.joined_date)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleGroupPress, formatDate, getRoleText, t, getRoleColor]);

  // Log render state
  console.log('🎨 [GroupManagementScreen] Rendering with state:', {
    groupsCount: groups.length,
    loading,
    isAuthenticated,
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('group.title')}</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Icon name="settings" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Groups List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>{t('group.loading')}</Text>
          </View>
        ) : groups.length === 0 ? (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Welcome Header */}
            <View style={styles.emptyHeaderSection}>
              <Text style={styles.emptyWelcomeTitle}>{t('group.title')}</Text>
              <Text style={styles.emptyWelcomeSubtitle}>
                {t('group.emptyState.subtitle')}
              </Text>
            </View>

            {/* Empty State Illustration */}
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIllustration}>
                <View style={styles.groupIconLarge}>
                  <Icon name="group" size={48} color="#4A90E2" />
                </View>
                <View style={styles.connectLine} />
                <View style={styles.addIconCircle}>
                  <Icon name="add" size={24} color="#FFFFFF" />
                </View>
              </View>
              
              <Text style={styles.emptyStateTitle}>
                {t('group.emptyState.title')}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {t('group.emptyState.description')}
              </Text>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                {t('group.emptyState.benefitsTitle')}
              </Text>
              
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Icon name="people" size={20} color="#4A90E2" />
                </View>
                <Text style={styles.benefitText}>
                  {t('group.emptyState.benefit1')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Icon name="trending-up" size={20} color="#4A90E2" />
                </View>
                <Text style={styles.benefitText}>
                  {t('group.emptyState.benefit2')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Icon name="security" size={20} color="#4A90E2" />
                </View>
                <Text style={styles.benefitText}>
                  {t('group.emptyState.benefit3')}
                </Text>
              </View>
            </View>

            {/* Primary Actions */}
            <View style={styles.primaryActionsContainer}>
              <TouchableOpacity style={styles.primaryActionButton} onPress={handleCreateGroup}>
                <View style={styles.actionButtonContent}>
                  <View style={styles.actionButtonIcon}>
                    <Icon name="add" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>{t('group.createGroup')}</Text>
                    <Text style={styles.actionButtonSubtitle}>
                      {t('group.emptyState.createDescription')}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Help Section */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpTitle}>
                {t('group.emptyState.helpTitle')}
              </Text>
              <Text style={styles.helpText}>
                {t('group.emptyState.helpText')}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.group_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.groupsList}
            ListHeaderComponent={() => (
              <View style={styles.headerSection}>
                <Text style={styles.welcomeText}>{t('group.title')}</Text>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionItem} onPress={handleCreateGroup}>
                  <Icon name="group" size={24} color="#4A90E2" />
                  <Text style={styles.actionText}>{t('group.createGroup')}</Text>
                  <Icon name="chevron-right" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
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
  settingsButton: {
    padding: 8,
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
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  groupDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignSelf: 'flex-start',
  },
  groupItemRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  memberCount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  leaderText: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
    textAlign: 'right',
  },
  joinedDate: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginLeft: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  headerSection: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  emptyHeaderSection: {
    padding: 16,
  },
  emptyWelcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyWelcomeSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIllustration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  groupIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  connectLine: {
    width: 40,
    height: 2,
    backgroundColor: '#CCCCCC',
    marginRight: 16,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  primaryActionsContainer: {
    padding: 16,
  },
  primaryActionButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  helpContainer: {
    backgroundColor: '#F8F9FA',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default GroupManagementScreen;

GroupManagementScreen.displayName = 'GroupManagementScreen'; 