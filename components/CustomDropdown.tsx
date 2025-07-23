import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomDropdownProps {
  label: string;
  onPressDropdown?: () => void;
  onPressPrev: () => void;
  onPressNext: () => void;
  showDateModal?: boolean;
  onCloseDateModal?: () => void;
  startDate?: Date;
  endDate?: Date;
  onChangeStartDate?: (date: Date) => void;
  onChangeEndDate?: (date: Date) => void;
  onConfirmDateModal?: () => void;
  style?: object;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  onPressDropdown,
  onPressPrev,
  onPressNext,
  showDateModal = false,
  onCloseDateModal,
  startDate = new Date(),
  endDate = new Date(),
  onChangeStartDate,
  onChangeEndDate,
  onConfirmDateModal,
  style,
}) => {
  const [showPicker, setShowPicker] = React.useState<'start' | 'end' | null>(null);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.arrowButton} onPress={onPressPrev}>
        <Icon name="chevron-left" size={24} color="#666" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={onPressDropdown}
        activeOpacity={0.7}
      >
        <Text
          style={styles.label}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
        <Icon name="chevron-down" size={16} color="#666" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.arrowButton} onPress={onPressNext}>
        <Icon name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>

      {/* Modal chọn ngày, chỉ show khi showDateModal true */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseDateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn khoảng ngày</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPicker('start')}
              >
                <Text style={styles.dateText}>
                  {startDate.toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.dateLabel}>Từ ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPicker('end')}
              >
                <Text style={styles.dateText}>
                  {endDate.toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.dateLabel}>Đến ngày</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCloseDateModal}
              >
                <Text style={styles.cancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirmDateModal}
              >
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            </View>
            {showPicker && (
              <DateTimePicker
                value={showPicker === 'start' ? startDate : endDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  if (date) {
                    if (showPicker === 'start' && onChangeStartDate) onChangeStartDate(date);
                    else if (showPicker === 'end' && onChangeEndDate) onChangeEndDate(date);
                  }
                  setShowPicker(null);
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
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 10,
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
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
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

export default CustomDropdown; 