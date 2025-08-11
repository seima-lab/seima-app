import { typography } from '@/constants/typography';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { categoryService } from '../services/categoryService';
import { getIconColor, getIconForCategory } from '../utils/iconUtils';

interface Transaction {
  transaction_id: number;
  transaction_type: 'EXPENSE' | 'INCOME';
  amount: number;
  currency_code: string;
  transaction_date: string;
  description: string;
}

interface DayData {
  expense: number;
  income: number;
  category_id: number;
  category_name: string;
  category_icon_url: string;
  transaction_detail_list: Transaction[];
}

interface CategoryDetailReportResponse {
  total_expense: number;
  total_income: number;
  data: {
    [date: string]: DayData;
  };
}

export default function CategoryDetailReportScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { 
    category_id, 
    category_name, 
    start_date, 
    end_date,
    groupId, // Thêm groupId từ params
    periodType,
    selectedPeriod: initialSelectedPeriod,
    weekReferenceDate: initialWeekReferenceDate,
    customStartDate: initialCustomStartDate,
    customEndDate: initialCustomEndDate,
  } = route.params as {
    category_id: number;
    category_name: string;
    start_date: string;
    end_date: string;
    groupId?: number; // Thêm groupId type
    periodType?: import('../components/PeriodFilterBar').PeriodType;
    selectedPeriod?: string;
    weekReferenceDate?: Date;
    customStartDate?: Date;
    customEndDate?: Date;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<CategoryDetailReportResponse | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [categoryIcon, setCategoryIcon] = useState<string>('cash');
  const [iconColor, setIconColor] = useState<string>('#007AFF');

  useEffect(() => {
    fetchCategoryDetailReport();
  }, [category_id, start_date, end_date, groupId]);

  const fetchCategoryDetailReport = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching category detail report:', { category_id, start_date, end_date, groupId });
      
      const data = await categoryService.getCategoryDetailReport(
        String(category_id),
        start_date,
        end_date,
        groupId // Thêm groupId parameter
      );
      
      console.log('📊 Category detail report data:', data);
      setReportData(data);
      
      // Process the data to extract all transactions and calculate totals
      if (data && data.data) {
        const transactions: Transaction[] = [];
        let total = 0;
        let iconUrl = '';
        
        // Extract all transactions from all dates
        Object.keys(data.data).forEach(date => {
          const dayData = data.data[date];
          if (dayData.transaction_detail_list) {
            transactions.push(...dayData.transaction_detail_list);
            // Add to total based on transaction type
            dayData.transaction_detail_list.forEach((transaction: Transaction) => {
              if (transaction.transaction_type === 'EXPENSE') {
                total += transaction.amount;
              } else if (transaction.transaction_type === 'INCOME') {
                total += transaction.amount;
              }
            });
          }
          // Get category icon from first available day data
          if (!iconUrl && dayData.category_icon_url) {
            iconUrl = dayData.category_icon_url;
          }
        });
        
        setAllTransactions(transactions);
        setTotalAmount(total);
        
        // Set category icon using iconUtils
        if (iconUrl) {
          const iconName = getIconForCategory(iconUrl, 'expense');
          const color = getIconColor(iconName, 'expense');
          setCategoryIcon(iconName);
          setIconColor(color);
        }
      }
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
        <View style={styles.transactionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Icon name={categoryIcon} size={20} color={iconColor} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription} numberOfLines={2}>
              {item.description || t('common.noNote')}
            </Text>
            <Text style={styles.categoryName}>
              {category_name}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <View style={styles.amountContainer}>
          <Text style={[
            styles.transactionAmount,
            { color: item.transaction_type === 'EXPENSE' ? '#E53935' : '#4CAF50' }
          ]}>
            {item.transaction_type === 'EXPENSE' ? '-' : '+'}
            {item.amount.toLocaleString('vi-VN')} ₫
          </Text>
          <Icon 
            name={item.transaction_type === 'EXPENSE' ? 'arrow-down' : 'arrow-up'} 
            size={16} 
            color={item.transaction_type === 'EXPENSE' ? '#E53935' : '#4CAF50'} 
          />
        </View>
        <Text style={styles.transactionDateTime}>
          {format(new Date(item.transaction_date), 'dd/MM/yyyy HH:mm')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('reports.loadingReport')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#E53935" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCategoryDetailReport}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
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
          <Text style={styles.summaryLabel}>{t('reports.totalAmount')}</Text>
          <Text style={styles.summaryAmount}>
            {totalAmount.toLocaleString('vi-VN')} ₫
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Icon name="format-list-bulleted" size={24} color="#FF9500" />
          <Text style={styles.summaryLabel}>{t('budget.detail.totalTransactions')}</Text>
          <Text style={styles.summaryAmount}>
            {allTransactions.length}
          </Text>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>{t('wallet.transactionHistory')}</Text>
          <Text style={styles.transactionsCount}>
            {allTransactions.length} {t('common.transactions')}
          </Text>
        </View>

        {allTransactions.length > 0 ? (
          <FlatList
            data={allTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.transaction_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="file-document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t('budget.noTransactions')}</Text>
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
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
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
  transactionDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    ...typography.medium,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    ...typography.regular,
  },
  transactionRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    ...typography.semibold,
  },
  transactionDateTime: {
    fontSize: 14,
    color: '#999',
    ...typography.regular,
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