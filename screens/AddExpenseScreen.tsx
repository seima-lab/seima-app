import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
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
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { categoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { CreateTransactionRequest, transactionService, TransactionType } from '../services/transactionService';
import { WalletResponse, walletService } from '../services/walletService';

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // State
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Wallet selection state
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  
  // Categories state
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction saving state
  const [saving, setSaving] = useState(false);

  // Load categories and wallets when component mounts or tab changes
  useEffect(() => {
    loadCategories();
    loadWallets();
  }, [activeTab]);

  const loadWallets = async () => {
    if (!user) {
      setLoadingWallets(false);
      return;
    }

    setLoadingWallets(true);
    
    try {
      console.log('🔄 Loading wallets for user:', user.id);
      
      const userId = parseInt(user.id) || 1;
      const userWallets = await walletService.getAllWallets(userId);
      
      console.log('💳 Loaded wallets:', userWallets);
      
      setWallets(userWallets);
      
      // Auto-select default wallet or first wallet
      if (userWallets.length > 0 && !selectedWallet) {
        const defaultWallet = userWallets.find(wallet => wallet.isDefault);
        setSelectedWallet(defaultWallet ? defaultWallet.walletId : userWallets[0].walletId);
      }
      
    } catch (err: any) {
      console.error('❌ Failed to load wallets:', err);
      Alert.alert(
        t('common.error'),
        'Failed to load wallets. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingWallets(false);
    }
  };

  const loadCategories = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading categories for AddExpense:', { activeTab, userId: user.id });
      
      // Convert tab to CategoryType
      const categoryType = activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME;
      
      // For now, using hardcoded userId and groupId - you should get these from user context
      const userId = parseInt(user.id) || 1;
      const groupId = 1; // You might want to get this from user context or app state
      
      // Fetch categories from API
      const apiCategories = await categoryService.getAllCategoriesByTypeAndUser(
        categoryType,
        userId,
        groupId
      );
      
      console.log('📊 API categories received for AddExpense:', apiCategories);
      console.log('📊 Categories count:', apiCategories.length);
      console.log('📊 Active tab:', activeTab, 'CategoryType:', categoryType);
      
      // Convert API categories to local format
      const localCategories = apiCategories.map(apiCategory => 
        categoryService.convertToLocalCategory(apiCategory)
      );
      
      console.log('📊 Local categories after conversion:', localCategories);
      
      // Add edit category option at the end
      const editCategory: LocalCategory = {
        key: 'edit',
        label: 'Edit Categories',
        icon: 'pencil',
        color: '#1e90ff'
      };
      
      const categoriesWithEdit = [...localCategories, editCategory];
      
      console.log('🔄 Converted categories for AddExpense:', categoriesWithEdit);
      
      setCategories(categoriesWithEdit);
      
      // Auto-select first category if none selected
      if (!selectedCategory && localCategories.length > 0) {
        setSelectedCategory(localCategories[0].key);
      }
      
    } catch (err: any) {
      console.error('❌ Failed to load categories in AddExpense:', err);
      setError(err.message || 'Failed to load categories');
      
      // Fallback to default categories
      const categoryType = activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME;
      const defaultCategories = categoryService.getDefaultCategories(categoryType);
      
      // Add edit category option
      const editCategory: LocalCategory = {
        key: 'edit',
        label: 'Edit Categories',
        icon: 'pencil',
        color: '#1e90ff'
      };
      
      setCategories([...defaultCategories, editCategory]);
      
      if (!selectedCategory && defaultCategories.length > 0) {
        setSelectedCategory(defaultCategories[0].key);
      }
      
      Alert.alert(
        t('common.error'),
        'Failed to load categories from server. Using default categories.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: 'expense' | 'income') => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      setSelectedCategory(''); // Reset selected category when switching tabs
    }
  };

  const openDatePicker = () => {
    setTempDate(date);
    setShowDate(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDate(false);
      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
      }
    } else {
      // iOS - update temp date for confirmation
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirmDate = () => {
    setDate(tempDate);
    setShowDate(false);
  };

  const handleCancelDate = () => {
    setTempDate(date); // Reset to original date
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
    Alert.alert(
      'Camera Feature',
      'Receipt scanning feature will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleCategoryPress = (category: LocalCategory) => {
    if (category.key === 'edit') {
      navigation.navigate('EditCategoryScreen', { type: activeTab });
    } else {
      setSelectedCategory(category.key);
    }
  };

  const handleSaveTransaction = async () => {
    // Validate inputs
    if (!amount.trim()) {
      Alert.alert(t('common.error'), 'Please enter an amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert(t('common.error'), 'Please select a category');
      return;
    }

    if (!selectedWallet) {
      Alert.alert(t('common.error'), 'Please select a wallet');
      return;
    }

    if (!user) {
      Alert.alert(t('common.error'), 'User not authenticated');
      return;
    }

    // Find the selected category to get its ID
    const selectedCategoryData = categories.find(cat => cat.key === selectedCategory);
    if (!selectedCategoryData || selectedCategoryData.key === 'edit') {
      Alert.alert(t('common.error'), 'Invalid category selected');
      return;
    }

    setSaving(true);

    try {
      // Prepare transaction data
      const transactionData: CreateTransactionRequest = {
        user_id: parseInt(user.id) || 1,
        wallet_id: selectedWallet || 1,
        category_id: parseInt(selectedCategoryData.key), // Assuming category key is the ID
        group_id: 1, // Default group ID
        transaction_type: activeTab === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME,
        amount: parseFloat(amount),
        currency_code: 'VND', // Default currency
        transaction_date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        description: note.trim() || undefined,
        receipt_image: null, // TODO: Implement image upload
        payee_payer_name: undefined, // Optional field
      };

      console.log('💰 Saving transaction:', transactionData);

      // Call the appropriate API method
      let savedTransaction;
      if (activeTab === 'expense') {
        savedTransaction = await transactionService.createExpense(transactionData);
      } else {
        savedTransaction = await transactionService.createIncome(transactionData);
      }

      console.log('✅ Transaction saved successfully:', savedTransaction);

      Alert.alert(
        t('common.success'),
        `${activeTab === 'expense' ? 'Expense' : 'Income'} saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setAmount('');
              setNote('');
              setDate(new Date());
              // Keep selected category for convenience
              
              // Navigate back or to main screen
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Failed to save transaction:', error);
      
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to save transaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: LocalCategory }) => (
    <TouchableOpacity
      style={[
        styles.category,
        selectedCategory === item.key && styles.categoryActive
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Icon name={item.icon} size={28} color={item.color} />
      <Text style={styles.categoryText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}> 
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <IconBack name="arrow-back" size={22} color="#1e90ff" />
            </TouchableOpacity>
            <View style={styles.tabSwitch}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'expense' && styles.tabItemActive]}
                onPress={() => handleTabChange('expense')}
              >
                <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>{t('expense')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'income' && styles.tabItemActive]}
                onPress={() => handleTabChange('income')}
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

          {/* Date Picker - Platform specific */}
          {Platform.OS === 'ios' ? (
            <Modal
              visible={showDate}
              transparent
              animationType="slide"
              onRequestClose={handleCancelDate}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.iosModalContent}>
                  <View style={styles.iosModalHeader}>
                    <TouchableOpacity onPress={handleCancelDate}>
                      <Text style={styles.iosModalButtonCancel}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.iosModalTitle}>Select Date</Text>
                    <TouchableOpacity onPress={handleConfirmDate}>
                      <Text style={styles.iosModalButtonConfirm}>{t('common.confirm')}</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    themeVariant="light"
                    style={styles.iosDatePicker}
                    textColor="#000"
                  />
                </View>
              </View>
            </Modal>
          ) : (
            showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                themeVariant="light"
              />
            )
          )}

          {/* Wallet Selection */}
          <View style={styles.row}>
            <Text style={styles.label}>Ví</Text>
            {loadingWallets ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1e90ff" />
              </View>
            ) : (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowWalletPicker(!showWalletPicker)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedWallet 
                      ? wallets.find(w => w.walletId === selectedWallet)?.walletName || 'Chọn ví'
                      : 'Chọn ví'
                    }
                  </Text>
                  <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                
                {showWalletPicker && wallets.length > 0 && (
                  <View style={styles.dropdownList}>
                    {wallets.map((wallet) => (
                      <TouchableOpacity
                        key={wallet.walletId}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedWallet(wallet.walletId);
                          setShowWalletPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{wallet.walletName}</Text>
                        <Text style={styles.dropdownItemBalance}>
                          {wallet.balance.toLocaleString('vi-VN')} VND
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
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
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <Text style={styles.currencyText}>{t('currency')}</Text>
            </View>
          </View>

          {/* Categories */}
          <Text style={[styles.label, styles.categoryTitle]}>{t('category')}</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e90ff" />
              <Text style={styles.loadingText}>{t('common.loading')}...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={categories}
              numColumns={3}
              keyExtractor={item => item.key}
              renderItem={renderCategoryItem}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          )}

          {/* Button */}
          <TouchableOpacity 
            style={[
              styles.button, 
              (!amount.trim() || !selectedCategory || !selectedWallet || saving) && styles.buttonDisabled
            ]} 
            onPress={handleSaveTransaction}
            disabled={!amount.trim() || !selectedCategory || !selectedWallet || saving}
          >
            {saving ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.buttonText, styles.buttonLoadingText]}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>
                {activeTab === 'expense' ? t('addExpenseButton') : t('addIncomeButton')}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>


    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
  },
  scrollContainer: {
    flex: 1,
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
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
    marginHorizontal: 2,
  },
  tabItemActive: {
    backgroundColor: '#1e90ff',
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 16,
    paddingVertical: 4,
  },
  label: { 
    fontSize: 16, 
    color: '#333', 
    fontWeight: '500', 
    width: 80,
    marginRight: 12,
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
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
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
    width: 'auto',
  },
  categoriesContainer: { 
    marginTop: 8,
    paddingBottom: 20,
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
    minHeight: 80,
  },
  categoryActive: {
    borderColor: '#1e90ff',
    backgroundColor: '#e6f2ff',
  },
  categoryText: { 
    fontSize: 12, 
    color: '#333', 
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#1e90ff',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
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
    width: '100%',
    height: 200,
  },
  iosModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  iosModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  iosModalButtonCancel: {
    fontSize: 17,
    color: '#ff3b30',
    fontWeight: '400',
  },
  iosModalButtonConfirm: {
    fontSize: 17,
    color: '#1e90ff',
    fontWeight: '600',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoadingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  // Wallet dropdown styles
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdown: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemBalance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});