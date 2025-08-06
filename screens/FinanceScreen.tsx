import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { CategoryResponse, CategoryService, CategoryType } from '../services/categoryService';
import { getUnreadCount } from '../services/notificationService';
import { HealthStatusData, statusService } from '../services/statusService';
import { TransactionReportResponse, transactionService, viewHistoryTransactions } from '../services/transactionService';
import { UserProfile, userService } from '../services/userService';
import { WalletResponse, walletService } from '../services/walletService';
import { getIconColor, getIconForCategory } from '../utils/iconUtils';

const { width, height } = Dimensions.get('window');

// Responsive utilities for FinanceScreen - memoized calculations
const responsiveUtils = {
  isSmallScreen: width < 375 || height < 667,
  screenWidth: width,
  screenHeight: height,
  rp: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minSize = size * 0.7;
    const scaledSize = size * scale;
    return Math.max(scaledSize, minSize);
  },
  rf: (fontSize: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minFontScale = 0.85;
    const maxFontScale = 1.15;
    const fontScale = Math.min(Math.max(scale, minFontScale), maxFontScale);
    return fontSize * fontScale;
  },
  wp: (percentage: number) => (width * percentage) / 100,
  hp: (percentage: number) => (height * percentage) / 100,
};

// Extract these for better performance
const { isSmallScreen, rp, rf, wp, hp } = responsiveUtils;

// Type definitions
interface ExpenseData {
  category: string;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: ExpenseData[];
}

interface ButtonProps {
  icon: string;
  label: string;
  isActive?: boolean;
  iconColor?: string;
}

interface FinanceData {
  totalBalance: number;
  income: number;
  expenses: number;
  difference: number;
}

// Add report data interface
interface ChartData {
  income: number;
  expenses: number;
  difference: number;
  isLoading: boolean;
}

// Hàm tính toán font size động cho balance
const getDynamicBalanceFontSize = (balance: number): number => {
  const formattedBalance = balance.toLocaleString('vi-VN');
  const balanceLength = formattedBalance.length;
  
  // Base font size
  const baseFontSize = isSmallScreen ? rf(28) : rf(32);
  
  // Giảm font size dựa trên độ dài
  if (balanceLength > 15) {
    return baseFontSize * 0.5; // Giảm 50%
  } else if (balanceLength > 12) {
    return baseFontSize * 0.6; // Giảm 40%
  } else if (balanceLength > 10) {
    return baseFontSize * 0.7; // Giảm 30%
  } else if (balanceLength > 8) {
    return baseFontSize * 0.8; // Giảm 20%
  } else if (balanceLength > 6) {
    return baseFontSize * 0.9; // Giảm 10%
  }
  
  return baseFontSize; // Giữ nguyên kích thước gốc
};

// Helper function tính phần trăm an toàn
const getPercent = (value: number, total: number) => {
  if (!total || isNaN(value)) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

// --- Pie chart giống ReportScreen ---

// Pie chart component giống ReportScreen
const SimplePieChart: React.FC<{
  data: any[];
  size?: number;
  categoryType: 'expense' | 'income';
}> = ({ data, size = 140, categoryType }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#999', fontSize: 14 }}>{t('reports.noData')}</Text>
        </View>
      </View>
    );
  }
  // Chuẩn hóa dữ liệu
  const chartData = data.map((item: any, idx: number) => {
    const categoryName = item.category_name || item.categoryName || `Category ${idx + 1}`;
    const percentage = item.percentage || 0;
    const amount = item.amount || 0;
    // Lấy màu từ iconUtils
    const icon = item.category_icon_url || '';
    const color = getIconColor(icon, categoryType);
    return { categoryName, percentage, color, amount };
  }).sort((a, b) => b.percentage - a.percentage);
  // SVG Donut Chart
  const radius = size * 0.4;
  const strokeWidth = size * 0.18;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercentage = 0;
  // Hàm format tiền
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₫', 'đ');
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: size * 1.7 }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
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
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <IconMC
            name={categoryType === 'expense' ? 'trending-down' : 'trending-up'}
            size={size * 0.15}
            color={categoryType === 'expense' ? '#FF3B30' : '#34C759'}
          />
        </View>
      </View>
      {/* Legend mới: Tên | Số tiền | % */}
      {/* Legend revert: chỉ hiện màu, tên, phần trăm */}
      <View style={{ marginLeft: 60, justifyContent: 'center'}}>
        {chartData
          .filter(item => item.percentage > 0)
          .slice(0, 6)
          .map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 8 }} />
              <Text style={{ fontSize: 14, color: '#333' }} numberOfLines={1} ellipsizeMode="tail">{item.categoryName}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', marginLeft: 8, minWidth: 50, textAlign: 'right' }}>{item.percentage.toFixed(1)}%</Text>
            </View>
        ))}
      </View>
    </View>
  );
};

