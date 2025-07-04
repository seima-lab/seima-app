import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const defaultCategory = {
  id: '2',
  name: 'Ăn uống',
  icon: 'restaurant',
  color: '#FF7043',
  backgroundColor: '#FFF3E0',
};

const defaultAccount = {
  id: 'all',
  name: 'Tất cả tài khoản',
  icon: 'account-balance-wallet',
};

const repeatOptions = [
  { label: 'Hàng tháng', value: 'monthly' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Không lặp lại', value: 'none' },
];

const AddBudgetLimitScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [account, setAccount] = useState(defaultAccount);
  const [repeat, setRepeat] = useState(repeatOptions[0]);
  const [startDate, setStartDate] = useState('01/07/2025');
  const [endDate, setEndDate] = useState('Không xác định');
  const [carryOver, setCarryOver] = useState(false);

  // Handlers (bạn có thể mở modal hoặc navigation ở đây)
  const handleSelectCategory = () => {};
  const handleSelectAccount = () => {};
  const handleSelectRepeat = () => {};
  const handleSelectStartDate = () => {};
  const handleSelectEndDate = () => {};
  const handleSave = () => {};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F8FD' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8FD" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}> 
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thêm hạn mức</Text>
            <TouchableOpacity>
              <Icon name="check" size={24} color="#1e90ff" />
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Số tiền</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#1e90ff"
            />
            <Text style={styles.amountCurrency}>đ</Text>
          </View>

          {/* Card Group */}
          <View style={styles.cardGroup}>
            {/* Tên hạn mức */}
            <TouchableOpacity style={styles.cardRow}>
              <Icon name="emoji-events" size={22} color="#F9A825" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Tên hạn mức</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardValue}>Hạn mức chi</Text>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            {/* Hạng mục chi */}
            <TouchableOpacity style={styles.cardRow} onPress={handleSelectCategory}>
              <Icon name="category" size={22} color="#26C6DA" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Hạng mục chi</Text>
              <View style={{ flex: 1 }} />
              <View style={styles.categoryBox}>
                <Icon name={category.icon} size={20} color={category.color} />
              </View>
              <Text style={styles.cardValue}>{category.name}</Text>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            {/* Tài khoản */}
            <TouchableOpacity style={styles.cardRow} onPress={handleSelectAccount}>
              <Icon name="account-balance-wallet" size={22} color="#1976D2" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Tài khoản</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardValue}>{account.name}</Text>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            {/* Lặp lại */}
            <TouchableOpacity style={styles.cardRow} onPress={handleSelectRepeat}>
              <Icon name="autorenew" size={22} color="#43A047" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Lặp lại</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardValue}>{repeat.label}</Text>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            {/* Ngày bắt đầu */}
            <TouchableOpacity style={styles.cardRow} onPress={handleSelectStartDate}>
              <Icon name="event" size={22} color="#1e90ff" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Ngày bắt đầu</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardValue}>{startDate}</Text>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            {/* Ngày kết thúc */}
            <TouchableOpacity style={styles.cardRow} onPress={handleSelectEndDate}>
              <Icon name="event-busy" size={22} color="#BDBDBD" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Ngày kết thúc</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardValue}>{endDate}</Text>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </TouchableOpacity>
          </View>

          {/* Đồn sang kỳ sau */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Đồn sang kì sau</Text>
            <Switch
              value={carryOver}
              onValueChange={setCarryOver}
              thumbColor={carryOver ? '#1e90ff' : '#BDBDBD'}
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
            />
          </View>
          <Text style={styles.switchNote}>
            Số tiền dư hoặc bội chi sẽ được chuyển sang kỳ sau
          </Text>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#F5F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  amountBox: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e90ff',
    textAlign: 'center',
    marginBottom: 2,
  },
  amountCurrency: {
    fontSize: 18,
    color: '#1e90ff',
    fontWeight: '600',
  },
  cardGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 15,
    color: '#1e90ff',
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  switchNote: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddBudgetLimitScreen; 