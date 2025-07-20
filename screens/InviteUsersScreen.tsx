import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { EmailInvitationResponse, groupService, PendingGroupMemberResponse } from '../services/groupService';
type InviteUsersRouteProp = RouteProp<RootStackParamList, 'InviteUsers'>;

const InviteUsersScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<InviteUsersRouteProp>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
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

    setIsLoading(true);
    setIsFullScreenLoading(true);
    
    setEmail('');

    try {
      console.log('🟡 Sending invitation for group:', groupId, 'to email:', trimmedEmail);
      
      const response: EmailInvitationResponse = await groupService.sendEmailInvitation({
        group_id: parseInt(groupId),
        email: trimmedEmail
      });
      
      console.log('🟢 Invitation response:', response);

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
      Alert.alert(t('common.error'), error.message || t('group.invitation.sendFailed'));
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
              ListEmptyComponent={
                <Text style={{ color: '#999' }}>
                  {t('group.invitation.noPendingMembers')}
                </Text>
              }
            />
          )}
        </View>
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