const FinanceScreen = React.memo(() => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const { isAuthenticated, transactionRefreshTrigger } = useAuth();
  
  // State for user data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for wallet data
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData>({
    totalBalance: 0,
    income: 0,
    expenses: 0,
    difference: 0
  });
  const [walletLoading, setWalletLoading] = useState(true);
  
  // State for chart data
  const [chartData, setChartData] = useState<ChartData>({
    income: 0,
    expenses: 0,
    difference: 0,
    isLoading: false
  });
  const [reportData, setReportData] = useState<TransactionReportResponse | null>(null);
  
  // UI state
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Health status state from API
  const [apiHealthStatus, setApiHealthStatus] = useState<HealthStatusData | null>(null);
  const [healthStatusLoading, setHealthStatusLoading] = useState(false);

  // Transaction history state
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [transactionHistoryLoading, setTransactionHistoryLoading] = useState(false);
  const [transactionCache, setTransactionCache] = useState<any[]>([]);
  const [lastTransactionFetch, setLastTransactionFetch] = useState(0);
  const TRANSACTION_CACHE_DURATION = 60000; // 1 phút

  // 1. Thêm state và options cho dropdown filter
  const PERIOD_OPTIONS = [
    { label: t('finance.periods.thisDay'), value: 'today' },
    { label: t('finance.periods.thisWeek'), value: 'week' },
    { label: t('finance.periods.thisMonth'), value: 'month' },
    { label: t('finance.periods.thisYear'), value: 'year' },
  ];
  const [selectedPeriodValue, setSelectedPeriodValue] = useState('month'); // Default: tháng này
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Hàm lấy object option theo value
  const getPeriodOption = (value: string) => PERIOD_OPTIONS.find(opt => opt.value === value) || PERIOD_OPTIONS[2];

  // Hàm tính toán khoảng thời gian theo filter
  const getPeriodRange = (periodValue: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;
    switch (periodValue) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week': {
        const day = now.getDay() || 7; // Chủ nhật là 0 => 7
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        endDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
        break;
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    return { startDate, endDate };
  };

  const handleSelectPeriod = (option: {label: string, value: string}) => {
    setSelectedPeriodValue(option.value);
    setIsDropdownOpen(false);
    const { startDate, endDate } = getPeriodRange(option.value);
    loadChartData(startDate, endDate);
  };

  // Cache state để tránh gọi API không cần thiết
  const [dataCache, setDataCache] = useState<{[key: string]: any}>({});
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 30000; // 30 giây

  // Load tất cả data song song với cache
  const loadAllData = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      setWalletLoading(false);
      return;
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
      console.log('📦 Using cached data, last fetch:', new Date(lastFetchTime));
      return;
    }

    try {
      setLoading(true);
      setWalletLoading(true);
      console.log('🟡 Loading all data in parallel...');
      
      // Gọi tất cả API song song
      const [profile, walletsData, chartResponse, notificationResponse, healthData] = await Promise.all([
        userService.getCurrentUserProfile(forceRefresh),
        walletService.getAllWallets(),
        (async () => {
          const { startDate, endDate } = getPeriodRange(selectedPeriodValue);
          const startDateStr = toLocalDateString(startDate);
          const endDateStr = toLocalDateString(endDate);
          return transactionService.viewTransactionReport(undefined, startDateStr, endDateStr);
        })(),
        getUnreadCount(),
        statusService.getHealthStatus()
      ]);

      console.log('🟢 All data loaded successfully');
      
      // Set states
      setUserProfile(profile);
      setWallets(walletsData);
      
      // Calculate total balance
      const totalBalance = walletsData.reduce((total: number, wallet: WalletResponse) => {
        if (wallet.is_active !== false && !wallet.exclude_from_total) {
          return total + (wallet.current_balance || 0);
        }
        return total;
      }, 0);
      
      setFinanceData({
        totalBalance,
        income: 0,
        expenses: 0,
        difference: 0
      });

      // Process chart data
      const summary = (chartResponse as any).summary || chartResponse.summary;
      const income = summary?.total_income || summary?.totalIncome || 0;
      const expenses = summary?.total_expense || summary?.totalExpense || 0;
      const difference = income - expenses;
      
      setChartData({
        income,
        expenses,
        difference,
        isLoading: false
      });
      
      setReportData(chartResponse);

      // Process notification count
      let count = 0;
      const responseAny = notificationResponse as any;
      if (responseAny?.data?.count !== undefined) {
        count = responseAny.data.count;
      } else if (responseAny?.count !== undefined) {
        count = responseAny.count;
      } else if (typeof responseAny?.data === 'number') {
        count = responseAny.data;
      } else if (typeof responseAny === 'number') {
        count = responseAny;
      } else if (responseAny?.data?.data?.count !== undefined) {
        count = responseAny.data.data.count;
      }
      setNotificationCount(count);

      // Set health status
      setApiHealthStatus(healthData);
      
      // Update cache
      setDataCache({
        profile,
        wallets: walletsData,
        chartData: chartResponse,
        notifications: count,
        health: healthData
      });
      setLastFetchTime(now);

    } catch (error: any) {
      console.error('🔴 Failed to load data:', error);
    } finally {
      setLoading(false);
      setWalletLoading(false);
      setHealthStatusLoading(false);
    }
  }, [isAuthenticated, selectedPeriodValue, lastFetchTime]);

  // Load data khi mount
  useEffect(() => {
    loadAllData();
  }, [isAuthenticated]);

  // Refresh khi có transaction mới
  useEffect(() => {
    if (transactionRefreshTrigger > 0) {
      console.log('🔄 Transaction updated - refreshing data');
      loadAllData(true); // Force refresh
    }
  }, [transactionRefreshTrigger]);

  // Refresh khi focus với debounce
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        const now = Date.now();
        // Force refresh khi quay lại từ NotificationsScreen
        console.log('🔄 FinanceScreen focused, refreshing data...');
        
        // Load main data first, then transaction history with a small delay
        // This prevents overwhelming the API and reduces perceived delay
        loadAllData(true).then(() => {
          // Add a small delay to prevent API overload
          setTimeout(() => {
            console.log('🔄 FinanceScreen focused, refreshing transaction history...');
            loadTransactionHistory(true);
          }, 200); // Increased delay to 200ms for better performance
        }).catch((error) => {
          console.error('🔴 Error loading main data:', error);
          // Still try to load transaction history even if main data fails
          setTimeout(() => {
            console.log('🔄 FinanceScreen focused, refreshing transaction history...');
            loadTransactionHistory(true);
          }, 200);
        });
      }
    }, [isAuthenticated])
  );

  // Chỉ load chart data khi period thay đổi
  useEffect(() => {
    if (isAuthenticated && selectedPeriodValue) {
      const { startDate, endDate } = getPeriodRange(selectedPeriodValue);
      loadChartData(startDate, endDate);
    }
  }, [selectedPeriodValue]);

  // Removed individual loadUserProfile - now handled in loadAllData

  // Helper function to format money - memoized
  const formatMoney = useCallback((amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    return amount.toLocaleString('vi-VN');
  }, []);

  // Format display number: nếu số quá dài thì chuyển sang dạng khoa học
  const formatDisplayNumber = (amount: number): string => {
    const str = amount.toLocaleString('vi-VN');
    if (str.replace(/[^0-9]/g, '').length > 9) {
      return amount.toExponential(2).replace('+', '');
    }
    return str;
  };

  // Removed individual loadWalletData - now handled in loadAllData

  // Helper: Lấy ngày local dạng YYYY-MM-DD
  const pad = (n: number) => n.toString().padStart(2, '0');
  const toLocalDateString = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  // Optimized chart data loading - chỉ gọi khi period thay đổi
  const loadChartData = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setChartData(prev => ({ ...prev, isLoading: true }));
      console.log('📊 Loading chart data for period change...');
      
      let _startDate = startDate, _endDate = endDate;
      if (!_startDate || !_endDate) {
        const range = getPeriodRange(selectedPeriodValue);
        _startDate = range.startDate;
        _endDate = range.endDate;
      }
      
      const startDateStr = toLocalDateString(_startDate);
      const endDateStr = toLocalDateString(_endDate);
      
      const reportResponse = await transactionService.viewTransactionReport(
        undefined,
        startDateStr,
        endDateStr
      );
      
      const summary = (reportResponse as any).summary || reportResponse.summary;
      const income = summary?.total_income || summary?.totalIncome || 0;
      const expenses = summary?.total_expense || summary?.totalExpense || 0;
      const difference = income - expenses;
      
      setChartData({
        income,
        expenses,
        difference,
        isLoading: false
      });
      
      setReportData(reportResponse);
      
    } catch (error: any) {
      console.error('🔴 Failed to load chart data:', error);
      setChartData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, selectedPeriodValue]);

  // Removed individual loadNotificationCount - now handled in loadAllData

  // Removed individual loadHealthStatus - now handled in loadAllData

  // Memoized expense data - chỉ sử dụng khi cần thiết
  const expenseData: ExpenseData[] = useMemo(() => {
    // Chỉ tạo mock data khi không có real data
    if (reportData && Object.keys(reportData).length > 0) {
      return [];
    }
    return [
      { category: t('categoryNames.entertainment'), percentage: 54.55, color: '#FFA726' },
      { category: t('categoryNames.education'), percentage: 25.25, color: '#EF5350' },
      { category: t('categoryNames.clothes'), percentage: 18.74, color: '#26A69A' },
      { category: t('categoryNames.food'), percentage: 0.76, color: '#AB47BC' },
      { category: t('common.unknown'), percentage: 0.7, color: '#42A5F5' },
    ];
  }, [reportData]);

  // Optimized ScrollView props
  const scrollViewProps = useMemo(() => ({
    style: styles.content,
    contentContainerStyle: [
      styles.scrollContent,
      { paddingBottom: rp(50) }
    ],
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    nestedScrollEnabled: true,
    bounces: true, // Enable bounce for natural scroll feel
    alwaysBounceVertical: true,
    bouncesZoom: false,
    overScrollMode: 'auto' as const, // Allow overscroll on Android
    contentInsetAdjustmentBehavior: 'automatic' as const,
    scrollEventThrottle: 16, // Smooth scroll events
    decelerationRate: 'normal' as const, // Natural deceleration
    removeClippedSubviews: true, // Performance optimization
    maxToRenderPerBatch: 10, // Performance optimization
    windowSize: 10, // Performance optimization
  }), []);

  // Memoized Icon Button Component
  const IconButton = React.memo(({ icon, label, isActive = false, iconColor = 'white' }: ButtonProps) => (
    <TouchableOpacity style={[styles.iconButton, isActive && styles.activeIconButton]}>
      <View style={styles.iconContainer}>
        {icon && typeof icon === 'string' && icon.startsWith('M') ? (
          <Icon name={icon} size={24} color={iconColor} />
        ) : (
          <Text style={[styles.iconText, { color: iconColor }]}>{icon || ''}</Text>
        )}
      </View>
    </TouchableOpacity>
  ));

  IconButton.displayName = 'IconButton';

  // Memoized Notification Icon Component
  const NotificationIcon = React.memo(() => (
    <View style={styles.headerIcon}>
      <Icon name="notifications" size={24} color="white" />
      {notificationCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </Text>
        </View>
      )}
    </View>
  ));

  NotificationIcon.displayName = 'NotificationIcon';

  // Memoized avatar source
  const avatarSource = useMemo(() => {
    if (userProfile?.user_avatar_url) {
      return { uri: userProfile.user_avatar_url };
    }
    
    // Use gender-based default avatar
    if (userProfile?.user_gender === true) {
      return require('../assets/images/maleavatar.png');
    } else if (userProfile?.user_gender === false) {
      return require('../assets/images/femaleavatar.png');
    }
    
    // Fallback to unknown avatar
    return require('../assets/images/Unknown.jpg');
  }, [userProfile?.user_avatar_url, userProfile?.user_gender]);

  // Memoized formatted balance - back to using real wallet data only
  const formattedBalance = useMemo(() => {
    return isBalanceVisible ? `${financeData.totalBalance.toLocaleString('vi-VN')} ${t('currency')}` : t('finance.hiddenBalance');
  }, [isBalanceVisible, financeData.totalBalance, t]);

  // Memoized dynamic balance font size - back to using real wallet data only
  const dynamicBalanceFontSize = useMemo(() => {
    return getDynamicBalanceFontSize(financeData.totalBalance);
  }, [financeData.totalBalance]);

  // Memoized callback functions for better performance
  const handleRefreshProfile = useCallback(() => {
    loadAllData(true); // Force refresh all data
  }, [loadAllData]);

  const handleToggleBalance = useCallback(() => {
    setIsBalanceVisible(prev => !prev);
  }, []);

  const handleNavigateToNotifications = useCallback(() => {
    navigation.navigate('Notifications');
    // Refresh notification count when returning from notifications screen
    setTimeout(() => {
      loadAllData(true);
    }, 1000);
  }, [navigation, loadAllData]);

  const handleNavigateToCalendar = useCallback(() => {
    navigation.navigate('Calendar');
  }, [navigation]);

  const handleNavigateToChatAI = useCallback(() => {
    navigation.navigate('ChatAI');
  }, [navigation]);

  const handleNavigateToGroupManagement = useCallback(() => {
    navigation.navigate('GroupManagement');
  }, [navigation]);

  const handleNavigateToBudget = useCallback(() => {
    navigation.navigate('BudgetScreen');
  }, [navigation]);

  // Move getCategoryBreakdown here so it can access reportData
  const getCategoryBreakdown = (type: 'expense' | 'income') => {
    if (!reportData) return [];
    const byCat = (reportData as any).transactionsByCategory || (reportData as any).transactions_by_category;
    if (!byCat) return [];
    return byCat[type] || [];
  };

  // Thêm mock data để test
  // Mock data for testing
  // Mock data for testing

  // Thêm Financial Health Score calculation và helper functions
  const calculateFinancialHealthScore = useCallback(() => {
    let score = 100;
    let suggestions: string[] = [];
    let warnings: string[] = [];
    let achievements: string[] = [];

    // Sử dụng mock data hoặc real data
    const currentChartData = chartData;
    const currentFinanceData = financeData;

    // 1. Tỷ lệ tiết kiệm (Savings Rate)
    const totalFlow = currentChartData.income + Math.abs(currentChartData.expenses);
    const savingsRate = totalFlow > 0 ? ((currentChartData.income - Math.abs(currentChartData.expenses)) / currentChartData.income) * 100 : 0;
    
    if (savingsRate < 5) {
      score -= 30;
      suggestions.push(t('finance.health.suggestions.lowSavings'));
    } else if (savingsRate < 10) {
      score -= 20;
      suggestions.push(t('finance.health.suggestions.improveSavings'));
    } else if (savingsRate >= 20) {
      achievements.push(t('finance.health.suggestions.excellentSavings', { rate: savingsRate.toFixed(1) }));
    }

    // 2. Xu hướng chi tiêu (Expense vs Income)
    const expenseRatio = currentChartData.income > 0 ? (Math.abs(currentChartData.expenses) / currentChartData.income) * 100 : 0;
    
    if (expenseRatio > 100) {
      score -= 40;
      warnings.push(t('finance.health.suggestions.overspending'));
    } else if (expenseRatio > 90) {
      score -= 25;
      warnings.push(t('finance.health.suggestions.highSpending'));
    }

    // 3. Xu hướng tài sản (giả định so với tháng trước)
    const previousMonthBalance = currentFinanceData.totalBalance * 0.85; // Mock data
    const balanceChange = currentFinanceData.totalBalance - previousMonthBalance;
    
    if (balanceChange < -500000) {
      score -= 20;
      suggestions.push(t('finance.health.suggestions.balanceDecline', { amount: Math.abs(balanceChange).toLocaleString('vi-VN') + '₫' }));
    } else if (balanceChange > 1000000) {
      achievements.push(t('finance.health.suggestions.balanceGrowth', { amount: balanceChange.toLocaleString('vi-VN') + '₫' }));
    }

    // Đảm bảo score trong khoảng 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      score: Math.round(score),
      savingsRate: Math.max(0, savingsRate),
      expenseRatio,
      balanceChange,
      suggestions,
      warnings,
      achievements
    };
  }, [chartData, financeData.totalBalance, t]);

  // Helper function to get health status color based on score ranges
  const getHealthStatusColor = (score: number) => {
    if (score >= 0 && score <= 20) return '#F44336'; // Red
    if (score >= 21 && score <= 40) return '#FF9800'; // Orange
    if (score >= 41 && score <= 75) return '#FFC107'; // Yellow
    if (score >= 76 && score <= 100) return '#4CAF50'; // Green
    return '#E0E0E0'; // Default gray
  };

  // Helper function to get health status message based on score ranges
  const getHealthStatusMessage = (score: number) => {
    if (score >= 0 && score <= 20) return t('finance.financialStatus.poor');
    if (score >= 21 && score <= 40) return t('finance.financialStatus.needsImprovement');
    if (score >= 41 && score <= 75) return t('finance.financialStatus.fair');
    if (score >= 76 && score <= 100) return t('finance.financialStatus.excellent');
    return t('finance.unknown');
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { 
      label: t('finance.health.status.excellent'), 
      message: t('finance.health.statusMessage.excellent'),
      color: '#4CAF50', 
      
    };
    if (score >= 60) return { 
      label: t('finance.health.status.good'), 
      message: t('finance.health.statusMessage.good'),
      color: '#FF9800', 
     
    };
    if (score >= 40) return { 
      label: t('finance.health.status.fair'), 
      message: t('finance.health.statusMessage.fair'),
      color: '#FF5722', 
      
    };
    return { 
      label: t('finance.health.status.poor'), 
      message: t('finance.health.statusMessage.poor'),
      color: '#F44336', 
    
    };
  };

  const financialHealth = useMemo(() => calculateFinancialHealthScore(), [calculateFinancialHealthScore]);
  const healthStatus = useMemo(() => getHealthStatus(financialHealth.score), [financialHealth.score]);

  // Chart data: lấy từ API report như cũ
  // ... giữ nguyên loadChartData và reportData ...

  // Transaction history hôm nay: lấy từ getAllTransactions, lọc local

  // State for categories
  const [categoriesMap, setCategoriesMap] = useState<{ [id: number]: CategoryResponse }>({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Optimized categories loading với cache
  const [categoriesCache, setCategoriesCache] = useState<{ [id: number]: CategoryResponse }>({});
  const [lastCategoriesFetch, setLastCategoriesFetch] = useState(0);
  const CATEGORIES_CACHE_DURATION = 300000; // 5 phút

  useEffect(() => {
    const loadCategories = async () => {
      if (!userProfile?.user_id) {
        setCategoriesMap({});
        setCategoriesLoading(false);
        return;
      }

      const now = Date.now();
      if (now - lastCategoriesFetch < CATEGORIES_CACHE_DURATION && Object.keys(categoriesCache).length > 0) {
        console.log('📦 Using cached categories');
        setCategoriesMap(categoriesCache);
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      try {
        console.log('🟡 Loading categories...');
        const categoryService = CategoryService.getInstance();
        const [incomeCats, expenseCats] = await Promise.all([
          categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, 0),
          categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, 0),
        ]);
        const allCats = [...incomeCats, ...expenseCats];
        const map: { [id: number]: CategoryResponse } = {};
        allCats.forEach(cat => { map[cat.category_id] = cat; });
        
        setCategoriesMap(map);
        setCategoriesCache(map);
        setLastCategoriesFetch(now);
      } catch (err) {
        console.error('🔴 Failed to load categories:', err);
        setCategoriesMap({});
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, [userProfile?.user_id, lastCategoriesFetch, categoriesCache]);

  // Helper: Lấy ngày hôm nay (YYYY-MM-DD) theo giờ local
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Optimized transaction history loading với cache

  const loadTransactionHistory = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastTransactionFetch < TRANSACTION_CACHE_DURATION && transactionCache.length > 0) {
      console.log('📦 Using cached transaction history');
      setTransactionHistory(transactionCache);
      return;
    }

    setTransactionHistoryLoading(true);
    try {
      console.log('🟡 Loading transaction history...');
      const apiResponse: any = await viewHistoryTransactions({ page: 0, size: 30 }); // Giảm từ 50 xuống 30
      const all: any[] = (apiResponse?.data?.content && Array.isArray(apiResponse.data.content)) ? apiResponse.data.content : [];

      const today = getTodayString();
      const filtered = all.filter((tr: any) => {
        if (!tr.transaction_date) return false;
        const datePart = tr.transaction_date.slice(0, 10);
        return datePart === today;
      });
      
      filtered.sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      
      setTransactionHistory(filtered);
      setTransactionCache(filtered);
      setLastTransactionFetch(now);
    } catch (err) {
      console.error('🔴 Failed to load transaction history:', err);
      setTransactionHistory([]);
    } finally {
      setTransactionHistoryLoading(false);
    }
  }, []);

  // Gọi khi mount hoặc có giao dịch mới
  useEffect(() => {
    loadTransactionHistory();
  }, []);

  // Refresh transaction history when transactionRefreshTrigger changes
  useEffect(() => {
    if (transactionRefreshTrigger > 0) {
      console.log('🔄 Transaction refresh triggered - reloading transaction history');
      loadTransactionHistory(true);
    }
  }, [transactionRefreshTrigger]);

  // Helper format ngày -> giờ:phút AM/PM
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatAmountDisplay = (amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    const formattedAmount = amount.toLocaleString('vi-VN');
    // Count only digits, not total characters
    const digitCount = formattedAmount.replace(/\D/g, '').length;
    if (digitCount > 7) {
      // If digit count > 7, truncate to show 7 digits
      let count = 0;
      let result = '';
      for (let i = 0; i < formattedAmount.length; i++) {
        if (/\d/.test(formattedAmount[i])) count++;
        result += formattedAmount[i];
        if (count === 7) break;
      }
      return result + '...';
    }
    return formattedAmount;
  };

  // Sửa lại getIconAndColor để lấy icon từ category_id
  const getIconAndColor = (item: any) => {
    const type = (item.transaction_type || '').toLowerCase() === 'income' ? 'income' : 'expense';
    const categoryId = item.category_id;
    const category = categoryId ? categoriesMap[categoryId] : undefined;
    const iconName = category ? getIconForCategory(category.category_icon_url, type) : (item.category_icon_url || '');
    const iconColor = getIconColor(iconName, type);
    return {
      iconName,
      iconColor,
      type,
    };
  };

  // Handle transaction press to navigate to edit mode
  const handleTransactionPress = useCallback((transaction: any) => {
    console.log('🔄 Navigating to edit transaction:', transaction);
    
    // Get category name for the transaction
    const categoryObj = transaction.category_id ? categoriesMap[transaction.category_id] : undefined;
    const categoryName = categoryObj?.category_name || transaction.category_name || transaction.categoryName || t('common.unknown');
    
    // Navigate to AddExpenseScreen in edit mode
    navigation.navigate('AddExpenseScreen', {
      editMode: true,
      transactionData: {
        id: transaction.transaction_id?.toString() || transaction.id?.toString() || `transaction-${Math.random()}`,
        amount: (transaction.amount || 0).toString(),
        note: transaction.description || transaction.note || '',
        date: transaction.transaction_date,
        category: categoryName,
        categoryId: transaction.category_id,
        type: (transaction.transaction_type || 'expense').toLowerCase(),
        icon: transaction.category_icon_url || '',
        iconColor: getIconColor(transaction.category_icon_url || '', (transaction.transaction_type || 'expense').toLowerCase())
      }
    });
  }, [navigation, categoriesMap]);

  // Progressive loading - không block UI hoàn toàn
  const showFullLoading = loading && !userProfile;
  const showPartialLoading = (walletLoading || categoriesLoading) && userProfile;

  // Skeleton Loading Component
  const SkeletonLoader = React.memo(() => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTextContainer}>
          <View style={styles.skeletonGreeting} />
          <View style={styles.skeletonName} />
        </View>
      </View>
      <View style={styles.skeletonBalance}>
        <View style={styles.skeletonBalanceLabel} />
        <View style={styles.skeletonBalanceAmount} />
      </View>
    </View>
  ));

  SkeletonLoader.displayName = 'SkeletonLoader';

  // Show full loading only when no user profile
  if (showFullLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4285F4" translucent={true} />
        <SkeletonLoader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285F4" translucent={true} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + rp(10) }]}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Image 
                source={avatarSource}
                style={styles.avatarImage}
              />
            </View>
            <View>
              <Text style={styles.greeting}>{t('finance.hello')}</Text>
              <Text style={styles.userName}>
                {userProfile?.user_full_name || t('common.unknownUser')}
              </Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={handleRefreshProfile}
            >
              <Icon name="refresh" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNavigateToNotifications}>
              <NotificationIcon />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>{t('finance.totalBalance')}</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceAmount, { 
              minWidth: 200,
              fontSize: dynamicBalanceFontSize
            }]}>
              {formattedBalance}
            </Text>
            <TouchableOpacity onPress={handleToggleBalance}>
              <Icon 
                name={isBalanceVisible ? "visibility" : "visibility-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Removed the healthStatusSection from here */}

             <ScrollView {...scrollViewProps}>
         <View style={styles.bodyContainer}>
          
          {/* Financial Health Status Section - now using real API data */}
          <View style={styles.section}>
            {healthStatusLoading ? (
              <View style={styles.healthLoadingContainer}>
                <ActivityIndicator size="small" color="#1e90ff" />
                <Text style={styles.healthLoadingText}>{t('common.loading')}...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  ❤️ {t('finance.health.title')}: {apiHealthStatus?.score || 75}/100 ⓘ
                </Text>
                
                {/* Health Status Bar - using real API data */}
                <View style={styles.healthBarContainer}>
                  <View style={styles.healthBar}>
                    <View style={[
                      styles.healthBarFill,
                      {
                        width: `${Math.max(0, Math.min(100, apiHealthStatus?.score || 75))}%`,
                        backgroundColor: getHealthStatusColor(apiHealthStatus?.score || 75)
                      }
                    ]} />
                  </View>
                  <Text style={[styles.healthStatusText, { 
                    color: getHealthStatusColor(apiHealthStatus?.score || 75) 
                  }]}>
                    {getHealthStatusMessage(apiHealthStatus?.score || 75)}
                  </Text>
                </View>

          
              </>
            )}
          </View>

          {/* Income and Expenses Section */}
          <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('finance.incomeAndExpenses')}</Text>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    style={styles.newDropdownButton}
                    onPress={() => setIsDropdownOpen((open) => !open)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.newDropdownButtonText}>{getPeriodOption(selectedPeriodValue).label}</Text>
                    <Icon name={isDropdownOpen ? 'expand-less' : 'expand-more'} size={20} color="#333" />
                  </TouchableOpacity>
                  {isDropdownOpen && (
                    <View style={styles.newDropdownMenu}>
                      {PERIOD_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.newDropdownOption,
                            selectedPeriodValue === option.value && styles.newDropdownOptionSelected,
                          ]}
                          onPress={() => handleSelectPeriod(option)}
                        >
                          <Text style={[
                            styles.newDropdownOptionText,
                            selectedPeriodValue === option.value && styles.newDropdownOptionTextSelected,
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              {/* Bar Chart - back to using real data, not mock */}
              <View style={styles.barChartContainer}>
                {chartData.isLoading ? (
                  <View style={styles.chartLoadingContainer}>
                    <ActivityIndicator size="small" color="#1e90ff" />
                    <Text style={styles.chartLoadingText}>{t('finance.loading')}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.barChart}>
                      <View style={[
                        styles.incomeBar,
                        { 
                          height: chartData.income > 0 ? Math.max(rp(20), (chartData.income / Math.max(chartData.income, chartData.expenses)) * rp(100)) : rp(20)
                        }
                      ]}>
                        <Text style={styles.barLabel}>{t('finance.income')}</Text>
                      </View>
                      <View style={[
                        styles.expenseBar,
                        { 
                          height: chartData.expenses > 0 ? Math.max(rp(20), (chartData.expenses / Math.max(chartData.income, chartData.expenses)) * rp(100)) : rp(20)
                        }
                      ]}>
                        <Text style={styles.barLabel}>{t('finance.expense')}</Text>
                      </View>
                    </View>
                    <View style={styles.amountsList}>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>{t('finance.income1')}</Text>
                        <Text style={[styles.percentAmount, { color: '#4CAF50' }]}>
                          {getPercent(chartData.income, chartData.income + chartData.expenses)}
                        </Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>{t('finance.expense1')}</Text>
                        <Text style={[styles.percentAmount, { color: '#E91E63' }]}>
                          {getPercent(chartData.expenses, chartData.income + chartData.expenses)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
              
              {/* Removed View Details Button */}
            </View>

          {/* Removed old Financial Health Section */}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <View style={styles.actionButtonWrapper}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleNavigateToCalendar}
              >
                <Icon name="calendar-month" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.buttonTitle}>{t('navigation.calendar')}</Text>
            </View>
            <View style={styles.actionButtonWrapper}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleNavigateToChatAI}
              >
                <Icon2 name="robot" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.buttonTitle}>{t('navigation.chatAI')}</Text>
            </View>
            <View style={styles.actionButtonWrapper}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleNavigateToGroupManagement}
              >
                <Icon name="group" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.buttonTitle}>{t('navigation.groups')}</Text>
            </View>
            <View style={styles.actionButtonWrapper}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleNavigateToBudget}
              >
                <Icon2 name="bullseye" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.buttonTitle}>{t('navigation.budget')}</Text>
            </View>
          </View>

          {/* Transaction History Card */}
         <Text style={styles.historyTitle}>{t('finance.transactionHistoryToday')}</Text>
         {transactionHistoryLoading ? (
           <View style={styles.transactionHistoryContainer}>
             <View style={styles.skeletonTransactionItem}>
               <View style={styles.skeletonTransactionIcon} />
               <View style={styles.skeletonTransactionInfo}>
                 <View style={styles.skeletonTransactionCategory} />
                 <View style={styles.skeletonTransactionDesc} />
                 <View style={styles.skeletonTransactionDate} />
               </View>
               <View style={styles.skeletonTransactionAmount} />
             </View>
             <View style={styles.skeletonTransactionItem}>
               <View style={styles.skeletonTransactionIcon} />
               <View style={styles.skeletonTransactionInfo}>
                 <View style={styles.skeletonTransactionCategory} />
                 <View style={styles.skeletonTransactionDesc} />
                 <View style={styles.skeletonTransactionDate} />
               </View>
               <View style={styles.skeletonTransactionAmount} />
             </View>
           </View>
         ) : transactionHistory.length === 0 ? (
           <Text style={styles.historyEmpty}>{t('finance.noTransactionHistory')}</Text>
         ) : (
           <View style={styles.transactionHistoryContainer}>
             <ScrollView 
               style={styles.transactionHistoryFlatList}
               contentContainerStyle={styles.transactionHistoryContent}
               showsVerticalScrollIndicator={true}
               nestedScrollEnabled={true}
               scrollEnabled={true}
               bounces={false}
               alwaysBounceVertical={false}
               removeClippedSubviews={true}
             >
               {transactionHistory.map((item, index) => {
                 const { iconName, iconColor, type } = getIconAndColor(item);
                 const categoryObj = item.category_id ? categoriesMap[item.category_id] : undefined;
                 const categoryName = categoryObj?.category_name || item.category_name || item.categoryName || t('common.unknown');
                 return (
                   <TouchableOpacity 
                     key={item.transaction_id?.toString() || item.id?.toString() || index.toString()} 
                     style={styles.historyItem}
                     onPress={() => handleTransactionPress(item)}
                     activeOpacity={0.6}
                   >
                     <View style={[styles.historyIcon, { backgroundColor: iconColor + '22' }]}> 
                       <IconMC name={iconName || (type === 'income' ? 'trending-up' : 'trending-down')} size={20} color={iconColor} />
                     </View>
                     <View style={styles.historyInfo}>
                       <Text style={styles.historyCategory} numberOfLines={1}>{categoryName}</Text>
                       {item.description ? (
                         <Text style={styles.historyDesc} numberOfLines={1}>{item.description}</Text>
                       ) : null}
                       <Text style={styles.historyDate}>{formatDate(item.transaction_date)}</Text>
                     </View>
                     <View style={styles.historyAmountContainer}>
                       <Text style={[styles.historyAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]} numberOfLines={1}>
                         {type === 'income' ? '+' : '-'}{formatAmountDisplay(item.amount || 0)} đ
                       </Text>
                       <Icon name="chevron-right" size={20} color="#999" />
                     </View>
                   </TouchableOpacity>
                 );
               })}
             </ScrollView>
           </View>
         )}
        </View>
      </ScrollView>
    </View>
  );
});

