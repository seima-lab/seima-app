import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomToast from '../components/CustomToast';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import {
    ReportByCategory,
    TransactionReportResponse,
    transactionService,
} from '../services/transactionService';
// Import getIconColor to match colors with AddExpenseScreen
import { RootStackParamList } from '../navigation/types';
import { getIconColor } from '../utils/iconUtils';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.4;

// Improved Pie Chart Component with category type support
interface PieChartProps {
  data: ReportByCategory[];
  size?: number;
  strokeWidth?: number;
  categoryType: 'expense' | 'income';
}

/**
 * Get category color based on category name and type
 * Maps category name to icon and gets color using iconUtils (same as AddExpenseScreen)
 */
const getCategoryColor = (categoryName: string, categoryType: 'expense' | 'income'): string => {
  // Map category name to icon (similar to iconMapping in categoryService)
  const categoryIconMap: { [key: string]: string } = {
    // Food & Dining
    'food': 'silverware-fork-knife',
    'restaurant': 'silverware-fork-knife', 
    'coffee': 'coffee',
    'fast-food': 'hamburger',
    'dining': 'silverware-fork-knife',
    'ăn uống': 'silverware-fork-knife',
    'thức ăn': 'silverware-fork-knife',
    'nhà hàng': 'silverware-fork-knife',
    
    // Daily & Shopping
    'daily': 'bottle-soda',
    'shopping': 'shopping', 
    'grocery': 'cart',
    'market': 'store',
    'mua sắm': 'shopping',
    'chợ': 'store',
    'siêu thị': 'cart',
    
    // Transportation
    'transport': 'train',
    'transportation': 'train', 
    'car': 'car',
    'bus': 'bus',
    'taxi': 'taxi',
    'fuel': 'gas-station',
    'di chuyển': 'train',
    'xe buýt': 'bus',
    'xăng': 'gas-station',
    
    // Utilities
    'electric': 'flash',
    'electricity': 'flash',
    'water': 'water',
    'internet': 'wifi',
    'gas': 'fire',
    'utility': 'home-lightning-bolt',
    'điện': 'flash',
    'nước': 'water',
    
    // Housing
    'rent': 'home-city',
    'house': 'home',
    'apartment': 'apartment',
    'home': 'home',
    'housing': 'home-city',
    'thuê nhà': 'home-city',
    'nhà ở': 'home',
    
    // Health & Medical
    'health': 'pill',
    'medical': 'hospital-box',
    'hospital': 'hospital-box',
    'fitness': 'dumbbell',
    'doctor': 'doctor',
    'sức khỏe': 'pill',
    'y tế': 'hospital-box',
    
    // Entertainment
    'entertainment': 'gamepad-variant',
    'movie': 'movie',
    'music': 'music',
    'party': 'party-popper',
    'gaming': 'gamepad-variant',
    'giải trí': 'gamepad-variant',
    
    // Income categories
    'salary': 'cash',
    'wage': 'cash',
    'income': 'cash-plus',
    'bonus': 'gift',
    'investment': 'chart-line',
    'freelance': 'laptop',
    'business': 'store',
    'lương': 'cash',
    'thưởng': 'gift',
    'đầu tư': 'chart-line',
    'kinh doanh': 'store',
  };
  
  // Convert category name to lowercase for matching
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Find matching icon
  let icon = 'cash-minus'; // default
  for (const [key, value] of Object.entries(categoryIconMap)) {
    if (normalizedName.includes(key)) {
      icon = value;
      break;
    }
  }
  
  // If no match found, use default based on category type
  if (icon === 'cash-minus') {
    icon = categoryType === 'expense' ? 'cash-minus' : 'cash-plus';
  }
  
  // Use getIconColor to get the color (same as AddExpenseScreen)
  return getIconColor(icon, categoryType);
};

