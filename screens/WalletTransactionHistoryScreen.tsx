import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typography } from '../constants/typography';
import { useNavigationService } from '../navigation/NavigationService';
import { categoryService, CategoryType } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { getIconColor, getIconForCategory, ICON_COLOR_MAP, isValidIcon } from '../utils/iconUtils';

// Enhanced responsive utilities for all screen sizes
const { width, height } = Dimensions.get('window');

// Responsive utilities - optimized for all screen sizes
const responsiveUtils = {
  isSmallScreen: width < 375 || height < 667,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  screenWidth: width,
  screenHeight: height,
  
  // Responsive padding/margin
  rp: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minSize = size * 0.7;
    const maxSize = size * 1.3;
    const scaledSize = size * scale;
    return Math.max(Math.min(scaledSize, maxSize), minSize);
  },
  
  // Responsive font size
  rf: (fontSize: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minFontScale = 0.8;
    const maxFontScale = 1.2;
    const fontScale = Math.min(Math.max(scale, minFontScale), maxFontScale);
    return fontSize * fontScale;
  },
  
  // Width percentage
  wp: (percentage: number) => (width * percentage) / 100,
  
  // Height percentage
  hp: (percentage: number) => (height * percentage) / 100,
  
  // Responsive border radius
  rb: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    return Math.max(size * scale, size * 0.8);
  }
};

// Extract utilities for easier use
const { isSmallScreen, isMediumScreen, isLargeScreen, rp, rf, wp, hp, rb } = responsiveUtils;

interface WalletTransactionHistoryScreenProps {
  route: {
    params: {
      walletId: number;
      walletName: string;
    };
  };
}

