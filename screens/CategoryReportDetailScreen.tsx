import { typography } from '@/constants/typography';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDays as addDaysFns, addMonths, endOfMonth, endOfWeek, format, getDay, startOfMonth, startOfWeek } from 'date-fns';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart as KitBarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../components/CustomDropdown';
import { categoryService } from '../services/categoryService';
// Xoá declare module ở đây, sẽ tạo file types/react-native-svg-charts.d.ts ở gốc dự án

const periodTypeOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'thisWeek', label: 'Tuần này' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'thisYear', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn' },
];

function addDaysLocal(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function getDaysInMonth(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = [];
  for (let d = start; d <= end; d = addDaysLocal(d, 1)) {
    days.push(new Date(d));
  }
  return days;
}

// Hàm chia tháng thành các tuần, mỗi tuần là mảng các ngày
function splitMonthToWeeks(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const weeks: Date[][] = [];
  let week: Date[] = [];
  for (let d = start; d <= end; d = addDaysLocal(d, 1)) {
    week.push(new Date(d));
    if (d.getDay() === 0 || d.getTime() === end.getTime()) { // Chủ nhật hoặc cuối tháng
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

// Tạo dữ liệu mẫu: mỗi ngày một số tiền ngẫu nhiên
function generateSampleDataForMonth(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const data: { date: Date; value: number }[] = [];
  for (let d = start; d <= end; d = addDaysLocal(d, 1)) {
    data.push({ date: new Date(d), value: Math.floor(Math.random() * 90) + 10 }); // 10 đến 99
  }
  return data;
}

export default function CategoryReportDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { category_name, category_id, start_date, end_date } = route.params as {
    category_name?: string;
    category_id?: number;
    start_date?: string;
    end_date?: string;
  };

  const [selectedPeriodType, setSelectedPeriodType] = useState('thisMonth');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleStartDate, setVisibleStartDate] = useState(startOfMonth(new Date()));
  const [apiData, setApiData] = useState<Record<string, { income?: number; expense?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);

  // Reset currentDate and visibleStartDate when period type changes (except custom)
  useEffect(() => {
    if (selectedPeriodType === 'thisMonth') {
      const firstDay = startOfMonth(new Date());
      setCurrentDate(firstDay);
      setVisibleStartDate(firstDay);
    } else if (selectedPeriodType !== 'custom') {
      setCurrentDate(new Date());
    }
  }, [selectedPeriodType]);

  // Fetch API data when period type, currentDate, or custom dates change
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      if (!category_id) return;
      setLoading(true);
      setError(null);
      try {
        let type = '';
        let start: Date, end: Date;
        if (start_date && end_date) {
          // Nếu có start_date/end_date truyền vào thì ưu tiên dùng
          type = 'CUSTOM';
          start = new Date(start_date);
          end = new Date(end_date);
        } else if (selectedPeriodType === 'thisMonth') {
          type = 'MONTHLY';
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
        } else if (selectedPeriodType === 'thisWeek') {
          type = 'WEEKLY';
          start = startOfWeek(currentDate, { weekStartsOn: 1 });
          end = endOfWeek(currentDate, { weekStartsOn: 1 });
        } else if (selectedPeriodType === 'thisYear') {
          type = 'YEARLY';
          start = new Date(currentDate.getFullYear(), 0, 1);
          end = new Date(currentDate.getFullYear(), 11, 31);
        } else if (selectedPeriodType === 'today') {
          type = 'DAILY';
          start = currentDate;
          end = currentDate;
        } else if (selectedPeriodType === 'custom') {
          type = 'CUSTOM';
          start = startDate;
          end = endDate;
        } else {
          return;
        }
        // Format dates as yyyy-MM-dd
        const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
        const report = await categoryService.getCategoryReport(
          String(category_id),
          type,
          formatDate(start),
          formatDate(end)
        );
        if (isMounted && report) {
          setApiData(report.data || {});
          setTotalExpense(report.totalExpense || 0);
          setTotalIncome(report.totalIncome || 0);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Lỗi tải dữ liệu');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [category_id, selectedPeriodType, currentDate, startDate, endDate, start_date, end_date]);

  const handlePrev = () => {
    if (selectedPeriodType === 'custom') return;
    if (selectedPeriodType === 'thisMonth') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else if (selectedPeriodType === 'thisWeek') {
      setCurrentDate(prev => addDaysFns(prev, -7));
    } else if (selectedPeriodType === 'thisYear') {
      setCurrentDate(prev => addMonths(prev, -12));
    } else if (selectedPeriodType === 'today') {
      setCurrentDate(prev => addDaysFns(prev, -1));
    }
  };

  const handleNext = () => {
    if (selectedPeriodType === 'custom') return;
    if (selectedPeriodType === 'thisMonth') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (selectedPeriodType === 'thisWeek') {
      setCurrentDate(prev => addDaysFns(prev, 7));
    } else if (selectedPeriodType === 'thisYear') {
      setCurrentDate(prev => addMonths(prev, 12));
    } else if (selectedPeriodType === 'today') {
      setCurrentDate(prev => addDaysFns(prev, 1));
    }
  };

  const handleDropdownPress = () => setShowDropdown((prev) => !prev);

  const handleDropdownSelect = (option: { value: string; label: string }) => {
    setShowDropdown(false);
    if (option.value === 'custom') {
      setShowDateModal(true);
    } else {
      setSelectedPeriodType(option.value);
    }
  };

  const handleDateModalCancel = () => setShowDateModal(false);
  const handleDateModalConfirm = () => {
    setShowDateModal(false);
    setSelectedPeriodType('custom');
    // You may want to trigger API call here with startDate/endDate
  };

  // Format label for current period
  let periodLabel = '';
  if (selectedPeriodType === 'thisMonth') {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    periodLabel = `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
  } else if (selectedPeriodType === 'thisWeek') {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    periodLabel = `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
  } else if (selectedPeriodType === 'thisYear') {
    periodLabel = format(currentDate, 'yyyy');
  } else if (selectedPeriodType === 'today') {
    periodLabel = format(currentDate, 'dd/MM/yyyy');
  } else if (selectedPeriodType === 'custom') {
    periodLabel = `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
  }

  // Days in current month (for horizontal scroll bar)
  const daysInMonth = selectedPeriodType === 'thisMonth' ? getDaysInMonth(visibleStartDate) : [];

  // Lấy ngày đầu tháng dựa vào visibleStartDate (đã có logic cập nhật theo filter)
  // Chia tháng thành các tuần theo yêu cầu
  function splitMonthToWeeks(date: Date) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const weeks = [];
    let weekStart = new Date(start);
    let d = new Date(start);

    // Tuần đầu: từ ngày 1 đến Chủ nhật đầu tiên hoặc hết tháng
    while (d <= end && getDay(d) !== 0) {
      d = addDaysFns(d, 1);
    }
    if (d > end) d = end;
    weeks.push({ start: new Date(weekStart), end: new Date(d) });

    // Các tuần tiếp theo: Thứ 2 đến Chủ nhật
    weekStart = addDaysFns(d, 1);
    d = new Date(weekStart);
    while (d <= end) {
      let weekEnd = addDaysFns(d, 6 - getDay(d));
      if (weekEnd > end) weekEnd = end;
      weeks.push({ start: new Date(d), end: new Date(weekEnd) });
      d = addDaysFns(weekEnd, 1);
    }
    return weeks;
  }

  // Helper: lấy các ngày trong tuần hiện tại
  function getDaysOfWeek(date: Date): string[] {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const days: string[] = [];
    for (let d = start; d <= end; d = addDaysFns(d, 1)) {
      days.push(format(d, 'dd'));
    }
    return days;
  }
  // Helper: lấy các tháng trong năm
  function getMonthsOfYear(): string[] {
    return Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
  }
  // Chuẩn hóa chia tuần trong tháng (thứ 2 -> chủ nhật)
  function getWeeksOfMonthISO(date: Date): { start: Date; end: Date }[] {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    let current = startOfWeek(start, { weekStartsOn: 1 }); // Bắt đầu từ thứ 2 tuần đầu tiên
    const weeks: { start: Date; end: Date }[] = [];
    while (current <= end) {
      const weekStart = current < start ? start : current;
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 }) > end ? end : endOfWeek(current, { weekStartsOn: 1 });
      weeks.push({ start: weekStart, end: weekEnd });
      current = addDaysFns(weekEnd, 1);
    }
    return weeks;
  }

  // Helper: lấy số tiền theo rule: income nếu khác 0, nếu không thì expense, nếu cả hai đều 0 thì trả về 0
  function getAmount(obj?: { income?: number; expense?: number }) {
    if (!obj) return 0;
    if (obj.income && obj.income !== 0) return obj.income;
    if (obj.expense && obj.expense !== 0) return obj.expense;
    return 0;
  }

  // Replace sampleData and barData logic with API data mapping
  let chartLabels: string[] = [];
  let chartData: number[] = [];
  if (selectedPeriodType === 'thisMonth') {
    const weeks = getWeeksOfMonthISO(currentDate);
    chartLabels = weeks.map(w => `${format(w.start, 'dd')}-${format(w.end, 'dd')}`);
    const apiKeys = weeks.map(w => `${format(w.start, 'yyyy-MM-dd')}_to_${format(w.end, 'yyyy-MM-dd')}`);
    chartData = apiKeys.map(key => getAmount(apiData[key]));
  } else if (selectedPeriodType === 'today') {
    const key = format(currentDate, 'yyyy-MM-dd'); // Sửa lại key cho đúng với API
    chartLabels = [format(currentDate, 'dd')];
    chartData = [getAmount(apiData[key])];
  } else if (selectedPeriodType === 'thisWeek') {
    const days = getDaysOfWeek(currentDate);
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    chartLabels = days;
    chartData = days.map((_, idx) => {
      const d = addDaysFns(start, idx);
      const key = format(d, 'yyyy-MM-dd'); // Sửa lại key cho đúng với API
      return getAmount(apiData[key]);
    });
  } else if (selectedPeriodType === 'thisYear') {
    chartLabels = getMonthsOfYear();
    chartData = chartLabels.map((_, idx) => {
      const month = idx + 1;
      const start = new Date(currentDate.getFullYear(), idx, 1);
      const end = new Date(currentDate.getFullYear(), idx + 1, 0);
      const key = `${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}`;
      return getAmount(apiData[key]);
    });
  } else if (selectedPeriodType === 'custom') {
    // For custom, show one bar for the selected range
    const key = `${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`;
    chartLabels = [`${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`];
    chartData = [getAmount(apiData[key])];
  } else {
    chartLabels = [];
    chartData = [];
  }
  const chartKitData = {
    labels: chartLabels,
    datasets: [{ data: chartData }],
  };
  const chartKitConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: () => 'red', // màu đỏ đặc, không gradient
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForLabels: { fontSize: 10 },
    propsForVerticalLabels: { fontSize: 10 },
    propsForBackgroundLines: { stroke: '#eee' },
  };

  const { width } = Dimensions.get('window');

  // Helper: get total amount based on rule
  function getTotalAmount() {
    if (totalExpense === 0 && totalIncome !== 0) return totalIncome;
    if (totalIncome === 0 && totalExpense !== 0) return totalExpense;
    return totalExpense + totalIncome;
  }

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 16, top: 40, zIndex: 10, padding: 8 }}>
        <Icon name="arrow-left" size={28} color="#222" />
      </TouchableOpacity>
      <Text style={styles.header}>{category_name}</Text>
      {/* Đường line ngăn cách header và body */}
      <View style={styles.headerDivider} />
      
      <View style={styles.dropdownWrapper}>
        <CustomDropdown
          label={periodLabel}
          onPressDropdown={handleDropdownPress}
          onPressPrev={selectedPeriodType === 'custom' ? (() => {}) : handlePrev}
          onPressNext={selectedPeriodType === 'custom' ? (() => {}) : handleNext}
          showDateModal={showDateModal}
          onCloseDateModal={handleDateModalCancel}
          startDate={startDate}
          endDate={endDate}
          onChangeStartDate={setStartDate}
          onChangeEndDate={setEndDate}
          onConfirmDateModal={handleDateModalConfirm}
        />
        {showDropdown && (
          <View style={styles.dropdownMenu}>
            {periodTypeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.dropdownItem}
                onPress={() => handleDropdownSelect(option)}
              >
                <Text style={styles.dropdownText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Chart Container */}
      <View style={styles.chartContainer}>
        <KitBarChart
          data={chartKitData}
          width={width - 32}
          height={220}
          chartConfig={chartKitConfig}
          style={styles.chart}
          showValuesOnTopOfBars={false}
          fromZero={true}
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Tổng cộng</Text>
          <Text style={styles.summaryAmount}>
            {getTotalAmount().toLocaleString('vi-VN')} ₫
          </Text>
        </View>
      </View>

      {/* Transaction List with scroll if long */}
      <View style={styles.transactionContainer}>
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          {chartLabels.map((label, idx) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.transactionItem,
                idx === chartLabels.length - 1 && styles.transactionItemLast
              ]}
            >
              <Text style={styles.transactionLabel}>{label}</Text>
              <View style={styles.transactionAmountContainer}>
                <Text style={styles.transactionAmount}>
                  {chartData[idx].toLocaleString('vi-VN')} ₫
                </Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
   
   fontSize:30,
    ...typography.semibold,
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  dropdownWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 0,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    borderRadius: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    ...typography.semibold,
    color: '#1a1a1a',
  },
  summaryAmount: {
    fontSize: 22,
    ...typography.semibold,
    color: '#E53935',
  },
  transactionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    ...typography.medium,
    flex: 1,
  },
  transactionAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    color: '#E53935',
    ...typography.semibold,
    marginRight: 8,
  },
  chevron: {
    fontSize: 16,
    color: '#bbb',
    ...typography.regular,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
});