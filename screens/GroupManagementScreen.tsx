import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

interface Group {
  id: string;
  name: string;
  date: string;
  incomeAmount: number;
  expenseAmount: number;
  memberCount: number;
}

const GroupManagementScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'NCM',
      date: '02/10/2024',
      incomeAmount: 50000000,
      expenseAmount: 100000000,
      memberCount: 5,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Mock API call
      setTimeout(() => {
        const mockGroups: Group[] = [
          {
            id: '1',
            name: 'NCM',
            date: '27/05/2025',
            incomeAmount: 50000000,
            expenseAmount: 100000000,
            memberCount: 5,
          },
        ];
        setGroups(mockGroups);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading groups:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSettingsPress = () => {
    // Navigate to group settings
    Alert.alert(t('group.settings'), t('group.groupSettings'));
  };

  const handleCreateGroup = () => {
    // Navigate to create group screen
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = () => {
    setShowJoinModal(true);
  };

  const handleGroupPress = (group: Group) => {
    // Navigate to group detail screen
    navigation.navigate('GroupDetail', { 
      groupId: group.id, 
      groupName: group.name 
    });
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newJoinCode = [...joinCode];
      newJoinCode[index] = value;
      setJoinCode(newJoinCode);
    }
  };

  const handleResendOtp = () => {
    if (resendTimer === 0) {
      setResendTimer(60);
      // Start countdown
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Mock API call to resend OTP
      Alert.alert('OTP đã được gửi lại', 'Vui lòng kiểm tra tin nhắn của bạn');
    }
  };

  const handleJoinGroupSubmit = () => {
    const joinString = joinCode.join('');
    if (joinString.length === 6) {
      // Mock API call to verify OTP and join group
      Alert.alert(
        'Tham gia nhóm thành công!',
        'Bạn đã tham gia nhóm thành công.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowJoinModal(false);
              setJoinCode(['', '', '', '', '', '']);
              // Reload groups
              loadGroups();
            }
          }
        ]
      );
    } else {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 chữ số');
    }
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setJoinCode(['', '', '', '', '', '']);
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupItem} onPress={() => handleGroupPress(item)}>
      <View style={styles.groupItemLeft}>
        <View style={styles.groupIcon}>
          <Icon name="group" size={24} color="#4A90E2" />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.groupItemRight}>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, styles.incomeAmount]}>
            +{item.incomeAmount.toLocaleString('vi-VN')} ₫
          </Text>
          <Text style={[styles.amount, styles.expenseAmount]}>
            -{item.expenseAmount.toLocaleString('vi-VN')} ₫
          </Text>
        </View>
        <Text style={styles.memberCount}>
          {item.memberCount} {item.memberCount === 1 ? t('group.member') : t('group.members')}
        </Text>
      </View>
    </TouchableOpacity>
  );



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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.welcomeText}>{t('group.title')}</Text>
            </View>

            <View style={styles.emptyContainer}>
              <Icon name="group" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>{t('group.noGroups')}</Text>
            </View>

            {/* Action Items */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionItem} onPress={handleCreateGroup}>
                <Icon name="group" size={24} color="#4A90E2" />
                <Text style={styles.actionText}>{t('group.createGroup')}</Text>
                <Icon name="chevron-right" size={20} color="#CCCCCC" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={handleJoinGroup}>
                <Icon name="login" size={24} color="#4A90E2" />
                <Text style={styles.actionText}>{t('group.joinGroup')}</Text>
                <Icon name="chevron-right" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
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

                <TouchableOpacity style={styles.actionItem} onPress={handleJoinGroup}>
                  <Icon name="login" size={24} color="#4A90E2" />
                  <Text style={styles.actionText}>{t('group.joinGroup')}</Text>
                  <Icon name="chevron-right" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Join Group OTP Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseJoinModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header with icon */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Icon name="login" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>Tham gia nhóm</Text>
              <Text style={styles.modalSubtitle}>Nhập mã nhóm gồm 6 chữ số để tham gia</Text>
            </View>
            
            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {joinCode.map((digit, index) => (
                <View key={index} style={styles.otpInputWrapper}>
                  <TextInput
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : null
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                </View>
              ))}
            </View>

            {/* Info text */}
            <Text style={styles.infoText}>
              Mã nhóm được chia sẻ bởi người tạo nhóm
            </Text>

            {/* Resend Button */}
            <TouchableOpacity 
              style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
              onPress={handleResendOtp}
              disabled={resendTimer > 0}
            >
              <Icon name="refresh" size={16} color={resendTimer > 0 ? "#999999" : "#4A90E2"} />
              <Text style={[styles.resendButtonText, resendTimer > 0 && styles.resendButtonTextDisabled]}>
                {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi lại mã'}
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseJoinModal}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.joinButton, 
                  joinCode.join('').length === 6 ? styles.joinButtonActive : styles.joinButtonInactive
                ]} 
                onPress={handleJoinGroupSubmit}
              >
                <Icon name="login" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.joinButtonText}>Tham gia</Text>
              </TouchableOpacity>
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
    alignItems: 'center',
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
    alignItems: 'center',
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
  },
  groupInfo: {
    flex: 1,
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
  },
  groupItemRight: {
    alignItems: 'flex-end',
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#FF4444',
  },
  memberCount: {
    fontSize: 12,
    color: '#666666',
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 30,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  otpInputWrapper: {
    flex: 1,
    marginHorizontal: 3,
  },
  otpInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    backgroundColor: '#F8F9FA',
  },
  otpInputFilled: {
    borderColor: '#4A90E2',
    backgroundColor: '#E8F0FE',
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: '#999999',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    marginLeft: 10,
  },
  joinButtonActive: {
    backgroundColor: '#4A90E2',
  },
  joinButtonInactive: {
    backgroundColor: '#CCCCCC',
  },
  joinButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
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
  actionText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});

export default GroupManagementScreen; 