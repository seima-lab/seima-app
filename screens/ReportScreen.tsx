import { typography } from '@/constants/typography';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { t } = useTranslation();
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <View style={[styles.emptyChart, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.emptyChartText}>{t('reports.noData')}</Text>
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
  })
  .filter(item => item.percentage > 0)
  .sort((a, b) => b.percentage - a.percentage);

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

// Add period type enum
type PeriodType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

export default function ReportScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { transactionRefreshTrigger } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<TransactionReportResponse | null>(null);
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>('thisMonth');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Period dropdown state
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  
  // Custom date picker state
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  
  // Custom date modal state
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | null>(null);
  
  // Week reference date for navigation
  const [weekReferenceDate, setWeekReferenceDate] = useState(new Date());

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  const showToastMessage = useCallback((message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  // Get date range based on period type and selected period
  const getDateRange = useCallback((): { startDate: string; endDate: string } => {
    const now = new Date();
    
    try {
      switch (selectedPeriodType) {
        case 'today': {
          // For today, use selectedPeriod if it's a valid date string, otherwise use current date
          let targetDate = now;
          if (selectedPeriod && selectedPeriod !== 'today') {
            const parsedDate = new Date(selectedPeriod);
            if (!isNaN(parsedDate.getTime())) {
              targetDate = parsedDate;
            }
          }
          const dateStr = targetDate.toISOString().split('T')[0];
          return { startDate: dateStr, endDate: dateStr };
        }
        
        case 'thisWeek': {
          // Use weekReferenceDate for week calculation
          const referenceDate = weekReferenceDate || new Date();
          const dayOfWeek = referenceDate.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start of week
          
          const startOfWeek = new Date(referenceDate);
          startOfWeek.setDate(referenceDate.getDate() + mondayOffset);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          
          return {
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: endOfWeek.toISOString().split('T')[0]
          };
        }
        
        case 'thisMonth': {
          // Parse selectedPeriod as month (format: "YYYY-MM")
          let year = now.getFullYear();
          let month = now.getMonth() + 1;
          
          if (selectedPeriod && selectedPeriod.includes('-')) {
            const parts = selectedPeriod.split('-');
            if (parts.length === 2) {
              const parsedYear = parseInt(parts[0]);
              const parsedMonth = parseInt(parts[1]);
              if (!isNaN(parsedYear) && !isNaN(parsedMonth) && parsedYear > 1900 && parsedYear < 3000 && parsedMonth >= 1 && parsedMonth <= 12) {
                year = parsedYear;
                month = parsedMonth;
              }
            }
          }
          
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0); // Last day of month
          
          return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        }
        
        case 'thisYear': {
          // Parse selectedPeriod as year (format: "YYYY")
          let year = now.getFullYear();
          
          if (selectedPeriod) {
            const parsedYear = parseInt(selectedPeriod);
            if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 3000) {
              year = parsedYear;
            }
          }
          
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31);
          
          return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        }
        
        case 'custom': {
          // Validate custom dates
          if (!customStartDate || !customEndDate || isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
            // Fallback to current month if custom dates are invalid
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          }
          
          return {
            startDate: customStartDate.toISOString().split('T')[0],
            endDate: customEndDate.toISOString().split('T')[0]
          };
        }
        
        default:
          return {
            startDate: now.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
          };
      }
    } catch (error) {
      console.error('Error in getDateRange:', error);
      // Fallback to current date if any error occurs
      const dateStr = now.toISOString().split('T')[0];
      return { startDate: dateStr, endDate: dateStr };
    }
  }, [selectedPeriodType, selectedPeriod, customStartDate, customEndDate, weekReferenceDate]);

  // Initialize selectedPeriod based on period type
  const initializePeriod = useCallback((periodType: PeriodType) => {
    const now = new Date();
    
    try {
      switch (periodType) {
        case 'today':
          setSelectedPeriod(now.toISOString().split('T')[0]);
          break;
          
        case 'thisWeek':
          // For week, we'll use current date as reference
          setWeekReferenceDate(new Date());
          setSelectedPeriod('current-week');
          break;
        
        case 'thisMonth':
          setSelectedPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
          break;
          
        case 'thisYear':
          setSelectedPeriod(now.getFullYear().toString());
          break;
          
        case 'custom':
          setCustomStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
          setCustomEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
          setSelectedPeriod('custom');
          break;
      }
    } catch (error) {
      console.error('Error in initializePeriod:', error);
      // Fallback to current month
      setSelectedPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
  }, []);

  // Load report data
  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      console.log('🔄 Loading report data for:', { 
        selectedPeriodType,
        selectedPeriod,
        startDate, 
        endDate
      });

      const data = await transactionService.viewTransactionReport(
        undefined, // categoryId - load all categories
        startDate,
        endDate
      );

      console.log('✅ Raw API Response:', data);
      setReportData(data);
      console.log('✅ Report data loaded and set to state');
    } catch (error: any) {
      console.error('❌ Failed to load report data:', error);
      showToastMessage(error.message || t('reports.loadingReport'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriodType, selectedPeriod, customStartDate, customEndDate, weekReferenceDate, getDateRange, showToastMessage, t]);

  // Load data on mount and when period changes
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Initialize period when period type changes
  useEffect(() => {
    initializePeriod(selectedPeriodType);
  }, [selectedPeriodType, initializePeriod]);

  // Khi transactionRefreshTrigger thay đổi, reload báo cáo
  useEffect(() => {
    loadReportData();
  }, [transactionRefreshTrigger]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₫', 'đ');
  };

  // Get period display text
  const getPeriodDisplayText = (): string => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    
    try {
      switch (selectedPeriodType) {
        case 'today': {
          let targetDate = new Date();
          
          if (selectedPeriod && selectedPeriod !== 'today') {
            const parsedDate = new Date(selectedPeriod);
            if (!isNaN(parsedDate.getTime())) {
              targetDate = parsedDate;
            }
          }
          
          return targetDate.toLocaleDateString(locale, { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          });
        }
        
        case 'thisWeek': {
          // Calculate week range using weekReferenceDate
          const referenceDate = weekReferenceDate || new Date();
          const dayOfWeek = referenceDate.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          
          const startOfWeek = new Date(referenceDate);
          startOfWeek.setDate(referenceDate.getDate() + mondayOffset);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          
          return `${startOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        
        case 'thisMonth': {
          let year = new Date().getFullYear();
          let month = new Date().getMonth() + 1;
          
          if (selectedPeriod && selectedPeriod.includes('-')) {
            const parts = selectedPeriod.split('-');
            if (parts.length === 2) {
              const parsedYear = parseInt(parts[0]);
              const parsedMonth = parseInt(parts[1]);
              if (!isNaN(parsedYear) && !isNaN(parsedMonth) && parsedYear > 1900 && parsedYear < 3000 && parsedMonth >= 1 && parsedMonth <= 12) {
                year = parsedYear;
                month = parsedMonth;
              }
            }
          }
          
          const date = new Date(year, month - 1);
          return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        }
        
        case 'thisYear': {
          let year = new Date().getFullYear();
          
          if (selectedPeriod) {
            const parsedYear = parseInt(selectedPeriod);
            if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 3000) {
              year = parsedYear;
            }
          }
          
          return year.toString();
        }
        
        case 'custom': {
          if (!customStartDate || !customEndDate || isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
            return t('reports.custom');
          }
          
          return `${customStartDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${customEndDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        
        default:
          return '';
      }
    } catch (error) {
      console.error('Error in getPeriodDisplayText:', error);
      return '';
    }
  };

  // Navigate period
  const navigatePeriod = (direction: 'prev' | 'next') => {
    try {
      switch (selectedPeriodType) {
        case 'today': {
          let currentDate = new Date();
          
          // If selectedPeriod is a valid date string, use it; otherwise use current date
          if (selectedPeriod && selectedPeriod !== 'today') {
            const parsedDate = new Date(selectedPeriod);
            if (!isNaN(parsedDate.getTime())) {
              currentDate = parsedDate;
            }
          }
          
          const newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
          setSelectedPeriod(newDate.toISOString().split('T')[0]);
          break;
        }
        
        case 'thisWeek': {
          // Move weekReferenceDate by 7 days
          const newReferenceDate = new Date(weekReferenceDate);
          newReferenceDate.setDate(weekReferenceDate.getDate() + (direction === 'next' ? 7 : -7));
          
          setWeekReferenceDate(newReferenceDate);
          // Keep selectedPeriod as 'current-week' to trigger re-render
          setSelectedPeriod('current-week');
          break;
        }
        
        case 'thisMonth': {
          let year = new Date().getFullYear();
          let month = new Date().getMonth() + 1;
          
          if (selectedPeriod && selectedPeriod.includes('-')) {
            const parts = selectedPeriod.split('-');
            if (parts.length === 2) {
              const parsedYear = parseInt(parts[0]);
              const parsedMonth = parseInt(parts[1]);
              if (!isNaN(parsedYear) && !isNaN(parsedMonth) && parsedYear > 1900 && parsedYear < 3000 && parsedMonth >= 1 && parsedMonth <= 12) {
                year = parsedYear;
                month = parsedMonth;
              }
            }
          }
          
          const newDate = new Date(year, month - 1);
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          
          const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
          setSelectedPeriod(newMonth);
          break;
        }
        
        case 'thisYear': {
          let year = new Date().getFullYear();
          
          if (selectedPeriod) {
            const parsedYear = parseInt(selectedPeriod);
            if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 3000) {
              year = parsedYear;
            }
          }
          
          const newYear = direction === 'next' ? year + 1 : year - 1;
          if (newYear > 1900 && newYear < 3000) {
            setSelectedPeriod(newYear.toString());
          }
          break;
        }
        
        case 'custom': {
          // For custom, navigate by the same time span
          if (!customStartDate || !customEndDate || isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
            return; // Don't navigate if dates are invalid
          }
          
          const daysDiff = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (24 * 60 * 60 * 1000));
          const multiplier = direction === 'next' ? 1 : -1;
          
          const newStartDate = new Date(customStartDate);
          newStartDate.setDate(customStartDate.getDate() + (daysDiff + 1) * multiplier);
          
          const newEndDate = new Date(customEndDate);
          newEndDate.setDate(customEndDate.getDate() + (daysDiff + 1) * multiplier);
          
          // Validate the new dates
          if (!isNaN(newStartDate.getTime()) && !isNaN(newEndDate.getTime())) {
            setCustomStartDate(newStartDate);
            setCustomEndDate(newEndDate);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error in navigatePeriod:', error);
    }
  };

  // Get period type options
  const periodTypeOptions = [
    { value: 'today', label: t('reports.today') },
    { value: 'thisWeek', label: t('reports.thisWeek') },
    { value: 'thisMonth', label: t('reports.thisMonth') },
    { value: 'thisYear', label: t('reports.thisYear') },
    { value: 'custom', label: t('reports.custom') },
  ];





  // Get current period type label with smart detection
  const getCurrentPeriodTypeLabel = () => {
    const today = new Date();
    switch (selectedPeriodType) {
      case 'today': {
        let targetDate = today;
        if (selectedPeriod && selectedPeriod !== 'today') {
          const parsedDate = new Date(selectedPeriod);
          if (!isNaN(parsedDate.getTime())) {
            targetDate = parsedDate;
          }
        }
        const isToday = targetDate.toDateString() === today.toDateString();
        return isToday ? t('reports.today') : '';
      }
      case 'thisWeek': {
        const referenceDate = weekReferenceDate || today;
        const todayStartOfWeek = new Date(today);
        const todayDayOfWeek = today.getDay();
        const todayMondayOffset = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
        todayStartOfWeek.setDate(today.getDate() + todayMondayOffset);

        const refStartOfWeek = new Date(referenceDate);
        const refDayOfWeek = referenceDate.getDay();
        const refMondayOffset = refDayOfWeek === 0 ? -6 : 1 - refDayOfWeek;
        refStartOfWeek.setDate(referenceDate.getDate() + refMondayOffset);

        const isSameWeek = todayStartOfWeek.toDateString() === refStartOfWeek.toDateString();
        return isSameWeek ? t('reports.thisWeek') : '';
      }
      case 'thisMonth': {
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const isCurrentMonth = selectedPeriod === currentMonth;
        return isCurrentMonth ? t('reports.thisMonth') : '';
      }
      case 'thisYear': {
        const currentYear = today.getFullYear().toString();
        const isCurrentYear = selectedPeriod === currentYear;
        return isCurrentYear ? t('reports.thisYear') : '';
      }
      case 'custom':
        return t('reports.custom');
      default:
        return '';
    }
  };

  // Handle date selection
  const handleDateSelect = (type: 'start' | 'end') => {
    const currentDate = type === 'start' ? tempStartDate : tempEndDate;
    
    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event: any, selectedDate?: Date) => {
        if (selectedDate) {
          if (type === 'start') {
            setTempStartDate(selectedDate);
          } else {
            setTempEndDate(selectedDate);
          }
        }
      },
      mode: 'date',
      is24Hour: true,
    });
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reports.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Period Navigation */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => navigatePeriod('prev')}>
          <Icon name="chevron-left" size={24} color="#666" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TouchableOpacity 
            style={styles.periodDisplayContainer}
            onPress={() => setShowPeriodDropdown((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.periodTypeIndicator}>
              <Text style={styles.periodTypeLabel}>{getCurrentPeriodTypeLabel()}</Text>
              {getCurrentPeriodTypeLabel() !== '' && (
                <Icon name="chevron-down" size={16} color="#666" />
              )}
            </View>
            <View style={getCurrentPeriodTypeLabel() === '' ? styles.periodTextContainerCenter : styles.periodTextContainer}>
              <Text style={getCurrentPeriodTypeLabel() === '' ? styles.monthTextCenter : styles.monthText}>{getPeriodDisplayText()}</Text>
            </View>
          </TouchableOpacity>
          {/* Dropdown filter ngay dưới filter */}
          {showPeriodDropdown && (
            <View style={styles.dropdownContainer}>
              {periodTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    selectedPeriodType === option.value && styles.selectedDropdownOption
                  ]}
                  onPress={() => {
                    setSelectedPeriodType(option.value as PeriodType);
                    setShowPeriodDropdown(false);
                    if (option.value === 'custom') {
                      setTempStartDate(customStartDate);
                      setTempEndDate(customEndDate);
                      setShowCustomDateModal(true);
                    }
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedPeriodType === option.value && styles.selectedDropdownOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => navigatePeriod('next')}>
          <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Custom Date Modal */}
      <Modal
        visible={showCustomDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customDateModalContainer}>
            <View style={styles.customDateModalHeader}>
              <Text style={styles.customDateModalTitle}>{t('reports.selectDateRange')}</Text>
              <TouchableOpacity onPress={() => setShowCustomDateModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.customDateModalContent}>
              {/* Current Range Display */}
              <View style={styles.currentRangeDisplay}>
                <Text style={styles.currentRangeText}>
                  {tempStartDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { 
                    day: 'numeric', 
                    month: 'short' 
                  })} - {tempEndDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Text>
                <Icon name="calendar" size={20} color="#007AFF" />
              </View>

              {/* Date Input Fields */}
              <View style={styles.dateInputFields}>
                <View style={styles.dateInputField}>
                  <Text style={styles.dateInputLabel}>{t('reports.startDate')}</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInputButton,
                      focusedInput === 'start' && styles.dateInputButtonActive
                    ]}
                    onPress={() => handleDateSelect('start')}
                  >
                    <Text style={styles.dateInputText}>
                      {tempStartDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputField}>
                  <Text style={styles.dateInputLabel}>{t('reports.endDate')}</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInputButton,
                      focusedInput === 'end' && styles.dateInputButtonActive
                    ]}
                    onPress={() => handleDateSelect('end')}
                  >
                    <Text style={styles.dateInputText}>
                      {tempEndDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.customDateModalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCustomDateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    tempStartDate > tempEndDate && styles.disabledButton
                  ]}
                  disabled={tempStartDate > tempEndDate}
                  onPress={() => {
                    if (tempStartDate <= tempEndDate) {
                      setCustomStartDate(tempStartDate);
                      setCustomEndDate(tempEndDate);
                      setShowCustomDateModal(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    tempStartDate > tempEndDate && styles.disabledButtonText
                  ]}>
                    {t('common.ok')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>







      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('reports.loadingReport')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.incomeCard}>
                <Text style={styles.incomeLabel}>{t('reports.expense')}</Text>
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
                <Text style={styles.expenseLabel}>{t('reports.income')}</Text>
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
              <Text style={styles.chartTitle}>{t('reports.expense')}</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('ReportDetailScreen', {
                  title: t('reports.expenseDetails'),
                  categoryType: 'expense',
                  data: getExpenseData(),
                  totalAmount: (reportData as any)?.summary?.total_expense || 0,
                })}
              >
                <Text style={styles.seeAllText}>{t('reports.seeDetails')}</Text>
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
              <Text style={styles.chartTitle}>{t('reports.income')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportDetailScreen', {
                  title: t('reports.incomeDetails'),
                  categoryType: 'income',
                  data: getIncomeData(),
                  totalAmount: (reportData as any)?.summary?.total_income || 0,
                })}
              >
                <Text style={styles.seeAllText}>{t('reports.seeDetails')}</Text>
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
            <Text style={styles.viewReportText}>{t('reports.viewReportByCategory')}</Text>
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
    </View>
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
    ...typography.medium,
    fontSize: 18,
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    position: 'relative', // thêm dòng này
},
  periodDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minHeight: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  periodTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  periodTypeLabel: {
    fontSize: 11,
    color: '#8e9aaf',
    marginRight: 3,
    marginLeft: 10,
    ...typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthTextCenter: {
    ...typography.medium,
    fontSize: 15,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom:15
  },
  monthText: {
    ...typography.medium,
    fontSize: 15,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 20,
  
  },
  periodTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  periodTextContainerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 0,
    width: '100%',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -80 }], // căn giữa với width 160
    zIndex: 10,
    width: 160,
    minWidth: 120,
    maxWidth: 200,
    alignSelf: 'center',
    paddingVertical: 4,
},
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  selectedDropdownOption: {
    backgroundColor: '#f0f8ff',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownOptionText: {
    color: '#007AFF',
    ...typography.medium,
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
    ...typography.medium,
    fontSize: 18,
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
    ...typography.medium,
    fontSize: 16,
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  chartAmount: {
    fontSize: 22,
    ...typography.medium,
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
    ...typography.medium,
    color: '#374151',
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
    ...typography.medium,
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
  customDateModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  customDateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customDateModalTitle: {
    ...typography.medium,
    fontSize: 18,
    color: '#333',
  },
  customDateModalContent: {
    padding: 0,
  },
  currentRangeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentRangeText: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  dateInputFields: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateInputField: {
    marginBottom: 15,
  },
  dateInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateInputButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  dateInputButtonActive: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  customDateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    ...typography.medium,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    ...typography.medium,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#999',
  },
}); 