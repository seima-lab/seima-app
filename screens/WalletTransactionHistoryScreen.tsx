import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
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
      currentBalance?: number;
      initialBalance?: number;
    };
  };
}

const WalletTransactionHistoryScreen = ({ route }: WalletTransactionHistoryScreenProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const { walletId, walletName, currentBalance = 0, initialBalance = 0 } = route.params;

  // Transaction data state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('allTime');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // DateTimePicker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [dateError, setDateError] = useState<string>('');

  // Helper function to format date to dd/mm/yyyy
  const formatDateToDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  // Helper functions for date calculations
  const getDateRange = (filterType: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterType) {
      case 'allTime':
        // Return a very old date to get all transactions
        return {
          startDate: '2000-01-01',
          endDate: today.toISOString().split('T')[0]
        };
      case 'thisDay':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'thisMonth':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: firstDayThisMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'thisYear':
        const firstDayThisYear = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: firstDayThisYear.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'custom':
        return {
          startDate: startDate,
          endDate: endDate
        };
      default:
        return {
          startDate: '2000-01-01',
          endDate: today.toISOString().split('T')[0]
        };
    }
  };

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'allTime': return t('wallet.filter.allTime');
      case 'thisDay': return t('wallet.filter.thisDay');
      case 'thisWeek': return t('wallet.filter.thisWeek');
      case 'thisMonth': return t('wallet.filter.thisMonth');
      case 'thisYear': return t('wallet.filter.thisYear');
      case 'custom': return t('wallet.filter.custom');
      default: return t('wallet.filter.allTime');
    }
  };

  // Load transactions for specific wallet
  const loadTransactions = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const dateRange = getDateRange(selectedFilter);
      console.log('🔄 Loading transactions for wallet:', walletId, 'with date range:', dateRange);
      
      // Prepare parameters for API call
      const params: any = {
        walletId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      // Add type parameter for allTime filter
      if (selectedFilter === 'allTime') {
        params.type = 'all';
      }
      
      const response: any = await transactionService.getWalletTransactionHistory(
        params.walletId,
        params.startDate,
        params.endDate,
        params.type
      );
      
      console.log('✅ Wallet transactions loaded:', response);
      
             // Handle the new API response structure
       if (response && response.report_by_wallet) {
         // Flatten the grouped transactions into a single array
         const flattenedTransactions: any[] = [];
         
         Object.keys(response.report_by_wallet).forEach(date => {
           const dayTransactions = response.report_by_wallet[date];
           if (Array.isArray(dayTransactions)) {
             dayTransactions.forEach((transaction: any) => {
               // Convert to the expected format
               const convertedTransaction = {
                 transaction_id: transaction.transactionId || transaction.transaction_id || Math.random(),
                 user_id: transaction.user_id || 0,
                 wallet_id: transaction.wallet_id || walletId,
                 category_id: transaction.category_id,
                 group_id: transaction.group_id,
                 transaction_type: transaction.transactionType || transaction.transaction_type || 'EXPENSE',
                 amount: transaction.amount,
                 currency_code: transaction.currency_code || 'VND',
                 transaction_date: transaction.transaction_date,
                 description: transaction.description,
                 receipt_image_url: transaction.receipt_image_url,
                 payee_payer_name: transaction.payee_payer_name,
                 created_at: transaction.created_at || transaction.transaction_date,
                 updated_at: transaction.updated_at || transaction.transaction_date
               };
               flattenedTransactions.push(convertedTransaction);
             });
           }
         });
         
         setTransactions(flattenedTransactions);
         
         // Update summary data from API response
         if (response.summary) {
           setTotalIncome(response.summary.total_income);
           setTotalExpense(response.summary.total_expense);
         }
       } else {
         setTransactions([]);
         setTotalIncome(0);
         setTotalExpense(0);
       }
    } catch (err: any) {
      console.error('❌ Failed to load wallet transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletId, selectedFilter]);

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

    // Use data from API instead of calculating from transactions
  const income = totalIncome;
  const expense = totalExpense;

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
    // Determine if it's income based on transaction_type instead of amount sign
    const isIncome = item.transaction_type === 'INCOME';
    const categoryInfo = getCategoryInfo(item.category_id);
    
    // Use iconUtils to map icon and color properly
    const categoryType = isIncome ? 'income' : 'expense';
    const iconName = getIconForCategory(categoryInfo.icon, categoryType);
    const iconColor = getIconColor(iconName, categoryType, categoryInfo.color);

    // Check if icon is valid
    const isValidIconName = isValidIcon(iconName);
    const finalIconName = isValidIconName ? iconName : (categoryType === 'income' ? 'cash-plus' : 'cash-minus');

    // Debug icon mapping (only log when needed)
    if (__DEV__) {
      debugIconMapping(categoryInfo, categoryType, finalIconName, iconColor);
    }

    // Ensure color is not undefined or null
    const safeIconColor = iconColor || (categoryType === 'income' ? '#32d74b' : '#ff375f');
    const backgroundColor = safeIconColor + '20';

    return (
      <View style={[styles.transactionItem]}>
        <View style={[styles.transactionIcon, { backgroundColor: backgroundColor }]}>
          <Icon2 name={finalIconName} size={rf(24)} color={safeIconColor} />
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
            {isIncome ? '+' : '-'}{Math.abs(item.amount).toLocaleString('vi-VN')} {t('currency')}
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
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onRefresh} disabled={loading || refreshing}>
              <Icon 
                name="refresh" 
                size={rf(24)} 
                color={loading || refreshing ? "#ccc" : "#333"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Label - Positioned between header and summary */}
        <View style={[styles.filterLabelContainer, { 
          marginHorizontal: rp(16), 
          marginTop: rp(12),
          marginBottom: rp(6)
        }]}>
          <TouchableOpacity 
            style={styles.filterLabelButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={[styles.filterLabelText, typography.medium]}>
              {selectedFilter === 'custom' 
                ? `${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}`
                : getFilterLabel(selectedFilter)
              }
            </Text>
            <Icon name="keyboard-arrow-right" size={rf(20)} color="#1e90ff" />
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
                     <View style={styles.balanceRow}>
             <View style={styles.balanceItem}>
               <Text style={[styles.balanceLabel, typography.medium]}>
                 {t('wallet.initialBalance')}
               </Text>
               <Text style={[styles.balanceAmount, typography.semibold]}>
                 {initialBalance.toLocaleString('vi-VN')} {t('currency')}
               </Text>
             </View>
             <View style={styles.balanceItem}>
               <Text style={[styles.balanceLabel, typography.medium]}>
                 {t('wallet.currentBalance')}
               </Text>
               <Text style={[
                 styles.balanceAmount, 
                 typography.semibold,
                 currentBalance >= 0 ? styles.incomeAmount : styles.expenseAmount
               ]}>
                 {currentBalance.toLocaleString('vi-VN')} {t('currency')}
               </Text>
             </View>
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

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                                 <Text style={[styles.modalTitle, typography.semibold]}>
                   {t('wallet.filter.selectTimeRange')}
                 </Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Icon name="close" size={rf(24)} color="#333" />
                </TouchableOpacity>
              </View>
              
                              <View style={styles.filterOptions}>
                  {[
                    { key: 'allTime', label: t('wallet.filter.allTime') },
                    { key: 'thisDay', label: t('wallet.filter.thisDay') },
                    { key: 'thisWeek', label: t('wallet.filter.thisWeek') },
                    { key: 'thisMonth', label: t('wallet.filter.thisMonth') },
                    { key: 'thisYear', label: t('wallet.filter.thisYear') },
                    { key: 'custom', label: t('wallet.filter.custom') }
                  ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      selectedFilter === option.key && styles.filterOptionSelected
                    ]}
                                         onPress={() => {
                       if (option.key === 'custom') {
                         setShowFilterModal(false);
                         setShowCustomDateModal(true);
                       } else {
                         setSelectedFilter(option.key);
                         setShowFilterModal(false);
                         loadTransactions();
                       }
                     }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedFilter === option.key && styles.filterOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {selectedFilter === option.key && (
                      <Icon name="check" size={rf(20)} color="#1e90ff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
                 </Modal>

         {/* Custom Date Range Modal */}
         <Modal
           visible={showCustomDateModal}
           transparent={true}
           animationType="slide"
           onRequestClose={() => setShowCustomDateModal(false)}
         >
           <View style={styles.modalOverlay}>
             <View style={[styles.modalContent, { maxHeight: '50%' }]}>
               <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, typography.semibold]}>
                   {t('wallet.filter.selectDateRange')}
                 </Text>
                 <TouchableOpacity onPress={() => setShowCustomDateModal(false)}>
                   <Icon name="close" size={rf(24)} color="#333" />
                 </TouchableOpacity>
               </View>
               
                               <View style={styles.customDateContainer}>
                  <View style={styles.dateInputContainer}>
                                         <TouchableOpacity
                       style={styles.dateInput}
                       onPress={() => {
                         setDateError(''); // Clear error when user starts selecting
                         setShowStartDatePicker(true);
                       }}
                     >
                                                                    <Text style={styles.dateInputText}>
                         {startDate ? formatDateToDisplay(startDate) : t('wallet.filter.selectStartDate')}
                       </Text>
                     </TouchableOpacity>
                     <Text style={styles.dateLabel}>{t('wallet.filter.fromDate')}</Text>
                  </View>
                  
                  <View style={styles.dateInputContainer}>
                                         <TouchableOpacity
                       style={styles.dateInput}
                       onPress={() => {
                         setDateError(''); // Clear error when user starts selecting
                         setShowEndDatePicker(true);
                       }}
                     >
                                                                    <Text style={styles.dateInputText}>
                         {endDate ? formatDateToDisplay(endDate) : t('wallet.filter.selectEndDate')}
                       </Text>
                     </TouchableOpacity>
                     <Text style={styles.dateLabel}>{t('wallet.filter.toDate')}</Text>
                                     </View>
                 </View>
                
                {/* Error Message */}
                {dateError ? (
                  <View style={styles.errorMessageContainer}>
                    <Text style={styles.errorMessageText}>{dateError}</Text>
                  </View>
                ) : null}
                
                <View style={styles.customDateActions}>
                 <TouchableOpacity 
                   style={styles.cancelButton}
                   onPress={() => setShowCustomDateModal(false)}
                 >
                   <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                 </TouchableOpacity>
                 
                                   <TouchableOpacity 
                    style={styles.okButton}
                    onPress={() => {
                                             // Validate dates
                       if (!startDate || !endDate) {
                         setDateError(t('wallet.filter.error.selectBothDates'));
                         return;
                       }
                       
                       const start = new Date(startDate);
                       const end = new Date(endDate);
                       
                       if (start > end) {
                         setDateError(t('wallet.filter.error.startDateAfterEndDate'));
                         return;
                       }
                      
                      // Clear error and proceed
                      setDateError('');
                      setSelectedFilter('custom');
                      setShowCustomDateModal(false);
                      loadTransactions();
                    }}
                  >
                   <Text style={styles.okButtonText}>{t('common.ok')}</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
                   </Modal>

          {/* DateTimePicker Components */}
          {showStartDatePicker && (
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setTempStartDate(selectedDate);
                  setStartDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setTempEndDate(selectedDate);
                  setEndDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterLabelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterLabelText: {
    fontSize: 15,
    color: '#1e90ff',
    ...typography.medium,
  },
  filterLabelContainer: {
    alignItems: 'center',
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 16,
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
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  transactionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
    fontWeight: '600',
  },
  transactionNote: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: 12,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    color: '#333',
  },
  filterOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    ...typography.regular,
  },
  filterOptionTextSelected: {
    color: '#1e90ff',
    ...typography.medium,
  },

   // Custom date modal styles
   customDateContainer: {
     paddingHorizontal: 20,
     paddingVertical: 20,
   },
   dateInputContainer: {
     marginBottom: 20,
   },
       dateInput: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#f8f8f8',
    },
    dateInputText: {
      fontSize: 16,
      color: '#333',
    },
   dateLabel: {
     fontSize: 14,
     color: '#666',
     marginTop: 8,
     marginLeft: 4,
   },
   customDateActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     paddingHorizontal: 20,
     paddingBottom: 20,
     gap: 12,
   },
   cancelButton: {
     flex: 1,
     backgroundColor: '#f0f0f0',
     paddingVertical: 12,
     borderRadius: 8,
     alignItems: 'center',
   },
   cancelButtonText: {
     fontSize: 16,
     color: '#333',
     fontWeight: '500',
   },
   okButton: {
     flex: 1,
     backgroundColor: '#1e90ff',
     paddingVertical: 12,
     borderRadius: 8,
     alignItems: 'center',
   },
       okButtonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '500',
    },
    errorMessageContainer: {
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    errorMessageText: {
      fontSize: 14,
      color: '#ef4444',
      textAlign: 'center',
    },
  });

export default WalletTransactionHistoryScreen; 