const WalletTransactionHistoryScreen = ({ route }: WalletTransactionHistoryScreenProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const { walletId, walletName } = route.params;

  // Transaction data state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories for mapping
  const loadCategories = useCallback(async () => {
    try {
      const [expenseCategories, incomeCategories] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, 0),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, 0)
      ]);
      
      const allCategories = [...expenseCategories, ...incomeCategories];
      
      // Đảm bảo mỗi category có color và icon mặc định
      const processedCategories = allCategories.map((cat: any) => ({
        ...cat,
        category_color: cat.category_color || getDefaultColorForCategory(cat.category_icon_url, cat.category_type),
        category_icon_url: cat.category_icon_url || getDefaultIconForCategory(cat.category_type)
      }));
      
      setCategories(processedCategories);
      console.log('✅ Categories loaded for mapping:', processedCategories.length);
      
      // Log chi tiết categories để debug
      if (__DEV__) {
        logCategoryDetails(processedCategories);
        
        const iconStats = processedCategories.reduce((stats: any, cat: any) => {
          const icon = cat.category_icon_url || 'cash';
          stats[icon] = (stats[icon] || 0) + 1;
          return stats;
        }, {});
        console.log('📊 Icon Usage Statistics:', iconStats);
        
        // Test icon mapping
        testIconMapping();
      }
    } catch (err: any) {
      console.error('❌ Failed to load categories:', err);
    }
  }, []);

  // Load transactions for specific wallet
  const loadTransactions = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Loading transactions for wallet:', walletId);
      const response: any = await transactionService.getAllTransactions();
      
      // API trả về dạng paginated response với content array
      const allTransactions = response.content || response;
      
      // Filter transactions by wallet ID
      const walletTransactions = allTransactions.filter(
        (transaction: any) => transaction.wallet_id === walletId
      );
      console.log(walletId)
      console.log('✅ Wallet transactions loaded:', walletTransactions.length);
      setTransactions(walletTransactions);
    } catch (err: any) {
      console.error('❌ Failed to load wallet transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletId]);

  // Load transactions on component mount
  useEffect(() => {
    loadCategories();
    loadTransactions();
    
    // Test icon mapping trong development
    if (__DEV__) {
      setTimeout(() => {
        testIconMapping();
      }, 1000);
    }
  }, [loadCategories, loadTransactions]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    loadTransactions(true);
  }, [loadTransactions]);

  // Calculate total income and expense for this wallet
  const calculateTotals = useCallback(() => {
    const income = transactions
      .filter((t: any) => t.transaction_type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const expense = transactions
      .filter((t: any) => t.transaction_type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    return { income, expense, net: income - expense };
  }, [transactions]);

  // Helper function to get category info by category_id
  const getCategoryInfo = (categoryId: number) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    if (category) {
      // Log thông tin category để debug
      if (__DEV__) {
        console.log('🔍 Category found:', {
          categoryId: categoryId,
          categoryName: category.category_name,
          categoryIcon: category.category_icon_url,
          categoryColor: category.category_color
        });
      }
      
      return {
        name: category.category_name || 'Unknown Category',
        icon: category.category_icon_url || 'cash',
        color: category.category_color || '#666'
      };
    }
    
    // Log khi không tìm thấy category
    if (__DEV__) {
      console.log('⚠️ Category not found for ID:', categoryId);
    }
    
    return {
      name: 'Unknown Category',
      icon: 'cash',
      color: '#666'
    };
  };

  // Helper function to debug icon mapping
  const debugIconMapping = (categoryInfo: any, categoryType: string, iconName: string, iconColor: string) => {
    console.log('🎨 Icon Mapping Debug:', {
      categoryId: categoryInfo.category_id,
      categoryName: categoryInfo.name,
      originalIcon: categoryInfo.icon,
      categoryType: categoryType,
      mappedIcon: iconName,
      mappedColor: iconColor,
      isValidIcon: isValidIcon(iconName),
      hasPredefinedColor: iconName in ICON_COLOR_MAP,
      finalIconName: iconName,
      safeColor: iconColor || (categoryType === 'income' ? '#32d74b' : '#ff375f')
    });
  };

  // Helper function to test icon mapping
  const testIconMapping = () => {
    console.log('🧪 Testing Icon Mapping:');
    const testCases = [
      { icon: 'cash', type: 'income' },
      { icon: 'cash', type: 'expense' },
      { icon: 'food', type: 'expense' },
      { icon: 'salary', type: 'income' },
      { icon: 'invalid-icon', type: 'expense' }
    ];
    
    testCases.forEach(test => {
      const iconName = getIconForCategory(test.icon, test.type as 'income' | 'expense');
      const iconColor = getIconColor(iconName, test.type as 'income' | 'expense');
      console.log(`Test: ${test.icon} (${test.type}) → ${iconName} (${iconColor})`);
    });
  };

  // Helper function to get default color for category
  const getDefaultColorForCategory = (iconUrl: string, categoryType: string) => {
    if (iconUrl) {
      const iconName = getIconForCategory(iconUrl, categoryType === 'INCOME' ? 'income' : 'expense');
      return getIconColor(iconName, categoryType === 'INCOME' ? 'income' : 'expense');
    }
    return categoryType === 'INCOME' ? '#32d74b' : '#ff375f';
  };

  // Helper function to get default icon for category
  const getDefaultIconForCategory = (categoryType: string) => {
    return categoryType === 'INCOME' ? 'cash-plus' : 'cash-minus';
  };

  // Helper function to log category details
  const logCategoryDetails = (categories: any[]) => {
    console.log('📋 Category Details:');
    categories.forEach((cat: any, index: number) => {
      console.log(`${index + 1}. ID: ${cat.category_id}, Name: ${cat.category_name}, Icon: ${cat.category_icon_url}, Color: ${cat.category_color}, Type: ${cat.category_type}`);
    });
  };

  const renderTransactionItem = ({ item }: { item: any }) => {
    const isIncome = item.transaction_type === 'INCOME';
    const categoryInfo = getCategoryInfo(item.category_id);
    
    // Sử dụng iconUtils để map icon và color một cách đầy đủ
    const categoryType = isIncome ? 'income' : 'expense';
    const iconName = getIconForCategory(categoryInfo.icon, categoryType);
    const iconColor = getIconColor(iconName, categoryType, categoryInfo.color);

    // Kiểm tra xem icon có hợp lệ không
    const isValidIconName = isValidIcon(iconName);
    const finalIconName = isValidIconName ? iconName : (categoryType === 'income' ? 'cash-plus' : 'cash-minus');

    // Debug icon mapping (chỉ log khi cần thiết)
    if (__DEV__) {
      debugIconMapping(categoryInfo, categoryType, finalIconName, iconColor);
    }

    // Đảm bảo color không bị undefined hoặc null
    const safeIconColor = iconColor || (categoryType === 'income' ? '#32d74b' : '#ff375f');
    const backgroundColor = safeIconColor + '20';

    return (
      <View style={[styles.transactionItem, { 
        paddingHorizontal: rp(16), 
        paddingVertical: rp(12) 
      }]}>
        <View style={[styles.transactionIcon, { backgroundColor: backgroundColor }]}>
          <Icon2 name={finalIconName} size={rf(20)} color={safeIconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionCategory, typography.medium]}>
            {categoryInfo.name}
          </Text>
          <Text style={[styles.transactionNote, typography.regular]} numberOfLines={1}>
            {item.description || t('common.noNote')}
          </Text>
          <Text style={[styles.transactionDate, typography.regular]}>
            {new Date(item.transaction_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText, 
            typography.semibold,
            isIncome ? styles.incomeAmount : styles.expenseAmount
          ]}>
            {isIncome ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} {t('currency')}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { paddingHorizontal: rp(20) }]}>
      <Icon name="receipt-long" size={rf(64)} color="#ccc" />
      <Text style={[styles.emptyTitle, typography.semibold]}>
        {t('wallet.noTransactions')}
      </Text>
      <Text style={[styles.emptySubtitle, typography.regular]}>
        {t('wallet.noTransactionsMessage')}
      </Text>
    </View>
  );

  const { income, expense, net } = calculateTotals();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { 
          paddingHorizontal: rp(20), 
          paddingVertical: rp(16),
          paddingTop: rp(20)
        }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={rf(24)} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, typography.semibold]} numberOfLines={1}>
              {walletName}
            </Text>
            <Text style={[styles.headerSubtitle, typography.regular]}>
              {t('wallet.transactionHistory')}
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} disabled={loading || refreshing}>
            <Icon 
              name="refresh" 
              size={rf(24)} 
              color={loading || refreshing ? "#ccc" : "#333"} 
            />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { 
          margin: rp(16), 
          padding: rp(20), 
          borderRadius: rb(16)
        }]}>
          <Text style={[styles.summaryTitle, typography.semibold]}>
            {t('wallet.summary')}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, typography.medium]}>
                {t('wallet.income')}
              </Text>
              <Text style={[styles.summaryAmount, styles.incomeAmount, typography.semibold]}>
                +{income.toLocaleString('vi-VN')} {t('currency')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, typography.medium]}>
                {t('wallet.expense')}
              </Text>
              <Text style={[styles.summaryAmount, styles.expenseAmount, typography.semibold]}>
                -{expense.toLocaleString('vi-VN')} {t('currency')}
              </Text>
            </View>
          </View>
          <View style={styles.netRow}>
            <Text style={[styles.netLabel, typography.semibold]}>
              {t('wallet.net')}
            </Text>
            <Text style={[
              styles.netAmount, 
              typography.semibold,
              net >= 0 ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {net >= 0 ? '+' : ''}{net.toLocaleString('vi-VN')} {t('currency')}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e90ff" />
            <Text style={[styles.loadingText, typography.medium]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="error" size={rf(48)} color="#ff6b6b" />
            <Text style={[styles.errorText, typography.medium]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadTransactions()}
            >
              <Text style={[styles.retryText, typography.semibold]}>
                {t('common.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item: any) => item.transaction_id.toString()}
            renderItem={renderTransactionItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1e90ff']}
                tintColor="#1e90ff"
              />
            }
            contentContainerStyle={{
              paddingBottom: insets.bottom + rp(20),
              flexGrow: transactions.length === 0 ? 1 : undefined
            }}
            ListEmptyComponent={renderEmptyState}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  netLabel: {
    fontSize: 16,
    color: '#333',
  },
  netAmount: {
    fontSize: 18,
  },
  incomeAmount: {
    color: '#22c55e',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default WalletTransactionHistoryScreen; 