const SimplePieChart: React.FC<PieChartProps> = ({ data, size = CHART_SIZE, categoryType }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <View style={[styles.emptyChart, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.emptyChartText}>Không có dữ liệu</Text>
        </View>
      </View>
    );
  }

  const chartData = data.map((item, index) => {
    const categoryName = (item as any).category_name || (item as any).categoryName || `Category ${index + 1}`;
    const percentage = item.percentage || 0;
    const color = getCategoryColor(categoryName, categoryType);
    
    return {
      categoryName,
      percentage,
      color,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // SVG Donut Chart Implementation
  const renderSvgChart = () => {
    const radius = size * 0.4;
    const strokeWidth = size * 0.18;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercentage = 0;

    return (
      <View style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Data Segments */}
          {chartData.map((item, index) => {
            if (item.percentage <= 0) return null;
            
            const segmentLength = (item.percentage / 100) * circumference;
            const rotationAngle = (cumulativePercentage / 100) * 360;
            
            cumulativePercentage += item.percentage;
            
            return (
              <Circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeLinecap="butt"
                fill="transparent"
                transform={`rotate(${rotationAngle - 90}, ${size / 2}, ${size / 2})`}
              />
            );
          })}
        </Svg>
        {/* Center Icon */}
        <View style={styles.chartCenterIcon}>
          <Icon 
            name={categoryType === 'expense' ? 'trending-down' : 'trending-up'} 
            size={size * 0.15} 
            color={categoryType === 'expense' ? '#FF3B30' : '#34C759'} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.chartContainer, { width: size * 1.8, height: size * 1.2, flexDirection: 'row', alignItems: 'center' }]}>
      {renderSvgChart()}
      {/* Legend on the right */}
      <View style={styles.legendContainer}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <View style={styles.legendContent}>
              <Text style={styles.legendLabel} numberOfLines={1}>
                {item.categoryName}
              </Text>
              <Text style={styles.legendPercentage}>
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function ReportScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<TransactionReportResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  const showToastMessage = useCallback((message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  // Load report data
  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate start and end dates for the selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('🔄 Loading report data for:', { 
        selectedMonth,
        startDate: startDateStr, 
        endDate: endDateStr,
        year,
        month 
      });

      const data = await transactionService.viewTransactionReport(
        undefined, // categoryId - load all categories
        startDateStr,
        endDateStr
      );

      console.log('✅ Raw API Response:', data);
      console.log('🏷️ Response Type:', typeof data);
      console.log('🔍 Response Keys:', Object.keys(data || {}));
      
      if (data?.summary) {
        console.log('💰 Summary Data:', {
          totalExpense: data.summary.totalExpense || (data.summary as any).total_expense,
          totalIncome: data.summary.totalIncome || (data.summary as any).total_income,
          fullSummary: data.summary
        });
      }
      
      if (data?.transactionsByCategory) {
        console.log('📊 TransactionsByCategory structure:', {
          type: typeof data.transactionsByCategory,
          keys: Object.keys(data.transactionsByCategory),
          fullData: data.transactionsByCategory
        });
      }
      
      // Check for snake_case version too
      if ((data as any)?.transactions_by_category) {
        console.log('📊 transactions_by_category structure:', {
          type: typeof (data as any).transactions_by_category,
          keys: Object.keys((data as any).transactions_by_category),
          fullData: (data as any).transactions_by_category
        });
      }

      setReportData(data);
      console.log('✅ Report data loaded and set to state');
    } catch (error: any) {
      console.error('❌ Failed to load report data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      showToastMessage(error.message || 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToastMessage]);

  // Load data on mount and when month changes
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₫', 'đ');
  };

  // Get month display text
  const getMonthDisplayText = (): string => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  // Navigate month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1);
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // Get expense data for pie chart
  const getExpenseData = (): ReportByCategory[] => {
    console.log('🔍 Getting Expense Data...');
    console.log('📊 Full Report Data:', reportData);
    
    if (!reportData) {
      console.log('❌ No reportData available');
      return [];
    }
    
    // Access snake_case API response
    const transactionsByCategory = (reportData as any).transactions_by_category;
    console.log('🗂️ transactions_by_category:', transactionsByCategory);
    
    if (!transactionsByCategory) {
      console.log('❌ No transactions_by_category in reportData');
      console.log('🔍 Available keys in reportData:', Object.keys(reportData));
      return [];
    }
    
    // Access expense data from snake_case API
    const expenseData = transactionsByCategory.expense;
    
    console.log('💰 Raw Expense Data:', expenseData);
    
    if (!expenseData || !Array.isArray(expenseData)) {
      console.log('❌ No valid expense data found');
      console.log('🔍 Available keys in transactions_by_category:', Object.keys(transactionsByCategory));
      return [];
    }
    
    console.log('✅ Expense Data Array Length:', expenseData.length);
    expenseData.forEach((item: any, index: number) => {
      console.log(`📈 Expense Item ${index}:`, {
        category_name: item.category_name,
        categoryName: item.categoryName,
        percentage: item.percentage,
        amount: item.amount,
        fullItem: item
      });
    });
    
    return expenseData;
  };

  // Get income data for pie chart
  const getIncomeData = (): ReportByCategory[] => {
    console.log('🔍 Getting Income Data...');
    console.log('📊 Full Report Data:', reportData);
    
    if (!reportData) {
      console.log('❌ No reportData available');
      return [];
    }
    
    // Access snake_case API response
    const transactionsByCategory = (reportData as any).transactions_by_category;
    console.log('🗂️ transactions_by_category:', transactionsByCategory);
    
    if (!transactionsByCategory) {
      console.log('❌ No transactions_by_category in reportData');
      console.log('🔍 Available keys in reportData:', Object.keys(reportData));
      return [];
    }
    
    // Access income data from snake_case API  
    const incomeData = transactionsByCategory.income;
    
    console.log('💰 Raw Income Data:', incomeData);
    
    if (!incomeData || !Array.isArray(incomeData)) {
      console.log('❌ No valid income data found');
      console.log('🔍 Available keys in transactions_by_category:', Object.keys(transactionsByCategory));
      return [];
    }
    
    console.log('✅ Income Data Array Length:', incomeData.length);
    incomeData.forEach((item: any, index: number) => {
      console.log(`📈 Income Item ${index}:`, {
        category_name: item.category_name,
        categoryName: item.categoryName,
        percentage: item.percentage,
        amount: item.amount,
        fullItem: item
      });
    });
    
    return incomeData;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => navigateMonth('prev')}>
          <Icon name="chevron-left" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{getMonthDisplayText()}</Text>
        <TouchableOpacity onPress={() => navigateMonth('next')}>
          <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.incomeCard}>
                <Text style={styles.incomeLabel}>Chi tiêu</Text>
                <Text style={[styles.summaryValue, styles.expenseValue]}>
                  {(() => {
                    // Log summary data before rendering
                    const summary = (reportData as any)?.summary;
                    const totalExpense = summary?.total_expense || summary?.totalExpense || 0;
                    
                    console.log('🏷️ Rendering Expense Summary:', {
                      reportData: !!reportData,
                      summary: summary,
                      total_expense: summary?.total_expense,
                      totalExpense: summary?.totalExpense,
                      finalValue: totalExpense,
                      formatted: reportData ? formatCurrency(-Math.abs(totalExpense)) : '-0đ'
                    });
                    
                    return reportData ? formatCurrency(-Math.abs(totalExpense)) : '-0đ';
                  })()}
                </Text>
              </View>
              <View style={styles.expenseCard}>
                <Text style={styles.expenseLabel}>Thu nhập</Text>
                <Text style={[styles.summaryValue, styles.incomeValue]}>
                  {(() => {
                    // Log summary data before rendering
                    const summary = (reportData as any)?.summary;
                    const totalIncome = summary?.total_income || summary?.totalIncome || 0;
                    
                    console.log('🏷️ Rendering Income Summary:', {
                      reportData: !!reportData,
                      summary: summary,
                      total_income: summary?.total_income,
                      totalIncome: summary?.totalIncome,
                      finalValue: totalIncome,
                      formatted: reportData ? `+${formatCurrency(totalIncome)}` : '+0đ'
                    });
                    
                    return reportData ? `+${formatCurrency(totalIncome)}` : '+0đ';
                  })()}
                </Text>
              </View>
            </View>
          </View>

          {/* Expense Chart Section */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Chi phí</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('ReportDetailScreen', {
                  title: 'Chi tiết chi phí',
                  categoryType: 'expense',
                  data: getExpenseData(),
                  totalAmount: (reportData as any)?.summary?.total_expense || 0,
                })}
              >
                <Text style={styles.seeAllText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.chartAmount}>
              {(() => {
                const summary = (reportData as any)?.summary;
                const totalExpense = summary?.total_expense || summary?.totalExpense || 0;
                return reportData ? formatCurrency(totalExpense) : '0 đ';
              })()}
            </Text>
            <SimplePieChart data={getExpenseData()} size={150} categoryType="expense" />
          </View>

          {/* Income Chart Section */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Thu nhập</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportDetailScreen', {
                  title: 'Chi tiết thu nhập',
                  categoryType: 'income',
                  data: getIncomeData(),
                  totalAmount: (reportData as any)?.summary?.total_income || 0,
                })}
              >
                <Text style={styles.seeAllText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.chartAmount}>
              {(() => {
                const summary = (reportData as any)?.summary;
                const totalIncome = summary?.total_income || summary?.totalIncome || 0;
                return reportData ? formatCurrency(totalIncome) : '0 đ';
              })()}
            </Text>
            <SimplePieChart data={getIncomeData()} size={150} categoryType="income" />
          </View>

          {/* View Report by Category */}
          <TouchableOpacity style={styles.viewReportButton}>
            <Text style={styles.viewReportText}>Xem báo cáo theo hạng mục</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Toast */}
      <CustomToast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 20,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    marginVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  incomeCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginRight: 8,
  },
  expenseCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  incomeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  expenseValue: {
    color: '#FF3B30',
  },
  incomeValue: {
    color: '#34C759',
  },
  chartSection: {
    marginBottom: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  chartAmount: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    marginTop: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryInfo: {
    flexDirection: 'column',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
  emptyChart: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#999',
    fontSize: 14,
  },
  viewReportButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  viewReportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendContent: {
    flexDirection: 'column',
  },
  legendLabel: {
    fontSize: 14,
    color: '#333',
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
  },
  chartCenterIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    marginLeft: 20,
    justifyContent: 'center',
  },
}); 