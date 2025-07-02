import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { RootStackParamList } from '../navigation/types';
import { GroupTransactionResponse, transactionService } from '../services/transactionService';

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
}

// Format money helper function
const formatMoney = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + '₫';
};

// Simple Transaction Item Component (Read-Only)
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: transaction.iconColor + '20' }]}>
          <Icon name={transaction.icon} size={20} color={transaction.iconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
          {transaction.description && (
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
          )}
          <Text style={styles.transactionDate}>
            {new Date(transaction.date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
      ]}>
        {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
      </Text>
    </View>
  );
};

const GroupTransactionListScreen: React.FC = () => {
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
  
  const LIMIT = 20;

  const getCategoryIcon = (categoryName: string): { icon: string; color: string } => {
    const lowerCategory = categoryName.toLowerCase();
    
    if (lowerCategory.includes('ăn') || lowerCategory.includes('uống') || lowerCategory.includes('food')) {
      return { icon: 'restaurant', color: '#FF9500' };
    }
    if (lowerCategory.includes('thu nhập') || lowerCategory.includes('income') || lowerCategory.includes('salary')) {
      return { icon: 'account-balance-wallet', color: '#34C759' };
    }
    if (lowerCategory.includes('chi tiêu') || lowerCategory.includes('shopping') || lowerCategory.includes('mua sắm')) {
      return { icon: 'shopping-basket', color: '#007AFF' };
    }
    if (lowerCategory.includes('transport') || lowerCategory.includes('xe')) {
      return { icon: 'directions-car', color: '#FF3B30' };
    }
    if (lowerCategory.includes('entertainment') || lowerCategory.includes('giải trí')) {
      return { icon: 'movie', color: '#9500FF' };
    }
    if (lowerCategory.includes('health') || lowerCategory.includes('sức khỏe')) {
      return { icon: 'local-hospital', color: '#FF2D92' };
    }
    
    return { icon: 'more-horiz', color: '#666' };
  };

  const convertToLocalTransaction = (item: GroupTransactionResponse): Transaction => {
    const categoryName = `Category ${item.category_id}`;
    const categoryIcon = getCategoryIcon(categoryName);
    const transactionType = item.transaction_type?.toLowerCase();
    
    return {
      id: item.transaction_id.toString(),
      date: item.transaction_date,
      category: categoryName,
      amount: item.amount || 0,
      type: transactionType === 'income' ? 'income' : 'expense',
      icon: categoryIcon.icon,
      iconColor: categoryIcon.color,
      description: item.description || '',
      categoryId: item.category_id
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
      
      console.log('🔄 Loading group transactions (read-only):', { groupId, offset: currentOffset, limit: LIMIT });
      
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

  useEffect(() => {
    loadTransactions(0);
  }, [loadTransactions]);

  const onRefresh = () => {
    loadTransactions(0, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && hasMore && transactions.length > 0) {
      loadTransactions(offset);
    }
  };

  const renderTransaction = ({ item }: { item: GroupTransactionResponse }) => {
    const transaction = convertToLocalTransaction(item);
    
    return (
      <TransactionItem transaction={transaction} />
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
      <Text style={styles.emptyStateTitle}>Chưa có giao dịch nào</Text>
      <Text style={styles.emptyStateDescription}>
        Nhóm {groupName} chưa có giao dịch nào được thực hiện
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#4A90E2" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Giao dịch nhóm</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadTransactions(0)}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
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
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default GroupTransactionListScreen; 