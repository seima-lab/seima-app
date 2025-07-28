import { typography } from '@/constants/typography';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { categoryService } from '../services/categoryService';

interface Transaction {
  transaction_id: number;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_type: 'expense' | 'income';
  wallet_name?: string;
  category_name?: string;
}

interface CategoryDetailReportResponse {
  category_id: number;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  transactions: Transaction[];
}

export default function CategoryDetailReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { category_id, category_name, start_date, end_date } = route.params as {
    category_id: number;
    category_name: string;
    start_date: string;
    end_date: string;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<CategoryDetailReportResponse | null>(null);

  useEffect(() => {
    fetchCategoryDetailReport();
  }, [category_id, start_date, end_date]);

  const fetchCategoryDetailReport = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching category detail report:', { category_id, start_date, end_date });
      
      const data = await categoryService.getCategoryDetailReport(
        String(category_id),
        start_date,
        end_date
      );
      
      console.log('📊 Category detail report data:', data);
      setReportData(data);
    } catch (err: any) {
      console.error('❌ Error fetching category detail report:', err);
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionDescription} numberOfLines={2}>
          {item.description || 'Không có mô tả'}
        </Text>
        <Text style={styles.transactionDate}>
          {format(new Date(item.transaction_date), 'dd/MM/yyyy')}
        </Text>
        {item.wallet_name && (
          <Text style={styles.transactionWallet}>{item.wallet_name}</Text>
        )}
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.transaction_type === 'expense' ? '#E53935' : '#4CAF50' }
        ]}>
          {item.transaction_type === 'expense' ? '-' : '+'}
          {item.amount.toLocaleString('vi-VN')} ₫
        </Text>
        <Icon 
          name={item.transaction_type === 'expense' ? 'arrow-down' : 'arrow-up'} 
          size={16} 
          color={item.transaction_type === 'expense' ? '#E53935' : '#4CAF50'} 
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#E53935" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCategoryDetailReport}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
      >
        <Icon name="arrow-left" size={28} color="#222" />
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>{category_name}</Text>
      <View style={styles.headerDivider} />

      {/* Date Range */}
      <View style={styles.dateRangeContainer}>
        <Text style={styles.dateRangeText}>
          {format(new Date(start_date), 'dd/MM/yyyy')} - {format(new Date(end_date), 'dd/MM/yyyy')}
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="cash" size={24} color="#007AFF" />
          <Text style={styles.summaryLabel}>Tổng cộng</Text>
          <Text style={styles.summaryAmount}>
            {reportData?.total_amount?.toLocaleString('vi-VN') || '0'} ₫
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Icon name="format-list-bulleted" size={24} color="#FF9500" />
          <Text style={styles.summaryLabel}>Số giao dịch</Text>
          <Text style={styles.summaryAmount}>
            {reportData?.transaction_count || '0'}
          </Text>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Danh sách giao dịch</Text>
          <Text style={styles.transactionsCount}>
            {reportData?.transactions?.length || 0} giao dịch
          </Text>
        </View>

        {reportData?.transactions && reportData.transactions.length > 0 ? (
          <FlatList
            data={reportData.transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.transaction_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="file-document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có giao dịch nào</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 40,
    zIndex: 10,
    padding: 8,
  },
  header: {
    fontSize: 30,
    ...typography.semibold,
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  dateRangeContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    ...typography.medium,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    ...typography.medium,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    ...typography.semibold,
    color: '#1a1a1a',
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  transactionsTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#1a1a1a',
  },
  transactionsCount: {
    fontSize: 14,
    color: '#666',
    ...typography.medium,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    ...typography.medium,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    ...typography.regular,
    marginBottom: 2,
  },
  transactionWallet: {
    fontSize: 12,
    color: '#999',
    ...typography.regular,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    ...typography.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    ...typography.medium,
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    ...typography.medium,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    ...typography.medium,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: 'white',
    ...typography.medium,
  },
}); 