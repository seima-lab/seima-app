import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../constants/typography';

interface MonthPickerModalProps {
  visible: boolean;
  currentMonth: string;
  onConfirm: (monthString: string) => void;
  onCancel: () => void;
}

const MonthPickerModal: React.FC<MonthPickerModalProps> = React.memo(({
  visible,
  currentMonth,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();
  
  const [selectedYear, setSelectedYear] = useState(new Date(currentMonth + '-01').getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentMonth + '-01').getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const months = [
    { value: 0, label: t('months.january') },
    { value: 1, label: t('months.february') },
    { value: 2, label: t('months.march') },
    { value: 3, label: t('months.april') },
    { value: 4, label: t('months.may') },
    { value: 5, label: t('months.june') },
    { value: 6, label: t('months.july') },
    { value: 7, label: t('months.august') },
    { value: 8, label: t('months.september') },
    { value: 9, label: t('months.october') },
    { value: 10, label: t('months.november') },
    { value: 11, label: t('months.december') }
  ];

  const currentMonthIndex = new Date(currentMonth + '-01').getMonth();
  const currentYearValue = new Date(currentMonth + '-01').getFullYear();

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
  };

  const handleYearChange = (increment: number) => {
    const newYear = selectedYear + increment;
    setSelectedYear(newYear);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  const handleToggleYearPicker = () => {
    setShowYearPicker(!showYearPicker);
  };

  const handleConfirm = () => {
    const newMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    onConfirm(newMonth);
  };

  const handleCancel = () => {
    // Reset to original values
    setSelectedYear(currentYearValue);
    setSelectedMonth(currentMonthIndex);
    onCancel();
  };

  // Generate years for picker (from 2010 to 2030)
  const years = Array.from({ length: 21 }, (_, i) => 2010 + i);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Year Selection Header */}
          <View style={styles.yearSelectionContainer}>
            <TouchableOpacity 
              style={styles.yearArrowButton}
              onPress={() => handleYearChange(-1)}
            >
              <Icon name="chevron-left" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.yearDisplayContainer}
              onPress={handleToggleYearPicker}
            >
              <Text style={styles.yearDisplayText}>{selectedYear}</Text>
              <Icon 
                name={showYearPicker ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#007AFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.yearArrowButton}
              onPress={() => handleYearChange(1)}
            >
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Year Picker Dropdown */}
          {showYearPicker && (
            <Animated.View 
              style={[
                styles.yearPickerContainer,
                { opacity: 1 }
              ]}
            >
              <ScrollView 
                style={styles.yearPickerScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingVertical: 4 }}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearPickerItem,
                      selectedYear === year && styles.selectedYearPickerItem
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text style={[
                      styles.yearPickerItemText,
                      selectedYear === year && styles.selectedYearPickerItemText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Month Grid */}
          <View style={styles.monthGrid}>
            {months.map((month) => (
              <TouchableOpacity
                key={month.value}
                style={[
                  styles.monthGridItem,
                  selectedMonth === month.value && styles.selectedMonthGridItem
                ]}
                onPress={() => handleMonthSelect(month.value)}
              >
                <Text style={[
                  styles.monthGridItemText,
                  selectedMonth === month.value && styles.selectedMonthGridItemText
                ]}>
                  {month.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.okButton}
              onPress={handleConfirm}
            >
              <Text style={styles.okButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

MonthPickerModal.displayName = 'MonthPickerModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  yearSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  yearArrowButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  yearDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  yearDisplayText: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    marginRight: 8,
  },
  yearPickerContainer: {
    maxHeight: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  yearPickerScroll: {
    maxHeight: 120,
  },
  yearPickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedYearPickerItem: {
    backgroundColor: '#007AFF',
  },
  yearPickerItemText: {
    fontSize: 16,
    ...typography.medium,
    color: '#333',
    textAlign: 'center',
  },
  selectedYearPickerItemText: {
    color: '#FFFFFF',
    ...typography.semibold,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  monthGridItem: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedMonthGridItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  monthGridItemText: {
    fontSize: 14,
    ...typography.medium,
    color: '#333',
    textAlign: 'center',
  },
  selectedMonthGridItemText: {
    color: '#FFFFFF',
    ...typography.semibold,
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    ...typography.medium,
    color: '#007AFF',
  },
  okButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: 16,
    ...typography.medium,
    color: '#FFFFFF',
  },
});

export default MonthPickerModal;
