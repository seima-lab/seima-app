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
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { getUnreadCount } from '../services/notificationService';
import { HealthStatusData, statusService } from '../services/statusService';
import { TransactionReportResponse, transactionService } from '../services/transactionService';
import { UserProfile, userService } from '../services/userService';
import { WalletResponse, walletService } from '../services/walletService';
import { getIconColor } from '../utils/iconUtils';

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
          <Text style={{ color: '#999', fontSize: 14 }}>{t('reports.noData') || 'No data'}</Text>
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
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Health status state from API
  const [apiHealthStatus, setApiHealthStatus] = useState<HealthStatusData | null>(null);
  const [healthStatusLoading, setHealthStatusLoading] = useState(false);

  // 1. Thêm state và options cho dropdown filter
  const PERIOD_OPTIONS = [
    { label: t('finance.periods.thisDay') || 'Hôm nay', value: 'today' },
    { label: t('finance.periods.thisWeek') || 'Tuần này', value: 'week' },
    { label: t('finance.periods.thisMonth') || 'Tháng này', value: 'month' },
    { label: t('finance.periods.thisYear') || 'Năm nay', value: 'year' },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[2]); // Default: Tháng này
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    setSelectedPeriod(option);
    setIsDropdownOpen(false);
    const { startDate, endDate } = getPeriodRange(option.value);
    loadChartData(startDate, endDate);
  };

  // Load user profile and wallet data
  useEffect(() => {
    loadUserProfile();
    loadWalletData();
    loadChartData();
    loadNotificationCount();
    loadHealthStatus(); // Load health status on mount
  }, [isAuthenticated]);

  // Listen to transaction changes to refresh wallet balance
  useEffect(() => {
    if (transactionRefreshTrigger > 0) {
      console.log('🔄 Transaction updated - refreshing finance data');
      loadWalletData();
      loadChartData();
      loadNotificationCount();
      loadHealthStatus(); // Refresh health status on transaction update
    }
  }, [transactionRefreshTrigger]);

  // Auto reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 FinanceScreen focused, reloading data...');
        loadUserProfile();
        loadWalletData();
        loadChartData();
        loadNotificationCount();
        loadHealthStatus(); // Refresh health status on focus
      }
    }, [isAuthenticated])
  );

  // Khi vào màn hình hoặc selectedPeriod đổi, tự động gọi loadChartData
  useEffect(() => {
    const { startDate, endDate } = getPeriodRange(selectedPeriod.value);
    loadChartData(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedPeriod.value, transactionRefreshTrigger]);

  const loadUserProfile = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🟡 Loading user profile in FinanceScreen...', forceRefresh ? '(Force Refresh)' : '');
      
      const profile = await userService.getCurrentUserProfile(forceRefresh);
      console.log('🟢 User profile loaded in FinanceScreen:', profile);
      
      setUserProfile(profile);
    } catch (error: any) {
      console.error('🔴 Failed to load user profile in FinanceScreen:', error);
      // Don't show alert on finance screen, just use fallback data
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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

  const loadWalletData = useCallback(async () => {
    if (!isAuthenticated) {
      setWalletLoading(false);
      return;
    }

    try {
      setWalletLoading(true);
      console.log('🟡 Loading wallet data in FinanceScreen...');
      
      const walletsData = await walletService.getAllWallets();
      console.log('🟢 Wallet data loaded in FinanceScreen:', walletsData);
      
      setWallets(walletsData);
      
      // Calculate total balance from current_balance field
      const totalBalance = walletsData.reduce((total: number, wallet: WalletResponse) => {
        // Only include active wallets and those not excluded from total
        if (wallet.is_active !== false && !wallet.exclude_from_total) {
          return total + (wallet.current_balance || 0);
        }
        return total;
      }, 0);
      
      setFinanceData({
        totalBalance: totalBalance,
        income: 0, // TODO: Get from transaction API
        expenses: 0, // TODO: Get from transaction API
        difference: 0 // TODO: Calculate from income - expenses
      });
    } catch (error: any) {
      console.error('🔴 Failed to load wallet data in FinanceScreen:', error);
      // Don't show alert on finance screen, just use fallback data
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated]);

  // Load chart data from report API
  const loadChartData = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setChartData(prev => ({ ...prev, isLoading: true }));
      console.log('�� Loading chart data in FinanceScreen...');
      
      // Nếu không truyền vào thì mặc định là tháng này hoặc theo selectedPeriod
      let _startDate = startDate, _endDate = endDate;
      if (!_startDate || !_endDate) {
        const range = getPeriodRange(selectedPeriod.value);
        _startDate = range.startDate;
        _endDate = range.endDate;
      }
      const startDateStr = _startDate.toISOString().split('T')[0];
      const endDateStr = _endDate.toISOString().split('T')[0];
      
      console.log('📅 Loading report for period:', { selectedPeriod: 'This Month', startDateStr, endDateStr });
      
      const reportResponse = await transactionService.viewTransactionReport(
        undefined, // categoryId - load all categories
        startDateStr,
        endDateStr
      );
      
      console.log('✅ Chart data loaded:', reportResponse);
      
      // Extract data from snake_case API response
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
      console.error('🔴 Failed to load chart data in FinanceScreen:', error);
      setChartData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, selectedPeriod.value]);

  // Load unread notification count
  const loadNotificationCount = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      console.log('🟡 Loading unread notification count...');
      const response = await getUnreadCount();
      console.log('📊 Notification count response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let count = 0;
      const responseAny = response as any;
      
      // Case 1: response.data.count (nested data structure)
      if (responseAny?.data?.count !== undefined) {
        count = responseAny.data.count;
        console.log('📦 Found nested data structure, count:', count);
      }
      // Case 2: response.count (direct count)
      else if (responseAny?.count !== undefined) {
        count = responseAny.count;
        console.log('📦 Found direct count structure, count:', count);
      }
      // Case 3: response.data is the count directly
      else if (typeof responseAny?.data === 'number') {
        count = responseAny.data;
        console.log('📦 Found direct data as number, count:', count);
      }
      // Case 4: response is the count directly
      else if (typeof responseAny === 'number') {
        count = responseAny;
        console.log('📦 Found response as number, count:', count);
      }
      // Case 5: response.data.data.count (double nested)
      else if (responseAny?.data?.data?.count !== undefined) {
        count = responseAny.data.data.count;
        console.log('📦 Found double nested data structure, count:', count);
      }
      
      console.log('🟢 Unread notification count loaded:', count);
      setNotificationCount(count);
    } catch (error: any) {
      console.error('🔴 Failed to load unread notification count:', error);
      setNotificationCount(0);
    }
  }, [isAuthenticated]);

  // Load health status from API
  const loadHealthStatus = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setHealthStatusLoading(true);
      console.log('🟡 Loading health status from API...');
      
      const healthData = await statusService.getHealthStatus();
      console.log('🟢 Health status loaded:', healthData);
      
      setApiHealthStatus(healthData);
    } catch (error: any) {
      console.error('🔴 Failed to load health status:', error);
      // Don't set error state, just keep using mock data
      setApiHealthStatus(null);
    } finally {
      setHealthStatusLoading(false);
    }
  }, [isAuthenticated]);

  // Memoized expense data
  const expenseData: ExpenseData[] = useMemo(() => [
    { category: 'Leisure', percentage: 54.55, color: '#FFA726' },
    { category: 'Self-development', percentage: 25.25, color: '#EF5350' },
    { category: 'Clothing', percentage: 18.74, color: '#26A69A' },
    { category: 'Food', percentage: 0.76, color: '#AB47BC' },
    { category: 'Undefined', percentage: 0.7, color: '#42A5F5' },
  ], []);

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
    return isBalanceVisible ? `${financeData.totalBalance.toLocaleString('vi-VN')} ${t('currency')}` : '********';
  }, [isBalanceVisible, financeData.totalBalance, t]);

  // Memoized dynamic balance font size - back to using real wallet data only
  const dynamicBalanceFontSize = useMemo(() => {
    return getDynamicBalanceFontSize(financeData.totalBalance);
  }, [financeData.totalBalance]);

  // Memoized callback functions for better performance
  const handleRefreshProfile = useCallback(() => {
    loadUserProfile(true);
  }, [loadUserProfile]);

  const handleToggleBalance = useCallback(() => {
    setIsBalanceVisible(!isBalanceVisible);
  }, [isBalanceVisible]);

  const handleNavigateToNotifications = useCallback(() => {
    navigation.navigate('Notifications');
    // Refresh notification count when returning from notifications screen
    setTimeout(() => {
      loadNotificationCount();
    }, 1000);
  }, [navigation, loadNotificationCount]);

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

  // Show loading state
  if (loading || walletLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4285F4" translucent={true} />
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
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
                {userProfile?.user_full_name || 'Unknown User'}
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
            {/* Removed Mock Data Toggle Button */}
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
                  📊 {t('finance.health.title')}: {apiHealthStatus?.score || 75}/100 ⓘ
                </Text>
                
                {/* Health Status Bar - using real API data */}
                <View style={styles.healthBarContainer}>
                  <View style={styles.healthBar}>
                    <View style={[
                      styles.healthBarFill,
                      {
                        width: `${Math.max(0, Math.min(100, apiHealthStatus?.score || 75))}%`,
                        backgroundColor: statusService.getHealthDescription(apiHealthStatus?.level || 'good').color
                      }
                    ]} />
                  </View>
                  <Text style={[styles.healthStatusText, { 
                    color: statusService.getHealthDescription(apiHealthStatus?.level || 'good').color 
                  }]}>
                    {statusService.getHealthDescription(apiHealthStatus?.level || 'good').message}
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
                    <Text style={styles.newDropdownButtonText}>{selectedPeriod.label}</Text>
                    <Icon name={isDropdownOpen ? 'expand-less' : 'expand-more'} size={20} color="#333" />
                  </TouchableOpacity>
                  {isDropdownOpen && (
                    <View style={styles.newDropdownMenu}>
                      {PERIOD_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.newDropdownOption,
                            selectedPeriod.value === option.value && styles.newDropdownOptionSelected,
                          ]}
                          onPress={() => handleSelectPeriod(option)}
                        >
                          <Text style={[
                            styles.newDropdownOptionText,
                            selectedPeriod.value === option.value && styles.newDropdownOptionTextSelected,
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
                    <Text style={styles.chartLoadingText}>Đang tải...</Text>
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
                        <Text style={styles.barLabel}>Thu</Text>
                      </View>
                      <View style={[
                        styles.expenseBar,
                        { 
                          height: chartData.expenses > 0 ? Math.max(rp(20), (chartData.expenses / Math.max(chartData.income, chartData.expenses)) * rp(100)) : rp(20)
                        }
                      ]}>
                        <Text style={styles.barLabel}>Chi</Text>
                      </View>
                    </View>
                    <View style={styles.amountsList}>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Income</Text>
                        <Text style={[styles.percentAmount, { color: '#4CAF50' }]}>
                          {getPercent(chartData.income, chartData.income + chartData.expenses)}
                        </Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Expense</Text>
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
    fontWeight: '400',
    fontFamily: 'Roboto',
  },
  userName: {
    color: 'white',
    fontSize: rf(18),
    fontWeight: '600',
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
  },
  balanceSection: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rf(16),
    marginBottom: rp(8),
    fontFamily: 'Roboto',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: rp(15),
    fontFamily: 'Roboto',
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
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Roboto',
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
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  differenceLabel: {
    fontSize: rf(12),
    color: '#666',
    marginLeft: rp(10),
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
  },
  
  percentAmount: {
    fontSize: rf(14),
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 50, // Đặt minWidth cố định cho phần trăm
    fontFamily: 'Roboto',
  },
incomeAmount: {
  fontSize: rf(14),
  color: '#4CAF50',
  fontWeight: '600',
  textAlign: 'left',
  minWidth: 0,
  maxWidth: '50%',
  flexShrink: 1,
  fontFamily: 'Roboto',
 
},
expenseAmount: {
  fontSize: rf(14),
  color: '#E91E63',
  fontWeight: '600',
  textAlign: 'left',
  minWidth: 0,
  maxWidth: '50%',
  flexShrink: 1,
  fontFamily: 'Roboto',
  
},
differenceAmount: {
  fontSize: rf(14),
  color: '#FF9800',
  fontWeight: '600',
  textAlign: 'left',
  minWidth: 0,
  maxWidth: '50%',
  flexShrink: 1,
  fontFamily: 'Roboto',
 
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
  fontWeight: '400',
  fontFamily: 'Roboto',
},
legendValue: {
  fontSize: rf(15),
  fontWeight: '600',
  fontFamily: 'Roboto',
},
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: rp(20),
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
    fontFamily: 'Roboto',
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
    fontWeight: '600',
    marginTop: rp(20),
    fontFamily: 'Roboto',
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
    fontWeight: '400',
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
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
});

export default FinanceScreen; 