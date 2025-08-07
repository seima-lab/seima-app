import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomErrorModal from '../components/CustomErrorModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import { typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { groupService, InvitedMemberResponse, PendingGroupMemberResponse } from '../services/groupService';
type InviteUsersRouteProp = RouteProp<RootStackParamList, 'InviteUsers'>;

const InviteUsersScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<InviteUsersRouteProp>();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<PendingGroupMemberResponse[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [invitedMembers, setInvitedMembers] = useState<InvitedMemberResponse[]>([]);
  const [invitedLoading, setInvitedLoading] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);

  // State for CustomErrorModal
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error' as 'error' | 'warning' | 'info' | 'success',
  });

  // State for CustomSuccessModal
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    buttonText: '',
  });

  const showError = (message: string, title?: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setErrorModal({
      visible: true,
      title: title || t('common.error'),
      message,
      type,
    });
  };

  const hideErrorModal = () => {
    setErrorModal((prev) => ({ ...prev, visible: false }));
  };

  const showSuccess = (message: string, title?: string, buttonText?: string) => {
    setSuccessModal({
      visible: true,
      title: title || t('common.success'),
      message,
      buttonText: buttonText || t('common.ok'),
    });
  };

  const hideSuccessModal = () => {
    setSuccessModal((prev) => ({ ...prev, visible: false }));
  };

  // Format date helper function
  const formatRequestedDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      
      const currentLocale = i18n.language || 'en';
      
      // Convert to Vietnam timezone (UTC+7)
      const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      
      // Format: dd/mm/yyyy HH:mm
      return vietnamTime.toLocaleDateString(currentLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

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

    setIsLoading(true);
    setIsFullScreenLoading(true);
    
    setEmail('');

    try {
      console.log('🟡 Sending invitation for group:', groupId, 'to email:', trimmedEmail);
      
      const response = await groupService.sendEmailInvitation({
        group_id: parseInt(groupId),
        email: trimmedEmail
      });
      console.log('API response:', response);
      if (!response) {
        showError(t('group.invitation.alreadyInvited') || 'Gửi lời mời thất bại. Vui lòng thử lại.');
        return;
      }
      // Nếu response chỉ có status_code và message (không có email_sent)
      if (
        typeof response === 'object' && response !== null &&
        'status_code' in response && 'message' in response && !('email_sent' in response)
      ) {
        const res: any = response;
        if (res.status_code === 409 || (res.message && res.message.toLowerCase().includes('already been invited'))) {
          showError(t('group.invitation.alreadyInvited'));
        } else {
          showError(res.message || t('group.invitation.sendFailed'));
        }
        return;
      }
      // Nếu response có email_sent thì xử lý như cũ
      if ('email_sent' in response) {
        const res: any = response;
        if (res.email_sent) {
          if (res.user_exists) {
            showSuccess(
              t('group.invitation.sentToExistingUser', { email: trimmedEmail }),
              t('common.success')
            );
          } else {
            showSuccess(
              t('group.invitation.sentToNewUser', { email: trimmedEmail }),
              t('common.success')
            );
          }
          // Reload invited members list after successful invitation
          fetchInvitedMembers();
        } else {
          showError(res.message || t('group.invitation.sendFailed'));
        }
        return;
      }
      // Nếu không khớp trường hợp nào, show lỗi chung
      showError(t('group.invitation.sendFailed') || 'Gửi lời mời thất bại. Vui lòng thử lại.');
      return;

    } catch (error: any) {
      console.error('🔴 Failed to send invitation:', error);
      // Xử lý lỗi 409
      let statusCode = error?.response?.status;
      let backendMessage = error?.response?.data?.message || error?.message;
      if (statusCode === 409 || (backendMessage && (backendMessage.toLowerCase().includes('409') || backendMessage.toLowerCase().includes('conflict')))) {
        showError(backendMessage || t('group.invitation.conflict'));
      } else {
        Alert.alert(t('common.error'), error.message || t('group.invitation.sendFailed'));
      }
    } finally {
      setIsLoading(false);
      setIsFullScreenLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  // Fetch invited members function
  const fetchInvitedMembers = async () => {
    setInvitedLoading(true);
    try {
      const res = await groupService.getInvitedMembers(Number(groupId));
      setInvitedMembers(res);
    } catch (e) {
      console.error('Error fetching invited members:', e);
    }
    setInvitedLoading(false);
  };

  // Fetch invited members on mount
  useEffect(() => {
    fetchInvitedMembers();
  }, [groupId]);

  // Accept/Reject handlers
  const handleAccept = async (userId: number) => {
    try {
      setLoadingUserId(userId);
      await groupService.acceptGroupMemberRequest(Number(groupId), userId);
      showSuccess(t('group.invitation.memberAccepted'));
      setShouldNavigateBack(true);
    } catch (e: any) {
      showError(e.message || t('group.invitation.acceptFailed'));
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      setLoadingUserId(userId);
      await groupService.rejectGroupMemberRequest(Number(groupId), userId);
      showSuccess(t('group.invitation.memberRejected'));
      setShouldNavigateBack(true);
    } catch (e: any) {
      showError(e.message || t('group.invitation.rejectFailed'));
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
          {t('group.invitation.requestedAt')}: {formatRequestedDate(item.requested_at)}
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

  // Render invited member
  const renderInvitedMember = ({ item }: { item: any }) => (
    <View style={styles.invitedCard}>
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
        <Text style={styles.invitedName}>{item.user_full_name}</Text>
        <Text style={styles.invitedEmail}>{item.user_email}</Text>
        <Text style={styles.invitedTime}>
          {t('group.invitation.invitedAt')}: {formatRequestedDate(item.invited_at)}
        </Text>
      
      </View>
    </View>
  );

  // Handle navigation after successful accept/reject
  useEffect(() => {
    if (shouldNavigateBack) {
      // Add a small delay to ensure modal closes properly
      setTimeout(() => {
        // Navigate back to GroupOverviewScreen by going back twice
        // since the navigation stack is: GroupOverview -> GroupMembers -> InviteUsers
        console.log('🔄 Navigating back to GroupOverviewScreen after accept/reject');
        navigation.goBack(); // Go back to GroupMembers
        setTimeout(() => {
          navigation.goBack(); // Go back to GroupOverview
        }, 50);
      }, 100);
      setShouldNavigateBack(false); // Reset the flag
    }
  }, [shouldNavigateBack, navigation]);

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
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        {/* Invited Members List */}
        <View style={{ marginTop: 16 }}>
          <Text style={[typography.semibold, { fontSize: 16, marginBottom: 8 }]}>
            {t('group.invitation.invitedMembers')}
          </Text>
          {invitedLoading ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : (
            <FlatList
              data={invitedMembers}
              keyExtractor={item => String(item.user_id)}
              renderItem={renderInvitedMember}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={{ color: '#999' }}>
                  {t('group.invitation.noInvitedMembers')}
                </Text>
              }
            />
          )}
        </View>

        {/* Pending Members List */}
        <View style={{ marginTop: 16 }}>
          <Text style={[typography.semibold, { fontSize: 16, marginBottom: 8 }]}>
            {t('group.invitation.pendingMembers')}
          </Text>
          {pendingLoading ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : (
            <FlatList
              data={pendingMembers}
              keyExtractor={item => String(item.user_id)}
              renderItem={renderPendingMember}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={{ color: '#999' }}>
                  {t('group.invitation.noPendingMembers')}
                </Text>
              }
            />
          )}
        </View>
      </ScrollView>

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
      {/* CustomErrorModal for 409 error */}
      <CustomErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onDismiss={hideErrorModal}
        type={errorModal.type}
      />

      {/* CustomSuccessModal for accept/reject */}
      <CustomSuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        buttonText={successModal.buttonText}
        onConfirm={() => {
          hideSuccessModal();
          console.log('✅ Success modal confirmed');
        }}
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
    ...typography.semibold,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 20,
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
    ...typography.semibold,
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
  // Invited Members Styles
  invitedCard: {
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
  invitedName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  invitedEmail: {
    color: '#666',
    fontSize: 13,
    marginBottom: 2,
  },
  invitedTime: {
    color: '#b0b0b0',
    fontSize: 11,
    marginBottom: 2,
  },
  invitedRole: {
    color: '#4CAF50',
    fontSize: 12,
    ...typography.semibold,
  },
  invitedStatus: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default InviteUsersScreen; 