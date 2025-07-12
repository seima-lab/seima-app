import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { EmailInvitationResponse, groupService, PendingGroupMemberResponse } from '../services/groupService';

type InviteUsersRouteProp = RouteProp<RootStackParamList, 'InviteUsers'>;

interface InviteItem {
  id: string;
  email: string;
  status: 'sending' | 'sent' | 'failed' | 'user_not_found';
  message?: string;
  userExists?: boolean;
  inviteLink?: string;
}

const InviteUsersScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<InviteUsersRouteProp>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<PendingGroupMemberResponse[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  const { groupId } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('group.invitation.enterEmail'));
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert(t('common.error'), t('group.invitation.invalidEmail'));
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if email already invited
    const existingInvite = invites.find(invite => invite.email === trimmedEmail);
    if (existingInvite) {
      Alert.alert(t('common.error'), t('group.invitation.alreadyInvited'));
      return;
    }

    setIsLoading(true);
    setIsFullScreenLoading(true); // Show full screen loading
    
    // Add pending invite to the list
    const pendingInvite: InviteItem = {
      id: Date.now().toString(),
      email: trimmedEmail,
      status: 'sending',
      message: t('group.invitation.sending')
    };
    
    setInvites(prev => [pendingInvite, ...prev]);
    setEmail('');

    try {
      console.log('🟡 Sending invitation for group:', groupId, 'to email:', trimmedEmail);
      
      const response: EmailInvitationResponse = await groupService.sendEmailInvitation({
        group_id: parseInt(groupId),
        email: trimmedEmail
      });
      
      console.log('🟢 Invitation response:', response);
      
      // Update the invite item with the response
      setInvites(prev => prev.map(invite => 
        invite.id === pendingInvite.id ? {
          ...invite,
          status: response.email_sent ? 'sent' : 'failed',
          message: response.message,
          userExists: response.user_exists,
          inviteLink: response.invite_link
        } : invite
      ));

      if (response.email_sent) {
        if (response.user_exists) {
          Alert.alert(
            t('common.success'), 
            t('group.invitation.sentToExistingUser', { email: trimmedEmail })
          );
        } else {
          Alert.alert(
            t('common.success'), 
            t('group.invitation.sentToNewUser', { email: trimmedEmail })
          );
        }
      } else {
        Alert.alert(t('common.error'), response.message);
      }

    } catch (error: any) {
      console.error('🔴 Failed to send invitation:', error);
      
      // Update invite status to failed
      setInvites(prev => prev.map(invite => 
        invite.id === pendingInvite.id ? {
          ...invite,
          status: 'failed',
          message: error.message || t('group.invitation.sendFailed')
        } : invite
      ));
      
      Alert.alert(t('common.error'), error.message || t('group.invitation.sendFailed'));
    } finally {
      setIsLoading(false);
      setIsFullScreenLoading(false); // Hide full screen loading
    }
  };

  const handleResendInvite = async (inviteItem: InviteItem) => {
    setIsFullScreenLoading(true); // Show full screen loading
    
    setInvites(prev => prev.map(invite => 
      invite.id === inviteItem.id ? {
        ...invite,
        status: 'sending',
        message: t('group.invitation.sending')
      } : invite
    ));

    try {
      const response: EmailInvitationResponse = await groupService.sendEmailInvitation({
        group_id: parseInt(groupId),
        email: inviteItem.email
      });
      
      setInvites(prev => prev.map(invite => 
        invite.id === inviteItem.id ? {
          ...invite,
          status: response.email_sent ? 'sent' : 'failed',
          message: response.message,
          userExists: response.user_exists,
          inviteLink: response.invite_link
        } : invite
      ));

      if (response.email_sent) {
        Alert.alert(t('common.success'), t('group.invitation.resentSuccess'));
      } else {
        Alert.alert(t('common.error'), response.message);
      }

    } catch (error: any) {
      console.error('🔴 Failed to resend invitation:', error);
      
      setInvites(prev => prev.map(invite => 
        invite.id === inviteItem.id ? {
          ...invite,
          status: 'failed',
          message: error.message || t('group.invitation.sendFailed')
        } : invite
      ));
      
      Alert.alert(t('common.error'), error.message || t('group.invitation.sendFailed'));
    } finally {
      setIsFullScreenLoading(false); // Hide full screen loading
    }
  };

  const handleRemoveInvite = (id: string) => {
    const invite = invites.find(inv => inv.id === id);
    if (!invite) return;

    Alert.alert(
      t('group.invitation.removeInvite'),
      t('group.invitation.confirmRemove', { email: invite.email }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            setInvites(prev => prev.filter(invite => invite.id !== id));
          }
        }
      ]
    );
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <ActivityIndicator size="small" color="#4A90E2" />;
      case 'sent':
        return <Icon name="check-circle" size={20} color="#4CAF50" />;
      case 'failed':
        return <Icon name="error" size={20} color="#F44336" />;
      case 'user_not_found':
        return <Icon name="person-off" size={20} color="#FF9800" />;
      default:
        return <Icon name="schedule" size={20} color="#9E9E9E" />;
    }
  };

  const getStatusText = (invite: InviteItem) => {
    switch (invite.status) {
      case 'sending':
        return { text: t('group.invitation.sending'), color: '#4A90E2' };
      case 'sent':
        if (invite.userExists) {
          return { text: t('group.invitation.sentToExisting'), color: '#4CAF50' };
        } else {
          return { text: t('group.invitation.sentToNew'), color: '#4CAF50' };
        }
      case 'failed':
        return { text: invite.message || t('group.invitation.sendFailed'), color: '#F44336' };
      case 'user_not_found':
        return { text: t('group.invitation.userNotFound'), color: '#FF9800' };
      default:
        return { text: t('group.invitation.pending'), color: '#9E9E9E' };
    }
  };

  const renderInviteItem: ListRenderItem<InviteItem> = ({ item }) => {
    const statusInfo = getStatusText(item);
    
    return (
      <View style={styles.inviteItem}>
        <View style={styles.inviteInfo}>
          <Text style={styles.inviteEmail}>{item.email}</Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.inviteStatus, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {item.status === 'failed' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.resendButton]}
              onPress={() => handleResendInvite(item)}
            >
              <Icon name="refresh" size={16} color="#4A90E2" />
              <Text style={styles.resendButtonText}>{t('group.invitation.resend')}</Text>
            </TouchableOpacity>
          )}
          
          {item.status !== 'sending' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveInvite(item.id)}
            >
              <Icon name="delete" size={16} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Fetch pending members on mount
  useEffect(() => {
    const fetchPending = async () => {
      setPendingLoading(true);
      try {
        const res = await groupService.getPendingGroupMembers(Number(groupId));
        setPendingMembers(res.pending_members);
      } catch (e) {
        // handle error
      }
      setPendingLoading(false);
    };
    fetchPending();
  }, [groupId]);

  // Accept/Reject handlers
  const handleAccept = async (userId: number) => {
    try {
      setLoadingUserId(userId);
      await groupService.acceptGroupMemberRequest(Number(groupId), userId);
      Alert.alert(
        t('common.success'), 
        t('group.invitation.memberAccepted')
      );
      // Reload pending list
      const res = await groupService.getPendingGroupMembers(Number(groupId));
      setPendingMembers(res.pending_members);
    } catch (e: any) {
      Alert.alert(
        t('common.error'), 
        e.message || t('group.invitation.acceptFailed')
      );
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      setLoadingUserId(userId);
      await groupService.rejectGroupMemberRequest(Number(groupId), userId);
      Alert.alert(
        t('common.success'), 
        t('group.invitation.memberRejected')
      );
      // Reload pending list
      const res = await groupService.getPendingGroupMembers(Number(groupId));
      setPendingMembers(res.pending_members);
    } catch (e: any) {
      Alert.alert(
        t('common.error'), 
        e.message || t('group.invitation.rejectFailed')
      );
    } finally {
      setLoadingUserId(null);
    }
  };

  // Thêm renderPendingMember
  const renderPendingMember = ({ item }: { item: PendingGroupMemberResponse }) => (
    <View style={styles.pendingCard}>
      {item.user_avatar_url ? (
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarBorder}>
            <Image source={{ uri: item.user_avatar_url }} style={styles.avatarImg} />
          </View>
        </View>
      ) : (
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarBorder}>
            <Icon name="person" size={40} color="#90caf9" />
          </View>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.pendingName}>{item.user_full_name}</Text>
        <Text style={styles.pendingEmail}>{item.user_email}</Text>
        <Text style={styles.pendingTime}>
          {t('group.invitation.requestedAt')}: {item.requested_at}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleAccept(item.user_id)}
        style={[styles.acceptBtn, loadingUserId === item.user_id && { opacity: 0.5 }]}
        disabled={loadingUserId === item.user_id}
      >
        {loadingUserId === item.user_id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon name="check" size={22} color="#fff" />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleReject(item.user_id)}
        style={[styles.rejectBtn, loadingUserId === item.user_id && { opacity: 0.5 }]}
        disabled={loadingUserId === item.user_id}
      >
        {loadingUserId === item.user_id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon name="close" size={22} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Icon name="group-add" size={24} color="#FFFFFF" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>{t('group.invitation.title')}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder={t('group.invitation.enterEmailPlaceholder')}
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        {/* Invite Button */}
        <TouchableOpacity 
          style={[styles.inviteButton, (isLoading || !email.trim()) && styles.inviteButtonDisabled]} 
          onPress={handleInvite}
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.inviteButtonText}>{t('group.invitation.sendInvite')}</Text>
          )}
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {t('group.invitation.instructions')}
          </Text>
        </View>

        {/* Pending Members List */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
            {t('group.invitation.pendingMembers')}
          </Text>
          {pendingLoading ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : (
            <FlatList
              data={pendingMembers}
              keyExtractor={item => String(item.user_id)}
              renderItem={renderPendingMember}
              ListEmptyComponent={
                <Text style={{ color: '#999' }}>
                  {t('group.invitation.noPendingMembers')}
                </Text>
              }
            />
          )}
        </View>

        {/* Invites List */}
        {invites.length > 0 && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {t('group.invitation.sentInvitations')} ({invites.length})
              </Text>
            </View>
            
            <FlatList
              data={invites}
              renderItem={renderInviteItem}
              keyExtractor={(item) => String(item.id)}
              style={styles.invitesList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}
      </View>

      {/* Full Screen Loading Modal */}
      <Modal
        visible={isFullScreenLoading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" style={styles.loadingSpinner} />
            <Text style={styles.loadingTitle}>{t('group.invitation.sending')}</Text>
            <Text style={styles.loadingSubtitle}>
              {t('group.invitation.sendingMessage')}
            </Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dotAnimation1]} />
              <View style={[styles.dot, styles.dotAnimation2]} />
              <View style={[styles.dot, styles.dotAnimation3]} />
            </View>
          </View>
        </View>
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
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333333',
  },
  inviteButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  listHeader: {
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  invitesList: {
    flex: 1,
  },
  inviteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteStatus: {
    fontSize: 14,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  resendButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  separator: {
    height: 8,
  },
  // Loading Modal Styles
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 280,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginHorizontal: 4,
  },
  dotAnimation1: {
    opacity: 0.4,
  },
  dotAnimation2: {
    opacity: 0.7,
  },
  dotAnimation3: {
    opacity: 1,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    marginRight: 0,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#90caf9',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  pendingName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  pendingEmail: {
    color: '#666',
    fontSize: 13,
    marginBottom: 2,
  },
  pendingTime: {
    color: '#b0b0b0',
    fontSize: 11,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  rejectBtn: {
    backgroundColor: '#F44336',
    borderRadius: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',       
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#F44336',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
});

export default InviteUsersScreen; 