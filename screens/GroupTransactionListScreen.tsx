import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typography } from '../constants/typography';
import { useLanguage } from '../contexts/LanguageContext';
import type { RootStackParamList } from '../navigation/types';
import { categoryService, CategoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { GroupMemberResponse, groupService } from '../services/groupService';
import { GroupTransactionResponse, transactionService, TransactionType } from '../services/transactionService';

type GroupTransactionListScreenRouteProp = RouteProp<RootStackParamList, 'GroupTransactionList'>;

interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  icon: string;
  iconColor: string;
  description?: string;
  categoryId?: number;
  userId?: number;
}

// Format money helper function
const formatMoney = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + '₫';
};

const TAB_MY = 'my';
const TAB_GROUP = 'group';

const GroupTransactionListScreen: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<GroupTransactionListScreenRouteProp>();
  const { groupId, groupName } = route.params;
  
  const [transactions, setTransactions] = useState<GroupTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>(TAB_MY);
  
  // Members and categories state
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<LocalCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<LocalCategory[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  const LIMIT = 20;

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

  // Load members data from API
  const loadMembersData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setMembersLoading(true);
      console.log('🟡 Loading group members for groupId:', groupId);
      
      const response = await groupService.getActiveGroupMembers(parseInt(groupId));
      console.log('🟢 Group members loaded:', response);
      
      // Combine group_leader + members array
      const allMembers: GroupMemberResponse[] = [];
      
      // Add group leader first
      if (response.group_leader) {
        allMembers.push(response.group_leader);
      }
      
      // Add other members
      if (response.members) {
        response.members.forEach(member => {
          // Avoid duplicate if leader is also in members array
          if (member.user_id !== response.group_leader?.user_id) {
            allMembers.push(member);
          }
        });
      }
      
      console.log('🟢 Final members array:', allMembers.length, 'members');
      setMembers(allMembers);
    } catch (error: any) {
      console.error('🔴 Failed to load group members:', error);
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  // Load categories data from API
  const loadCategoriesData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setCategoriesLoading(true);
      console.log('🟡 Loading group categories for groupId:', groupId);
      
      // Use same logic as GroupOverviewScreen for group context
      const userId = 0;
      const groupIdNum = parseInt(groupId);
      
      // Fetch categories for both expense and income
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, userId, groupIdNum),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, userId, groupIdNum),
      ]);

      console.log('🟢 Categories loaded:', {
        expenseCount: expenseCats.length,
        incomeCount: incomeCats.length,
      });

      // Convert to local format
      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(expenseCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));
      setIncomeCategories(incomeCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));

      console.log('🟢 Categories processed successfully');
    } catch (error: any) {
      console.error('🔴 Failed to load group categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [groupId]);

  const convertToLocalTransaction = (item: GroupTransactionResponse): Transaction => {
    const categoryName = getCategoryName(item.category_id);
    const transactionType = item.transaction_type?.toLowerCase();
    
    return {
      id: item.transaction_id.toString(),
      date: item.transaction_date,
      category: categoryName,
      amount: item.amount || 0,
      type: transactionType === 'income' ? 'income' : 'expense',
      icon: 'more-horiz', // Will be replaced by proper category icons if needed
      iconColor: transactionType === 'income' ? '#4CAF50' : '#F44336',
      description: item.description || '',
      categoryId: item.category_id,
      userId: item.user_id
    };
  };

  const loadTransactions = useCallback(async (currentOffset: number = 0, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (currentOffset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      console.log('🔄 Loading group transactions:', { groupId, offset: currentOffset, limit: LIMIT });
      
      const response = await transactionService.getGroupTransactionHistory(
        parseInt(groupId), 
        currentOffset, 
        LIMIT
      );
      
      console.log('🟢 Group transactions loaded:', response.length);
      
      if (isRefresh || currentOffset === 0) {
        setTransactions(response);
        setOffset(LIMIT);
      } else {
        setTransactions(prev => [...prev, ...response]);
        setOffset(currentOffset + LIMIT);
      }
      
      setHasMore(response.length === LIMIT);
      
    } catch (error: any) {
      console.error('🔴 Failed to load group transactions:', error);
      setError(error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [groupId]);

  // Load initial data
  useEffect(() => {
    loadMembersData();
    loadCategoriesData();
    loadTransactions(0);
  }, [loadMembersData, loadCategoriesData, loadTransactions]);

  const onRefresh = () => {
    loadTransactions(0, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && hasMore && transactions.length > 0) {
      loadTransactions(offset);
    }
  };

  // Enhanced Transaction Item Component with user avatar and better design
  const TransactionItem = ({ item }: { item: GroupTransactionResponse }) => {
    const isIncome = item.transaction_type === TransactionType.INCOME;
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
              {isIncome ? '+' : '-'}{formatMoney(item.amount)}
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
                {isIncome ? t('groupTransaction.income') : t('groupTransaction.expense')}
              </Text>
            </View>
            <Text style={styles.transactionDate}>
              {new Date(item.transaction_date.replace(' ', 'T')).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTransaction = ({ item }: { item: GroupTransactionResponse }) => {
    return <TransactionItem item={item} />;
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4A90E2" />
        <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt-long" size={64} color="#D0D0D0" />
      <Text style={styles.emptyStateTitle}>{t('groupTransaction.emptyTitle')}</Text>
      <Text style={styles.emptyStateDescription}>
        {t('groupTransaction.emptyDescription', { groupName })}
      </Text>
    </View>
  );

  // Tạm thời chia transaction thành 2 loại theo userId (giả lập)
  const myUserId = 0; // TODO: lấy userId thực tế từ context/auth
  const myTransactions = transactions.filter(t => t.user_id === myUserId);
  const groupTransactions = transactions;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('groupTransaction.title')}</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TAB_MY && styles.tabButtonActive]}
          onPress={() => setSelectedTab(TAB_MY)}
        >
          <Text style={[styles.tabText, selectedTab === TAB_MY && styles.tabTextActive]}>{t('groupTransaction.myTransactions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TAB_GROUP && styles.tabButtonActive]}
          onPress={() => setSelectedTab(TAB_GROUP)}
        >
          <Text style={[styles.tabText, selectedTab === TAB_GROUP && styles.tabTextActive]}>{t('groupTransaction.groupTransactions')}</Text>
        </TouchableOpacity>
      </View>
      {/* End Tabs */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>{t('groupTransaction.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>{t('groupTransaction.errorTitle')}</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadTransactions(0)}
          >
            <Text style={styles.retryButtonText}>{t('groupTransaction.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={selectedTab === TAB_MY ? myTransactions : groupTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.transaction_id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A90E2']}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={transactions.length === 0 ? styles.emptyListContainer : undefined}
        />
      )}
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
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    ...typography.medium,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    ...typography.regular,
  },
  headerRight: {
    width: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#333',
    flex: 1,
    marginRight: 8,
    ...typography.medium,
  },
  transactionAmount: {
    fontSize: 15,
    ...typography.medium,
  },
  transactionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
    ...typography.regular,
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
    color: '#666',
    ...typography.medium,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    ...typography.regular,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
    marginVertical: 4,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    ...typography.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    ...typography.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    ...typography.medium,
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    ...typography.regular,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    ...typography.medium,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    ...typography.medium,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    ...typography.regular,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    ...typography.medium,
  },
  tabTextActive: {
    color: '#4A90E2',
  },
});

export default GroupTransactionListScreen; 