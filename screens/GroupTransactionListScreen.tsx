import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomConfirmModal from '../components/CustomConfirmModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import { typography } from '../constants/typography';
import { useLanguage } from '../contexts/LanguageContext';
import type { RootStackParamList } from '../navigation/types';
import { categoryService, CategoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { GroupMemberResponse, groupService } from '../services/groupService';
import { secureApiService } from '../services/secureApiService';
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

// Check if date is today
const isToday = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return transactionDate.getTime() === today.getTime();
  } catch (error) {
    return false;
  }
};

// Format date helper function - display formatted date and time
const formatTransactionDate = (dateString: string, language: string): string => {
  try {
    console.log('🔍 Original date string from database:', dateString);
    
    // Parse the date string
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid date string:', dateString);
      return dateString;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Format time (HH:mm)
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Format date based on when the transaction occurred
    if (transactionDate.getTime() === today.getTime()) {
      // Today - show only time
      return timeString;
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      // Yesterday - show "Hôm qua" + time
      return `Hôm qua ${timeString}`;
    } else {
      // Check if it's within the last 7 days
      const daysDiff = Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        // Within last 7 days - show day name + time
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayName = dayNames[date.getDay()];
        return `${dayName} ${timeString}`;
      } else {
        // Older than 7 days - show full date + time
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year} ${timeString}`;
      }
    }
    
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

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
  
  // Members and categories state
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<LocalCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<LocalCategory[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Current user and filter state
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showOnlyMyTransactions, setShowOnlyMyTransactions] = useState(false);
  
  // Delete confirmation state
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [selectedTransactionIdToDelete, setSelectedTransactionIdToDelete] = useState<string | null>(null);
  const [isDeleteSuccessModalVisible, setIsDeleteSuccessModalVisible] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  const LIMIT = 10000;
  const SWIPE_THRESHOLD = -80;
  const DELETE_BUTTON_WIDTH = 80;
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({});

  // Helper function to get animated value for a transaction
  const getAnimatedValue = (transactionId: string) => {
    if (!animatedValues.current[transactionId]) {
      animatedValues.current[transactionId] = new Animated.Value(0);
    }
    return animatedValues.current[transactionId];
  };

  // Helper function to reset swipe position
  const resetSwipe = (transactionId: string) => {
    const animatedValue = getAnimatedValue(transactionId);
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  // Delete transaction handlers
  const handleDeleteTransaction = (transactionId: string) => {
    resetSwipe(transactionId);
    setSelectedTransactionIdToDelete(transactionId);
    setIsDeleteConfirmModalVisible(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!selectedTransactionIdToDelete) return;
    
    try {
      setDeletingTransactionId(selectedTransactionIdToDelete);
      setIsDeleteConfirmModalVisible(false);
      
      console.log('🗑️ Deleting transaction:', selectedTransactionIdToDelete);
      await transactionService.deleteTransaction(parseInt(selectedTransactionIdToDelete));
      
      // Remove transaction from local state
      setTransactions(prev => prev.filter(t => t.transaction_id?.toString() !== selectedTransactionIdToDelete));
      
      // Clean up animated value
      delete animatedValues.current[selectedTransactionIdToDelete];
      
      console.log('✅ Transaction deleted successfully');
      setIsDeleteSuccessModalVisible(true);
      
    } catch (error: any) {
      console.error('❌ Error deleting transaction:', error);
      // You might want to show an error modal here
    } finally {
      setDeletingTransactionId(null);
      setSelectedTransactionIdToDelete(null);
    }
  };

  const cancelDeleteTransaction = () => {
    setIsDeleteConfirmModalVisible(false);
    setSelectedTransactionIdToDelete(null);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteSuccessModalVisible(false);
  };

  // Helper function to get current user profile
  const getCurrentUserProfile = useCallback(async () => {
    try {
      console.log('🔄 Getting current user profile...');
      const userProfile = await secureApiService.getCurrentUserProfile();
      console.log('✅ Current user profile loaded:', userProfile);
      setCurrentUserId(userProfile.user_id);
    } catch (error: any) {
      console.error('❌ Failed to get current user profile:', error);
    }
  }, []);

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
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, groupIdNum),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, groupIdNum),
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
      id: item.transaction_id?.toString() || `transaction-${Math.random()}`,
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
    getCurrentUserProfile(); // Load current user profile on mount
  }, [loadMembersData, loadCategoriesData, loadTransactions, getCurrentUserProfile]);

  const onRefresh = () => {
    loadTransactions(0, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && hasMore && transactions.length > 0) {
      loadTransactions(offset);
    }
  };

  // Handle filter toggle between all transactions and my transactions only
  const handleFilterToggle = () => {
    setShowOnlyMyTransactions(!showOnlyMyTransactions);
  };

  // Handle transaction item press
  const handleTransactionPress = (transaction: GroupTransactionResponse) => {
    // Only allow editing own transactions
    if (transaction.user_id !== currentUserId) {
      console.log('⚠️ Cannot edit transaction of other user:', {
        transactionUserId: transaction.user_id,
        currentUserId: currentUserId
      });
      return;
    }

    console.log('🔄 Navigating to edit transaction:', {
      transactionId: transaction.transaction_id,
      transactionType: transaction.transaction_type,
      amount: transaction.amount,
      categoryId: transaction.category_id
    });

    // Navigate to AddExpenseScreen in edit mode with group context
    (navigation as any).navigate('AddExpenseScreen', {
      editMode: true,
      transactionData: {
        id: transaction.transaction_id?.toString() || `transaction-${Math.random()}`,
        amount: transaction.amount,
        note: transaction.description || '',
        date: transaction.transaction_date,
        category: getCategoryName(transaction.category_id),
        categoryId: transaction.category_id, // Add categoryId for better matching
        type: transaction.transaction_type.toLowerCase()
      },
      fromGroupOverview: true, // Enable group context
      groupId: groupId,
      groupName: groupName,
      fromGroupTransactionList: true // Indicate coming from transaction list
    });
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactionList: GroupTransactionResponse[]) => {
    const grouped: { [key: string]: GroupTransactionResponse[] } = {};
    
    transactionList.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    
    // Sort transactions within each date group by time (newest first)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const timeA = new Date(a.transaction_date).getTime();
        const timeB = new Date(b.transaction_date).getTime();
        return timeB - timeA; // Newest first
      });
    });
    
    return grouped;
  };

  // Get sorted date keys (newest first)
  const getSortedDateKeys = (groupedTransactions: { [key: string]: GroupTransactionResponse[] }) => {
    const dateKeys = Object.keys(groupedTransactions);
    return dateKeys.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  };

  // Filter transactions based on current filter state
  const getFilteredTransactions = () => {
    let filteredTransactions = transactions;
    
    if (showOnlyMyTransactions && currentUserId) {
      // Show only current user's transactions
      filteredTransactions = transactions.filter(t => t.user_id === currentUserId);
      console.log('🔍 Filtered to my transactions:', {
        totalTransactions: transactions.length,
        myTransactions: filteredTransactions.length,
        currentUserId: currentUserId
      });
    }
    
    return filteredTransactions;
  };

  // Swipeable Transaction Item Component with delete functionality
  const SwipeableTransactionItem = ({ item }: { item: GroupTransactionResponse }) => {
    const isIncome = item.transaction_type === TransactionType.INCOME;
    const userInfo = getUserInfo(item.user_id);
    const isMyTransaction = item.user_id === currentUserId;
    const transactionId = item.transaction_id?.toString() || `transaction-${Math.random()}`;
    const animatedValue = getAnimatedValue(transactionId);
    const isDeleting = deletingTransactionId === transactionId;

    // Only allow swipe for own transactions
    if (!isMyTransaction) {
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
              <View style={styles.transactionDateContainer}>
                {isToday(item.transaction_date) && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayIndicatorText}>Hôm nay</Text>
                  </View>
                )}
                <Text style={[
                  styles.transactionDate,
                  isToday(item.transaction_date) && styles.todayDate
                ]}>
                  {formatTransactionDate(item.transaction_date, language)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: animatedValue } }],
      { useNativeDriver: false }
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX, velocityX } = event.nativeEvent;
        
        if (translationX < SWIPE_THRESHOLD || velocityX < -500) {
          // Swipe far enough or fast enough - show delete button
          Animated.spring(animatedValue, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        } else {
          // Snap back to original position (hide delete button)
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        }
      }
    };

    const handleDelete = () => {
      handleDeleteTransaction(transactionId);
    };

    return (
      <View style={styles.swipeableContainer}>
        {/* Delete Button Background */}
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="delete" size={24} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>{t('delete')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Swipeable Transaction Card */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
        >
          <Animated.View
            style={[
              styles.animatedTransactionCard,
              {
                transform: [{ translateX: animatedValue }],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.transactionItem}
              onPress={() => handleTransactionPress(item)}
              activeOpacity={0.7}
            >
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
                  <View style={styles.transactionDateContainer}>
                    {isToday(item.transaction_date) && (
                      <View style={styles.todayIndicator}>
                        <Text style={styles.todayIndicatorText}>Hôm nay</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.transactionDate,
                      isToday(item.transaction_date) && styles.todayDate
                    ]}>
                      {formatTransactionDate(item.transaction_date, language)}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Edit arrow for own transactions */}
              <Icon name="chevron-right" size={20} color="#CCCCCC" style={styles.editArrow} />
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  const renderDateGroup = ({ item: dateKey }: { item: string }) => {
    const transactionsForDate = groupedTransactions[dateKey];
    
    return (
      <View style={styles.dateGroupContainer}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{formatDateHeader(dateKey)}</Text>
          <Text style={styles.dateHeaderCount}>{transactionsForDate.length} giao dịch</Text>
        </View>
        
        {/* Transactions for this date */}
        {transactionsForDate.map((transaction, index) => (
          <View key={transaction.transaction_id?.toString() || `transaction-${Math.random()}`}>
            <SwipeableTransactionItem item={transaction} />
            {index < transactionsForDate.length - 1 && <View style={styles.transactionSeparator} />}
          </View>
        ))}
      </View>
    );
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

  // Use all transactions for the group
  const filteredTransactions = getFilteredTransactions();
  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const sortedDateKeys = getSortedDateKeys(groupedTransactions);

  // Format date for header display
  const formatDateHeader = (dateKey: string): string => {
    const date = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayKey = today.toISOString().split('T')[0];
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    if (dateKey === todayKey) {
      return 'Hôm nay';
    } else if (dateKey === yesterdayKey) {
      return 'Hôm qua';
    } else {
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayName = dayNames[date.getDay()];
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${dayName}, ${day}/${month}/${year}`;
    }
  };

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
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleFilterToggle}>
            <View style={[styles.filterButton, showOnlyMyTransactions ? { backgroundColor: '#E3F2FD' } : {}]}>
              <Icon 
                name={showOnlyMyTransactions ? 'filter-list' : 'filter-list-alt'} 
                size={24} 
                color="#4A90E2" 
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
        <>
          {/* Filter Indicator */}
          {showOnlyMyTransactions && (
            <View style={styles.filterIndicator}>
              <Icon name="person" size={16} color="#4A90E2" />
              <Text style={styles.filterIndicatorText}>
                Chỉ hiển thị giao dịch của tôi ({filteredTransactions.length} giao dịch)
              </Text>
            </View>
          )}
          
          <FlatList
            data={sortedDateKeys}
            renderItem={renderDateGroup}
            keyExtractor={(dateKey) => dateKey}
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={filteredTransactions.length === 0 ? styles.emptyListContainer : undefined}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <CustomConfirmModal
        visible={isDeleteConfirmModalVisible}
        title={t('common.confirm')}
        message={t('groupTransaction.confirmDelete') || 'Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.'}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={confirmDeleteTransaction}
        onCancel={cancelDeleteTransaction}
        type="danger"
        iconName="delete"
      />

      {/* Delete Success Modal */}
      <CustomSuccessModal
        visible={isDeleteSuccessModalVisible}
        title={t('common.success')}
        message={t('groupTransaction.deleteSuccess') || 'Giao dịch đã được xóa thành công!'}
        buttonText={t('common.ok')}
        onConfirm={handleDeleteSuccess}
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
  filterButton: {
    padding: 8,
    borderRadius: 20,
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
    position: 'relative',
  },
  transactionAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  editIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  transactionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayIndicatorText: {
    fontSize: 9,
    color: '#FFFFFF',
    ...typography.medium,
  },
  todayDate: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  dateGroupContainer: {
    marginBottom: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    marginBottom: 8,
  },
  dateHeaderText: {
    fontSize: 16,
    color: '#495057',
    ...typography.medium,
  },
  dateHeaderCount: {
    fontSize: 12,
    color: '#6C757D',
    ...typography.regular,
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
    marginRight: 16,
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
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  filterIndicatorText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 8,
    ...typography.medium,
  },
  editArrow: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  // Swipeable styles
  swipeableContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FF3B30',
  },
  deleteButtonContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    ...typography.medium,
  },
  animatedTransactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
});

export default GroupTransactionListScreen; 