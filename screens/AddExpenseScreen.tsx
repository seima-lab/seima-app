import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Modal,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconBack from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';

const CATEGORIES = [
  { key: 'daily', label: 'categoryNames.daily', icon: 'bottle-soda', color: '#1e90ff' },
  { key: 'food', label: 'categoryNames.food', icon: 'silverware-fork-knife', color: '#1e90ff' },
  { key: 'clothes', label: 'categoryNames.clothes', icon: 'tshirt-crew', color: '#1e90ff' },
  { key: 'cosmetic', label: 'categoryNames.cosmetic', icon: 'lipstick', color: '#1e90ff' },
  { key: 'social', label: 'categoryNames.social', icon: 'glass-cocktail', color: '#1e90ff' },
  { key: 'health', label: 'categoryNames.health', icon: 'pill', color: '#1e90ff' },
  { key: 'education', label: 'categoryNames.education', icon: 'book-open-variant', color: '#1e90ff' },
  { key: 'electric', label: 'categoryNames.electric', icon: 'flash', color: '#1e90ff' },
  { key: 'transport', label: 'categoryNames.transport', icon: 'train', color: '#1e90ff' },
  { key: 'phone', label: 'categoryNames.phone', icon: 'cellphone', color: '#1e90ff' },
  { key: 'rent', label: 'categoryNames.rent', icon: 'home-city', color: '#1e90ff' },
  { key: 'edit', label: 'edit', icon: 'pencil', color: '#1e90ff' },
];

const INCOME_CATEGORIES = [
  { key: 'salary', label: 'categoryNames.salary', icon: 'cash', color: '#1e90ff' },
  { key: 'bonus', label: 'categoryNames.bonus', icon: 'gift', color: '#1e90ff' },
  { key: 'investment', label: 'categoryNames.investment', icon: 'chart-line', color: '#1e90ff' },
  { key: 'freelance', label: 'categoryNames.freelance', icon: 'laptop', color: '#1e90ff' },
  { key: 'business', label: 'categoryNames.business', icon: 'store', color: '#1e90ff' },
  { key: 'rental', label: 'categoryNames.rental', icon: 'home-account', color: '#1e90ff' },
  { key: 'dividend', label: 'categoryNames.dividend', icon: 'bank', color: '#1e90ff' },
  { key: 'interest', label: 'categoryNames.interest', icon: 'percent', color: '#1e90ff' },
  { key: 'gift_money', label: 'categoryNames.giftMoney', icon: 'hand-heart', color: '#1e90ff' },
  { key: 'other_income', label: 'categoryNames.otherIncome', icon: 'plus-circle', color: '#1e90ff' },
  { key: 'passive', label: 'categoryNames.passive', icon: 'autorenew', color: '#1e90ff' },
  { key: 'edit_income', label: 'edit', icon: 'pencil', color: '#1e90ff' },
];

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('daily');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const openDatePicker = () => {
    setTempDate(date);
    setShowDate(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmDate = () => {
    setDate(tempDate);
    setShowDate(false);
  };

  const handleCancelDate = () => {
    setShowDate(false);
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  };

  const handleCameraPress = () => {
    // TODO: Implement camera functionality for receipt scanning
    console.log('Camera pressed - will implement receipt scanning');
    // You can add camera/image picker logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar - Thêm phần này */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />
      
      <View style={styles.headerRow}> 
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <IconBack name="arrow-back" size={22} color="#1e90ff" />
        </TouchableOpacity>
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'expense' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('expense');
              setSelectedCategory('daily');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>{t('expense')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'income' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('income');
              setSelectedCategory('salary');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>{t('incomeLabel')}</Text>
          </TouchableOpacity>
        </View>
        {/* Camera Icon - Only show for expense tab */}
        {activeTab === 'expense' && (
          <TouchableOpacity style={styles.cameraBtn} onPress={handleCameraPress}>
            <Icon name="camera" size={24} color="#1e90ff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Date */}
      <View style={styles.row}>
        <Text style={styles.label}>{t('date')}</Text>
        <View style={styles.dateContainer}>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => adjustDate(-1)}
          >
            <IconBack name="chevron-left" size={20} color="#333" />
          </TouchableOpacity>
          <Pressable 
            style={styles.dateValue}
            onPress={openDatePicker}
          >
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </Pressable>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => adjustDate(1)}
          >
            <IconBack name="chevron-right" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDate}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              themeVariant="light"
              style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelDate}>
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmDate}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ghi chú */}
      <View style={styles.row}>
        <Text style={styles.label}>{t('note')}</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder={t('notePlaceholder')}
          value={note}
          onChangeText={setNote}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Amount */}
      <View style={styles.row}>
        <Text style={styles.label}>{activeTab === 'expense' ? t('expense') : t('incomeLabel')}</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />
          <Text style={styles.currencyText}>{t('currency')}</Text>
        </View>
      </View>

      {/* Categories */}
      <Text style={[styles.label, styles.categoryTitle]}>{t('category')}</Text>
      <FlatList
        data={activeTab === 'expense' ? CATEGORIES : INCOME_CATEGORIES}
        numColumns={3}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.category,
              selectedCategory === item.key && styles.categoryActive
            ]}
            onPress={() => {
              if (item.key === 'edit' || item.key === 'edit_income') {
                navigation.navigate('EditCategoryScreen', { type: activeTab });
              } else {
                setSelectedCategory(item.key);
              }
            }}
          >
            <Icon name={item.icon} size={28} color={item.color} />
            <Text style={styles.categoryText}>{t(item.label)}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.categoriesContainer}
      />

      {/* Button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          {activeTab === 'expense' ? t('addExpenseButton') : t('addIncomeButton')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 16,
    paddingTop: 8, // Thêm padding top
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20, // Thêm margin bottom
    paddingVertical: 8, // Thêm padding vertical
  },
  backBtn: {
    position: 'absolute',
    left: 0, // Sửa từ 10 thành 0
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#ededed',
    borderRadius: 16,
    width: 200,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2, // Thêm margin
  },
  tabItemActive: {
    backgroundColor: '#1e90ff',
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3, // Thêm elevation cho Android
  },
  tabText: {
    color: '#1e90ff',
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#fff',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, // Tăng margin
    paddingVertical: 4, // Thêm padding
  },
  label: { 
    fontSize: 16, 
    color: '#333', 
    fontWeight: '500', 
    width: 80,
    marginRight: 12, // Thêm margin right
  },
  dateContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dateArrow: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateValue: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#1e90ff',
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12, // Tăng padding
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333', // Thêm màu text
  },
  noteInput: {
    flex: 1,
  },
  amountContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
  },
  currencyText: { 
    marginLeft: 8, 
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  categoryTitle: {
    marginTop: 8,
    marginBottom: 12,
    width: 'auto', // Sửa width
  },
  categoriesContainer: { 
    marginTop: 8,
    paddingBottom: 20, // Thêm padding bottom
  },
  category: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    minHeight: 80, // Thêm min height
  },
  categoryActive: {
    borderColor: '#1e90ff',
    backgroundColor: '#e6f2ff',
  },
  categoryText: { 
    fontSize: 12, 
    color: '#333', 
    marginTop: 6, // Tăng margin
    textAlign: 'center',
    lineHeight: 16, // Thêm line height
  },
  button: {
    backgroundColor: '#1e90ff',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Thêm margin bottom
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Thêm elevation cho Android
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 6,
  },
  modalButtonConfirm: {
    backgroundColor: '#1e90ff',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontWeight: 'bold',
  },
  iosDatePicker: {
    backgroundColor: '#fff',
    marginVertical: 10,
  },
});