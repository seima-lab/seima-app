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
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, G, Svg } from 'react-native-svg';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { UserProfile, userService } from '../services/userService';
import { WalletResponse, walletService } from '../services/walletService';

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
  
  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState(t('finance.periods.thisMonth'));
  const [isPeriodModalVisible, setIsPeriodModalVisible] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [notificationCount, setNotificationCount] = useState(3);

  // Load user profile and wallet data
  useEffect(() => {
    loadUserProfile();
    loadWalletData();
  }, [isAuthenticated]);

  // Listen to transaction changes to refresh wallet balance
  useEffect(() => {
    if (transactionRefreshTrigger > 0) {
      console.log('🔄 Transaction updated - refreshing finance data');
      loadWalletData();
    }
  }, [transactionRefreshTrigger]);

  // Auto reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 FinanceScreen focused, reloading data...');
        loadUserProfile();
        loadWalletData();
      }
    }, [isAuthenticated])
  );

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
      { paddingBottom: rp(50) + insets.bottom }
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
  }), [insets.bottom]);

  // Component biểu đồ tròn - Memoized for performance
  const PieChart = React.memo(({ data }: PieChartProps) => {
    const radius = isSmallScreen ? rp(60) : rp(80);
    const centerX = isSmallScreen ? rp(80) : rp(100);
    const centerY = isSmallScreen ? rp(80) : rp(100);
    const svgSize = isSmallScreen ? rp(160) : rp(200);

    const { arcs, polarToCartesian } = useMemo(() => {
      let cumulativePercentage = 0;

      const createArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(centerX, centerY, radius, endAngle);
        const end = polarToCartesian(centerX, centerY, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return [
          "M", centerX, centerY,
          "L", start.x, start.y,
          "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
          "Z"
        ].join(" ");
      };

      const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
        };
      };

      const arcs = data.map((item) => {
        const startAngle = cumulativePercentage * 3.6;
        const endAngle = (cumulativePercentage + item.percentage) * 3.6;
        cumulativePercentage += item.percentage;
        
        return {
          ...item,
          startAngle,
          endAngle,
          strokeDasharray: `${item.percentage * 5.03} ${500}`,
          strokeDashoffset: -startAngle * 1.4
        };
      });

      return { arcs, polarToCartesian };
    }, [data, centerX, centerY, radius]);
    
    return (
      <View style={styles.chartContainer}>
        <Svg width={svgSize} height={svgSize}>
          {arcs.map((item, index) => (
            <G key={`${item.category}-${index}`}>
              <Circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={20}
                strokeDasharray={item.strokeDasharray}
                strokeDashoffset={item.strokeDashoffset}
                transform={`rotate(-90 ${centerX} ${centerY})`}
              />
            </G>
          ))}
          {/* Vòng tròn trắng ở giữa */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={isSmallScreen ? rp(35) : rp(50)}
            fill="white"
          />
        </Svg>
      </View>
    );
  });

  PieChart.displayName = 'PieChart';

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

  // Memoized Bottom Tab Button
  const BottomTabButton = React.memo(({ icon, label, isActive = false }: ButtonProps) => (
    <TouchableOpacity 
      style={styles.bottomTabButton}
      onPress={() => setActiveTab(label)}
    >
      <Icon2 
        name={icon} 
        size={20} 
        color={isActive ? '#1e90ff' : '#999'} 
        style={styles.bottomTabIcon}
      />
      <Text style={[styles.bottomTabLabel, isActive && styles.activeBottomTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  ));

  BottomTabButton.displayName = 'BottomTabButton';

  // Memoized Period Selector Component
  const PeriodSelector = React.memo(() => (
    <View style={styles.periodSelectorContainer}>
      <TouchableOpacity 
        style={styles.periodSelector}
        onPress={() => setIsPeriodModalVisible(!isPeriodModalVisible)}
      >
        <Text style={styles.periodText}>{selectedPeriod}</Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      {isPeriodModalVisible && (
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.dropdownMenu}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodOption,
                  selectedPeriod === period && styles.selectedPeriodOption
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setIsPeriodModalVisible(false);
                }}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === period && styles.selectedPeriodOptionText
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  ));

  PeriodSelector.displayName = 'PeriodSelector';

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

  // Memoized PERIODS array
  const PERIODS = useMemo(() => [
    t('finance.periods.thisDay'),
    t('finance.periods.thisWeek'),
    t('finance.periods.thisMonth'),
    t('finance.periods.quarter'),
    t('finance.periods.thisYear')
  ], [t]);

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

  // Memoized formatted balance
  const formattedBalance = useMemo(() => {
    return isBalanceVisible ? `${financeData.totalBalance.toLocaleString('vi-VN')} ${t('currency')}` : '********';
  }, [isBalanceVisible, financeData.totalBalance, t]);

  // Memoized dynamic balance font size
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
  }, [navigation]);

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

  const handleClosePeriodModal = useCallback(() => {
    setIsPeriodModalVisible(false);
  }, []);

  // Show loading state
  if (loading || walletLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4285F4" translucent={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285F4" translucent={true} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + rp(20) }]}>
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
          </View>
        </View>
      </View>

             <ScrollView {...scrollViewProps}>
         <View style={styles.bodyContainer}>
          {/* Income and Expenses Section */}
          <TouchableWithoutFeedback onPress={handleClosePeriodModal}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('finance.incomeAndExpenses')}</Text>
                <PeriodSelector />
              </View>
              {/* Bar Chart */}
              <View style={styles.barChartContainer}>
                <View style={styles.barChart}>
                  <View style={styles.incomeBar}>
                    <Text style={styles.barLabel}>{t('finance.incomeShort')}</Text>
                  </View>
                  <View style={styles.expenseBar}>
                    <Text style={styles.barLabel}>{t('finance.expenseShort')}</Text>
                  </View>
                  <Text style={styles.differenceLabel}>{t('finance.difference')}</Text>
                </View>
                <View style={styles.amountsList}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>{t('incomeLabel')}</Text>
                    <Text style={styles.incomeAmount}>{formatMoney(financeData.income)} {t('currency')}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>{t('finance.expenseShort')}</Text>
                    <Text style={styles.expenseAmount}>{formatMoney(financeData.expenses)} {t('currency')}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>{t('finance.difference')}</Text>
                    <Text style={[
                      styles.differenceAmount,
                      financeData.difference >= 0 ? styles.incomeAmount : styles.expenseAmount
                    ]}>
                      {financeData.difference >= 0 ? '+' : ''}{formatMoney(Math.abs(financeData.difference))} {t('currency')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* Pie Chart Section */}
          <View style={styles.section}>
            <View style={styles.pieChartSection}>
              <PieChart data={expenseData} />
              <View style={styles.legendContainer}>
                {expenseData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.category}</Text>
                    <Text style={styles.legendPercentage}>{item.percentage} %</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

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

      {/* Backdrop for dropdown - separate from scroll */}
      {isPeriodModalVisible && (
        <TouchableWithoutFeedback onPress={handleClosePeriodModal}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rp(30),
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
  },
  userName: {
    color: 'white',
    fontSize: rf(18),
    fontWeight: '600',
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
  },
  balanceSection: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rf(16),
    marginBottom: rp(8),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: rp(15),
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
    marginTop: rp(25),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rp(20),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    color: '#333',
  },
  periodSelectorContainer: {
    position: 'relative',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: rp(12),
    paddingVertical: rp(6),
    borderRadius: rp(15),
  },
  periodText: {
    fontSize: rf(14),
    color: '#666',
    marginRight: rp(5),
  },
  dropdownIcon: {
    fontSize: rf(10),
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: rp(15),
    padding: rp(8),
    marginTop: rp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: rp(140),
    maxWidth: rp(180),
  },
  periodOption: {
    paddingVertical: rp(14),
    paddingHorizontal: rp(20),
    borderRadius: rp(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: rp(2),
  },
  selectedPeriodOption: {
    backgroundColor: '#E8F0FE',
  },
  periodOptionText: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: rf(16),
  },
  selectedPeriodOptionText: {
    color: '#1e90ff',
    fontWeight: '600',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  incomeBar: {
    width: rp(30),
    height: rp(40),
    backgroundColor: '#4CAF50',
    marginRight: rp(10),
    borderRadius: rp(4),
    justifyContent: 'flex-end',
    paddingBottom: rp(5),
  },
  expenseBar: {
    width: rp(30),
    height: rp(120),
    backgroundColor: '#F44336',
    marginRight: rp(20),
    borderRadius: rp(4),
    justifyContent: 'flex-end',
    paddingBottom: rp(5),
  },
  barLabel: {
    fontSize: rf(10),
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  differenceLabel: {
    fontSize: rf(12),
    color: '#666',
    marginLeft: rp(10),
  },
  amountsList: {
    flex: 1,
    paddingLeft: rp(20),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rp(8),
  },
  amountLabel: {
    fontSize: rf(14),
    color: '#666',
  },
  incomeAmount: {
    fontSize: rf(14),
    color: '#4CAF50',
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: rf(14),
    color: '#F44336',
    fontWeight: '600',
  },
  differenceAmount: {
    fontSize: rf(14),
    color: '#F44336',
    fontWeight: '600',
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
    flex: 1,
    paddingLeft: isSmallScreen ? rp(10) : rp(20),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rp(8),
  },
  legendColor: {
    width: rp(12),
    height: rp(12),
    borderRadius: rp(6),
    marginRight: rp(8),
  },
  legendLabel: {
    flex: 1,
    fontSize: rf(12),
    color: '#666',
  },
  legendPercentage: {
    fontSize: rf(12),
    color: '#333',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: rp(30),
    marginBottom: rp(20),
  },
  iconButton: {
    width: rp(60),
    height: rp(60),
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
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  bottomTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 60,
  },
  bottomTabIcon: {
    marginBottom: 4,
  },
  bottomTabLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  activeBottomTabLabel: {
    color: '#1e90ff',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#1e90ff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  notificationBadge: {
    position: 'absolute',
    top: rp(-5),
    right: rp(-5),
    backgroundColor: '#FF3B30',
    borderRadius: rp(10),
    minWidth: rp(20),
    height: rp(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rp(4),
  },
  notificationText: {
    color: 'white',
    fontSize: rf(10),
    fontWeight: '600',
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
  },
  scrollContent: {
    paddingTop: rp(10),
  },
  dropdownBackdrop: {
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
  },
  stickySection: {
    backgroundColor: '#fff',
    zIndex: 2,
  },
  bodyContainer: {
    paddingTop: rp(20),
  },
});

export default FinanceScreen; 