FinanceScreen.displayName = 'FinanceScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4285F4',
  },

  header: {
    backgroundColor: '#4285F4',
    paddingHorizontal: rp(20),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: rp(20),
 
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rp(20),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: rp(50),
    height: rp(50),
    borderRadius: rp(25),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rp(15),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  greeting: {
    color: 'white',
    fontSize: rf(16),
    ...typography.regular,
  },
  userName: {
    color: 'white',
    fontSize: rf(18),
    ...typography.semibold,
  },
  headerIcons: {  
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: rp(15),
    position: 'relative',
  },
  headerIconText: {
    color: 'white',
    fontSize: rf(20),
    ...typography.regular,
  },
  balanceSection: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rf(16),
    marginBottom: rp(8),
    ...typography.regular,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: 'white',
    marginRight: rp(15),
    ...typography.semibold,
  },
  eyeIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: rp(20),
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginTop: rp(1),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rp(10),
  },
  sectionTitle: {
    marginTop: rp(1),
    fontSize: rf(18),
    color: '#333',
    ...typography.semibold,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barChart: {
    height: rp(150),
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  incomeBar: {
    width: rp(40),
    height: rp(40),
    backgroundColor: '#4CAF50',
    marginRight: rp(15),
    borderRadius: rp(6),
    justifyContent: 'flex-end',
    paddingBottom: rp(5),
  },
  expenseBar: {
    width: rp(40),
    height: rp(120),
    backgroundColor: '#E91E63',
    marginRight: rp(15),
    borderRadius: rp(6),
    justifyContent: 'flex-end',
    paddingBottom: rp(5),
  },
  differenceBar: {
    width: rp(40),
    height: rp(120),
    backgroundColor: '#FF9800', // Default color for difference
    marginRight: rp(20),
    borderRadius: rp(6),
    justifyContent: 'flex-end',
    paddingBottom: rp(5),
  },
  barLabel: {
    fontSize: rf(12),
    color: 'white',
    textAlign: 'center',
    ...typography.semibold,
  },
  differenceLabel: {
    fontSize: rf(12),
    color: '#666',
    marginLeft: rp(10),
    ...typography.regular,
  },
  amountsList: {
    alignItems: 'flex-start',
    paddingLeft: 15,
    minWidth: 150,
    marginRight: rp(10),
     // Thêm minWidth để đảm bảo có đủ không gian
  },
  
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Thay đổi thành space-between
    marginBottom: rp(8),
    width: '100%', // Đảm bảo chiếm toàn bộ chiều rộng
    minWidth: 120, // Thêm minWidth
  },
  
  amountLabel: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'left',
    flex: 1, // Thêm flex để label chiếm không gian còn lại
    ...typography.regular,
  },
  
  percentAmount: {
    fontSize: rf(14),
    color: '#4CAF50',
    textAlign: 'right',
    minWidth: 50, // Đặt minWidth cố định cho phần trăm
    ...typography.semibold,
  },
