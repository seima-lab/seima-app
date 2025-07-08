import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { categoryService, CategoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { GroupDetailResponse, GroupMemberResponse, groupService } from '../services/groupService';
import { GroupTransactionResponse, transactionService, TransactionType } from '../services/transactionService';

interface Props {
  groupId: string;
  groupName: string;
}

const GroupOverviewScreen: React.FC<Props> = ({ groupId, groupName }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  
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
  
  // Categories state
  const [expenseCategories, setExpenseCategories] = useState<LocalCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<LocalCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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

  // Calculate financial summary from actual transactions data
  const getFinancialSummary = () => {
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };
    }

    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.transaction_type === TransactionType.INCOME) {
          acc.totalIncome += transaction.amount;
        } else if (transaction.transaction_type === TransactionType.EXPENSE) {
          acc.totalExpense += transaction.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );

    // Calculate balance: income - expense
    summary.balance = summary.totalIncome - summary.totalExpense;

    console.log('💰 Financial summary calculated:', {
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      balance: summary.balance,
      transactionCount: transactions.length
    });

    return summary;
  };

  const financialSummary = getFinancialSummary();

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

  // Load categories data from API (similar to AddExpenseScreen logic)
  const loadCategoriesData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      console.log('🟡 Loading group categories for groupId:', groupId);
      
      // Use same logic as AddExpenseScreen for group context
      // For group context: userId=0, groupId=current group
      const userId = 0;
      const groupIdNum = parseInt(groupId);
      
      console.log('🔍 GroupOverviewScreen categories context:', {
        userId: userId,
        groupId: groupIdNum,
        groupIdType: typeof groupIdNum
      });
      
      // Fetch categories for both expense and income
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, userId, groupIdNum),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, userId, groupIdNum),
      ]);

      console.log('🟢 Categories loaded:', {
        expenseCount: expenseCats.length,
        incomeCount: incomeCats.length,
      });
      
      console.log('📊 Raw expense categories from API:', expenseCats.map(cat => ({
        category_id: cat.category_id,
        category_name: cat.category_name,
        category_type: cat.category_type
      })));
      
      console.log('📊 Raw income categories from API:', incomeCats.map(cat => ({
        category_id: cat.category_id,
        category_name: cat.category_name,
        category_type: cat.category_type
      })));

      // Convert to local format
      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(expenseCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));
      setIncomeCategories(incomeCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));

      console.log('🟢 Categories processed successfully');
    } catch (error: any) {
      console.error('🔴 Failed to load group categories:', error);
      setCategoriesError(error.message || 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, [groupId]);

  // Load transactions data from API
  const loadTransactionsData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setTransactionsLoading(true);
      setTransactionsError(null);
      console.log('🟡 Loading group transactions for groupId:', groupId);
      
      // Load all transactions for accurate financial summary calculation
      // Use a large page size to get all transactions at once
      const transactionsResponse = await transactionService.getGroupTransactionHistory(parseInt(groupId), 0, 1000);
      console.log('🟢 Group transactions loaded:', transactionsResponse.length, 'transactions');
      
      // Log transaction types for debugging
      const incomeCount = transactionsResponse.filter(t => t.transaction_type === TransactionType.INCOME).length;
      const expenseCount = transactionsResponse.filter(t => t.transaction_type === TransactionType.EXPENSE).length;
      console.log('📊 Transaction breakdown:', {
        total: transactionsResponse.length,
        income: incomeCount,
        expense: expenseCount
      });
      
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
    loadCategoriesData();
    loadTransactionsData();
  }, [loadGroupDetail, loadMembersData, loadCategoriesData, loadTransactionsData]);

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

  // Helper function to get user info from member data
  const getUserInfo = (userId: number) => {
    const user = members.find(member => member.user_id === userId);
    return {
      name: user?.user_full_name || 'Người dùng không xác định',
      avatar: user?.user_avatar_url || null
    };
  };

  // Helper function to get avatar source
  const getUserAvatarSource = (userId: number) => {
    const userInfo = getUserInfo(userId);
    if (userInfo.avatar) {
      return { uri: userInfo.avatar };
    }
    // Use male avatar as fallback
    return require('../assets/images/maleavatar.png');
  };

  // Helper function to get category name from category_id using real API data
  const getCategoryName = (categoryId: number) => {
    // Search in both expense and income categories
    const allCategories = [...expenseCategories, ...incomeCategories];
    const category = allCategories.find(cat => cat.category_id === categoryId);
    
    if (category) {
      console.log('🎯 Found category:', {
        categoryId: categoryId,
        categoryName: category.label,
        categoryKey: category.key
      });
      return category.label;
    }
    
    // Fallback if not found
    console.log('⚠️ Category not found for ID:', categoryId);
    return `Danh mục ${categoryId}`;
  };

  const handleCopyInviteCode = async () => {
    try {
      const inviteCode = groupDetail?.group_invite_link || t('group.overview.noInviteCode');
      await Clipboard.setString(inviteCode);
      Alert.alert(t('common.success'), t('group.overview.copySuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('group.overview.copyError'));
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
    const userInfo = getUserInfo(item.user_id);
    
    return (
      <View style={styles.transactionItem}>
        {/* User Avatar */}
        <View style={styles.transactionUserAvatar}>
          <Image 
            source={getUserAvatarSource(item.user_id)} 
            style={styles.transactionAvatarImage} 
          />
        </View>
        
        {/* Transaction Content */}
        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionUserName}>{userInfo.name}</Text>
            <Text style={[
              styles.transactionAmount, 
              { color: isIncome ? '#4CAF50' : '#F44336' }
            ]}>
              {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
          </View>
          
          <Text style={styles.transactionDescription}>
            {getCategoryName(item.category_id)}
          </Text>
          
          <View style={styles.transactionMeta}>
            <View style={styles.transactionTypeContainer}>
              <View style={[
                styles.transactionTypeIndicator, 
                { backgroundColor: isIncome ? '#E8F5E8' : '#FFF2F2' }
              ]}>
                <Icon 
                  name={isIncome ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={isIncome ? '#4CAF50' : '#F44336'} 
                />
              </View>
              <Text style={styles.transactionType}>
                {isIncome ? 'Thu nhập' : 'Chi tiêu'}
              </Text>
            </View>
            
            <Text style={styles.transactionDate}>
              {new Date(item.transaction_date).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        </View>
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
              <Text style={styles.loadingText}>{t('common.loading')}...</Text>
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
                  <Text style={styles.groupMeta}>
                    {t('group.overview.totalMembers', { count: groupDetail.total_members_count })} • {t('group.overview.groupCreated')} {new Date(groupDetail.group_created_date).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={handleEditGroup}>
                  <Icon name="edit" size={20} color="#1e90ff" />
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.cardTitle}>{t('group.overview.financialSummary')}</Text>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>{t('group.overview.totalIncome')}</Text>
              <Text style={styles.incomeAmount}>{formatCurrency(financialSummary.totalIncome)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>{t('group.overview.totalExpense')}</Text>
              <Text style={styles.expenseAmount}>{formatCurrency(financialSummary.totalExpense)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>{t('group.overview.balance')}</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(financialSummary.balance)}</Text>
            </View>
          </View>
        </View>

        {/* Members Preview */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.cardTitle}>{t('group.overview.membersPreview')}</Text>
            <View style={styles.memberAvatars}>
              {membersLoading ? (
                <ActivityIndicator size="small" color="#4A90E2" />
              ) : membersError ? (
                <Text style={styles.errorText}>{membersError}</Text>
              ) : (
                <>
                  {members.length === 0 ? (
                    <Text style={styles.noMembersText}>{t('group.overview.noMembers')}</Text>
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
              {t('group.overview.totalMembers', { count: totalMembersCount })}
            </Text>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.cardTitle}>{t('group.overview.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GroupTransactionList', { groupId, groupName })}>
              <Text style={styles.viewAllText}>{t('group.overview.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={transactions.slice(0, 5)}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.transaction_id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={() => (
              transactionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={styles.loadingText}>{t('group.overview.loadingTransactions')}</Text>
                </View>
              ) : transactionsError ? (
                <Text style={styles.errorText}>{transactionsError}</Text>
              ) : null
            )}
            ListEmptyComponent={() => (
              !transactionsLoading && !transactionsError ? (
                <Text style={styles.emptyText}>{t('group.overview.noTransactions')}</Text>
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
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  transactionUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  transactionAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  transactionUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  transactionDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTypeIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  transactionType: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '400',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
    marginVertical: 4,
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