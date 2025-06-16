import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, G, Svg } from 'react-native-svg';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { UserProfile, userService } from '../services/userService';

const { width } = Dimensions.get('window');

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

const FinanceScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const { isAuthenticated } = useAuth();
  
  // State for user data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState(t('finance.periods.thisMonth'));
  const [isPeriodModalVisible, setIsPeriodModalVisible] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [notificationCount, setNotificationCount] = useState(3);

  // Load user profile from API
  useEffect(() => {
    loadUserProfile();
  }, [isAuthenticated]);

  // Auto reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 FinanceScreen focused, reloading profile...');
        loadUserProfile();
      }
    }, [isAuthenticated])
  );

  const loadUserProfile = async (forceRefresh: boolean = false) => {
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
  };

  // Helper function to get avatar source based on gender
  const getAvatarSource = () => {
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
  };

  // Dữ liệu mẫu (will be replaced with real API data later)
  const financeData = {
    balance: '2,100,000',
    income: '80,000',
    expenses: '1,980,000',
    difference: '-1,900,000'
  };

  const expenseData: ExpenseData[] = [
    { category: 'Leisure', percentage: 54.55, color: '#FFA726' },
    { category: 'Self-development', percentage: 25.25, color: '#EF5350' },
    { category: 'Clothing', percentage: 18.74, color: '#26A69A' },
    { category: 'Food', percentage: 0.76, color: '#AB47BC' },
    { category: 'Undefined', percentage: 0.7, color: '#42A5F5' },
  ];

  // Component biểu đồ tròn
  const PieChart = ({ data }: PieChartProps) => {
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
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

    return (
      <View style={styles.chartContainer}>
        <Svg width={200} height={200}>
          {data.map((item: ExpenseData, index: number) => {
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + item.percentage) * 3.6;
            cumulativePercentage += item.percentage;

            return (
              <G key={index}>
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={20}
                  strokeDasharray={`${item.percentage * 5.03} ${500}`}
                  strokeDashoffset={-startAngle * 1.4}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                />
              </G>
            );
          })}
          {/* Vòng tròn trắng ở giữa */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={50}
            fill="white"
          />
        </Svg>
      </View>
    );
  };

  const IconButton = ({ icon, label, isActive = false, iconColor = 'white' }: ButtonProps) => (
    <TouchableOpacity style={[styles.iconButton, isActive && styles.activeIconButton]}>
      <View style={styles.iconContainer}>
        {icon && typeof icon === 'string' && icon.startsWith('M') ? (
          <Icon name={icon} size={24} color={iconColor} />
        ) : (
          <Text style={[styles.iconText, { color: iconColor }]}>{icon || ''}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const BottomTabButton = ({ icon, label, isActive = false }: ButtonProps) => (
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
  );

  const PeriodSelector = () => (
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
  );

  const NotificationIcon = () => (
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
  );

  const PERIODS = [
    t('finance.periods.thisDay'),
    t('finance.periods.thisWeek'),
    t('finance.periods.thisMonth'),
    t('finance.periods.quarter'),
    t('finance.periods.thisYear')
  ];

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4285F4" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => setIsPeriodModalVisible(false)}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4285F4" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Image 
                  source={getAvatarSource()}
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
                onPress={() => loadUserProfile(true)}
              >
                <Icon name="refresh" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <NotificationIcon />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>{t('finance.totalBalance')}</Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceAmount, { minWidth: 200 }]}>
                {isBalanceVisible ? `${financeData.balance} ${t('currency')}` : '********'}
              </Text>
              <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)}>
                <Icon 
                  name={isBalanceVisible ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Income and Expenses Section */}
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
                  <Text style={styles.incomeAmount}>{financeData.income} {t('currency')}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>{t('finance.expenseShort')}</Text>
                  <Text style={styles.expenseAmount}>{financeData.expenses} {t('currency')}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>{t('finance.difference')}</Text>
                  <Text style={styles.differenceAmount}>{financeData.difference} {t('currency')}</Text>
                </View>
              </View>
            </View>
          </View>

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
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Calendar')}
            >
              <Icon name="calendar-month" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('ChatAI')}
            >
              <Icon2 name="robot" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="group" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('BudgetScreen')}
            >
              <Icon2 name="bullseye" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>

      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4285F4',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  greeting: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerIcons: {  
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
    position: 'relative',
  },
  headerIconText: {
    color: 'white',
    fontSize: 20,
  },
  balanceSection: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 15,
  },
  eyeIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
    maxWidth: 180,
  },
  periodOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  selectedPeriodOption: {
    backgroundColor: '#E8F0FE',
  },
  periodOptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
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
    width: 30,
    height: 40,
    backgroundColor: '#4CAF50',
    marginRight: 10,
    borderRadius: 4,
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  expenseBar: {
    width: 30,
    height: 120,
    backgroundColor: '#F44336',
    marginRight: 20,
    borderRadius: 4,
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  differenceLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  amountsList: {
    flex: 1,
    paddingLeft: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  incomeAmount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  differenceAmount: {
    fontSize: 14,
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
    paddingLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  legendPercentage: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 20,
  },
  iconButton: {
    width: 60,
    height: 60,
    backgroundColor: '#1e90ff',
    borderRadius: 15,
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
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
});

export default FinanceScreen; 