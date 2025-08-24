import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { CategoryResponse } from '../services/categoryService';
import { getUnreadCount } from '../services/notificationService';
import { HealthStatusData, statusService } from '../services/statusService';
import { TransactionReportResponse, transactionService } from '../services/transactionService';
import { UserProfile, userService } from '../services/userService';
// import of walletService removed; balance now derives from today's transactions
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomSuccessModal from '../components/CustomSuccessModal';
import SwipeableTransactionItem from '../components/SwipeableTransactionItem';
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

// Hàm tính toán font size động cho tên người dùng
const getDynamicUserNameFontSize = (userName: string): number => {
  const nameLength = userName.length;
  
  // Base font size
  const baseFontSize = rf(18);
  
  // Giảm font size dựa trên độ dài tên
  if (nameLength > 25) {
    return baseFontSize * 0.6; // Giảm 40% cho tên rất dài
  } else if (nameLength > 20) {
    return baseFontSize * 0.7; // Giảm 30%
  } else if (nameLength > 15) {
    return baseFontSize * 0.8; // Giảm 20%
  } else if (nameLength > 12) {
    return baseFontSize * 0.9; // Giảm 10%
  }
  
  return baseFontSize; // Giữ nguyên kích thước gốc
};

// Helper function tính phần trăm an toàn
const getPercent = (value: number, total: number) => {
  if (!total || isNaN(value)) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

// SimplePieChart removed - not used anymore

const FinanceScreen = React.memo(() => {
  
  
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const { isAuthenticated, transactionRefreshTrigger } = useAuth();
  
  // State for user data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for wallet data removed
  const [financeData, setFinanceData] = useState<FinanceData>({
    totalBalance: 0,
    income: 0,
    expenses: 0,
    difference: 0
  });
  const [walletLoading, setWalletLoading] = useState(false);
  
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
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteSuccessKey, setDeleteSuccessKey] = useState(0);
  const [showHealthInfoModal, setShowHealthInfoModal] = useState(false);

  // Health status state from API
  const [apiHealthStatus, setApiHealthStatus] = useState<HealthStatusData | null>(null);
  const [healthStatusLoading, setHealthStatusLoading] = useState(false);

  // Transaction history state
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [transactionHistoryLoading, setTransactionHistoryLoading] = useState(false);
  const [transactionCache, setTransactionCache] = useState<any[]>([]);
  const [lastTransactionFetch, setLastTransactionFetch] = useState(0);
  const TRANSACTION_CACHE_DURATION = 60000; // 1 phút
  const isAllDataLoadingRef = useRef(false);
  const isTxnHistoryLoadingRef = useRef(false);

  // 1. Memoized period options
  const PERIOD_OPTIONS = useMemo(() => [
    { label: t('finance.periods.thisDay'), value: 'today' },
    { label: t('finance.periods.thisWeek'), value: 'week' },
    { label: t('finance.periods.thisMonth'), value: 'month' },
    { label: t('finance.periods.thisYear'), value: 'year' },
  ], [t]);
  
  const [selectedPeriodValue, setSelectedPeriodValue] = useState('month'); // Default: tháng này
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Memoized function lấy object option theo value
  const getPeriodOption = useCallback((value: string) => 
    PERIOD_OPTIONS.find(opt => opt.value === value) || PERIOD_OPTIONS[2], 
    [PERIOD_OPTIONS]
  );

  // Memoized function tính toán khoảng thời gian theo filter
  const getPeriodRange = useCallback((periodValue: string) => {
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
  }, []);

  const handleSelectPeriod = (option: {label: string, value: string}) => {
    setSelectedPeriodValue(option.value);
    setIsDropdownOpen(false);
    
    // Kiểm tra cache trước khi gọi API
    const cacheKey = `chart_${option.value}`;
    if (dataCache[cacheKey] && Date.now() - lastFetchTime < CACHE_DURATION) {
      console.log('⏰ Using cached chart data for period:', option.value);
      const cachedData = dataCache[cacheKey];
      setChartData({
        income: cachedData.income || 0,
        expenses: cachedData.expenses || 0,
        difference: cachedData.difference || 0,
        isLoading: false
      });
      setReportData(cachedData.reportData);
    } else {
      console.log('🔄 Loading fresh chart data for period:', option.value);
      const { startDate, endDate } = getPeriodRange(option.value);
      loadChartData(startDate, endDate);
    }
  };

  // Cache state để tránh gọi API không cần thiết
  const [dataCache, setDataCache] = useState<{[key: string]: any}>({});
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 30000; // 30 giây

  // API timeout wrapper with longer timeout
  const withTimeout = (promise: Promise<any>, timeoutMs: number = 60000): Promise<any> => {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`API timeout after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  };

  // Load tất cả data song song với cache và timeout - Progressive rendering
  const loadAllData = useCallback(async (forceRefresh: boolean = false) => {
    if (isAllDataLoadingRef.current) {
      console.log('🔄 loadAllData already in progress, skipping...');
      return;
    }

    isAllDataLoadingRef.current = true;

    if (!isAuthenticated) {
      setLoading(false);
      isAllDataLoadingRef.current = false;
      return;
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
      console.log('⏰ Using cached data, skipping API calls...');
      isAllDataLoadingRef.current = false;
      return;
    }

    console.log('🚀 Starting progressive data loading...');
    // Only keep skeleton until user profile loads
    setLoading(true);
    // Per-section loading flags
    setHealthStatusLoading(true);
    setTransactionHistoryLoading(true);
    setChartData(prev => ({ ...prev, isLoading: true }));
    // Record fetch time at start
    setLastFetchTime(now);

    const profilePromise = withTimeout(userService.getCurrentUserProfile(forceRefresh), 30000)
      .then((profile) => {
        if (profile) {
          setUserProfile(profile);
          console.log('✅ User profile loaded successfully');
        }
      })
      .catch(() => {
        console.log('⚠️ User profile API failed, keeping existing data');
      })
      .finally(() => {
        // Hide skeleton once profile finished (success or fail)
        setLoading(false);
      });

    const chartPromise = (async () => {
      try {
        const { startDate, endDate } = getPeriodRange(selectedPeriodValue);
        const startDateStr = toLocalDateString(startDate);
        const endDateStr = toLocalDateString(endDate);
        const report = await withTimeout(
          transactionService.viewTransactionChart(undefined, startDateStr, endDateStr),
          45000
        );
        if (report) {
          const summary = (report as any)?.summary || report?.summary || {};
          const income = summary?.total_income || summary?.totalIncome || 0;
          const expenses = summary?.total_expense || summary?.totalExpense || 0;
          const difference = income - expenses;
          setChartData({ income, expenses, difference, isLoading: false });
          setReportData(report);
          console.log('✅ Chart data loaded successfully');
        } else {
          throw new Error('Empty chart response');
        }
      } catch (error) {
        console.log('⚠️ Chart data API failed, using fallback values');
        setChartData(prev => ({
          income: prev.income || 0,
          expenses: prev.expenses || 0,
          difference: prev.difference || 0,
          isLoading: false
        }));
      }
    })();

    const notificationPromise = withTimeout(getUnreadCount(), 20000)
      .then((response: any) => {
        let count = 0;
        try {
          if (typeof response === 'number') {
            count = response;
          } else if (response?.data?.count !== undefined) {
            count = response.data.count;
          } else if (response?.count !== undefined) {
            count = response.count;
          } else if (typeof response?.data === 'number') {
            count = response.data;
          } else if (response?.data?.data?.count !== undefined) {
            count = response.data.data.count;
          }
        } catch (e) {
          count = 0;
        }
        setNotificationCount(Math.max(0, count || 0));
      })
      .catch(() => {
        setNotificationCount((c) => Math.max(0, c || 0));
      });

    const healthPromise = withTimeout(statusService.getHealthStatus(), 20000)
      .then((health) => {
        if (health) {
          setApiHealthStatus(health);
          const healthBalance = (health as any).total_balance ?? (health as any).current_balance ?? (health as any).balance;
          if (typeof healthBalance === 'number' && !isNaN(healthBalance)) {
            setFinanceData(prev => ({ ...prev, totalBalance: healthBalance }));
          }
          console.log('✅ Health status loaded successfully');
        } else {
          setApiHealthStatus({ score: 75, level: 'unknown' } as any);
        }
      })
      .catch(() => {
        setApiHealthStatus({ score: 75, level: 'unknown' } as any);
      })
      .finally(() => setHealthStatusLoading(false));

    const transactionsPromise = withTimeout(transactionService.getTransactionsToday(), 30000)
      .then((txns) => {
        const filtered = Array.isArray(txns) ? txns : [];
        filtered.sort((a: any, b: any) =>
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        );
        setTransactionHistory(filtered);
        setTransactionCache(filtered);
        setLastTransactionFetch(now);
        console.log('✅ Today\'s transactions loaded successfully');
      })
      .catch(() => {
        console.log('⚠️ Transactions API failed, keeping existing data');
      })
      .finally(() => setTransactionHistoryLoading(false));

    // When all complete, release the loading guard (does not block UI updates)
    Promise.allSettled([profilePromise, chartPromise, notificationPromise, healthPromise, transactionsPromise])
      .finally(() => {
        isAllDataLoadingRef.current = false;
        console.log('🎉 Progressive data loading completed');
      });
  }, [isAuthenticated, selectedPeriodValue]); // ✅ Xóa lastFetchTime khỏi dependencies

  // Load data handled via focus effect and refresh triggers only

  // Refresh khi có transaction mới - only depend on trigger value
  // useEffect này đã được gộp vào useEffect ở dưới để tránh trùng lặp

  // Check if notifications have changed and reload if needed
  const checkNotificationsChanges = useCallback(async () => {
    try {
      const changeInfoStr = await AsyncStorage.getItem('NotificationsChangeInfo');
      if (changeInfoStr) {
        const changeInfo = JSON.parse(changeInfoStr);
        const now = Date.now();
        const timeDiff = now - changeInfo.timestamp;
        
        // Only reload if change is recent (within last 5 minutes)
        if (changeInfo.notificationsChanged && timeDiff < 5 * 60 * 1000) {
          console.log('🔄 Notifications changed detected, reloading notification count...');
          
          // Reload notification count
          const notificationResponse = await getUnreadCount();
          let count = 0;
          try {
            const responseAny = notificationResponse as any;
            if (typeof notificationResponse === 'number') {
              count = notificationResponse;
            } else if (responseAny?.data?.count !== undefined) {
              count = responseAny.data.count;
            } else if (responseAny?.count !== undefined) {
              count = responseAny.count;
            } else if (typeof responseAny?.data === 'number') {
              count = responseAny.data;
            } else if (responseAny?.data?.data?.count !== undefined) {
              count = responseAny.data.data.count;
            }
          } catch (error) {
            count = 0;
          }
          setNotificationCount(Math.max(0, count || 0));
          
          // Clear the change info after reloading
          await AsyncStorage.removeItem('NotificationsChangeInfo');
          console.log('✅ Notification count reloaded and change info cleared');
        }
      }
    } catch (error) {
      console.error('❌ Error checking notifications changes:', error);
    }
  }, []);

  // Memoized focus effect callback - OPTIMIZED VERSION
  const focusEffectCallback = useCallback(() => {
    if (isAuthenticated) {
      console.log('🔄 Screen focused, loading data...');
      
      // Load tất cả data trong một lần gọi duy nhất (đã bao gồm transaction history)
      loadAllData(false).catch((error) => {
        console.error('❌ Error loading data on focus:', error);
      });
      
      // Check notifications changes (chỉ khi cần thiết)
      checkNotificationsChanges();
    }
  }, [isAuthenticated, loadAllData, checkNotificationsChanges]);

  // Refresh khi focus với debounce để tránh gọi API quá nhiều
  useFocusEffect(
    useCallback(() => {
      // Debounce focus effect để tránh gọi API liên tục
      const timeoutId = setTimeout(() => {
        focusEffectCallback();
      }, 300); // Delay 300ms

      return () => clearTimeout(timeoutId);
    }, [focusEffectCallback])
  );

  // 🚀 OPTIMIZATION SUMMARY:
  // - Gộp tất cả API calls vào loadAllData (5 APIs song song thay vì gọi riêng lẻ)
  // - Implement proper caching với CACHE_DURATION = 30s
  // - Debounce focus effect (300ms delay) để tránh gọi API liên tục
  // - Smart cache checking trước khi gọi API mới
  // - Reduced timeout values: Profile(30s), Chart(45s), Notifications(20s), Health(20s), Transactions(30s)
  // - Transaction history loading đã được gộp vào loadAllData
  // - Chart data chỉ gọi riêng khi user thay đổi period filter
  // ✅ FIXED: Xóa useEffect trùng lặp để tránh API status load liên tục sau khi add transaction
  // ✅ FIXED: Tránh vòng lặp vô hạn trong useEffect dependencies để API health không load lại liên tục

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

  // Chart data loading đã được gộp vào loadAllData để tối ưu hóa
  // Chỉ gọi riêng khi user thay đổi period filter
  const loadChartData = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setChartData(prev => ({ ...prev, isLoading: true }));
      
      let _startDate = startDate, _endDate = endDate;
      if (!_startDate || !_endDate) {
        const range = getPeriodRange(selectedPeriodValue);
        _startDate = range.startDate;
        _endDate = range.endDate;
      }
      
      const startDateStr = toLocalDateString(_startDate);
      const endDateStr = toLocalDateString(_endDate);
      
      console.log('📊 Loading chart data for period:', startDateStr, 'to', endDateStr);
      
      const reportResponse = await withTimeout(
        transactionService.viewTransactionChart(undefined, startDateStr, endDateStr),
        30000 // Giảm timeout vì chỉ gọi 1 API
      );
      
      if (reportResponse) {
        const summary = (reportResponse as any)?.summary || reportResponse?.summary || {};
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
        console.log('✅ Chart data updated for new period');
      } else {
        throw new Error('Empty chart response');
      }
      
    } catch (error: any) {
      console.error('❌ Error loading chart data:', error);
      
      // Fallback to previous values
      setChartData(prev => ({
        income: prev.income || 0,
        expenses: prev.expenses || 0,
        difference: prev.difference || 0,
        isLoading: false
      }));
    }
  }, [isAuthenticated, selectedPeriodValue]);

  // Removed individual loadNotificationCount - now handled in loadAllData

  // Removed individual loadHealthStatus - now handled in loadAllData

  // Memoized expense data - removed since not used

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

  // Memoized Health Status Section Component
  const HealthStatusSection = React.memo(() => (
    <View style={styles.section}>
      {healthStatusLoading ? (
        <View style={styles.healthLoadingContainer}>
          <ActivityIndicator size="small" color="#1e90ff" />
          <Text style={styles.healthLoadingText}>{t('common.loading')}...</Text>
        </View>
      ) : (
        <>
          <View style={styles.healthTitleRow}>
            <Text style={styles.sectionTitle}>
              ❤️ {t('finance.health.title')}: {apiHealthStatus?.score || 75}/100
            </Text>
            <TouchableOpacity 
              style={styles.healthInfoButton}
              onPress={() => setShowHealthInfoModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="info" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
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
  ));

  HealthStatusSection.displayName = 'HealthStatusSection';

  // Memoized Health Info Modal Component
  const HealthInfoModal = React.memo(() => (
    <Modal
      visible={showHealthInfoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowHealthInfoModal(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.healthInfoModalOverlay}>
        <View style={styles.healthInfoModalContainer}>
          <View style={styles.healthInfoModalHeader}>
            <Text style={styles.healthInfoModalTitle}>
              {t('finance.health.infoModal.title')}
            </Text>
            <TouchableOpacity 
              style={styles.healthInfoModalCloseButton}
              onPress={() => setShowHealthInfoModal(false)}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.healthInfoModalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.healthInfoModalContent}
          >
            <Text style={styles.healthInfoDescription}>
              {t('finance.health.infoModal.description')}
            </Text>
            
            {/* Savings Rate Card */}
            <View style={styles.healthMetricCard}>
              <View style={styles.healthMetricHeader}>
                <View style={styles.healthMetricIconContainer}>
                  <Icon name="trending-up" size={20} color="#4285F4" />
                </View>
                <Text style={styles.healthMetricTitle}>
                  {t('finance.health.infoModal.savingsRate.title')}
                </Text>
                <View style={styles.healthMetricScore}>
                  <Text style={[styles.healthMetricScoreText, { color: '#4285F4' }]}>
                    {Math.round((chartData.income > 0 ? ((chartData.income - Math.abs(chartData.expenses)) / chartData.income) * 100 : 0))}₫
                  </Text>
                </View>
              </View>
              <View style={styles.healthMetricFormula}>
                <View style={styles.fractionRow}>
                  <View style={styles.fractionContainer}>
                    <Text style={styles.fractionNumerator}>
                      {t('finance.health.infoModal.savingsRate.numerator')}
                    </Text>
                    <View style={styles.fractionLine} />
                    <Text style={styles.fractionDenominator}>
                      {t('finance.health.infoModal.savingsRate.denominator')}
                    </Text>
                  </View>
                  <Text style={styles.formulaResult}>× 100%</Text>
                </View>
              </View>
            </View>

            {/* Budget Compliance Card */}
            <View style={styles.healthMetricCard}>
              <View style={styles.healthMetricHeader}>
                <View style={styles.healthMetricIconContainer}>
                  <Icon name="gps-fixed" size={20} color="#FF9800" />
                </View>
                <Text style={styles.healthMetricTitle}>
                  {t('finance.health.infoModal.budgetCompliance.title')}
                </Text>
                <View style={styles.healthMetricScore}>
                  <Text style={[styles.healthMetricScoreText, { color: '#FF9800' }]}>
                    30₫
                  </Text>
                </View>
              </View>
              <View style={styles.healthMetricFormula}>
                <View style={styles.fractionRow}>
                  <View style={styles.fractionContainer}>
                    <Text style={styles.fractionNumerator}>
                      {t('finance.health.infoModal.budgetCompliance.numerator')}
                    </Text>
                    <View style={styles.fractionLine} />
                    <Text style={styles.fractionDenominator}>
                      {t('finance.health.infoModal.budgetCompliance.denominator')}
                    </Text>
                  </View>
                  <Text style={styles.formulaResult}>× 100%</Text>
                </View>
              </View>
            </View>

            {/* Asset Growth Card */}
            <View style={styles.healthMetricCard}>
              <View style={styles.healthMetricHeader}>
                <View style={styles.healthMetricIconContainer}>
                  <Icon name="attach-money" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.healthMetricTitle}>
                  {t('finance.health.infoModal.assetGrowth.title')}
                </Text>
                <View style={styles.healthMetricScore}>
                  <Text style={[styles.healthMetricScoreText, { color: '#4CAF50' }]}>
                    30₫
                  </Text>
                </View>
              </View>
              <View style={styles.healthMetricFormula}>
                <View style={styles.fractionRow}>
                  <View style={styles.fractionContainer}>
                    <Text style={styles.fractionNumerator}>
                      {t('finance.health.infoModal.assetGrowth.numerator')}
                    </Text>
                    <View style={styles.fractionLine} />
                    <Text style={styles.fractionDenominator}>
                      {t('finance.health.infoModal.assetGrowth.denominator')}
                    </Text>
                  </View>
                  <Text style={styles.formulaResult}>× 100%</Text>
                </View>
              </View>
            </View>

            {/* Total Score Section */}
            <View style={styles.totalScoreSection}>
              <Text style={styles.totalScoreTitle}>
                {t('finance.health.infoModal.totalScore.title')}
              </Text>
              <View style={styles.totalScoreContainer}>
                <Text style={[
                  styles.totalScoreValue, 
                  { color: getHealthStatusColor(apiHealthStatus?.score || 75) }
                ]}>
                  {apiHealthStatus?.score || 75}
                </Text>
                <Text style={styles.totalScoreUnit}>/100</Text>
              </View>
              <Text style={styles.totalScoreDescription}>
                {t('finance.health.infoModal.totalScore.description')}
              </Text>
            </View>

            {/* Color Legend Section */}
            <View style={styles.colorLegendSection}>
              <Text style={styles.colorLegendTitle}>
                {t('finance.health.infoModal.colorLegend.title')}
              </Text>
              <View style={styles.colorLegendContainer}>
                <View style={styles.colorLegendRow}>
                  <View style={[styles.colorLegendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.colorLegendText}>
                    {t('finance.health.infoModal.colorLegend.excellent')} (76-100)
                  </Text>
                </View>
                <View style={styles.colorLegendRow}>
                  <View style={[styles.colorLegendDot, { backgroundColor: '#FF9800' }]} />
                  <Text style={styles.colorLegendText}>
                    {t('finance.health.infoModal.colorLegend.good')} (60-75)
                  </Text>
                </View>
                <View style={styles.colorLegendRow}>
                  <View style={[styles.colorLegendDot, { backgroundColor: '#FF5722' }]} />
                  <Text style={styles.colorLegendText}>
                    {t('finance.health.infoModal.colorLegend.fair')} (40-59)
                  </Text>
                </View>
                <View style={styles.colorLegendRow}>
                  <View style={[styles.colorLegendDot, { backgroundColor: '#F44336' }]} />
                  <Text style={styles.colorLegendText}>
                    {t('finance.health.infoModal.colorLegend.poor')} (0-39)
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  ));

  HealthInfoModal.displayName = 'HealthInfoModal';

  // Memoized Income and Expense Section Component
  const IncomeExpenseSection = React.memo(() => (
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
      {/* Bar Chart */}
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
    </View>
  ));

  IncomeExpenseSection.displayName = 'IncomeExpenseSection';

  // Memoized Action Buttons Section Component
  const ActionButtonsSection = React.memo(() => (
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
  ));

  ActionButtonsSection.displayName = 'ActionButtonsSection';

  // Memoized Transaction History Section Component
  const TransactionHistorySection = React.memo(() => (
    <>
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
              
              // Convert to Transaction format for SwipeableTransactionItem
              const transaction = {
                id: (item.transaction_id || item.id || index).toString(),
                date: item.transaction_date,
                transaction_datetime: item.transaction_date,
                category: categoryName,
                amount: item.amount || 0,
                type: type as 'income' | 'expense',
                icon: iconName || (type === 'income' ? 'trending-up' : 'trending-down'),
                iconColor: iconColor,
                description: item.description || item.category_name || 'No description',
                wallet_id: item.wallet_id ?? item.walletId,
                receipt_image_url: item.receipt_image_url || item.receiptImageUrl || item.receipt_image || item.receiptImage || null,
                receiptImageUrl: item.receiptImageUrl || item.receipt_image_url || item.receipt_image || item.receiptImage || null,
              };
              
              return (
                <SwipeableTransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditTransaction}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  ));

  TransactionHistorySection.displayName = 'TransactionHistorySection';

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
    return require('../assets/images/maleavatar.png');
  }, [userProfile?.user_avatar_url, userProfile?.user_gender]);

  // Memoized formatted balance - derived from today's transactions
  const formattedBalance = useMemo(() => {
    return isBalanceVisible ? `${financeData.totalBalance.toLocaleString('vi-VN')} ${t('currency')}` : t('finance.hiddenBalance');
  }, [isBalanceVisible, financeData.totalBalance, t]);

  // Memoized dynamic balance font size
  const dynamicBalanceFontSize = useMemo(() => {
    return getDynamicBalanceFontSize(financeData.totalBalance);
  }, [financeData.totalBalance]);

  // Memoized dynamic user name font size
  const dynamicUserNameFontSize = useMemo(() => {
    const userName = userProfile?.user_full_name || t('common.unknownUser');
    return getDynamicUserNameFontSize(userName);
  }, [userProfile?.user_full_name, t]);

  // Memoized callback functions for better performance
  const handleRefreshProfile = useCallback(() => {
    loadAllData(true); // Force refresh all data
  }, [loadAllData]);

  // Removed wallet refresh: balance is from today's transactions

  const handleToggleBalance = useCallback(() => {
    const next = !isBalanceVisible;
    setIsBalanceVisible(next);
  }, [isBalanceVisible]);

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

  // Memoized categories loading với timeout
  const memoizedLoadCategories = useCallback(async () => {
      if (!userProfile?.user_id) {
        setCategoriesMap({});
        setCategoriesLoading(false);
        return;
      }

      const now = Date.now();
      if (now - lastCategoriesFetch < CATEGORIES_CACHE_DURATION && Object.keys(categoriesCache).length > 0) {
        setCategoriesMap(categoriesCache);
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      try {
        // Skipping category API calls per request; use cache or empty map
        if (Object.keys(categoriesCache).length > 0) {
          setCategoriesMap(categoriesCache);
          // Only update last fetch time when we actually load from cache
          setLastCategoriesFetch(now);
        } else {
          // No cache and we skip API calls → set empty once and avoid updating last fetch time
          // to prevent useEffect dependency loops
          setCategoriesMap({});
        }
      } catch (err: any) {
        if (Object.keys(categoriesCache).length > 0) {
          setCategoriesMap(categoriesCache);
        } else {
          setCategoriesMap({});
        }
      } finally {
        setCategoriesLoading(false);
      }
  }, [userProfile?.user_id, lastCategoriesFetch, categoriesCache]);

  useEffect(() => {
    memoizedLoadCategories();
  }, [memoizedLoadCategories]);

  // Helper: Lấy ngày hôm nay (YYYY-MM-DD) theo giờ local
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Transaction history loading đã được gộp vào loadAllData để tối ưu hóa
  // Không cần gọi API riêng nữa

  // Transaction history fetched on focus and refresh triggers

  // 🚨 SINGLE SOURCE OF TRUTH: Refresh tất cả data khi có transaction mới
  // useEffect này thay thế useEffect trùng lặp ở trên để tránh gọi API 2 lần
  // ✅ FIXED: Tránh vòng lặp vô hạn bằng cách không đưa loadAllData vào dependencies
  useEffect(() => {
    if (transactionRefreshTrigger > 0) {
      console.log('🔄 Transaction refresh triggered, reloading all data...');
      // Gọi loadAllData trực tiếp thay vì qua dependency để tránh vòng lặp vô hạn
      const refreshData = async () => {
        try {
          await loadAllData(true); // Force refresh tất cả data
        } catch (error) {
          console.error('❌ Error refreshing data after transaction:', error);
        }
      };
      refreshData();
    }
  }, [transactionRefreshTrigger]); // ✅ Chỉ phụ thuộc vào transactionRefreshTrigger

  // Memoized helper functions
  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }, []);

  const formatAmountDisplay = useCallback((amount: number): string => {
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
  }, []);

  // Memoized getIconAndColor để lấy icon từ category_id
  const getIconAndColor = useCallback((item: any) => {
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
  }, [categoriesMap]);

  // Handle transaction press to navigate to edit mode
  const handleTransactionPress = useCallback((transaction: any) => {
    
    
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
        iconColor: getIconColor(transaction.category_icon_url || '', (transaction.transaction_type || 'expense').toLowerCase()),
        // Ensure AddExpenseScreen receives wallet id for correct wallet selection in edit mode
        wallet_id: transaction.wallet_id ?? transaction.walletId,
        walletId: transaction.wallet_id ?? transaction.walletId,
        // Pass receipt image url for edit screen prefill (support multiple naming conventions)
        receipt_image_url: transaction.receipt_image_url || transaction.receiptImageUrl || transaction.receipt_image || transaction.receiptImage || null,
        receiptImageUrl: transaction.receiptImageUrl || transaction.receipt_image_url || transaction.receipt_image || transaction.receiptImage || null,
      }
    });
  }, [navigation, categoriesMap]);

  // Handle delete transaction
  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    try {
      console.log('🔄 Deleting transaction:', transactionId);
      
      // Call the actual delete API
      await transactionService.deleteTransaction(parseInt(transactionId));
      
      console.log('✅ Transaction deleted successfully');
      
      // Show success modal first, then refresh data after modal is dismissed
      setDeleteSuccessKey(prev => prev + 1);
      setShowDeleteSuccess(true);
      
    } catch (error: any) {
      console.error('❌ Failed to delete transaction:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to delete transaction',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Handle edit transaction
  const handleEditTransaction = useCallback((transaction: any) => {
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
        iconColor: getIconColor(transaction.category_icon_url || '', (transaction.transaction_type || 'expense').toLowerCase()),
        // Pass wallet_id so AddExpenseScreen can preselect wallet
        wallet_id: transaction.wallet_id ?? transaction.walletId,
        // Pass receipt image urls so AddExpenseScreen can prefill image
        receipt_image_url: transaction.receipt_image_url ?? transaction.receiptImageUrl ?? transaction.receipt_image ?? transaction.receiptImage ?? null,
        receiptImageUrl: transaction.receiptImageUrl ?? transaction.receipt_image_url ?? transaction.receipt_image ?? transaction.receiptImage ?? null,
      }
    });
  }, [navigation, categoriesMap]);

  // Better loading state management
  const hasEssentialData = userProfile?.user_full_name && userProfile?.user_email;
  const showFullLoading = loading && (!userProfile || !hasEssentialData);
  const showPartialLoading = (walletLoading || categoriesLoading) && userProfile;
  const isUserDataLoading = loading && !hasEssentialData;

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

  // Removed full-screen blocking loader to allow progressive rendering

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
              {isUserDataLoading ? (
                <View style={styles.userNameSkeleton} />
              ) : (
                <Text style={[styles.userName, { fontSize: dynamicUserNameFontSize }]}>
                {userProfile?.user_full_name || t('common.unknownUser')}
              </Text>
              )}
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
            {
            <Text style={[styles.balanceAmount, { 
              minWidth: 200,
              fontSize: dynamicBalanceFontSize
            }]}>
              {formattedBalance}
            </Text>
            }
            <TouchableOpacity onPress={handleToggleBalance} disabled={walletLoading}>
              <Icon 
                name={isBalanceVisible ? "visibility" : "visibility-off"} 
                size={24} 
                color={walletLoading ? "rgba(255,255,255,0.5)" : "white"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Removed the healthStatusSection from here */}

             <ScrollView {...scrollViewProps}>
         <View style={styles.bodyContainer}>
          <HealthStatusSection />
          <IncomeExpenseSection />
          <ActionButtonsSection />
          <TransactionHistorySection />
        </View>
      </ScrollView>

      {/* Delete Success Modal */}
      <CustomSuccessModal
        visible={showDeleteSuccess}
        title={t('common.success')}
        message={t('calendar.transactionDeleted')}
        buttonText={t('common.ok')}
        onConfirm={() => {
          setShowDeleteSuccess(false);
          // Refresh data after modal is dismissed
          loadAllData(true);
        }}
        iconName="check-circle"
        transitionKey={deleteSuccessKey.toString()}
      />
      <HealthInfoModal />
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
    maxWidth: rp(180), // Giới hạn chiều rộng để tránh tràn
    flexShrink: 1, // Cho phép shrink khi cần
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  transactionHistoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    maxWidth: rp(200), // Thêm maxWidth để handle tên dài
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
  // Header skeleton styles
  userNameSkeleton: {
    width: rp(120),
    height: rf(18),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: rp(4),
    marginTop: rp(2),
  },
  balanceSkeleton: {
    width: rp(180),
    height: rf(32),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: rp(6),
    marginRight: rp(15),
  },
  healthTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rp(10),
  },
  healthInfoButton: {
    marginLeft: rp(10),
  },
  healthInfoContent: {
    padding: rp(16),
  },
  healthInfoDescription: {
    fontSize: rf(14),
    color: '#666',
    marginBottom: rp(15),
    lineHeight: rf(20),
    textAlign: 'center',
   ...typography.regular,
  },
  healthInfoSection: {
    marginBottom: rp(15),
    paddingVertical: rp(12),
    paddingHorizontal: rp(16),
    backgroundColor: '#f8f9fa',
    borderRadius: rp(12),
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  healthInfoSectionTitle: {
    fontSize: rf(16),
    color: '#333',
    marginBottom: rp(8),
    ...typography.semibold,
  },
  healthInfoSectionText: {
    ...typography.regular,
    fontSize: rf(14),
    color: '#666',
    lineHeight: rf(20),
    marginBottom: rp(8),
  },
  healthInfoFormula: {
    fontSize: rf(12),
    color: '#666',
    marginTop: rp(8),
    
    backgroundColor: '#e9ecef',
    padding: rp(8),
    borderRadius: rp(6),
    textAlign: 'center',
    ...typography.regular,
  },
  healthInfoScoring: {
    marginTop: rp(15),
    backgroundColor: '#f8f9fa',
    borderRadius: rp(12),
    padding: rp(12),
  },
  healthInfoScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rp(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  healthInfoScoreRowLast: {
    borderBottomWidth: 0,
  },
  healthInfoScoreLabel: {
    fontSize: rf(14),
    ...typography.semibold,
  },
  healthInfoScoreValue: {
    fontSize: rf(12),
    ...typography.semibold,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: rp(8),
    paddingVertical: rp(4),
    borderRadius: rp(6),
  },
  healthInfoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rp(20),
  },
  healthInfoModalContainer: {
    backgroundColor: '#fff',
    borderRadius: rp(20),
    width: '95%',
    maxWidth: 450,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  healthInfoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rp(20),
    paddingTop: rp(20),
    paddingBottom: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: rp(20),
    borderTopRightRadius: rp(20),
  },
  healthInfoModalTitle: {
    fontSize: rf(20),
    color: '#333',
    ...typography.semibold,
    flex: 1,
  },
  healthInfoModalCloseButton: {
    padding: rp(8),
    borderRadius: rp(20),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthInfoModalScroll: {
    maxHeight: rp(450),
  },
  healthInfoModalContent: {
    paddingHorizontal: rp(20),
    paddingBottom: rp(20),
    paddingTop: rp(16),
  },
  // New Health Metric Card Styles
  healthMetricCard: {
    backgroundColor: '#fff',
    borderRadius: rp(18),
    padding: rp(20),
    marginBottom: rp(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  healthMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rp(16),
  },
  healthMetricIconContainer: {
    width: rp(44),
    height: rp(44),
    borderRadius: rp(22),
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rp(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  healthMetricTitle: {
    fontSize: rf(17),
    ...typography.semibold,
    color: '#333',
    flex: 1,
  },
  healthMetricScore: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: rp(16),
    paddingVertical: rp(8),
    borderRadius: rp(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  healthMetricScoreText: {
    fontSize: rf(17),
    ...typography.semibold,
  },
  healthMetricFormula: {
    padding: rp(16),
    borderRadius: rp(12),
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  // Total Score Section Styles
  totalScoreSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: rp(16),
    padding: rp(20),
    alignItems: 'center',
    marginTop: rp(8),
  },
  totalScoreTitle: {
    fontSize: rf(18),
    ...typography.semibold,
    color: '#333',
    marginBottom: rp(12),
  },
  totalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: rp(8),
  },
  totalScoreValue: {
      fontSize: rf(32),
      fontWeight: '700',
    color: '#4285F4',
  },
  totalScoreUnit: {
    fontSize: rf(18),
    ...typography.regular,
    color: '#666',
    marginLeft: rp(4),
  },
  totalScoreDescription: {
    ...typography.regular,
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: rf(20),
  },
  colorLegendSection: {
    marginTop: rp(20),
    paddingHorizontal: rp(20),
    paddingVertical: rp(16),
    backgroundColor: '#f8f9fa',
    borderRadius: rp(16),
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  colorLegendTitle: {
    fontSize: rf(16),
      fontWeight: '600',
    color: '#333',
    marginBottom: rp(12),
    textAlign: 'center',
  },
  colorLegendContainer: {
    flexDirection: 'column',
    gap: rp(8),
  },
  colorLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rp(6),
    paddingHorizontal: rp(8),
    backgroundColor: '#fff',
    borderRadius: rp(8),
    marginBottom: rp(4),
  },
  colorLegendDot: {
    width: rp(12),
    height: rp(12),
    borderRadius: rp(6),
    marginRight: rp(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 0,
  },
  colorLegendText: {
    fontSize: rf(14),
    color: '#555',
    ...typography.regular,
    flex: 1,
    flexShrink: 1,
  },
  fractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  fractionContainer: {
    alignItems: 'center',
    flex: 1,
  },
  fractionNumerator: {
    fontSize: rf(14),
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    marginBottom: rp(2),
  },
  fractionLine: {
    width: rp(40),
    height: 1,
    backgroundColor: '#666',
    marginVertical: rp(4),
  },
  fractionDenominator: {
    fontSize: rf(14),
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    marginTop: rp(2),
  },
  formulaResult: {
    fontSize: rf(14),
    color: '#666',
    ...typography.regular,
    marginLeft: rp(16),
    flexShrink: 0,
  },
});

export default FinanceScreen; 