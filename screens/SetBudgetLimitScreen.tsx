import { useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../constants/typography';
import { useNavigationService } from '../navigation/NavigationService';
import { Budget, budgetService } from '../services/budgetService';
import { CategoryResponse, categoryService, CategoryType } from '../services/categoryService';
import { WalletResponse, walletService } from '../services/walletService';
import { deduplicateCategories, getIconColor, getIconForCategory } from '../utils/iconUtils';

const { width } = Dimensions.get('window');

const PERIOD_OPTIONS = [
  { label: 'budget.setBudgetLimit.weekly', value: 'WEEKLY' },
  { label: 'budget.setBudgetLimit.monthly', value: 'MONTHLY' },
  { label: 'budget.setBudgetLimit.yearly', value: 'YEARLY' },
];

const BudgetLimitScreen = () => {
  const { t } = useTranslation();
  
  // Get route params for edit mode
  const navigation = useNavigationService();
  const route = useRoute();
  const routeParams = route.params as any;
  const isEditMode = routeParams?.editMode || false;
  const budgetData = routeParams?.budgetData as Budget | null;
  const budgetId = routeParams?.budgetId as number | null;

  const [amount, setAmount] = useState('');
  const [amountFontSize, setAmountFontSize] = useState(28);
  const [limitName, setLimitName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 24*60*60*1000));
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<CategoryResponse[]>([]);
  const [allAvailableCategories, setAllAvailableCategories] = useState<CategoryResponse[]>([]);

  // Debug selectedCategories changes
  useEffect(() => {
    console.log('🔄 selectedCategories state changed:', {
      count: selectedCategories.length,
      categories: selectedCategories.map(cat => ({
        id: cat.category_id,
        name: cat.category_name
      }))
    });
    
    // Check for duplicates
    const categoryIds = selectedCategories.map(cat => cat.category_id);
    const uniqueIds = new Set(categoryIds);
    if (categoryIds.length !== uniqueIds.size) {
      console.warn('⚠️ DUPLICATE CATEGORIES DETECTED!', {
        total: categoryIds.length,
        unique: uniqueIds.size,
        duplicates: categoryIds.length - uniqueIds.size
      });
      
      // Find duplicates
      const duplicates = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
      console.warn('⚠️ Duplicate category IDs:', duplicates);
    }
  }, [selectedCategories]);

  // Load all available categories to compare with selected ones
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        const categories = await categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, 0, 1);
        setAllAvailableCategories(categories);
      } catch (error) {
        console.error('Error loading all available categories:', error);
      }
    };
    loadAllCategories();
  }, []);
  
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletResponse | null>(null);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const insets = useSafeAreaInsets();

  // Helper function to calculate end date based on period type
  const calculateEndDateFromPeriod = (periodType: string, startDate: Date) => {
    let calculatedEndDate = new Date(startDate);
    
    switch (periodType) {
      case 'WEEKLY':
        // Add 1 week (7 days) from start date
        calculatedEndDate.setDate(startDate.getDate() + 7);
        break;
      case 'MONTHLY':
        // Add 1 month from start date
        calculatedEndDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'YEARLY':
        // Add 1 year from start date
        calculatedEndDate.setFullYear(startDate.getFullYear() + 1);
        break;
      default:
        return;
    }
    
    setEndDate(calculatedEndDate);
  };

  // Load initial categories for new budget
  useEffect(() => {
    if (!isEditMode) {
      const loadInitialCategories = async () => {
        try {
          const allExpenseCategories = await categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, 0, 1);
          setSelectedCategories(allExpenseCategories);
        } catch (error) {
          console.error('Failed to load initial categories:', error);
        }
      };
      loadInitialCategories();
      
      // Set default end date for new budget based on default period type (MONTHLY)
      calculateEndDateFromPeriod(periodType, startDate);
    }
  }, [isEditMode]);

  // Recalculate end date when startDate or periodType changes for new budgets
  useEffect(() => {
    if (!isEditMode && startDate) {
      calculateEndDateFromPeriod(periodType, startDate);
    }
  }, [startDate, periodType, isEditMode]);

  // Helper functions for modals
  const showValidationError = (message: string) => {
    setModalTitle(t('common.validation'));
    setModalMessage(message);
    setShowValidationModal(true);
  };

  const showSuccessMessage = (message: string) => {
    setModalTitle(t('common.success'));
    setModalMessage(message);
    setShowSuccessModal(true);
  };

  const showErrorMessage = (message: string) => {
    setModalTitle(t('common.error'));
    setModalMessage(message);
    setShowErrorModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowValidationModal(false);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate back after success
    navigation.goBack();
  };

  // Helper function to render category icons
  const renderCategoryIcons = () => {
    if (selectedCategories.length === 0) {
      return <Text style={styles.label}>{t('budget.setBudgetLimit.selectCategory')}</Text>;
    }

    // If all available categories are selected, show "Tất cả hạng mục" text
    if (allAvailableCategories.length > 0 && selectedCategories.length === allAvailableCategories.length) {
      return <Text style={styles.label}>{t('budget.setBudgetLimit.allCategories')}</Text>;
    }

    return (
      <View style={styles.categoryIconsContainer}>
        {selectedCategories.slice(0, 4).map((category, index) => {
          const iconName = getIconForCategory(category.category_icon_url, 'expense');
          const iconColor = getIconColor(iconName, 'expense');
          
          return (
            <Icon
              key={`${category.category_id}-${index}`}
              name={iconName}
              size={20}
              color={iconColor}
              style={styles.categoryIcon}
            />
          );
        })}
        {selectedCategories.length > 4 && (
          <Text style={styles.moreText}>+{selectedCategories.length - 4}</Text>
        )}
      </View>
    );
  };

  // Load budget data if in edit mode
  useEffect(() => {
    console.log('🔍 Edit mode useEffect triggered:', {
      isEditMode,
      budgetId,
      budgetData: budgetData ? 'exists' : 'null'
    });
    
    if (isEditMode && budgetId) {
      console.log('🚀 Starting to load budget data...');
      loadBudgetData();
    }
  }, [isEditMode, budgetId]);

  // Load wallets
  useEffect(() => {
    walletService.getAllWallets().then((data) => {
      setWallets(data);
      if (data.length > 0) setSelectedWallet(data.find(w => w.is_default) || data[0]);
    });
  }, []);

  const loadBudgetData = async () => {
    console.log('🔄 loadBudgetData called with budgetId:', budgetId);
    if (!budgetId) {
      console.log('❌ No budgetId provided');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📡 Calling budgetService.getBudgetDetail...');
      const budgetDetail = await budgetService.getBudgetDetail(budgetId);
      console.log('📊 Budget detail loaded:', budgetDetail);
      console.log('📊 Budget detail type:', typeof budgetDetail);
      console.log('📊 Budget detail keys:', budgetDetail ? Object.keys(budgetDetail) : 'null');
      
      // Fill form with budget data
      if (budgetDetail) {
        setLimitName(budgetDetail.budget_name || '');
        setAmount(formatCurrency(budgetDetail.overall_amount_limit?.toString() || ''));
        setPeriodType(budgetDetail.period_type || 'MONTHLY');
        
        // Set dates
        if (budgetDetail.start_date) {
          setStartDate(new Date(budgetDetail.start_date));
        }
        if (budgetDetail.end_date) {
          setEndDate(new Date(budgetDetail.end_date));
        }
        
        // Set categories if available
        console.log('🔍 Checking categories in budgetDetail...');
        console.log('🔍 budgetDetail.category_list:', budgetDetail.category_list);
        console.log('🔍 budgetDetail.category_list type:', typeof budgetDetail.category_list);
        console.log('🔍 budgetDetail.category_list isArray:', Array.isArray(budgetDetail.category_list));
        
        if (budgetDetail.category_list && Array.isArray(budgetDetail.category_list)) {
          console.log('📊 Categories from API:', budgetDetail.category_list);
          console.log('📊 First category sample:', budgetDetail.category_list[0]);
          
          // Convert to CategoryResponse format if needed and deduplicate
          const convertedCategories = budgetDetail.category_list.map((cat: any) => ({
            category_id: cat.category_id || cat.id,
            category_name: cat.category_name || cat.name,
            category_type: cat.category_type || cat.type,
            category_icon_url: cat.category_icon_url || cat.icon_url,
            user_id: cat.user_id,
            group_id: cat.group_id,
            parent_category_id: cat.parent_category_id,
            is_system_defined: cat.is_system_defined
          }));
          
          const categories = deduplicateCategories(convertedCategories);
          console.log('🔄 Setting selectedCategories with:', categories.length, 'items');
          setSelectedCategories(categories);
        } else {
          console.log('⚠️ No categories found in budget detail');
          console.log('🔍 Checking route params budgetData...');
          console.log('🔍 budgetData:', budgetData);
          console.log('🔍 budgetData?.category_list:', budgetData?.category_list);
          
          // If no categories in budget detail, try to load from route params
          if (budgetData?.category_list && Array.isArray(budgetData.category_list)) {
            console.log('📊 Using categories from route params:', budgetData.category_list);
            console.log('📊 Route params categories count:', budgetData.category_list.length);
            
            const deduplicatedCategories = deduplicateCategories(budgetData.category_list);
            console.log('🔄 Setting selectedCategories from route params:', deduplicatedCategories.length, 'items');
            setSelectedCategories(deduplicatedCategories);
          } else {
            console.log('❌ No categories found in both API and route params');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      alert(t('budget.setBudgetLimit.error.loadData'));
    } finally {
      setIsLoading(false);
    }
  };

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
    // Limit to 15 digits - không cho nhập nếu vượt quá 15 chữ số
    if (cleanedText.length > 15) return;
    setAmount(cleanedText);
    // Adjust font size based on length
    if (cleanedText.length > 12) setAmountFontSize(16);
    else if (cleanedText.length > 9) setAmountFontSize(20);
    else setAmountFontSize(28);
  };

  const handleRepeatSelect = (frequency: string) => {
    setPeriodType(frequency);
    setShowRepeatModal(false);
    
    // Auto-calculate end date based on period type and start date
    calculateEndDateFromPeriod(frequency, startDate);
  };

  const getPeriodLabel = (value: string) => {
    switch (value) {
      case 'WEEKLY':
        return t('budget.setBudgetLimit.weekly');
      case 'MONTHLY':
        return t('budget.setBudgetLimit.monthly');
      case 'YEARLY':
        return t('budget.setBudgetLimit.yearly');
      default:
        return t('budget.setBudgetLimit.monthly');
    }
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

    // Auto-calculate end date based on current period type and new start date
    calculateEndDateFromPeriod(periodType, selectedDate);
  };

  const handleEndDateSelect = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    
    // Validate if the selected end date matches the period requirement
    if (!validateEndDateForPeriod(selectedDate, startDate, periodType)) {
      // Show warning and auto-correct the end date
      const correctEndDate = new Date(startDate);
      calculateEndDateFromPeriod(periodType, startDate);
      
      // Show validation warning
      showValidationError(getInvalidPeriodMessage(periodType));
      return;
    }
    
    setEndDate(selectedDate);
    setShowEndDateModal(false);
  };

  // Helper function to validate if end date meets minimum period requirement
  const validateEndDateForPeriod = (endDate: Date, startDate: Date, periodType: string): boolean => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    switch (periodType) {
      case 'WEEKLY':
        // Must be at least 7 days (can be more)
        return daysDiff >= 7;
      case 'MONTHLY':
        // Must be at least 1 month (can be more)
        const minimumMonthlyEnd = new Date(startDate);
        minimumMonthlyEnd.setMonth(startDate.getMonth() + 1);
        return endDate >= minimumMonthlyEnd;
      case 'YEARLY':
        // Must be at least 1 year (can be more)
        const minimumYearlyEnd = new Date(startDate);
        minimumYearlyEnd.setFullYear(startDate.getFullYear() + 1);
        return endDate >= minimumYearlyEnd;
      default:
        return true;
    }
  };

  // Helper function to get validation message for period type
  const getInvalidPeriodMessage = (periodType: string): string => {
    switch (periodType) {
      case 'WEEKLY':
        return t('budget.setBudgetLimit.validation.weeklyPeriodRequired');
      case 'MONTHLY':
        return t('budget.setBudgetLimit.validation.monthlyPeriodRequired');
      case 'YEARLY':
        return t('budget.setBudgetLimit.validation.yearlyPeriodRequired');
      default:
        return t('budget.setBudgetLimit.validation.invalidPeriod');
    }
  };

  const toggleEndDate = () => {
    if (endDate && (endDate <= startDate)) {
      setEndDate(null);
    } else {
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
              {isStartDate ? t('budget.setBudgetLimit.selectStartDate') : t('budget.setBudgetLimit.selectEndDate')}
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
            <Text style={styles.dateModalConfirmButtonText}>{t('budget.setBudgetLimit.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handleSave = async () => {
    console.log('🔄 ===== HANDLE SAVE START =====');
    console.log('🎯 Edit mode:', isEditMode);
    console.log('🆔 Budget ID:', budgetId);
    
    // Validate ngày kết thúc phải lớn hơn ngày bắt đầu
    if (endDate && (endDate <= startDate)) {
      showValidationError(t('budget.setBudgetLimit.validation.endDateBeforeStart'));
      return;
    }
    if (!limitName.trim()) {
      showValidationError(t('budget.setBudgetLimit.validation.budgetNameRequired'));
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showValidationError(t('budget.setBudgetLimit.validation.amountRequired'));
      return;
    }
    if (selectedCategories.length === 0) {
      showValidationError(t('budget.setBudgetLimit.validation.categoryRequired'));
      return;
    }
    if (!selectedWallet) {
      showValidationError(t('budget.setBudgetLimit.validation.walletRequired'));
      return;
    }
    
    // Show loading state
    setIsSaving(true);
    
    try {
      console.log('📋 Form data before creating request:');
      console.log('  - limitName:', limitName);
      console.log('  - amount (raw):', amount);
      console.log('  - amount (numeric):', Number(amount.replace(/[^0-9]/g, '')));
      console.log('  - startDate:', startDate);
      console.log('  - endDate:', endDate);
      console.log('  - periodType:', periodType);
      console.log('  - selectedCategories count:', selectedCategories.length);
      console.log('  - selectedCategories:', selectedCategories.map(cat => ({
        id: cat.category_id,
        name: cat.category_name
      })));
      console.log('  - selectedWallet:', selectedWallet ? {
        id: selectedWallet.id,
        name: selectedWallet.wallet_name
      } : 'null');
      
      const request = {
        user_id: 0, // hoặc lấy user_id thực tế nếu cần
        budget_name: limitName,
        start_date: startDate.toISOString().slice(0, 10) + ' 00:00:00',
        end_date: endDate ? endDate.toISOString().slice(0, 10) + ' 23:59:59' : '',
        period_type: periodType, // 'WEEKLY' | 'MONTHLY' | 'YEARLY'
        overall_amount_limit: Number(amount.replace(/[^0-9]/g, '')),
        budget_remaining_amount: Number(amount.replace(/[^0-9]/g, '')),
        category_list: selectedCategories.map(category => ({ category_id: category.category_id })), // Array of objects with category_id
        // wallet_id: selectedWallet.id, // nếu backend hỗ trợ
      };

      console.log('📤 Final request object:', JSON.stringify(request, null, 2));

      if (isEditMode && budgetId) {
        console.log('🔄 Calling updateBudget API...');
        // Update existing budget
        await budgetService.updateBudget(budgetId, request);
        console.log('✅ Update successful!');
        showSuccessMessage(t('budget.setBudgetLimit.success.update'));
      } else {
        console.log('🔄 Calling createBudget API...');
        // Create new budget
        await budgetService.createBudget(request);
        console.log('✅ Create successful!');
        showSuccessMessage(t('budget.setBudgetLimit.success.create'));
      }
      
      console.log('🔄 ===== HANDLE SAVE END =====');
    } catch (err) {
      console.error('❌ ===== HANDLE SAVE ERROR =====');
      console.error('❌ Error:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('🔄 ===== HANDLE SAVE END =====');
      showErrorMessage(isEditMode ? t('budget.setBudgetLimit.error.update') : t('budget.setBudgetLimit.error.create'));
    } finally {
      setIsSaving(false);
    }
  };

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
            <Text style={styles.headerTitle}>{isEditMode ? t('budget.setBudgetLimit.editTitle') : t('budget.setBudgetLimit.title')}</Text>
            <TouchableOpacity>
              <Icon name="check" size={24} color="#1e90ff" />
            </TouchableOpacity>
          </View>

          {/* Loading indicator for edit mode */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e90ff" />
              <Text style={styles.loadingText}>{t('budget.setBudgetLimit.loadingBudgetData')}</Text>
            </View>
          )}

          {/* Content - hide when loading in edit mode */}
          {!isLoading && (
            <>
              {/* Amount */}
              <View style={styles.amountBox}>
                <TextInput
                  style={[styles.amount, { fontSize: amountFontSize }]}
                  value={formatCurrency(amount)}
                  onChangeText={handleAmountChange}
                  placeholder={t('budget.setBudgetLimit.amountPlaceholder')}
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
                  placeholder={t('budget.setBudgetLimit.budgetNamePlaceholder')}
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>

              {/* Category */}
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  console.log('🎯 Category button pressed');
                  console.log('🎯 Current selectedCategories:', selectedCategories);
                  navigation.navigate('SelectCategoryScreen', {
                    categoryType: 'expense',
                    selectedCategories,
                    onSelectCategories: (categories: CategoryResponse[]) => {
                      console.log('🔄 onSelectCategories called with:', categories);
                      setSelectedCategories(categories);
                    },
                    selectAllDefault: !isEditMode,
                  });
                }}
              >
                <Icon name="food" size={24} color="#555" />
                <View style={styles.itemContent}>
                  {renderCategoryIcons()}
                </View>
                <Icon name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>

              {/* Account */}
              <TouchableOpacity
                style={styles.item}
                onPress={() => setShowWalletPicker(true)}
              >
                <Icon name="wallet-outline" size={24} color="#555" />
                <View style={styles.itemContent}>
                  <Text
                    style={[styles.label, { marginLeft: 0 }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedWallet ? selectedWallet.wallet_name : t('budget.setBudgetLimit.allAccounts')}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>

              {/* Wallet Picker Modal */}
              {showWalletPicker && (
                <Modal visible={showWalletPicker} transparent animationType="fade">
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowWalletPicker(false)}
                  >
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>{t('budget.setBudgetLimit.selectAccountTitle')}</Text>
                      {wallets.map((wallet) => (
                        <TouchableOpacity
                          key={wallet.id}
                          style={[
                            styles.modalItem,
                            selectedWallet?.id === wallet.id && styles.modalItemSelected
                          ]}
                          onPress={() => {
                            setSelectedWallet(wallet);
                            setShowWalletPicker(false);
                          }}
                        >
                          <Text
                            style={styles.modalItemText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {wallet.wallet_name}
                          </Text>
                          {wallet.is_default && (
                            <Text style={{ color: '#1e90ff', marginLeft: 8 }}>({t('budget.setBudgetLimit.defaultAccount')})</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowWalletPicker(false)}
                      >
                        <Text style={styles.modalCloseButtonText}>{t('budget.setBudgetLimit.close')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}

              {/* Repeat */}
              <TouchableOpacity
                style={styles.item}
                onPress={() => setShowRepeatModal(true)}
              >
                <Icon name="repeat" size={24} color="#555" />
                <Text style={styles.label}>
                  {getPeriodLabel(periodType)}
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
                    <Text style={styles.modalTitle}>{t('budget.setBudgetLimit.selectRepeatTitle')}</Text>
                    {PERIOD_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.modalItem,
                          periodType === option.value && styles.modalItemSelected
                        ]}
                        onPress={() => {
                          setPeriodType(option.value);
                          setShowRepeatModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{t(option.label)}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowRepeatModal(false)}
                    >
                      <Text style={styles.modalCloseButtonText}>{t('budget.setBudgetLimit.close')}</Text>
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
                  {`${t('budget.setBudgetLimit.startDate')}: ${formatDate(startDate)}`}
                </Text>
              </TouchableOpacity>

              {/* End Date */}
              <TouchableOpacity
                style={styles.item}
                onPress={() => setShowEndDateModal(true)}
              >
                <Icon name="calendar-end" size={24} color="#555" />
                <View style={styles.dateContainer}>
                  <Text style={styles.label}>
                    {endDate
                      ? `${t('budget.setBudgetLimit.endDate')}: ${formatDate(endDate)}`
                      : t('budget.setBudgetLimit.selectEndDate')}
                  </Text>
                  <Text style={styles.helperText}>
                    {t('budget.setBudgetLimit.autoCalculated')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Custom Date Picker Modals */}
              {renderDatePickerModal(
                true, 
                startDate, 
                showStartDateModal, 
                setShowStartDateModal, 
                handleStartDateSelect
              )}

              {renderDatePickerModal(
                false, 
                endDate || new Date(), 
                showEndDateModal, 
                setShowEndDateModal, 
                handleEndDateSelect
              )}

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <View style={styles.saveButtonLoading}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {isEditMode ? t('budget.setBudgetLimit.updating') : t('budget.setBudgetLimit.saving')}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? t('budget.setBudgetLimit.update') : t('budget.setBudgetLimit.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Custom Modals */}
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="check-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Validation Modal */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="alert" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    textAlign: 'center',
    ...typography.semibold,
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
    textAlign: 'center',
    minWidth: 100,
    ...typography.semibold,
  },
  currencySymbol: {
    fontSize: 28,
    color: '#007AFF',
    marginLeft: 8,
    ...typography.semibold,
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
    ...typography.regular,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
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
    ...typography.semibold,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
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
    marginBottom: 12,
    textAlign: 'center',
    color: '#222',
    ...typography.semibold,
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
    ...typography.medium,
  },
  walletBalance: {
    fontSize: 13,
    color: '#888',
    ...typography.regular,
  },
  walletListClose: {
    marginTop: 12,
    alignItems: 'center',
  },
  walletListCloseText: {
    color: '#1e90ff',
    fontSize: 15,
    ...typography.semibold,
  },
  nameInput: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
    ...typography.regular,
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
    marginBottom: 15,
    color: '#333',
    ...typography.semibold,
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
    ...typography.regular,
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
    ...typography.semibold,
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
    color: '#333',
    ...typography.semibold,
  },
  dateModalConfirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateModalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    ...typography.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16, 
    color: '#333',
    ...typography.semibold,
  },
  categoryIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  categoryIcon: {
    marginHorizontal: 2,
  },
  moreText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
    ...typography.regular,
  },
  // Custom modal styles
  customModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.8,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
     modalIconContainer: {
     marginBottom: 15,
   },
   modalMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    ...typography.regular,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16, 
    ...typography.semibold,
  },
  dateContainer: {
    flex: 1,
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    ...typography.regular,
  },
});
