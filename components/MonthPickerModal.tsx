import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../constants/typography';

const { width: screenWidth } = Dimensions.get('window');

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
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setSelectedYear(new Date(currentMonth + '-01').getFullYear());
      setSelectedMonth(new Date(currentMonth + '-01').getMonth());
      setShowYearPicker(false);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      slideAnim.setValue(50);
    }
  }, [visible, currentMonth, fadeAnim, scaleAnim, slideAnim]);
  
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
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIndicator} />
            <Text style={styles.headerTitle}>{t('calendar.selectMonth')}</Text>
          </View>

          {/* Year Selection */}
          <View style={styles.yearSection}>
            <Text style={styles.sectionLabel}>{t('calendar.year')}</Text>
            <View style={styles.yearSelectionContainer}>
              <TouchableOpacity 
                style={styles.yearNavButton}
                onPress={() => handleYearChange(-1)}
              >
                <Icon name="chevron-left" size={24} color="#4A90E2" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.yearDisplayContainer, showYearPicker && styles.yearDisplayActive]}
                onPress={handleToggleYearPicker}
              >
                <Text style={styles.yearDisplayText}>{selectedYear}</Text>
                <Icon 
                  name={showYearPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#4A90E2" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.yearNavButton}
                onPress={() => handleYearChange(1)}
              >
                <Icon name="chevron-right" size={24} color="#4A90E2" />
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
                  contentContainerStyle={styles.yearPickerContent}
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
          </View>

          {/* Month Selection */}
          <View style={styles.monthSection}>
            <Text style={styles.sectionLabel}>{t('calendar.month')}</Text>
            <View style={styles.monthGrid}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.monthGridItem,
                    selectedMonth === month.value && styles.selectedMonthGridItem
                  ]}
                  onPress={() => handleMonthSelect(month.value)}
                  activeOpacity={0.7}
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
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

MonthPickerModal.displayName = 'MonthPickerModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: Math.min(screenWidth - 40, 380),
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  headerIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    ...typography.semibold,
    color: '#1C1C1E',
  },
  yearSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  monthSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    ...typography.semibold,
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  yearDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 140,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  yearDisplayActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#4A90E2',
  },
  yearDisplayText: {
    fontSize: 18,
    ...typography.semibold,
    color: '#1C1C1E',
    marginRight: 8,
  },
  yearPickerContainer: {
    maxHeight: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  yearPickerScroll: {
    maxHeight: 160,
  },
  yearPickerContent: {
    paddingVertical: 8,
  },
  yearPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  selectedYearPickerItem: {
    backgroundColor: '#4A90E2',
  },
  yearPickerItemText: {
    fontSize: 16,
    ...typography.medium,
    color: '#1C1C1E',
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
    gap: 12,
  },
  monthGridItem: {
    width: '30%',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedMonthGridItem: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  monthGridItemText: {
    fontSize: 14,
    ...typography.medium,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  selectedMonthGridItemText: {
    color: '#FFFFFF',
    ...typography.semibold,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelButtonText: {
    fontSize: 16,
    ...typography.semibold,
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    ...typography.semibold,
    color: '#FFFFFF',
  },
});

export default MonthPickerModal;
