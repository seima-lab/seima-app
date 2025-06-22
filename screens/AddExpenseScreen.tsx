import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// Cache for categories and wallets to avoid repeated API calls
interface DataCache {
  expenseCategories: LocalCategory[] | null;
  incomeCategories: LocalCategory[] | null;
  wallets: WalletResponse[] | null;
  lastFetchTime: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
let dataCache: DataCache = {
  expenseCategories: null,
  incomeCategories: null,
  wallets: null,
  lastFetchTime: 0
};

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
  
  // Categories state
  const [expenseCategories, setExpenseCategories] = useState<LocalCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<LocalCategory[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction saving state
  const [saving, setSaving] = useState(false);

  // Memoized current categories based on active tab
  const currentCategories = useMemo(() => {
    return activeTab === 'expense' ? expenseCategories : incomeCategories;
  }, [activeTab, expenseCategories, incomeCategories]);

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    return Date.now() - dataCache.lastFetchTime < CACHE_DURATION;
  }, []);

  // Load data from cache if available and valid
  const loadFromCache = useCallback(() => {
    if (isCacheValid()) {
      console.log('📦 Loading from cache...');
      
      if (dataCache.expenseCategories) {
        setExpenseCategories(dataCache.expenseCategories);
      }
      if (dataCache.incomeCategories) {
        setIncomeCategories(dataCache.incomeCategories);
      }
      if (dataCache.wallets) {
        setWallets(dataCache.wallets);
        // Auto-select default wallet
        if (!selectedWallet && dataCache.wallets.length > 0) {
          const defaultWallet = dataCache.wallets.find(wallet => wallet.is_default);
          setSelectedWallet(defaultWallet ? defaultWallet.id : dataCache.wallets[0].id);
        }
      }
      
      return true;
    }
    return false;
  }, [isCacheValid, selectedWallet]);

  // Optimized wallet loading with caching
  const loadWallets = useCallback(async (useCache = true) => {
    if (!user) return [];

    // Try cache first
    if (useCache && dataCache.wallets && isCacheValid()) {
      console.log('💳 Using cached wallets');
      return dataCache.wallets;
    }

    try {
      console.log('🔄 Loading wallets from API...');
      
      // Remove userId parameter as the service now uses authentication
      const userWallets = await walletService.getAllWallets();
      
      console.log('💳 Loaded wallets:', userWallets.length);
      
      // Cache the results
      dataCache.wallets = userWallets;
      dataCache.lastFetchTime = Date.now();
      
      return userWallets;
      
    } catch (err: any) {
      console.error('❌ Failed to load wallets:', err);
      throw err;
    }
  }, [user, isCacheValid]);

  // Optimized categories loading with caching
  const loadCategoriesByType = useCallback(async (categoryType: CategoryType, useCache = true) => {
    if (!user) return [];

    // Check cache first
    const cacheKey = categoryType === CategoryType.EXPENSE ? 'expenseCategories' : 'incomeCategories';
    if (useCache && dataCache[cacheKey] && isCacheValid()) {
      console.log(`📊 Using cached ${categoryType} categories`);
      return dataCache[cacheKey]!;
    }

    try {
      console.log(`🔄 Loading ${categoryType} categories from API...`);
      
      const userId = parseInt(user.id) || 1;
      const groupId = 1;
      
      // Fetch categories from API
      const apiCategories = await categoryService.getAllCategoriesByTypeAndUser(
        categoryType,
        userId,
        groupId
      );
      
      console.log(`📊 API categories received for ${categoryType}:`, apiCategories.length);
      
      // Convert API categories to local format
      const localCategories = apiCategories.map(apiCategory => 
        categoryService.convertToLocalCategory(apiCategory)
      );
      
      // Add edit category option at the end
      const editCategory: LocalCategory = {
        key: 'edit',
        label: 'Edit Categories',
        icon: 'pencil',
        color: '#1e90ff'
      };
      
      const categoriesWithEdit = [...localCategories, editCategory];
      
      // Cache the results
      dataCache[cacheKey] = categoriesWithEdit;
      dataCache.lastFetchTime = Date.now();
      
      return categoriesWithEdit;
      
    } catch (err: any) {
      console.error(`❌ Failed to load ${categoryType} categories:`, err);
      
      // Return default categories as fallback
      const defaultCategories = categoryService.getDefaultCategories(categoryType);
      const editCategory: LocalCategory = {
        key: 'edit',
        label: 'Edit Categories',
        icon: 'pencil',
        color: '#1e90ff'
      };
      
      const fallbackCategories = [...defaultCategories, editCategory];
      
      // Don't cache fallback data
      return fallbackCategories;
    }
  }, [user, isCacheValid]);

  // Load all data in parallel
  const loadAllData = useCallback(async (useCache = true) => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    setError(null);
    
    try {
      // Load from cache first if available
      if (useCache && loadFromCache()) {
        setInitialLoading(false);
        return;
      }

      console.log('🚀 Loading all data in parallel...');
      
      // Load all data in parallel for better performance
      const [expenseCats, incomeCats, userWallets] = await Promise.all([
        loadCategoriesByType(CategoryType.EXPENSE, useCache),
        loadCategoriesByType(CategoryType.INCOME, useCache),
        loadWallets(useCache)
      ]);

      // Update state
      setExpenseCategories(expenseCats);
      setIncomeCategories(incomeCats);
      setWallets(userWallets);

      // Auto-select first category and default wallet
      if (!selectedCategory) {
        const currentCats = activeTab === 'expense' ? expenseCats : incomeCats;
        if (currentCats.length > 0 && currentCats[0].key !== 'edit') {
          setSelectedCategory(currentCats[0].key);
        }
      }

      if (!selectedWallet && userWallets.length > 0) {
        const defaultWallet = userWallets.find(wallet => wallet.is_default);
        setSelectedWallet(defaultWallet ? defaultWallet.id : userWallets[0].id);
      }

      console.log('✅ All data loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Failed to load data:', err);
      setError(err.message || 'Failed to load data');
      
      Alert.alert(
        t('common.error'),
        'Failed to load data from server. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadAllData(false) },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setInitialLoading(false);
    }
  }, [user, loadFromCache, loadCategoriesByType, loadWallets, selectedCategory, selectedWallet, activeTab, t]);

  // Initial load
  useEffect(() => {
    loadAllData(true);
  }, []);

  // Optimized tab change handler
  const handleTabChange = useCallback((newTab: 'expense' | 'income') => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      
      // Auto-select first category for the new tab
      const newCategories = newTab === 'expense' ? expenseCategories : incomeCategories;
      if (newCategories.length > 0 && newCategories[0].key !== 'edit') {
        setSelectedCategory(newCategories[0].key);
      } else {
        setSelectedCategory('');
      }
    }
  }, [activeTab, expenseCategories, incomeCategories]);

  // Optimized date handlers with useMemo for date formatting
  const formattedDate = useMemo(() => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  }, [date]);

  const openDatePicker = useCallback(() => {
    setTempDate(date);
    setShowDate(true);
  }, [date]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDate(false);
      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  }, []);

  const handleConfirmDate = useCallback(() => {
    setDate(tempDate);
    setShowDate(false);
  }, [tempDate]);

  const handleCancelDate = useCallback(() => {
    setTempDate(date);
    setShowDate(false);
  }, [date]);

  const adjustDate = useCallback((days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  }, [date]);

  const handleCameraPress = useCallback(() => {
    console.log('Camera pressed - will implement receipt scanning');
    Alert.alert(
      'Camera Feature',
      'Receipt scanning feature will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleCategoryPress = useCallback((category: LocalCategory) => {
    if (category.key === 'edit') {
      navigation.navigate('EditCategoryScreen', { type: activeTab });
    } else {
      setSelectedCategory(category.key);
    }
  }, [navigation, activeTab]);

  // Optimized wallet selection
  const handleWalletSelect = useCallback((walletId: number) => {
    setSelectedWallet(walletId);
    setShowWalletPicker(false);
  }, []);

  // Optimized save transaction with better error handling
  const handleSaveTransaction = useCallback(async () => {
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
    const selectedCategoryData = currentCategories.find(cat => cat.key === selectedCategory);
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
        category_id: parseInt(selectedCategoryData.key),
        group_id: 1,
        transaction_type: activeTab === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME,
        amount: parseFloat(amount),
        currency_code: 'VND',
        transaction_date: date.toISOString().split('T')[0],
        description: note.trim() || undefined,
        receipt_image: null,
        payee_payer_name: undefined,
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
              
              // Mark wallets for refresh
              walletService.markForRefresh();
              
              // Invalidate wallet cache to force refresh balances
              dataCache.wallets = null;
              
              // Navigate to MainTab
              navigation.navigate('MainTab');
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
  }, [amount, selectedCategory, selectedWallet, user, currentCategories, activeTab, date, note, t, navigation]);

  // Memoized category item renderer for better performance
  const renderCategoryItem = useCallback(({ item }: { item: LocalCategory }) => (
    <TouchableOpacity
      style={[
        styles.category,
        selectedCategory === item.key && styles.categoryActive
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Icon name={item.icon} size={24} color={item.color} />
      <Text style={styles.categoryText} numberOfLines={2} ellipsizeMode="tail">
        {item.label}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, handleCategoryPress]);



  // Memoized selected wallet display
  const selectedWalletDisplay = useMemo(() => {
    if (!selectedWallet) return 'Chọn ví';
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet?.wallet_name || 'Chọn ví';
  }, [selectedWallet, wallets]);

  // Early return if still loading initially
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>{t('common.loading')}...</Text>
      </View>
    );
  }

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
                <Text style={styles.dateText}>{formattedDate}</Text>
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
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowWalletPicker(!showWalletPicker)}
              >
                <Text style={styles.dropdownText}>{selectedWalletDisplay}</Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              {showWalletPicker && wallets.length > 0 && (
                <>
                  {/* Invisible overlay to close dropdown when tapping outside */}
                  <TouchableOpacity
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setShowWalletPicker(false)}
                  />
                  <View style={styles.dropdownList}>
                    {wallets.map(wallet => (
                      <TouchableOpacity
                        key={wallet.id}
                        style={styles.dropdownItem}
                        onPress={() => handleWalletSelect(wallet.id)}
                      >
                        <Text style={styles.dropdownItemText}>{wallet.wallet_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
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

          {/* Note */}
          <View style={styles.row}>
            <Text style={styles.label}>{t('note')}</Text>
            <View style={styles.noteContainer}>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Note"
                value={note}
                onChangeText={setNote}
                multiline={true}
                numberOfLines={4}
                placeholderTextColor="#aaa"
              />
            </View>
          </View>

          {/* Categories */}
          <Text style={[styles.label, styles.categoryTitle]}>{t('category')}</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadAllData(false)}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={currentCategories}
              numColumns={4}
              keyExtractor={item => item.key}
              renderItem={renderCategoryItem}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
              removeClippedSubviews={true}
              maxToRenderPerBatch={12}
              windowSize={10}
            />
          )}

          {/* Save Button */}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  noteContainer: {
    flex: 1,
  },
  noteInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
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
    padding: 8,
    margin: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    minHeight: 70,
    maxWidth: '22%',
  },
  categoryActive: {
    borderColor: '#1e90ff',
    backgroundColor: '#e6f2ff',
  },
  categoryText: { 
    fontSize: 10, 
    color: '#333', 
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 12,
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
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
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