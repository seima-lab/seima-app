import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigationService } from '../navigation/NavigationService';

const { width } = Dimensions.get('window');

const REPEAT_OPTIONS = [
  { label: 'Không lặp lại', value: 'none' },
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' },
  { label: 'Hàng quý', value: 'quarterly' },
  { label: 'Hàng năm', value: 'yearly' }
];

const BudgetLimitScreen = () => {
  const [amount, setAmount] = useState('');
  const [limitName, setLimitName] = useState('');
  const [carryOver, setCarryOver] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState('monthly');
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Convert to number and format with commas
    if (numericValue) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(parseInt(numericValue, 10));
    }
    return '';
  };

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    setAmount(cleanedText);
  };

  const handleRepeatSelect = (frequency: string) => {
    setRepeatFrequency(frequency);
    setShowRepeatModal(false);
  };

  const getRepeatLabel = (frequency: string) => {
    const option = REPEAT_OPTIONS.find(opt => opt.value === frequency);
    return option ? option.label : 'Hàng tháng';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleStartDateSelect = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    setStartDate(selectedDate);
    setShowStartDateModal(false);

    // Reset end date if it's before the new start date
    if (endDate && selectedDate > endDate) {
      setEndDate(null);
      setHasEndDate(false);
    }
  };

  const handleEndDateSelect = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    setEndDate(selectedDate);
    setShowEndDateModal(false);
    setHasEndDate(true);
  };

  const toggleEndDate = () => {
    if (hasEndDate) {
      setHasEndDate(false);
      setEndDate(null);
    } else {
      setHasEndDate(true);
      setEndDate(new Date());
    }
  };

  const renderDatePickerModal = (
    isStartDate: boolean, 
    selectedDate: Date, 
    showModal: boolean, 
    setShowModal: (show: boolean) => void,
    onDateSelect: (day: { dateString: string }) => void
  ) => (
    <Modal
      transparent={true}
      visible={showModal}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.dateModalOverlay}>
        <View style={styles.dateModalContainer}>
          <View style={styles.dateModalHeader}>
            <Text style={styles.dateModalTitle}>
              {isStartDate ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <Calendar
            current={selectedDate.toISOString().split('T')[0]}
            onDayPress={onDateSelect}
            markedDates={{
              [selectedDate.toISOString().split('T')[0]]: {
                selected: true,
                selectedColor: '#007AFF'
              }
            }}
            theme={{
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#007AFF',
              arrowColor: '#007AFF',
            }}
          />
          <TouchableOpacity 
            style={styles.dateModalConfirmButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.dateModalConfirmButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F8FD' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8FD" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thêm hạn mức</Text>
            <TouchableOpacity>
              <Icon name="check" size={24} color="#1e90ff" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountBox}>
            <TextInput
              style={styles.amount}
              value={formatCurrency(amount)}
              onChangeText={handleAmountChange}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.currencySymbol}>₫</Text>
          </View>

          {/* Budget Limit Name */}
          <View style={styles.item}>
            <Icon name="text" size={24} color="#555" />
            <TextInput
              style={styles.nameInput}
              value={limitName}
              onChangeText={setLimitName}
              placeholder="Nhập tên hạn mức"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>

          {/* Category */}
          <View style={styles.item}>
            <Icon name="food" size={24} color="#555" />
            <Text style={styles.label}>Ăn uống</Text>
          </View>

          {/* Account */}
          <View style={styles.item}>
            <Icon name="wallet-outline" size={24} color="#555" />
            <Text style={styles.label}>Tất cả tài khoản</Text>
          </View>

          {/* Repeat */}
          <TouchableOpacity
            style={styles.item}
            onPress={() => setShowRepeatModal(true)}
          >
            <Icon name="repeat" size={24} color="#555" />
            <Text style={styles.label}>
              {getRepeatLabel(repeatFrequency)}
            </Text>
          </TouchableOpacity>

          {/* Repeat Frequency Modal */}
          <Modal
            transparent={true}
            visible={showRepeatModal}
            animationType="slide"
            onRequestClose={() => setShowRepeatModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Chọn chu kỳ lặp</Text>
                {REPEAT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalItem,
                      repeatFrequency === option.value && styles.modalItemSelected
                    ]}
                    onPress={() => handleRepeatSelect(option.value)}
                  >
                    <Text style={styles.modalItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowRepeatModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Start Date */}
          <TouchableOpacity
            style={styles.item}
            onPress={() => setShowStartDateModal(true)}
          >
            <Icon name="calendar-start" size={24} color="#555" />
            <Text style={styles.label}>
              {`Ngày bắt đầu: ${formatDate(startDate)}`}
            </Text>
          </TouchableOpacity>

          {/* End Date */}
          <View style={styles.item}>
            <TouchableOpacity 
              style={styles.endDateToggle} 
              onPress={toggleEndDate}
            >
              <Icon 
                name={hasEndDate ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={24} 
                color="#555" 
              />
              <Text style={styles.label}>Có ngày kết thúc</Text>
            </TouchableOpacity>
          </View>

          {hasEndDate && (
            <TouchableOpacity
              style={styles.item}
              onPress={() => setShowEndDateModal(true)}
            >
              <Icon name="calendar-end" size={24} color="#555" />
              <Text style={styles.label}>
                {endDate 
                  ? `Ngày kết thúc: ${formatDate(endDate)}` 
                  : 'Chọn ngày kết thúc'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Custom Date Picker Modals */}
          {renderDatePickerModal(
            true, 
            startDate, 
            showStartDateModal, 
            setShowStartDateModal, 
            handleStartDateSelect
          )}

          {hasEndDate && renderDatePickerModal(
            false, 
            endDate || new Date(), 
            showEndDateModal, 
            setShowEndDateModal, 
            handleEndDateSelect
          )}

          {/* Carry Over */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Dồn sang kì sau</Text>
            <Switch value={carryOver} onValueChange={setCarryOver} />
          </View>
          <Text style={styles.helperText}>
            Số tiền dư hoặc bội chi sẽ được chuyển sang kỳ sau
          </Text>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Lưu lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BudgetLimitScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#E6F3FB',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  amountBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 100,
  },
  currencySymbol: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
  },
  label: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletListOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  walletListModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  walletListTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#222',
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#F5F8FD',
  },
  walletItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1e90ff',
  },
  walletName: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  walletBalance: {
    fontSize: 13,
    color: '#888',
  },
  walletListClose: {
    marginTop: 12,
    alignItems: 'center',
  },
  walletListCloseText: {
    color: '#1e90ff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  nameInput: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '85%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalItem: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New date-related styles
  endDateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePicker: {
    backgroundColor: '#F5F8FD',
    borderRadius: 10,
    marginBottom: 12,
  },
  // New date modal styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateModalConfirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateModalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
