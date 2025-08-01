import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, G, Svg, Text as SvgText } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ReportByCategory, transactionService } from '../services/transactionService';
import { getIconColor, getIconForCategory } from '../utils/iconUtils';

import PeriodFilterBar, { PeriodType } from '../components/PeriodFilterBar';
import { typography } from '../constants/typography';
const { width } = Dimensions.get('window');

// Type definition for the route params
type ReportDetailScreenRouteProp = RouteProp<RootStackParamList, 'ReportDetailScreen'>;

// Helper to convert polar coordinates to Cartesian
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

interface DetailedPieChartProps {
  data: (ReportByCategory & { color: string })[];
  categoryType: 'expense' | 'income';
  t: (key: string) => string;
}

// Clean pie chart component
const DetailedPieChart: React.FC<DetailedPieChartProps> = ({ data, categoryType, t }) => {
  const size = width * 0.8;
  const radius = size * 0.35;
  const strokeWidth = size * 0.15;

  let cumulativePercentage = 0;

  // Nếu không có dữ liệu, hiển thị thông báo
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { justifyContent: 'center', alignItems: 'center', minHeight: size }]}> 
        <Text style={{ color: '#999', fontSize: 16, fontWeight: '500', textAlign: 'center', marginTop: 24 }}>
          {t('reports.noExpenseData')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {data.map((item, index) => {
            if (item.percentage <= 0) return null;

            const segmentLength = (item.percentage / 100) * (2 * Math.PI * radius);
            const rotationAngle = (cumulativePercentage / 100) * 360;
            // Calculate midpoint of the segment for text positioning
            const midAngle = rotationAngle + (item.percentage / 100) * 180;
            const textPosition = polarToCartesian(size / 2, size / 2, radius, midAngle);
            cumulativePercentage += item.percentage;
            return (
              <G key={index}>
                {/* Pie Segment */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLength} ${2 * Math.PI * radius}`}
                  strokeLinecap="butt"
                  fill="transparent"
                  transform={`rotate(${rotationAngle - 90}, ${size / 2}, ${size / 2})`}
                />
                {/* Percentage Text inside segment */}
                {item.percentage > 5 && (
                  <SvgText
                    x={textPosition.x}
                    y={textPosition.y + 5}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {`${item.percentage.toFixed(1)}%`}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.category_name}
            </Text>
            <Text style={styles.legendPercentage}>
              {item.percentage.toFixed(2)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};


const ReportDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ReportDetailScreenRouteProp>();
  const { t, i18n } = useTranslation();

  // FILTER STATE & LOGIC (copy từ ReportScreen)
  const [selectedPeriodType, setSelectedPeriodType] = React.useState<PeriodType>('thisMonth');
  const [selectedPeriod, setSelectedPeriod] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [customStartDate, setCustomStartDate] = React.useState(new Date());
  const [customEndDate, setCustomEndDate] = React.useState(new Date());
  const [weekReferenceDate, setWeekReferenceDate] = React.useState(new Date());

  // Dummy fetchData: bạn thay bằng API thực tế nếu cần
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reportData, setReportData] = React.useState<any>(null);

  // Lấy filter range
  const dateRange = React.useMemo(() => {
    const now = new Date();
    try {
      switch (selectedPeriodType) {
        case 'today': {
          let targetDate = now;
          if (selectedPeriod && selectedPeriod !== 'today') {
            const parsedDate = new Date(selectedPeriod);
            if (!isNaN(parsedDate.getTime())) {
              targetDate = parsedDate;
            }
          }
          const dateStr = getLocalDateString(targetDate);
          return { startDate: dateStr, endDate: dateStr };
        }
        case 'thisWeek': {
          const referenceDate = weekReferenceDate || new Date();
          const dayOfWeek = referenceDate.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
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
          const endDate = new Date(year, month, 0);
          return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        }
        case 'thisYear': {
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
          if (!customStartDate || !customEndDate || isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
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
      const dateStr = now.toISOString().split('T')[0];
      return { startDate: dateStr, endDate: dateStr };
    }
  }, [selectedPeriodType, selectedPeriod, weekReferenceDate]);

  // Fetch API khi filter đổi
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.viewTransactionReport(
        undefined, // Nếu muốn lọc theo category thì truyền categoryId ở đây
        dateRange.startDate,
        dateRange.endDate,
        groupId // Add groupId parameter
      );
      setReportData(res);
    } catch (err: any) {
      setError(err?.message || t('reports.failedToLoadReport'));
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, groupId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logic lấy range ngày theo filter
  const getDateRange = React.useCallback((): { startDate: string; endDate: string } => {
    const now = new Date();
    try {
      switch (selectedPeriodType) {
        case 'today': {
          let targetDate = now;
          if (selectedPeriod && selectedPeriod !== 'today') {
            const parsedDate = new Date(selectedPeriod);
            if (!isNaN(parsedDate.getTime())) {
              targetDate = parsedDate;
            }
          }
          const dateStr = getLocalDateString(targetDate);
          return { startDate: dateStr, endDate: dateStr };
        }
        case 'thisWeek': {
          const referenceDate = weekReferenceDate || new Date();
          const dayOfWeek = referenceDate.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
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
          const endDate = new Date(year, month, 0);
          return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        }
        case 'thisYear': {
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
          if (!customStartDate || !customEndDate || isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
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
      const dateStr = now.toISOString().split('T')[0];
      return { startDate: dateStr, endDate: dateStr };
    }
  }, [selectedPeriodType, selectedPeriod, weekReferenceDate]);

  // UI filter giống ReportScreen
  const periodTypeOptions = [
    { value: 'today', label: t('reports.today') },
    { value: 'thisWeek', label: t('reports.thisWeek') },
    { value: 'thisMonth', label: t('reports.thisMonth') },
    { value: 'thisYear', label: t('reports.thisYear') },
    { value: 'custom', label: t('reports.custom') },
  ];

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

  const getPeriodDisplayText = () => {
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
          return targetDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        }
        case 'thisWeek': {
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
      return '';
    }
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    try {
      switch (selectedPeriodType) {
        case 'today': {
          let currentDate = new Date();
          if (selectedPeriod && selectedPeriod !== 'today') {
            const parsedDate = new Date(selectedPeriod);
            if (!isNaN(parsedDate.getTime())) {
              currentDate = parsedDate;
            }
          }
          const newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
          setSelectedPeriod(getLocalDateString(newDate));
          break;
        }
        case 'thisWeek': {
          const newReferenceDate = new Date(weekReferenceDate);
          newReferenceDate.setDate(weekReferenceDate.getDate() + (direction === 'next' ? 7 : -7));
          setWeekReferenceDate(newReferenceDate);
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
          if (!customStartDate || !customEndDate || isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
            return;
          }
          const daysDiff = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (24 * 60 * 60 * 1000));
          const multiplier = direction === 'next' ? 1 : -1;
          const newStartDate = new Date(customStartDate);
          newStartDate.setDate(customStartDate.getDate() + (daysDiff + 1) * multiplier);
          const newEndDate = new Date(customEndDate);
          newEndDate.setDate(customEndDate.getDate() + (daysDiff + 1) * multiplier);
          if (!isNaN(newStartDate.getTime()) && !isNaN(newEndDate.getTime())) {
            setCustomStartDate(newStartDate);
            setCustomEndDate(newEndDate);
          }
          break;
        }
      }
    } catch (error) {}
  };

  const handleDateSelect = (type: 'start' | 'end') => {
    const currentDate = type === 'start' ? customStartDate : customEndDate;
    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event: any, selectedDate?: Date) => {
        if (selectedDate) {
          if (type === 'start') {
            setCustomStartDate(selectedDate);
          } else {
            setCustomEndDate(selectedDate);
          }
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  const { title, categoryType, data, totalAmount, groupId } = route.params;

  // Lấy dữ liệu cho biểu đồ và danh sách từ reportData
  const chartData = React.useMemo(() => {
    if (!reportData) return [];
    // Lấy đúng loại (expense/income) theo categoryType
    const arr: ReportByCategory[] = (reportData.transactionsByCategory?.[categoryType] || reportData.transactions_by_category?.[categoryType]) || [];
    return arr
      .map((item: ReportByCategory) => {
        const iconName = getIconForCategory(item.category_icon_url, categoryType);
        const iconColor = getIconColor(iconName, categoryType);
        return { ...item, color: iconColor };
      })
      .filter((item) => item.percentage > 0); // Loại bỏ category có percentage = 0
  }, [reportData, categoryType]);

  // Helper: Lấy ngày hiện tại theo giờ local (YYYY-MM-DD)
  function getLocalDateString(date?: Date) {
    const now = date || new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Hàm khởi tạo kỳ khi đổi filter
  const initializePeriod = React.useCallback((periodType: PeriodType) => {
    const now = new Date();
    switch (periodType) {
      case 'today':
        setSelectedPeriod(getLocalDateString(now));
        break;
      case 'thisWeek':
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
  }, []);

  // Khi đổi filter, gọi initializePeriod
  React.useEffect(() => {
    initializePeriod(selectedPeriodType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodType]);

  // Khi chọn filter từ dropdown, set selectedPeriod đúng cho 'today'
  React.useEffect(() => {
    if (selectedPeriodType === 'today') {
      setSelectedPeriod(getLocalDateString());
    }
  }, [selectedPeriodType]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* FILTER UI giống ReportScreen */}
      <PeriodFilterBar
        periodType={selectedPeriodType}
        periodValue={selectedPeriod}
        weekReferenceDate={weekReferenceDate}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onChangePeriodType={setSelectedPeriodType}
        onChangePeriodValue={setSelectedPeriod}
        onChangeWeekReferenceDate={setWeekReferenceDate}
        onChangeCustomStartDate={setCustomStartDate}
        onChangeCustomEndDate={setCustomEndDate}
      />
      {/* Modal chọn ngày tuỳ chỉnh */}
      <Modal
        visible={false} // Removed showCustomDateModal
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // Removed setShowCustomDateModal
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customDateModalContainer}>
            <View style={styles.customDateModalHeader}>
              <Text style={styles.customDateModalTitle}>{t('reports.selectDateRange')}</Text>
              <TouchableOpacity onPress={() => {}}> {/* Removed setShowCustomDateModal */}
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.customDateModalContent}>
              <View style={styles.currentRangeDisplay}>
                <Text style={styles.currentRangeText}>
                  {customStartDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })} - {customEndDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })}
                </Text>
                <Icon name="calendar" size={20} color="#007AFF" />
              </View>
              <View style={styles.dateInputFields}>
                <View style={styles.dateInputField}>
                  <Text style={styles.dateInputLabel}>{t('reports.startDate')}</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInputButton,
                      // Removed focusedInput === 'start' && styles.dateInputButtonActive
                    ]}
                    onPress={() => handleDateSelect('start')}
                  >
                    <Text style={styles.dateInputText}>
                      {customStartDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateInputField}>
                  <Text style={styles.dateInputLabel}>{t('reports.endDate')}</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInputButton,
                      // Removed focusedInput === 'end' && styles.dateInputButtonActive
                    ]}
                    onPress={() => handleDateSelect('end')}
                  >
                    <Text style={styles.dateInputText}>
                      {customEndDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.customDateModalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {}} // Removed setShowCustomDateModal
                >
                  <Text style={styles.cancelButtonText}>{t('reports.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    customStartDate > customEndDate && styles.disabledButton
                  ]}
                  disabled={customStartDate > customEndDate}
                  onPress={() => {
                    if (customStartDate <= customEndDate) {
                      // Removed setCustomStartDate(tempStartDate);
                      // Removed setCustomEndDate(tempEndDate);
                      // Removed setShowCustomDateModal(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    customStartDate > customEndDate && styles.disabledButtonText
                  ]}>
                    {t('reports.ok')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Loading/Error */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{t('reports.loadingReport')}</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <DetailedPieChart data={chartData} categoryType={categoryType} t={t} />
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('reports.total')}</Text>
              <Text style={styles.summaryAmount}>{totalAmount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {t('currency')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('reports.dailyAverage')}</Text>
              <Text style={styles.summaryAmount}>{Math.round(totalAmount / new Date(dateRange.endDate).getDate()).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {t('currency')}</Text>
            </View>
          </View>
          <View style={styles.listSection}>
            <Text style={styles.listHeader}>{t('reports.categories')}</Text>
            {chartData.map((item: ReportByCategory & { color: string }, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.listItem}
                onPress={async () => {
                  try {
                    let startOfMonth: Date, endOfMonth: Date;
                    if (selectedPeriodType === 'thisMonth' && selectedPeriod && selectedPeriod.includes('-')) {
                      const [year, month] = selectedPeriod.split('-').map(Number);
                      startOfMonth = new Date(year, month - 1, 1);
                      endOfMonth = new Date(year, month, 0);
                    } else {
                      // fallback: current month
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth();
                      startOfMonth = new Date(year, month, 1);
                      endOfMonth = new Date(year, month + 1, 0);
                    }
                    // Không truyền start_date/end_date để type mặc định là MONTHLY
                    navigation.navigate('CategoryReportDetailScreen', {
                      category_name: item.category_name,
                      category_id: item.category_id,
                      groupId: groupId
                    });
                  } catch (err) {
                    console.error('Error navigating to category report:', err);
                  }
                }}
              >
                <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}> 
                  <Icon name={getIconForCategory(item.category_icon_url, categoryType)} size={20} color={item.color} />
                </View>
                <Text style={styles.itemName}>{item.category_name}</Text>
                <Text style={styles.itemAmount}>{item.amount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {t('currency')}</Text>
                <Icon name="chevron-right" size={22} color="#bbb" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
  headerTitle: { fontSize: 18, ...typography.semibold },
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
    position: 'relative',
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
    transform: [{ translateX: -80 }],
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
  dateInputFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  dateInputField: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateInputButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInputButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  customDateModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  customDateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customDateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customDateModalContent: {
    padding: 20,
  },
  currentRangeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentRangeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  customDateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#888',
  },
  scrollContent: { padding: 16 },
  chartContainer: { alignItems: 'center', marginVertical: 30 },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 16, ...typography.medium, color: '#666' },
  summaryAmount: { fontSize: 16, ...typography.medium, color: '#333' },
  listSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  listHeader: { fontSize: 18, ...typography.semibold, marginBottom: 10 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: { flex: 1, fontSize: 16, ...typography.medium, color: '#333' },
  itemAmount: { fontSize: 16, ...typography.medium, color: 'red' },
  legendContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: { 
    flex: 1, 
    fontSize: 14, ...typography.medium,
    color: '#333' 
  },
  legendPercentage: { 
    fontSize: 14, ...typography.medium,
    color: '#666' 
  },
});

export default ReportDetailScreen; 