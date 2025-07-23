import DateTimePicker from '@react-native-community/datetimepicker';
import { addMonths, addWeeks, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type PeriodType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface PeriodFilterBarProps {
  periodType: PeriodType;
  periodValue: string;
  weekReferenceDate: Date;
  customStartDate: Date;
  customEndDate: Date;
  onChangePeriodType: (type: PeriodType) => void;
  onChangePeriodValue: (value: string) => void;
  onChangeWeekReferenceDate: (date: Date) => void;
  onChangeCustomStartDate: (date: Date) => void;
  onChangeCustomEndDate: (date: Date) => void;
}

const periodTypeOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'thisWeek', label: 'Tuần này' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'thisYear', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn' },
];

const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  periodType,
  periodValue,
  weekReferenceDate,
  customStartDate,
  customEndDate,
  onChangePeriodType,
  onChangePeriodValue,
  onChangeWeekReferenceDate,
  onChangeCustomStartDate,
  onChangeCustomEndDate,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(customStartDate);
  const [tempEndDate, setTempEndDate] = useState(customEndDate);
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | null>(null);

  // Format label for current period
  const periodLabel = useMemo(() => {
    const now = new Date();
    switch (periodType) {
      case 'thisMonth': {
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        if (periodValue && periodValue.includes('-')) {
          const parts = periodValue.split('-');
          if (parts.length === 2) {
            const parsedYear = parseInt(parts[0]);
            const parsedMonth = parseInt(parts[1]);
            if (!isNaN(parsedYear) && !isNaN(parsedMonth)) {
              year = parsedYear;
              month = parsedMonth;
            }
          }
        }
        const visibleStartDate = startOfMonth(new Date(year, month - 1));
        const isCurrentMonth =
          visibleStartDate.getFullYear() === now.getFullYear() &&
          visibleStartDate.getMonth() === now.getMonth();
        if (isCurrentMonth) {
          return 'Tháng này';
        } else {
          const start = format(visibleStartDate, 'dd/MM/yyyy');
          const end = format(endOfMonth(visibleStartDate), 'dd/MM/yyyy');
          return `${start} - ${end}`;
        }
      }
      case 'thisWeek': {
        const referenceDate = weekReferenceDate || now;
        const start = format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM/yyyy');
        const end = format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM/yyyy');
        return `${start} - ${end}`;
      }
      case 'thisYear': {
        let year = now.getFullYear();
        if (periodValue) {
          const parsedYear = parseInt(periodValue);
          if (!isNaN(parsedYear)) year = parsedYear;
        }
        return `${year}`;
      }
      case 'today': {
        let targetDate = now;
        if (periodValue && periodValue !== 'today') {
          const parsedDate = new Date(periodValue);
          if (!isNaN(parsedDate.getTime())) targetDate = parsedDate;
        }
        return format(targetDate, 'dd/MM/yyyy');
      }
      case 'custom': {
        return `${format(customStartDate, 'dd/MM/yyyy')} - ${format(customEndDate, 'dd/MM/yyyy')}`;
      }
      default:
        return '';
    }
  }, [periodType, periodValue, weekReferenceDate, customStartDate, customEndDate]);

  // Navigation logic
  const handlePrev = () => {
    switch (periodType) {
      case 'thisMonth': {
        let year = new Date().getFullYear();
        let month = new Date().getMonth() + 1;
        if (periodValue && periodValue.includes('-')) {
          const parts = periodValue.split('-');
          if (parts.length === 2) {
            const parsedYear = parseInt(parts[0]);
            const parsedMonth = parseInt(parts[1]);
            if (!isNaN(parsedYear) && !isNaN(parsedMonth)) {
              year = parsedYear;
              month = parsedMonth;
            }
          }
        }
        const prev = subMonths(new Date(year, month - 1), 1);
        const newPeriod = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
        onChangePeriodValue(newPeriod);
        break;
      }
      case 'thisWeek': {
        const prev = subWeeks(weekReferenceDate, 1);
        onChangeWeekReferenceDate(prev);
        break;
      }
      case 'thisYear': {
        let year = new Date().getFullYear();
        if (periodValue) {
          const parsedYear = parseInt(periodValue);
          if (!isNaN(parsedYear)) year = parsedYear;
        }
        onChangePeriodValue((year - 1).toString());
        break;
      }
      case 'today': {
        let targetDate = new Date();
        if (periodValue && periodValue !== 'today') {
          const parsedDate = new Date(periodValue);
          if (!isNaN(parsedDate.getTime())) targetDate = parsedDate;
        }
        const prev = subDays(targetDate, 1);
        onChangePeriodValue(format(prev, 'yyyy-MM-dd'));
        break;
      }
      case 'custom': {
        const daysDiff = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (24 * 60 * 60 * 1000));
        const newStart = subDays(customStartDate, daysDiff + 1);
        const newEnd = subDays(customEndDate, daysDiff + 1);
        onChangeCustomStartDate(newStart);
        onChangeCustomEndDate(newEnd);
        break;
      }
    }
  };

  const handleNext = () => {
    switch (periodType) {
      case 'thisMonth': {
        let year = new Date().getFullYear();
        let month = new Date().getMonth() + 1;
        if (periodValue && periodValue.includes('-')) {
          const parts = periodValue.split('-');
          if (parts.length === 2) {
            const parsedYear = parseInt(parts[0]);
            const parsedMonth = parseInt(parts[1]);
            if (!isNaN(parsedYear) && !isNaN(parsedMonth)) {
              year = parsedYear;
              month = parsedMonth;
            }
          }
        }
        const next = addMonths(new Date(year, month - 1), 1);
        const newPeriod = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
        onChangePeriodValue(newPeriod);
        break;
      }
      case 'thisWeek': {
        const next = addWeeks(weekReferenceDate, 1);
        onChangeWeekReferenceDate(next);
        break;
      }
      case 'thisYear': {
        let year = new Date().getFullYear();
        if (periodValue) {
          const parsedYear = parseInt(periodValue);
          if (!isNaN(parsedYear)) year = parsedYear;
        }
        onChangePeriodValue((year + 1).toString());
        break;
      }
      case 'today': {
        let targetDate = new Date();
        if (periodValue && periodValue !== 'today') {
          const parsedDate = new Date(periodValue);
          if (!isNaN(parsedDate.getTime())) targetDate = parsedDate;
        }
        const next = addDays(targetDate, 1);
        onChangePeriodValue(format(next, 'yyyy-MM-dd'));
        break;
      }
      case 'custom': {
        const daysDiff = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (24 * 60 * 60 * 1000));
        const newStart = addDays(customStartDate, daysDiff + 1);
        const newEnd = addDays(customEndDate, daysDiff + 1);
        onChangeCustomStartDate(newStart);
        onChangeCustomEndDate(newEnd);
        break;
      }
    }
  };

  // Helper for days
  function addDays(date: Date, amount: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  }
  function subDays(date: Date, amount: number) {
    const d = new Date(date);
    d.setDate(d.getDate() - amount);
    return d;
  }

  // Dropdown select
  const handleDropdownSelect = (option: { value: string; label: string }) => {
    setShowDropdown(false);
    if (option.value === 'custom') {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
      setShowDateModal(true);
    }
    onChangePeriodType(option.value as PeriodType);
  };

  // Confirm custom date
  const handleDateModalConfirm = () => {
    setShowDateModal(false);
    onChangeCustomStartDate(tempStartDate);
    onChangeCustomEndDate(tempEndDate);
    onChangePeriodType('custom');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowButton} onPress={handlePrev}>
        <Icon name="chevron-left" size={24} color="#666" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowDropdown((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{periodLabel}</Text>
        <Icon name="chevron-down" size={16} color="#666" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.arrowButton} onPress={handleNext}>
        <Icon name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
      {/* Dropdown menu */}
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
      {/* Modal chọn ngày tuỳ chỉnh */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn khoảng ngày</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setFocusedInput('start')}
              >
                <Text style={styles.dateText}>{format(tempStartDate, 'dd/MM/yyyy')}</Text>
                <Text style={styles.dateLabel}>Từ ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setFocusedInput('end')}
              >
                <Text style={styles.dateText}>{format(tempEndDate, 'dd/MM/yyyy')}</Text>
                <Text style={styles.dateLabel}>Đến ngày</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDateModal(false)}>
                <Text style={styles.cancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleDateModalConfirm}>
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            </View>
            {focusedInput && (
              <DateTimePicker
                value={focusedInput === 'start' ? tempStartDate : tempEndDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  if (date) {
                    if (focusedInput === 'start') setTempStartDate(date);
                    else setTempEndDate(date);
                  }
                  setFocusedInput(null);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  arrowButton: {
    padding: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'center',
    justifyContent: 'center',
    elevation: 2,
    minWidth: 120,
    maxWidth: 240,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: '50%',
    width: 120,
    transform: [{ translateX: -60 }],
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 260,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  dateButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PeriodFilterBar; 