incomeAmount: {
  fontSize: rf(14),
  color: '#4CAF50',
  textAlign: 'left',
  minWidth: 0,
  maxWidth: '50%',
  flexShrink: 1,
  ...typography.semibold,
 
},
expenseAmount: {
  fontSize: rf(14),
  color: '#E91E63',
  textAlign: 'left',
  minWidth: 0,
  maxWidth: '50%',
  flexShrink: 1,
  ...typography.semibold,
  
},
differenceAmount: {
  fontSize: rf(14),
  color: '#FF9800',
  textAlign: 'left',
  minWidth: 0,
  maxWidth: '50%',
  flexShrink: 1,
  ...typography.semibold,
 
},
  pieChartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: rp(8),
    marginBottom: rp(8),
    alignSelf: 'center',
    width: rp(140),
},
legendRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginVertical: rp(2),
},
legendLabel: {
  color: '#666',
  fontSize: rf(15),
  ...typography.regular,
},
legendValue: {
  fontSize: rf(15),
  ...typography.semibold,
},
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: rp(50),
  },
  iconButton: {
    width: rp(50),
    height: rp(50),
    backgroundColor: '#1e90ff',
    borderRadius: rp(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconButton: {
    backgroundColor: '#1976D2',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    color: 'white',
    ...typography.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4285F4',
  },
  loadingText: {
    color: 'white',
    fontSize: rf(18),
    marginTop: rp(20),
    ...typography.semibold,
  },
  scrollContent: {
    paddingTop: rp(10),
  },
  simpleBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  actionButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: rp(80),
  },
  buttonTitle: {
    fontSize: rf(10),
    color: '#666',
    marginTop: rp(4),
    textAlign: 'center',
    ...typography.regular,
  },
  stickySection: {
    backgroundColor: '#fff',
    zIndex: 2,
  },
  bodyContainer: {
    paddingTop: rp(10),
  },
  chartLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(20),
  },
  chartLoadingText: {
    marginLeft: rp(10),
    color: '#666',
    fontSize: rf(14),
    ...typography.regular,
  },
  newDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 20,
    marginLeft: 8,
    marginBottom: 0,
    minWidth: 120,
    // Removed shadow properties
  },
  newDropdownButtonText: {
    marginLeft: 10,
    fontSize: rf(14),
    color: '#495057',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  newDropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    // Reduced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2000,
    paddingVertical: 4,
  },
  newDropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  newDropdownOptionSelected: {
    backgroundColor: '#F8F9FA',
  },
  newDropdownOptionText: {
    fontSize: rf(14),
    color: '#495057',
    fontFamily: 'Roboto',
  },
  newDropdownOptionTextSelected: {
    color: '#007BFF',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  amountsAndDropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: rp(20),
  },
  dropdownContainer: {
    alignItems: 'flex-end',
    marginTop: rp(10),
  },
  healthBarContainer: {
    marginTop: rp(10),
    marginBottom: rp(10),
    alignItems: 'center',
  },
  healthBar: {
    width: '100%',
    height: rp(10),
    backgroundColor: '#E0E0E0',
    borderRadius: rp(5),
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: rp(5),
  },
  healthStatusText: {
    fontSize: rf(14),
    fontWeight: '600',
    marginTop: rp(10),
    fontFamily: 'Roboto',
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: rp(10),
    marginBottom: rp(15),
  },
  metricRow: {
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: rf(20),
    marginBottom: rp(4),
  },
  metricText: {
    fontSize: rf(14),
    color: '#666',
    fontFamily: 'Roboto',
  },
  suggestionsContainer: {
    marginTop: rp(10),
    marginBottom: rp(15),
  },
  suggestionItem: {
    paddingVertical: rp(8),
    paddingHorizontal: rp(12),
    borderRadius: rp(8),
    marginBottom: rp(5),
  },
  warningItem: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 5,
    borderLeftColor: '#FFEEBA',
  },
  suggestionNormal: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 5,
    borderLeftColor: '#BBDEFB',
  },
  achievementItem: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 5,
    borderLeftColor: '#A5D6A7',
  },
  suggestionText: {
    fontSize: rf(14),
    color: '#333',
    fontFamily: 'Roboto',
  },
  detailButton: {
    backgroundColor: '#1976D2',
    paddingVertical: rp(12),
    paddingHorizontal: rp(20),
    borderRadius: rp(10),
    alignItems: 'center',
    marginTop: rp(10),
  },
  detailButtonText: {
    color: 'white',
    fontSize: rf(16),
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  infoButton: {
    marginLeft: rp(5),
  },
  infoIcon: {
    fontSize: rf(16),
    color: '#666',
    fontFamily: 'Roboto',
  },
  notificationBadge: {
    position: 'absolute',
    top: rp(-4),
    right: rp(-4),
    backgroundColor: '#FF3B30',
    borderRadius: rp(9),
    minWidth: rp(18),
    height: rp(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rp(3),
  },
  notificationText: {
    color: 'white',
    fontSize: rf(9),
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  healthLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(20),
  },
  healthLoadingText: {
    marginLeft: rp(10),
    color: '#666',
    fontSize: rf(14),
    fontFamily: 'Roboto',
  },
  healthStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rp(10),
  },
  healthStatusEmoji: {
    fontSize: rf(24),
    marginRight: rp(5),
  },
  healthStatusLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Roboto',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 40,
    marginBottom: 10,
    // Đã xoá shadow và elevation để card không nổi nữa
  },
  historyTitle: {
    marginTop: 20,
    fontSize: rf(16),
    ...typography.semibold,
    color: '#333',
    marginBottom: 10,
  },
  historyEmpty: {
    color: '#999',
    fontSize: rf(14),
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
    minWidth: 0,
  },
  historyCategory: {
    fontSize: rf(14),
    color: '#333',
    ...typography.semibold,
  },
  historyDesc: {
    fontSize: rf(12),
    color: '#888',
    marginTop: 2,
  },
  historyDate: {
    fontSize: rf(11),
    color: '#aaa',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: rf(15),
    ...typography.semibold,
    minWidth: 80,
    textAlign: 'right',
    flexShrink: 1,
  },
  historyAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 100,
    flexShrink: 1,
  },

  transactionHistoryContainer: {
    height: 320,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  transactionHistoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  transactionHistoryFlatList: {
    flex: 1,
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#4285F4',
    paddingHorizontal: rp(20),
    paddingTop: rp(60),
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rp(20),
  },
  skeletonAvatar: {
    width: rp(50),
    height: rp(50),
    borderRadius: rp(25),
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: rp(15),
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonGreeting: {
    width: rp(80),
    height: rf(16),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: rp(4),
    marginBottom: rp(8),
  },
  skeletonName: {
    width: rp(120),
    height: rf(18),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: rp(4),
  },
  skeletonBalance: {
    alignItems: 'flex-start',
  },
  skeletonBalanceLabel: {
    width: rp(100),
    height: rf(16),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: rp(4),
    marginBottom: rp(8),
  },
  skeletonBalanceAmount: {
    width: rp(200),
    height: rf(32),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: rp(4),
  },
  // Transaction Skeleton Styles
  skeletonTransactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  skeletonTransactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  skeletonTransactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  skeletonTransactionCategory: {
    width: rp(100),
    height: rf(14),
    backgroundColor: '#f0f0f0',
    borderRadius: rp(2),
    marginBottom: 4,
  },
  skeletonTransactionDesc: {
    width: rp(80),
    height: rf(12),
    backgroundColor: '#f0f0f0',
    borderRadius: rp(2),
    marginBottom: 2,
  },
  skeletonTransactionDate: {
    width: rp(60),
    height: rf(11),
    backgroundColor: '#f0f0f0',
    borderRadius: rp(2),
  },
  skeletonTransactionAmount: {
    width: rp(80),
    height: rf(15),
    backgroundColor: '#f0f0f0',
    borderRadius: rp(2),
  },
});

export default FinanceScreen; 