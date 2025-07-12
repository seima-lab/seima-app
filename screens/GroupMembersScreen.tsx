import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { GroupMemberListResponse, GroupMemberRole, groupService } from '../services/groupService';

interface Props {
  groupId: string;
  groupName: string;
}

// Transform API member to display member format
interface DisplayMember {
  id: string;
  name: string;
  avatar: any;
  joinDate: string;
  contribution: number;
  role: GroupMemberRole;
  email: string;
  isCurrentUser?: boolean;
}

// Swipeable Row Component for members
interface SwipeableRowProps {
  member: DisplayMember;
  onRemove: (member: DisplayMember) => void;
  isGroupLeader: boolean;
  renderContent: () => React.ReactNode;
  t: (key: string) => string;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ member, onRemove, isGroupLeader, renderContent, t }) => {
  const translateX = new Animated.Value(0);
  const { width: screenWidth } = Dimensions.get('window');
  const threshold = 60; // Smaller threshold - just need to swipe a bit
  const removeButtonWidth = 100; // Width of remove button

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      if (translationX < -threshold || velocityX < -500) {
        // Swipe far enough or fast enough - show remove button
        Animated.spring(translateX, {
          toValue: -removeButtonWidth,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        // Snap back to original position (hide remove button)
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const handleRemove = () => {
    // Animate back first
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      onRemove(member);
    });
  };

  // Don't allow swipe for group leader
  if (isGroupLeader) {
    return <View>{renderContent()}</View>;
  }

  return (
    <View style={styles.swipeableContainer}>
      {/* Swipeable Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.swipeableContent,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </PanGestureHandler>

      {/* Hidden Remove Button - positioned behind the content */}
      <Animated.View 
        style={[
          styles.removeButtonContainer,
          {
            opacity: translateX.interpolate({
              inputRange: [-removeButtonWidth, -20, 0],
              outputRange: [1, 0.5, 0],
              extrapolate: 'clamp',
            }),
            transform: [{
              translateX: translateX.interpolate({
                inputRange: [-removeButtonWidth, 0],
                outputRange: [0, removeButtonWidth],
                extrapolate: 'clamp',
              }),
            }],
          }
        ]}
      >
        <TouchableOpacity style={styles.swipeRemoveButton} onPress={handleRemove}>
          <Icon name="delete" size={20} color="#FFFFFF" />
          <Text style={styles.swipeRemoveButtonText}>{t('common.remove')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Role Selection Component
interface RoleSelectorProps {
  currentRole: GroupMemberRole;
  onRoleChange: (role: GroupMemberRole) => void;
  disabled?: boolean;
  canPromoteToOwner?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  currentRole, 
  onRoleChange, 
  disabled = false,
  canPromoteToOwner = false 
}) => {
  const { t } = useTranslation();
  
  const getRoleConfig = (role: GroupMemberRole) => {
    switch (role) {
      case GroupMemberRole.OWNER:
        return { label: t('group.memberManagement.roles.owner'), color: '#FF6B35', icon: 'stars' };
      case GroupMemberRole.ADMIN:
        return { label: t('group.memberManagement.roles.admin'), color: '#4A90E2', icon: 'admin-panel-settings' };
      case GroupMemberRole.MEMBER:
        return { label: t('group.memberManagement.roles.member'), color: '#6C757D', icon: 'person' };
      default:
        return { label: t('group.memberManagement.roles.member'), color: '#6C757D', icon: 'person' };
    }
  };

  const availableRoles = [
    GroupMemberRole.MEMBER,
    GroupMemberRole.ADMIN,
    ...(canPromoteToOwner ? [GroupMemberRole.OWNER] : [])
  ];

  return (
    <View style={styles.roleSelectorContainer}>
      <Text style={styles.roleSelectorTitle}>{t('group.memberManagement.memberRole')}</Text>
      <View style={styles.roleOptions}>
        {availableRoles.map((role) => {
          const config = getRoleConfig(role);
          const isSelected = currentRole === role;
          
          return (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleOption,
                isSelected && styles.selectedRoleOption,
                disabled && styles.disabledRoleOption
              ]}
              onPress={() => !disabled && onRoleChange(role)}
              disabled={disabled}
            >
              <Icon 
                name={config.icon} 
                size={20} 
                color={isSelected ? '#FFFFFF' : config.color} 
              />
              <Text style={[
                styles.roleOptionText,
                isSelected && styles.selectedRoleOptionText,
                { color: isSelected ? '#FFFFFF' : config.color }
              ]}>
                {config.label}
              </Text>
              {isSelected && (
                <Icon name="check" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Role Badge Component
interface RoleBadgeProps {
  role: GroupMemberRole;
  size?: 'small' | 'medium';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'small' }) => {
  const { t } = useTranslation();
  
  const getRoleConfig = (role: GroupMemberRole) => {
    switch (role) {
      case GroupMemberRole.OWNER:
        return { label: t('group.memberManagement.roles.owner'), color: '#FF6B35', bgColor: '#FFF2F0' };
      case GroupMemberRole.ADMIN:
        return { label: t('group.memberManagement.roles.admin'), color: '#4A90E2', bgColor: '#F0F7FF' };
      case GroupMemberRole.MEMBER:
        return { label: t('group.memberManagement.roles.member'), color: '#6C757D', bgColor: '#F8F9FA' };
      default:
        return { label: t('group.memberManagement.roles.member'), color: '#6C757D', bgColor: '#F8F9FA' };
    }
  };

  const config = getRoleConfig(role);
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.roleBadge,
      { backgroundColor: config.bgColor },
      isSmall && styles.roleBadgeSmall
    ]}>
      <Text style={[
        styles.roleBadgeText,
        { color: config.color },
        isSmall && styles.roleBadgeTextSmall
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const GroupMembersScreen: React.FC<Props> = ({ groupId, groupName }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<GroupMemberListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<GroupMemberRole>(GroupMemberRole.MEMBER);

  useEffect(() => {
    loadGroupMembers();
  }, [groupId]);

  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🟡 Loading members for group:', groupId);
      
      const response = await groupService.getActiveGroupMembers(parseInt(groupId));
      console.log('🟢 Members loaded:', response);
      
      setMemberData(response);
    } catch (error: any) {
      console.error('🔴 Failed to load members:', error);
      setError(error.message || 'Failed to load group members');
      Alert.alert('Error', error.message || 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  // Transform API data to display format with enhanced role handling
  const transformMemberData = (): DisplayMember[] => {
    if (!memberData) return [];
    
    const allMembers: DisplayMember[] = [];
    
    // Add group leader first
    if (memberData.group_leader) {
      allMembers.push({
        id: memberData.group_leader.user_id.toString(),
        name: memberData.group_leader.user_full_name,
        avatar: memberData.group_leader.user_avatar_url 
          ? { uri: memberData.group_leader.user_avatar_url }
          : require('../assets/images/maleavatar.png'),
        joinDate: new Date().toLocaleDateString('vi-VN'),
      contribution: 700000,
        role: GroupMemberRole.OWNER, // Group leader is always OWNER
        email: memberData.group_leader.user_email || t('group.memberManagement.noEmail'), // Fix undefined email
        isCurrentUser: user?.id === memberData.group_leader.user_id.toString()
      });
    }
    
    // Add other members
    if (memberData.members) {
      memberData.members.forEach(member => {
        if (member.user_id !== memberData.group_leader?.user_id) {
          allMembers.push({
            id: member.user_id.toString(),
            name: member.user_full_name,
            avatar: member.user_avatar_url 
              ? { uri: member.user_avatar_url }
              : require('../assets/images/femaleavatar.png'),
            joinDate: new Date().toLocaleDateString('vi-VN'),
      contribution: 500000,
            role: (member as any).role || GroupMemberRole.MEMBER, // FIX: Use role from API
            email: member.user_email || t('group.memberManagement.noEmail'), // Fix undefined email
            isCurrentUser: user?.id === member.user_id.toString()
          });
        }
      });
    }
    
    console.log('🟢 Transformed members with fixed emails:', allMembers);
    return allMembers;
  };

  const members = transformMemberData();
  
  // Debug log for members
  console.log('🔍 Current members array:', members);
  console.log('🔍 MemberData state:', memberData);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const handleInviteUsers = () => {
    navigation.navigate('InviteUsers', { groupId });
  };

  const handleManageMembers = () => {
    console.log('🟡 Opening member management modal');
    console.log('🟡 Current member data:', memberData);
    console.log('🟡 Transformed members:', members);
    console.log('🟡 Members length:', members.length);
    setShowMemberModal(true);
  };

  const handleRemoveMember = async (member: DisplayMember) => {
    Alert.alert(
      t('group.memberManagement.removeMember'),
      t('group.memberManagement.confirmRemove', { name: member.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingMember(member.id);
              console.log('🟡 Removing member:', member.name, member.id);
              
              await groupService.removeMemberFromGroup(
                parseInt(groupId), 
                parseInt(member.id)
              );
              
              console.log('🟢 Member removed successfully');
              Alert.alert(t('common.success'), t('group.memberManagement.removeSuccess', { name: member.name }));
              
              // Reload member list
              await loadGroupMembers();
            } catch (error: any) {
              console.error('🔴 Failed to remove member:', error);
              Alert.alert(t('common.error'), error.message || t('group.memberManagement.removeFailed'));
            } finally {
              setRemovingMember(null);
            }
          }
        }
      ]
    );
  };

  // Check if current user can manage roles
  const canManageRoles = () => {
    return memberData?.current_user_role === GroupMemberRole.OWNER || 
           memberData?.current_user_role === GroupMemberRole.ADMIN;
  };

  // Check if current user can change specific member's role
  const canChangeRole = (targetMemberRole: GroupMemberRole) => {
    const currentUserRole = memberData?.current_user_role;
    
    if (currentUserRole === GroupMemberRole.OWNER) {
      return true; // Owner can change anyone's role
    }
    
    if (currentUserRole === GroupMemberRole.ADMIN) {
      // Admin can manage other Members, but not other Admins or the Owner.
      return targetMemberRole === GroupMemberRole.MEMBER;
    }
    
    return false;
  };

  // Check if the current user can perform any action on a target member
  const canActOnMember = (targetMember: DisplayMember) => {
    const currentUserRole = memberData?.current_user_role;
    if (!currentUserRole || !user) return false;

    // Cannot act on self
    if (targetMember.id === user.id?.toString()) return false;

    // Cannot act on Owner
    if (targetMember.role === GroupMemberRole.OWNER) return false;

    // Owner can act on anyone (except themselves)
    if (currentUserRole === GroupMemberRole.OWNER) return true;

    // Admin can act on Members
    if (currentUserRole === GroupMemberRole.ADMIN) {
      return targetMember.role === GroupMemberRole.MEMBER;
    }

    return false;
  };

  // Handle role update
  const handleRoleUpdate = async (member: DisplayMember, newRole: GroupMemberRole) => {
    if (member.role === newRole) return;

    const getRoleLabel = (role: GroupMemberRole) => {
      switch (role) {
        case GroupMemberRole.OWNER: return t('group.owner');
        case GroupMemberRole.ADMIN: return t('group.admin');
        case GroupMemberRole.MEMBER: return t('group.member');
        default: return t('group.member');
      }
    };

    Alert.alert(
      t('group.memberManagement.confirmRoleChange'),
      t('group.memberManagement.changeRoleFrom', { 
        name: member.name, 
        oldRole: getRoleLabel(member.role), 
        newRole: getRoleLabel(newRole) 
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('group.memberManagement.confirm'),
          onPress: async () => {
            try {
              console.log('🟡 Updating member role:', member.name, newRole);
              
              await groupService.updateMemberRole(
                parseInt(groupId),
                parseInt(member.id),
                newRole
              );
              
              console.log('🟢 Member role updated successfully');
              Alert.alert(t('common.success'), t('group.memberManagement.roleUpdateSuccess', { name: member.name }));
              
              // Reload member list to get updated data
              await loadGroupMembers();
            } catch (error: any) {
              console.error('🔴 Failed to update member role:', error);
              Alert.alert(t('common.error'), error.message || t('group.memberManagement.roleUpdateFailed'));
            }
          }
        }
      ]
    );
  };

  // Enhanced member modal rendering with role management
  const renderMemberInModal: ListRenderItem<DisplayMember> = ({ item }) => {
    console.log('🎯 Rendering member in modal:', item.name);
    
    return (
      <View style={styles.simpleModalMemberItem}>
      <Image source={item.avatar} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <View style={styles.simpleBadge}>
            <Text style={styles.simpleBadgeText}>{item.role}</Text>
          </View>
          
          {/* Simple role change buttons */}
          {item.role !== GroupMemberRole.OWNER && (
            <View style={styles.simpleRoleButtons}>
              <TouchableOpacity 
                style={styles.simpleRoleButton}
                onPress={() => Alert.alert('Test', `Change ${item.name} to ADMIN`)}
              >
                <Text style={styles.simpleRoleButtonText}>Make Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.simpleRoleButton}
                onPress={() => Alert.alert('Test', `Change ${item.name} to MEMBER`)}
              >
                <Text style={styles.simpleRoleButtonText}>Make Member</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Enhanced regular member rendering with role badges
  const renderMember: ListRenderItem<DisplayMember> = ({ item }) => {
    const isRemoving = removingMember === item.id;
    const isOwner = item.role === GroupMemberRole.OWNER;
    
    const memberContent = () => (
      <View style={[styles.memberItem, isRemoving && styles.memberItemRemoving]}>
        <Image source={item.avatar} style={styles.memberAvatar} />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <RoleBadge role={item.role} size="small" />
        </View>
        <Text style={styles.memberContribution}>{formatCurrency(item.contribution)}</Text>
        {isRemoving && (
          <ActivityIndicator size="small" color="#FF6B6B" style={{ marginLeft: 8 }} />
        )}
      </View>
    );

    return (
      <SwipeableRow
        member={item}
        onRemove={handleRemoveMember}
        isGroupLeader={isOwner}
        renderContent={memberContent}
        t={t}
      />
    );
  };

  const displayedMembers = showAllMembers ? members : members.slice(0, 2);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>{t('common.loading')}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="error-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{t('group.errorLoadingGroups')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGroupMembers}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Member Management Modal */}
      <Modal
        visible={showMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('group.memberManagement.title')}</Text>
              <TouchableOpacity 
                onPress={() => setShowMemberModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            {/* Member Count */}
            <View style={styles.memberCountBadge}>
              <Text style={styles.memberCountText}>
                {t('group.memberManagement.totalMembersCount', { count: members.length })}
              </Text>
            </View>
            
            {/* Member List */}
            <View style={styles.modalListContainer}>
              {members.length > 0 ? (
                <ScrollView 
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={true}
                >
                  {members.map((member) => (
                    <View key={member.id} style={styles.modalMemberCard}>
                      <View style={styles.modalMemberHeader}>
                        <Image source={member.avatar} style={styles.modalMemberAvatar} />
                        <View style={styles.modalMemberInfo}>
                          <Text style={styles.modalMemberName}>{member.name}</Text>
                        </View>
                      </View>
                      
                      {/* Role and Actions */}
                      <View style={styles.modalMemberFooter}>
                        <View style={[
                          styles.roleTag,
                          member.role === GroupMemberRole.OWNER && styles.roleTagOwner,
                          member.role === GroupMemberRole.ADMIN && styles.roleTagAdmin,
                          member.role === GroupMemberRole.MEMBER && styles.roleTagMember,
                        ]}>
                          <Text style={styles.roleTagText}>
                            {member.role === GroupMemberRole.OWNER ? t('group.memberManagement.roles.owner') :
                             member.role === GroupMemberRole.ADMIN ? t('group.memberManagement.roles.admin') : t('group.memberManagement.roles.member')}
                          </Text>
                        </View>

                        {/* Action Buttons */}
                        {canActOnMember(member) && (
                          <View style={styles.modalActionsContainer}>
                            {canChangeRole(member.role) && (
                              <>
                                {member.role === GroupMemberRole.MEMBER && (
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.promoteButton]}
                                    onPress={() => handleRoleUpdate(member, GroupMemberRole.ADMIN)}
                                  >
                                    <Icon name="arrow-upward" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>{t('group.memberManagement.promoteToAdmin')}</Text>
                                  </TouchableOpacity>
                                )}
                                {member.role === GroupMemberRole.ADMIN && (
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.demoteButton]}
                                    onPress={() => handleRoleUpdate(member, GroupMemberRole.MEMBER)}
                                  >
                                    <Icon name="arrow-downward" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>{t('group.memberManagement.demoteToMember')}</Text>
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                            <TouchableOpacity
                              style={[styles.actionButton, styles.removeButton]}
                              onPress={() => handleRemoveMember(member)}
                            >
                              <Icon name="delete-forever" size={14} color="#fff" />
                              <Text style={styles.actionButtonText}>{t('common.remove')}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Icon name="people-outline" size={64} color="#CCCCCC" />
                  <Text style={styles.emptyStateText}>{t('group.memberManagement.noMembersFound')}</Text>
                </View>
              )}
            </View>
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.modalFooterButton}
              onPress={() => setShowMemberModal(false)}
            >
              <Text style={styles.modalFooterButtonText}>{t('group.memberManagement.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Group Header */}
        <View style={styles.groupHeader}>
          <Image 
            source={
              memberData?.group_avatar_url 
                ? { uri: memberData.group_avatar_url }
                : require('../assets/images/group.png')
            } 
            style={styles.groupImage} 
          />
        </View>

        {/* Management Card */}
        <View style={styles.managementCard}>
          <TouchableOpacity style={styles.managementItem} onPress={handleInviteUsers}>
            <Icon name="mail" size={24} color="#4A90E2" />
            <Text style={styles.managementText}>{t('group.memberManagement.inviteUsers')}</Text>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.managementItem} onPress={handleManageMembers}>
            <Icon name="people" size={24} color="#4A90E2" />
            <Text style={styles.managementText}>{t('group.memberManagement.manageMembers')}</Text>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          
          {/* Removed Approve Fund Requests section */}
        </View>

        {/* Members List */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>
              {t('group.memberManagement.listMembers')} ( {memberData?.total_members_count || 0} )
            </Text>
            <TouchableOpacity onPress={handleManageMembers}>
              <Icon name="chevron-right" size={24} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={displayedMembers}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.memberSeparator} />}
          />
          
          {!showAllMembers && members.length > 2 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllMembers(true)}
            >
              <Text style={styles.viewAllText}>{t('group.memberManagement.viewAllMembers')}</Text>
              <Icon name="expand-more" size={20} color="#4A90E2" />
            </TouchableOpacity>
          )}
          
          {showAllMembers && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllMembers(false)}
            >
              <Text style={styles.viewAllText}>{t('group.memberManagement.collapse')}</Text>
              <Icon name="expand-less" size={20} color="#4A90E2" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Roboto',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  scrollContent: {
    paddingBottom: 100, // Add padding bottom to account for the bottom navigation
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  groupImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
  },
  managementCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  managementText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 16,
    fontFamily: 'Roboto',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Roboto',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginRight: 8,
    fontFamily: 'Roboto',
  },
  memberEmail: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Roboto',
  },
  memberContribution: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    fontFamily: 'Roboto',
  },
  memberSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 60,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginRight: 4,
    fontFamily: 'Roboto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    height: '70%',
    maxHeight: 600,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Roboto',
  },
  modalCloseButton: {
    padding: 4,
  },
  memberCountBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  memberCountText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  modalListContainer: {
    flex: 1,
    padding: 16,
  },
  modalScrollView: {
    flex: 1,
  },
  modalMemberCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  modalMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalMemberInfo: {
    flex: 1,
  },
  modalMemberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Roboto',
  },
  modalMemberEmail: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontFamily: 'Roboto',
  },
  modalMemberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleTagOwner: {
    backgroundColor: '#FF6B35',
  },
  roleTagAdmin: {
    backgroundColor: '#4A90E2',
  },
  roleTagMember: {
    backgroundColor: '#6C757D',
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  modalActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  promoteButton: {
    backgroundColor: '#4A90E2',
  },
  demoteButton: {
    backgroundColor: '#6C757D',
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Roboto',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Roboto',
  },
  modalFooterButton: {
    backgroundColor: '#4A90E2',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalFooterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  swipeableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  removeButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    backgroundColor: '#FF6B6B',
  },
  swipeRemoveButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    height: '100%',
  },
  swipeRemoveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Roboto',
  },
  swipeableContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  memberItemRemoving: {
    backgroundColor: '#FFEBEB',
  },
  roleSelectorContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  roleSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    minWidth: 80,
    justifyContent: 'center',
  },
  selectedRoleOption: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  disabledRoleOption: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#666666',
    fontFamily: 'Roboto',
  },
  selectedRoleOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 0,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  roleBadgeSmall: {
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  roleBadgeTextSmall: {
    fontSize: 7,
  },
  roleManagementSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  updatingRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  updatingRoleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  modalCloseFooterButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseFooterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  simpleModalMemberItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  simpleBadge: {
    padding: 4,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  simpleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  simpleRoleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  simpleRoleButton: {
    padding: 8,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  simpleRoleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
});

// Main component that works with React Navigation
const GroupMembersScreenContainer: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'GroupMembers'>>();
  const { groupId, groupName } = route.params;
  
  return <GroupMembersScreen groupId={groupId} groupName={groupName} />;
};

export default GroupMembersScreenContainer; 