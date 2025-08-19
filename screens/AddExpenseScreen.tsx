// React imports
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// React Native imports
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party component imports
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Local imports
import CustomErrorModal from '../components/CustomErrorModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import CustomToast from '../components/CustomToast';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { LocalCategory } from '../services/categoryService';
import { TransactionOcrResponse } from '../services/ocrService';
import { getIconColor } from '../utils/iconUtils';
import OptimizedSaveButton from './components/OptimizedSaveButton';

// Custom hooks
import { useDataLoading } from './hooks/useDataLoading';
import { useDebounceInput } from './hooks/useDebounceInput';
import { useFormValidation } from './hooks/useFormValidation';
import { useImagePicker } from './hooks/useImagePicker';
import { useModalStates } from './hooks/useModalStates';
import { useTransactionSave } from './hooks/useTransactionSave';

// Constants
import { addExpenseStyles as styles } from './AddExpenseScreen.styles';

// i18n
import { Calendar } from 'react-native-calendars';
import '../i18n';
export default function AddExpenseScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user, isAuthenticated, isLoading: authLoading, refreshTransactions } = useAuth();
  
  // Get route parameters for edit mode and group context
  const routeParams = route.params as any;
  const isEditMode = routeParams?.editMode || false;
  const fromCopy = routeParams?.fromCopy || false;
  const transactionData = routeParams?.transactionData || routeParams; // support both nested and flat
  const fromGroupOverview = routeParams?.fromGroupOverview || false;
  const fromGroupTransactionList = routeParams?.fromGroupTransactionList || false;
  const groupContextId = routeParams?.groupId;
  const groupContextName = routeParams?.groupName;
  
  // State
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(
    isEditMode && transactionData?.type ? transactionData.type : 'expense'
  );

  // State declarations first - initialize with edit data if available
  const [selectedWallet, setSelectedWallet] = useState<number | null>(() => {
    if (fromGroupOverview) {
      return 0; // Set to 0 for group transactions
    }
    const initialWalletId =
      (fromCopy ? (transactionData?.wallet_id ?? transactionData?.walletId) : undefined) ??
      (isEditMode ? (transactionData?.wallet_id ?? transactionData?.walletId) : undefined);
    if (initialWalletId !== undefined && initialWalletId !== null) {
      console.log('🔄 Initializing selectedWallet from transactionData:', initialWalletId);
      return Number(initialWalletId);
    }
    return null;
  });

  // Custom hooks
  const {
    isLoading,
    hasInitiallyLoaded,
    wallets,
    expenseCategories,
    incomeCategories,
    selectedCategory,
    setSelectedCategory,
    setWallets,
    loadData,
    refreshData,
    cleanup,
  } = useDataLoading({
    fromGroupOverview,
    groupContextId,
    groupContextName,
    isEditMode,
    transactionData,
    activeTab,
    fromGroupTransactionList,
    setSelectedWallet,
    fromCopy,
  });

  // Form validation hook (declare before usage)
  const {
    formatAmountInput,
    getNumericAmountFromInput,
    formatAmountFromNumber,
  } = useFormValidation({
    amount: '', // Not used for validation in hook
    note: '',
    selectedCategory: '',
    selectedWallet: null,
    fromGroupOverview: false,
    getNumericAmount: () => 0,
  });

  const onOCRResult = useCallback((result: TransactionOcrResponse) => {
    if (result.total_amount) {
      console.log('💰 Setting amount:', result.total_amount);
      setAmount(formatAmountFromNumber(result.total_amount));
    }
    
    if (result.transaction_date) {
      console.log('📅 Setting date:', result.transaction_date);
      const parsedDate = new Date(result.transaction_date);
      if (!isNaN(parsedDate.getTime())) {
        const localDate = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate()
        );
        setDate(localDate);
        console.log('✅ Date set successfully (local):', localDate);
      }
    }
    
    if (result.description_invoice) {
      console.log('📝 Setting note:', result.description_invoice);
      setNote(result.description_invoice);
    }
  }, [formatAmountFromNumber]);

  const {
    selectedImage,
    isScanning,
    showImageOptions,
    setShowImageOptions,
    setSelectedImage,
    takePhoto,
    pickFromGallery,
    pickFromGalleryWithCrop,
    removeImage,
  } = useImagePicker({
    activeTab,
    onOCRResult,
  });

  // Prefill existing receipt image when editing
  useEffect(() => {
    if (isEditMode && !selectedImage) {
      const existingUrl =
        (transactionData && (
          transactionData.receipt_image_url ||
          transactionData.receiptImageUrl ||
          transactionData.receipt_image ||
          transactionData.receiptImage
        )) || null;
      if (existingUrl) {
        setSelectedImage(existingUrl);
      }
    }
  }, [isEditMode, transactionData, selectedImage, setSelectedImage]);

  // Form data - pre-fill if in edit mode
  // Prefill when copying from an existing transaction (make copy)
  const rawAmountSource = (fromCopy
    ? transactionData?.amount
    : (isEditMode ? transactionData?.amount : undefined));
  const parsedInitialAmountNumber = typeof rawAmountSource === 'number'
    ? rawAmountSource
    : (rawAmountSource ? parseInt(String(rawAmountSource).replace(/[^\d]/g, ''), 10) : 0);
  const initialAmount = parsedInitialAmountNumber > 0
    ? formatAmountFromNumber(parsedInitialAmountNumber)
    : '';
  const [note, setNote] = useState(
    (fromCopy && transactionData?.note)
      ? transactionData.note
      : (isEditMode && transactionData?.note ? transactionData.note : '')
  );

  // Debounced amount input for better performance
  const {
    value: amount,
    debouncedValue: debouncedAmount,
    handleChange: handleAmountChange,
    setValue: setAmount,
  } = useDebounceInput({
    initialValue: initialAmount,
    delay: 300,
    formatValue: formatAmountInput,
  });
  
  const [date, setDate] = useState(() => {
    const srcDate = (fromCopy ? transactionData?.date : (isEditMode ? transactionData?.date : null));
    if (srcDate) {
      const parsedDate = new Date(srcDate);
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      );
    }
    return new Date();
  });
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // Modal states hook
  const {
    errorModal,
    showErrorModal,
    hideErrorModal,
    successModal,
    showSuccessModal,
    hideSuccessModal,
    toast,
    showToast,
    hideToast,
    showDatePicker,
    openDatePicker,
    closeDatePicker,
    showWalletPicker,
    openWalletPicker,
    closeWalletPicker,
    showCreateWalletModal,
    openCreateWalletModal,
    closeCreateWalletModal,
  } = useModalStates();

  // Custom validation function that uses current form state
  const validateForm = useCallback(() => {
    console.log('🔍 Validating form with:', {
      debouncedAmount,
      amount,
      note,
      selectedCategory,
      selectedWallet,
      fromGroupOverview
    });

    // Prefer debouncedAmount, but fall back to immediate amount if needed
    const amountText = (debouncedAmount && debouncedAmount.trim().length > 0)
      ? debouncedAmount.trim()
      : (amount || '').trim();

    // Check amount
    if (!amountText) {
      console.log('❌ Amount is empty:', debouncedAmount);
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseEnterAmount'),
        },
      };
    }
    
    const amountValue = getNumericAmountFromInput(amountText);
    if (amountValue <= 0) {
      console.log('❌ Amount is zero or negative:', amountValue);
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseEnterValidAmount'),
        },
      };
    }
    
    // Check if amount exceeds 15 digits
    const digitsOnly = amountText.replace(/[^\d]/g, '');
    if (digitsOnly.length > 15) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.amountExceed15Digits'),
        },
      };
    }
    
    // Check if amount is too large for JavaScript number precision
    if (amountValue > Number.MAX_SAFE_INTEGER) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.amountTooLarge'),
        },
      };
    }
    
    // Validate note (optional but with constraints if provided)
    if (note.trim().length > 500) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.noteExceed500Chars'),
        },
      };
    }
    
    // Check for potentially malicious content in note
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(note))) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.noteInvalidChars'),
        },
      };
    }
    
    if (!selectedCategory) {
      console.log('❌ No category selected:', selectedCategory);
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseSelectCategory'),
        },
      };
    }
    
    // Only validate wallet selection if not from group overview
    if (!fromGroupOverview && !selectedWallet) {
      console.log('❌ No wallet selected:', selectedWallet);
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseSelectWallet'),
        },
      };
    }
    
    console.log('✅ Form validation passed');
    return { isValid: true };
  }, [debouncedAmount, amount, note, selectedCategory, selectedWallet, fromGroupOverview, getNumericAmountFromInput, t]);

  // Transaction save hook với optimistic updates
  const {
    isSaving,
    saveTransaction,
    copyTransaction,
  } = useTransactionSave({
    isEditMode,
    activeTab,
    fromGroupOverview,
    fromGroupTransactionList,
    groupContextId,
    groupContextName,
    transactionData,
    refreshTransactions,
    onSaveSuccess: () => {
      const message = isEditMode ? t('common.transactionUpdated') : t('common.transactionSaved');
      showSuccessModal(t('common.success'), message, () => {
        hideSuccessModal();
        navigation.goBack();
      });
    },
    onSaveError: (error: any) => {
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        showErrorModal(t('common.error'), t('common.pleaseLogin'), () => {
          hideErrorModal();
          if (fromGroupTransactionList && groupContextId && groupContextName) {
            (navigation as any).reset({
              index: 1,
              routes: [
                { name: 'GroupDetail', params: { groupId: groupContextId, groupName: groupContextName } },
                { name: 'GroupTransactionList', params: { groupId: groupContextId, groupName: groupContextName } }
              ],
            });
          } else {
            navigation.goBack();
          }
        });
      } else {
        showErrorModal(t('common.error'), t('common.failedToSaveTransaction'));
      }
    },
  });

  // Debug selectedCategory changes
  useEffect(() => {
    console.log('🔄 selectedCategory changed:', {
      selectedCategory: selectedCategory,
      activeTab: activeTab,
      expenseCategories: expenseCategories.length,
      incomeCategories: incomeCategories.length
    });
  }, [selectedCategory, activeTab]);

  // Load data when component mounts
  useEffect(() => {
    console.log('🔍 AddExpenseScreen - Auth Status:', { 
      authLoading, 
      isAuthenticated, 
      hasUser: !!user 
    });
    
    // Wait for auth check to complete
    if (authLoading) {
      return;
    }
    
    // Load data directly using /me API to get user info
    loadData();
    
    // Cleanup on unmount
    return cleanup;
  }, [authLoading, loadData, cleanup]);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have initially loaded data (not on first mount)
      if (hasInitiallyLoaded) {
          console.log('🔄 AddExpenseScreen focused - refreshing data');
          refreshData();
        }
    }, [hasInitiallyLoaded, refreshData])
  );

  // Sau khi setExpenseCategories và setIncomeCategories, nếu chưa có selectedCategory thì chọn mặc định
  useEffect(() => {
    if (!selectedCategory) {
      const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
      if (categories.length > 0) {
        setSelectedCategory(categories[0].key);
      }
    }
  }, [expenseCategories, incomeCategories, activeTab]);



  const handleTabChange = (tab: 'expense' | 'income') => {
    console.log('🔄 Tab change started:', {
      from: activeTab,
      to: tab,
      expenseCategories: expenseCategories.length,
      incomeCategories: incomeCategories.length
    });
    
    setActiveTab(tab);
    // Reset category selection when switching tabs
    const categories = tab === 'expense' ? expenseCategories : incomeCategories;
    
    console.log('�� Categories for new tab:', {
      tab: tab,
      categoriesCount: categories.length,
      categories: categories.map(cat => ({
        key: cat.key,
        label: cat.label,
        category_id: cat.category_id
      }))
    });
    
    if (categories.length > 0) {
      const newCategoryKey = categories[0].key;
      console.log('🔍 Tab change category selection:', {
        newTab: tab,
        newCategoryKey: newCategoryKey,
        firstCategory: categories[0]
      });
      setSelectedCategory(newCategoryKey);
    } else {
      console.log('⚠️ No categories found for tab:', tab);
      setSelectedCategory('');
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('🔐 Checking current permission status...');
      
      // First check current permissions without requesting
      const [cameraStatus, libraryStatus] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(false)
      ]);
      
      console.log('📷 Current camera permission:', cameraStatus.status);
      console.log('🖼️ Current library permission:', libraryStatus.status);
      
      // Request permissions if not granted
      let finalCameraStatus = cameraStatus;
      let finalLibraryStatus = libraryStatus;
      
      if (cameraStatus.status !== 'granted') {
        console.log('🔐 Requesting camera permission...');
        finalCameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📷 Camera permission result:', finalCameraStatus.status);
      }
      
      if (libraryStatus.status !== 'granted') {
        console.log('🔐 Requesting library permission...');
        finalLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
        console.log('🖼️ Library permission result:', finalLibraryStatus.status);
      }
      
      // Check final results
      if (finalCameraStatus.status !== 'granted') {
        console.log('❌ Camera permission denied:', finalCameraStatus.status);
        if (finalCameraStatus.canAskAgain === false) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is required. Please enable it in device settings.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Camera Permission Required',
            'Please allow camera access to take photos.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      
      if (finalLibraryStatus.status !== 'granted') {
        console.log('❌ Photo library permission denied:', finalLibraryStatus.status);
        if (finalLibraryStatus.canAskAgain === false) {
          Alert.alert(
            'Photo Library Permission Required',
            'Photo library access is required. Please enable it in device settings.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Photo Library Permission Required',
            'Please allow photo library access to select images.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      
      console.log('✅ All permissions granted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request permissions. Please check your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      console.log('🔐 Checking camera permission...');
      
      // First check current permission
      const currentStatus = await ImagePicker.getCameraPermissionsAsync();
      console.log('📷 Current camera permission:', {
        status: currentStatus.status,
        canAskAgain: currentStatus.canAskAgain,
        granted: currentStatus.granted,
        expires: currentStatus.expires
      });
      
      if (currentStatus.status === 'granted') {
        console.log('✅ Camera permission already granted');
        
        // For debugging: Check if permission expires (for "Only this time")
        if (currentStatus.expires && currentStatus.expires !== 'never') {
          console.log('⏰ Permission expires at:', new Date(currentStatus.expires));
          const now = Date.now();
          if (now > currentStatus.expires) {
            console.log('⚠️ Permission has expired, requesting again...');
          } else {
            console.log('✅ Permission still valid');
            return true;
          }
        } else {
          console.log('♾️ Permission granted permanently');
          return true;
        }
      }
      
      // Request permission if not granted or expired
      console.log('🔐 Requesting camera permission...');
      const result = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Camera permission result:', {
        status: result.status,
        canAskAgain: result.canAskAgain,
        granted: result.granted,
        expires: result.expires
      });
      
      if (result.status !== 'granted') {
        if (result.canAskAgain === false) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is required. Please enable it in device settings.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Camera Permission Required',
            'Please allow camera access to take photos.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error requesting camera permission:', error);
      return false;
    }
  };

  const requestLibraryPermission = async () => {
    try {
      console.log('🔐 Checking library permission...');
      
      // First check current permission
      const currentStatus = await ImagePicker.getMediaLibraryPermissionsAsync(false);
      console.log('🖼️ Current library permission:', currentStatus.status);
      
      if (currentStatus.status === 'granted') {
        return true;
      }
      
      // Request permission if not granted
      console.log('🔐 Requesting library permission...');
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
      console.log('🖼️ Library permission result:', result.status);
      
      if (result.status !== 'granted') {
        if (result.canAskAgain === false) {
          Alert.alert(
            'Photo Library Permission Required',
            'Photo library access is required. Please enable it in device settings.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Photo Library Permission Required',
            'Please allow photo library access to select images.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error requesting library permission:', error);
      return false;
    }
  };









    // Optimized save handler với better UX
  const handleSave = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      if (validation.error) {
        showErrorModal(validation.error.title, validation.error.message);
      }
        return;
      }

    const amountValue = getNumericAmountFromInput(debouncedAmount);

    // Prepare form data
    const formData = {
        amount: amountValue,
      note,
      date,
      selectedCategory,
      selectedWallet,
      selectedImage,
    };

    // Use optimized save transaction hook
    await saveTransaction(formData);
  }, [
    validateForm,
    getNumericAmountFromInput,
    debouncedAmount,
    note,
    date,
    selectedCategory,
    selectedWallet,
    selectedImage,
    saveTransaction,
    showErrorModal,
  ]);



  const formatDate = (date: Date) => {
    const currentLocale = i18n.language || 'en';
    return date.toLocaleDateString(currentLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  };

  const getCurrentCategories = useMemo(() => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    
    // Only add "Edit" item if not called from GroupOverviewScreen
    if (fromGroupOverview) {
      // Return categories without edit option when from group overview
      // Sort: system-defined categories first, then user-created
      return [
        ...categories.filter(c => c.is_system_defined),
        ...categories.filter(c => !c.is_system_defined)
      ];
    }
    
    // Add "Edit" item at the end of the categories list for normal flow
    const editItem: LocalCategory = {
      key: 'edit_categories',
      label: 'Edit',
      icon: 'pencil',
      color: '#1e90ff',
      category_id: -1,
      is_system_defined: false
    };
    
    // Sort: system-defined categories first, then user-created, rồi mới tới Edit
    return [
      ...categories.filter(c => c.is_system_defined),
      ...categories.filter(c => !c.is_system_defined),
      editItem
    ];
  }, [activeTab, expenseCategories, incomeCategories, fromGroupOverview]);

  const getSelectedWalletName = useMemo(() => {
    // For group transactions, show a special message
    if (fromGroupOverview && selectedWallet === 0) {
      return t('groupTransaction.groupWallet');
    }
    
    if (wallets.length === 0) {
      return t('wallet.addWallet');
    }
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet ? wallet.wallet_name : t('wallet.addWallet');
  }, [fromGroupOverview, selectedWallet, wallets, t]);

  const handleWalletPickerPress = useCallback(() => {
    if (wallets.length === 0) {
      // No wallets available, show create wallet modal
      openCreateWalletModal();
    } else {
      // Has wallets, show wallet picker
      openWalletPicker();
    }
  }, [wallets.length, openCreateWalletModal, openWalletPicker]);

  const handleCreateWallet = useCallback(() => {
    closeCreateWalletModal();
    (navigation as any).navigate('AddWalletScreen');
  }, [navigation, closeCreateWalletModal]);






  const renderCategoryItem = useCallback(({ item }: { item: LocalCategory }) => {
    const isSelected = selectedCategory === item.key;
    
    // Handle Edit item specially
    if (item.key === 'edit_categories') {
      return (
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => {
            console.log('🔧 Navigating to EditCategoryScreen for tab:', activeTab);
            (navigation as any).navigate('EditCategoryScreen', {
              type: activeTab
            });
          }}
        >
          <Icon name={item.icon} size={24} color="#666" />
          <Text style={styles.categoryText} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Regular category item - use intelligent color mapping
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => {
          console.log('🎯 User selected category:', {
            selected_key: item.key,
            selected_category_id: item.category_id,
            selected_label: item.label,
            previous_selectedCategory: selectedCategory
          });
          setSelectedCategory(item.key);
        }}
      >
        <Icon name={item.icon} size={24} color={getIconColor(item.icon, activeTab)} />
        <Text style={styles.categoryText} numberOfLines={2}>{item.label}</Text>
      </TouchableOpacity>
    );
  }, [selectedCategory, activeTab, navigation]);

  // Progressive loading - không block UI hoàn toàn
  const showFullLoading = (authLoading || isLoading) && !hasInitiallyLoaded;

  // Skeleton Loading Component - memoized for better performance
  const SkeletonLoader = useMemo(() => React.memo(() => (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Skeleton */}
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonBackButton} />
          <View style={styles.skeletonTabContainer}>
            <View style={styles.skeletonTab} />
            <View style={styles.skeletonTab} />
          </View>
          <View style={styles.skeletonCameraButton} />
        </View>

        {/* Form Skeleton */}
        <View style={styles.skeletonFormContainer}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonInput} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonInput} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonAmountInput} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonNoteInput} />
          </View>
        </View>

        {/* Categories Skeleton */}
        <View style={styles.skeletonCategoriesContainer}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonCategoriesGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <View key={index} style={styles.skeletonCategoryItem} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  )), []);

  const MemoizedSkeletonLoader = SkeletonLoader;

  // Show scanning overlay when OCR is processing (prioritize over skeleton)
  if (isScanning) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.loadingText}>{t('common.scanningInvoice')}</Text>
          <Text style={styles.subLoadingText}>{t('common.extractingText')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show full loading only when no data has been loaded
  if (showFullLoading) {
    return <MemoizedSkeletonLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#007aff" />
          </TouchableOpacity>
          
          {isEditMode ? (
            <View style={styles.editHeaderContainer}>
              <Text style={styles.editHeaderTitle}>
                {activeTab === 'expense' ? t('common.editExpense') : t('common.editIncome')}
              </Text>
            </View>
          ) : (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
                onPress={() => handleTabChange('expense')}
              >
                <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
                  {t('expense')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'income' && styles.tabActive]}
                onPress={() => handleTabChange('income')}
              >
                <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
                  {t('incomeLabel')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

                    {/* Camera Icon - Available for both expense and income tabs */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowImageOptions(true)}
            >
                <Icon name="camera" size={24} color="#007aff" />
              </TouchableOpacity>
            {/* Copy Icon - chỉ hiển thị khi edit */}
            {isEditMode && (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={copyTransaction}
              >
                <Icon name="content-copy" size={24} color="#007aff" />
              </TouchableOpacity>
            )}

            {/* Debug Permission Button - Only show in development */}
       
          </View>

        {/* Group Context Indicator */}
        {fromGroupOverview && groupContextName && (
          <View style={styles.groupContextContainer}>
            <Icon name="account-group" size={16} color="#4A90E2" />
            <Text style={styles.groupContextText}>
              {t('groupTransaction.groupTransactionNote')}
            </Text>
          </View>
        )}

          {/* Date */}
          <View style={styles.row}>
            <Text style={styles.label}>{t('date')}</Text>
              <TouchableOpacity 
            style={styles.input}
            onPress={openDatePicker}
          >
            <Text style={styles.dateText}>{formatDate(date)}</Text>
              </TouchableOpacity>
          </View>

        {/* Wallet - Hide when from group overview */}
        {!fromGroupOverview && (
          <View style={styles.row}>
          <Text style={styles.label}>{t('wallet.title')}</Text>
              <TouchableOpacity 
            style={styles.input}
                onPress={handleWalletPickerPress}
              >
            <Text
              style={styles.inputText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getSelectedWalletName}
            </Text>
                <Icon 
                  name="chevron-down" 
                  size={20} 
                  color="#666" 
                  style={{ position: 'absolute', right: 12 }}
                />
              </TouchableOpacity>
          </View>
        )}

        {/* Wallet Picker - Moved outside of main content to be an overlay */}

          {/* Amount */}
          <View style={styles.row}>
          <Text style={styles.label}>{t('amount')}</Text>
            <View style={styles.amountContainer}>
              <TextInput
              style={styles.amountInput}
                placeholder="0"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                maxLength={20} // Reduced for 15 digits with commas
              />
            <Text style={styles.currency}>{t('currency')}</Text>
            </View>
          </View>

          {/* Note */}
          <View style={styles.row}>
            <Text style={styles.label}>{t('note')}</Text>
            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder={t('common.enterNoteOptional')}
                value={note}
                onChangeText={(text) => {
                  // Trim leading/trailing whitespace and limit length
                  const trimmedText = text.trimStart();
                  if (trimmedText.length <= 500) {
                    setNote(trimmedText);
                  }
                }}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{note.length}/500</Text>
            </View>
          </View>

        {/* Receipt Image - Available for both expense and income tabs */}
        {selectedImage && (
          <View style={styles.row}>
            <Text style={styles.label}>{t('images')}</Text>
            <View style={styles.imageContainer}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setShowImagePreview(true)}>
                <Image source={{ uri: selectedImage }} style={styles.receiptImage} contentFit="cover" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>{t('category.title')}</Text>
        <View style={{ width: '100%', paddingHorizontal: 0 }}>
            <FlatList
              data={getCurrentCategories}
              renderItem={renderCategoryItem}
          keyExtractor={(item) => item.key}
          numColumns={4}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={{ width: '100%' }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={8}
              windowSize={5}
              getItemLayout={(data, index) => ({
                length: 80, // Approximate height of category item
                offset: 80 * Math.floor(index / 4),
                index,
              })}
            />
        </View>

          {/* Save Button */}
          {/* LƯU Ý: XÓA nút Save khỏi ScrollView */}
      </ScrollView>
      {/* Đặt nút Save ra ngoài ScrollView, luôn cố định dưới cùng */}
      <View style={styles.fixedSaveButtonContainer}>
        <OptimizedSaveButton
          onPress={handleSave}
          isLoading={isSaving}
          title={isEditMode 
                ? (activeTab === 'expense' ? t('common.editExpense') : t('common.editIncome'))
                : (activeTab === 'expense' ? t('common.addExpense') : t('common.addIncome'))
              }
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
          loadingColor="#fff"
        />
      </View>

      {/* Full-screen image preview */}
      <Modal visible={showImagePreview} transparent animationType="fade" onRequestClose={() => setShowImagePreview(false)}>
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="contain" />
            )}
            <TouchableOpacity style={styles.previewClose} onPress={() => setShowImagePreview(false)}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <Modal
          transparent={true}
          visible={showDatePicker}
          animationType="slide"
          onRequestClose={closeDatePicker}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContainer}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>
                  {t('date')}
                </Text>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Calendar
                current={date.toISOString().split('T')[0]}
                onDayPress={(day) => {
                  const selectedDate = new Date(day.dateString);
                  setDate(selectedDate);
                  closeDatePicker();
                }}
                markedDates={{
                  [date.toISOString().split('T')[0]]: {
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
                onPress={closeDatePicker}
              >
                <Text style={styles.dateModalConfirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Wallet Picker Modal */}
      {showWalletPicker && (
        <Modal 
          visible={showWalletPicker} 
          transparent 
          animationType="fade"
          onRequestClose={closeWalletPicker}
        >
          <TouchableOpacity 
            style={styles.walletModalOverlay} 
            activeOpacity={1} 
            onPress={closeWalletPicker}
          >
            <View style={styles.walletPickerContainer}>
              <Text style={styles.walletPickerTitle}>{t('common.selectWallet')}</Text>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletPickerItem,
                    selectedWallet === wallet.id && styles.walletPickerItemSelected
                  ]}
                  onPress={() => {
                    setSelectedWallet(wallet.id);
                    closeWalletPicker();
                  }}
                >
                  <Text
                    style={[
                      styles.walletPickerItemText,
                      selectedWallet === wallet.id && styles.walletPickerItemTextSelected
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {wallet.wallet_name}
                  </Text>
                  {wallet.is_default && (
                    <Text style={styles.walletPickerDefault}>{t('wallet.defaultWallet')}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Image Options Modal */}
      {showImageOptions && (
        <Modal 
          visible={showImageOptions} 
          transparent 
          animationType={isScanning ? 'none' : 'fade'}
          onRequestClose={() => setShowImageOptions(false)}
        >
          {isScanning ? (
            <View style={styles.imageOptionsOverlay}>
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#1e90ff" />
                <Text style={styles.loadingText}>{t('common.scanningInvoice')}</Text>
                <Text style={styles.subLoadingText}>{t('common.extractingText')}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imageOptionsOverlay} 
              activeOpacity={1} 
              onPress={() => setShowImageOptions(false)}
            >
              <View style={styles.imageOptionsContainer}>
                <Text style={styles.imageOptionsTitle}>
                  {activeTab === 'expense' ? t('addExpense') : t('addIncome')}
                </Text>
                
                <TouchableOpacity
                  style={styles.imageOptionItem}
                  onPress={takePhoto}
                >
                  <Icon name="camera" size={24} color="#007aff" />
                  <Text style={styles.imageOptionText}>{t('common.takePhoto')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.imageOptionItem}
                  onPress={pickFromGallery}
                >
                  <Icon name="image" size={24} color="#007aff" />
                  <Text style={styles.imageOptionText}>{t('common.photoLibrary')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.imageOptionItem}
                  onPress={pickFromGalleryWithCrop}
                >
                  <Icon name="crop" size={24} color="#007aff" />
                  <Text style={styles.imageOptionText}>{t('common.photoLibraryWithCrop')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.imageOptionItem, styles.imageOptionCancel]}
                  onPress={() => setShowImageOptions(false)}
                >
                  <Icon name="close" size={24} color="#666" />
                  <Text style={[styles.imageOptionText, styles.imageOptionCancelText]}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        </Modal>
      )}

      {/* Create Wallet Modal */}
      {showCreateWalletModal && (
        <Modal 
          visible={showCreateWalletModal} 
          transparent 
          animationType="fade"
          onRequestClose={closeCreateWalletModal}
        >
          <View style={styles.createWalletModalOverlay}>
            <View style={styles.createWalletContainer}>
                          <Text style={styles.createWalletTitle}>{t('common.noWallets')}</Text>
            <Text style={styles.createWalletMessage}>
              {t('common.noWalletsMessage')}
            </Text>
            
            <View style={styles.createWalletButtons}>
              <TouchableOpacity
                style={[styles.createWalletButton, styles.createWalletButtonCancel]}
                onPress={closeCreateWalletModal}
              >
                <Text style={styles.createWalletButtonTextCancel}>{t('common.no')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createWalletButton, styles.createWalletButtonConfirm]}
                onPress={handleCreateWallet}
              >
                <Text style={styles.createWalletButtonTextConfirm}>{t('common.yes')}</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Custom Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        duration={4000}
      />
      <CustomErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onDismiss={hideErrorModal}
      />
      <CustomSuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        buttonText={t('common.ok')}
        onConfirm={() => {
          // Call the onConfirm callback if it exists, otherwise just hide the modal
          if (successModal.onConfirm) {
            successModal.onConfirm();
          } else {
            hideSuccessModal();
          }
        }}
      />
    </SafeAreaView>
  );
}



