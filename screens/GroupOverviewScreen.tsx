import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Image,
  ListRenderItem,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { RootStackParamList } from '../navigation/types';
import { GroupDetailResponse, GroupMemberResponse, groupService } from '../services/groupService';
import { GroupTransactionResponse, transactionService, TransactionType } from '../services/transactionService';

interface GroupOverviewScreenProps {
  groupId: string;
  groupName: string;
}

const GroupOverviewScreen: React.FC<GroupOverviewScreenProps> = ({ groupId, groupName }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // State management
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  
  // Group detail state
  const [groupDetail, setGroupDetail] = useState<GroupDetailResponse | null>(null);
  const [groupDetailLoading, setGroupDetailLoading] = useState(true);
  const [groupDetailError, setGroupDetailError] = useState<string | null>(null);
  
  // Transactions state
  const [transactions, setTransactions] = useState<GroupTransactionResponse[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  
  // Load group detail data from API
  const loadGroupDetail = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setGroupDetailLoading(true);
      setGroupDetailError(null);
      console.log('🟡 Loading group detail for groupId:', groupId);
      
      const response = await groupService.getGroupDetail(parseInt(groupId));
      console.log('🟢 Group detail loaded:', response);
      
      setGroupDetail(response);
    } catch (error: any) {
      console.error('🔴 Failed to load group detail:', error);
      setGroupDetailError(error.message || 'Failed to load group detail');
    } finally {
      setGroupDetailLoading(false);
    }
  }, [groupId]);

  const financialSummary = {
    totalIncome: 15000000,
    totalExpense: 8500000,
    balance: 6500000,
  };

  // Load members data from API
  const loadMembersData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setMembersLoading(true);
      setMembersError(null);
      console.log('🟡 Loading group members for groupId:', groupId);
      
      const response = await groupService.getActiveGroupMembers(parseInt(groupId));
      console.log('🟢 Group members loaded:', response);
      
      // Combine group_leader + members array (same as GroupMembersScreen)
      const allMembers: GroupMemberResponse[] = [];
      
      // Add group leader first
      if (response.group_leader) {
        console.log('🟡 Adding group leader:', response.group_leader.user_full_name);
        allMembers.push(response.group_leader);
      }
      
      // Add other members
      if (response.members) {
        console.log('🟡 Adding members:', response.members.length);
        response.members.forEach(member => {
          // Avoid duplicate if leader is also in members array
          if (member.user_id !== response.group_leader?.user_id) {
            allMembers.push(member);
          }
        });
      }
      
      console.log('🟢 Final members array:', allMembers.length, 'members');
      setMembers(allMembers);
      setTotalMembersCount(response.total_members_count || 0);
    } catch (error: any) {
      console.error('🔴 Failed to load group members:', error);
      setMembersError(error.message || 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  // Load transactions data from API
  const loadTransactionsData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setTransactionsLoading(true);
      setTransactionsError(null);
      console.log('🟡 Loading group transactions for groupId:', groupId);
      
      const transactionsResponse = await transactionService.getGroupTransactionHistory(parseInt(groupId), 0, 10);
      console.log('🟢 Group transactions loaded:', transactionsResponse);
      
      setTransactions(transactionsResponse);
    } catch (error: any) {
      console.error('🔴 Failed to load group transactions:', error);
      setTransactionsError(error.message || 'Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
    }
  }, [groupId]);

  // Load all data
  const loadAllData = useCallback(() => {
    loadGroupDetail();
    loadMembersData();
    loadTransactionsData();
  }, [loadGroupDetail, loadMembersData, loadTransactionsData]);

  // Load data when component mounts
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh data when screen comes into focus (after editing/deleting from GroupTransactionListScreen)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 GroupOverviewScreen focused - refreshing data');
      loadAllData();
    }, [loadAllData])
  );

  // Helper function to get avatar source based on user data
  const getAvatarSource = (member: GroupMemberResponse) => {
    console.log('🟡 Getting avatar for member:', member.user_full_name, 'Avatar URL:', member.user_avatar_url);
    
    if (member.user_avatar_url) {
      return { uri: member.user_avatar_url };
    }
    
    // Use male avatar as fallback when URL is null
    console.log('🟡 Using fallback avatar for:', member.user_full_name);
    return require('../assets/images/maleavatar.png');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const handleCopyInviteCode = async () => {
    try {
      const inviteCode = groupDetail?.group_invite_link || 'Không có mã mời';
      await Clipboard.setString(inviteCode);
      Alert.alert('Thành công', 'Đã sao chép mã mời vào clipboard');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể sao chép mã mời');
    }
  };

  const handleEditGroup = () => {
    navigation.navigate('EditGroup', { groupId, groupName });
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddExpenseScreen', {
      fromGroupOverview: true,
      groupId: groupId,
      groupName: groupName
    });
  };

  const renderTransaction: ListRenderItem<GroupTransactionResponse> = ({ item }) => {
    const isIncome = item.transaction_type === TransactionType.INCOME;
    const isExpense = item.transaction_type === TransactionType.EXPENSE;
    
    return (
      <View style={styles.transactionItem}>
        <View style={[styles.transactionIcon, { backgroundColor: isIncome ? '#E8F5E8' : '#FFF2F2' }]}>
          <Icon 
            name={isIncome ? 'arrow-downward' : 'arrow-upward'} 
            size={20} 
            color={isIncome ? '#4CAF50' : '#F44336'} 
          />
        </View>
        <View style={styles.transactionContent}>
          <Text style={styles.transactionDescription}>{item.description || 'Không có mô tả'}</Text>
          <Text style={styles.transactionCategory}>
            Category ID: {item.category_id} • {new Date(item.transaction_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <Text style={[
          styles.transactionAmount, 
          { color: isIncome ? '#4CAF50' : '#F44336' }
        ]}>
          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  const renderMemberAvatar = (member: GroupMemberResponse, index: number) => (
    <View key={member.user_id} style={[styles.memberAvatar, { marginLeft: index > 0 ? -8 : 0 }]}>
      <Image source={getAvatarSource(member)} style={styles.memberAvatarImage} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Group Info Card */}
        <View style={styles.groupInfoCard}>
          {groupDetailLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Đang tải thông tin nhóm...</Text>
            </View>
          ) : groupDetailError ? (
            <Text style={styles.errorText}>{groupDetailError}</Text>
          ) : groupDetail ? (
            <>
              <View style={styles.groupHeader}>
                <Image 
                  source={groupDetail.group_avatar_url ? { uri: groupDetail.group_avatar_url } : require('../assets/images/group.png')} 
                  style={styles.groupAvatar} 
                />
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>{groupDetail.group_name}</Text>
                  <Text style={styles.groupDescription}>Nhóm quản lý tài chính gia đình</Text>
                  <Text style={styles.groupMeta}>
                    {groupDetail.total_members_count} thành viên • Tạo ngày {new Date(groupDetail.group_created_date).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={handleEditGroup}>
                  <Icon name="edit" size={20} color="#1e90ff" />
                </TouchableOpacity>
              </View>
              
              {/* Invite Code Section */}
              {groupDetail.group_invite_link && (
                <View style={styles.inviteCodeSection}>
                  <Text style={styles.inviteCodeLabel}>Mã mời nhóm</Text>
                  <TouchableOpacity 
                    style={styles.inviteCodeContainer}
                    onPress={handleCopyInviteCode}
                  >
                    <Text style={styles.inviteCodeText}>{groupDetail.group_invite_link}</Text>
                    <Icon name="content-copy" size={18} color="#4A90E2" />
                  </TouchableOpacity>
                  <Text style={styles.inviteCodeHint}>Nhấn để sao chép và chia sẻ với bạn bè</Text>
                </View>
              )}
            </>
          ) : null}
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.cardTitle}>Tổng quan tài chính</Text>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Thu nhập</Text>
              <Text style={styles.incomeAmount}>{formatCurrency(financialSummary.totalIncome)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Chi tiêu</Text>
              <Text style={styles.expenseAmount}>{formatCurrency(financialSummary.totalExpense)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Số dư</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(financialSummary.balance)}</Text>
            </View>
          </View>
        </View>

        {/* Members Preview */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.cardTitle}>Thành viên</Text>
            <View style={styles.memberAvatars}>
              {membersLoading ? (
                <ActivityIndicator size="small" color="#4A90E2" />
              ) : membersError ? (
                <Text style={styles.errorText}>{membersError}</Text>
              ) : (
                <>
                  {(() => {
                    console.log('🔍 Debug - Members array length:', members.length);
                    console.log('🔍 Debug - Members data:', JSON.stringify(members, null, 2));
                    return null;
                  })()}
                  {members.length === 0 ? (
                    <Text style={styles.noMembersText}>Không có thành viên nào</Text>
                  ) : (
                    members.slice(0, 3).map((member, index) => {
                      console.log('🟡 Rendering member avatar:', member.user_full_name, 'Index:', index, 'Avatar URL:', member.user_avatar_url);
                      return renderMemberAvatar(member, index);
                    })
                  )}
                  {members.length > 3 && (
                    <View style={styles.moreMembers}>
                      <Text style={styles.moreMembersText}>+{members.length - 3}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
          {!membersLoading && !membersError && (
            <Text style={styles.memberCount}>
              Tổng cộng: {totalMembersCount} thành viên
            </Text>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.cardTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GroupTransactionList', { groupId, groupName })}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.transaction_id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={() => (
              transactionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
                </View>
              ) : transactionsError ? (
                <Text style={styles.errorText}>{transactionsError}</Text>
              ) : null
            )}
            ListEmptyComponent={() => (
              !transactionsLoading && !transactionsError ? (
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              ) : null
            )}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  groupInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 12,
    color: '#999999',
  },
  financialCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreMembersText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 80,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666666',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 52,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editButton: {
    padding: 8,
  },
  inviteCodeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 6,
  },
  inviteCodeText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    fontFamily: 'monospace',
    flex: 1,
  },
  inviteCodeHint: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
  memberCount: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  noMembersText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default GroupOverviewScreen; 