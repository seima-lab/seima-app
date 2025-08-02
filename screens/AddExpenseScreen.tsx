import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../navigation/types';

import CustomErrorModal from '../components/CustomErrorModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import CustomToast from '../components/CustomToast';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { categoryService, CategoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { ocrService, TransactionOcrResponse } from '../services/ocrService';
import { secureApiService } from '../services/secureApiService';
import { CreateTransactionRequest, transactionService, TransactionType } from '../services/transactionService';
import { WalletResponse, walletService } from '../services/walletService';

// Import centralized icon color utility
import { typography } from '@/constants/typography';
import { getIconColor } from '../utils/iconUtils';
export default function AddExpenseScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user, isAuthenticated, isLoading: authLoading, refreshTransactions } = useAuth();
  
  // Get route parameters for edit mode and group context
  const routeParams = route.params as any;
  const isEditMode = routeParams?.editMode || false;
  const transactionData = routeParams?.transactionData;
  const fromGroupOverview = routeParams?.fromGroupOverview || false;
  const fromGroupTransactionList = routeParams?.fromGroupTransactionList || false;
  const groupContextId = routeParams?.groupId;
  const groupContextName = routeParams?.groupName;
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(
    isEditMode && transactionData?.type ? transactionData.type : 'expense'
  );
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Cache state để tránh gọi API không cần thiết
  const [dataCache, setDataCache] = useState<{[key: string]: any}>({});
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 30000; // 30 giây
  
  // Prevent multiple concurrent API calls
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Hàm format số tiền từ OCR hoặc số nguyên
  const formatAmountFromNumber = useCallback((value: number): string => {
    if (value <= 0) return '';
    return value.toLocaleString('vi-VN');
  }, []);

  // Form data - pre-fill if in edit mode
  const [amount, setAmount] = useState(isEditMode && transactionData?.amount ? formatAmountFromNumber(transactionData.amount) : '');
  const [note, setNote] = useState(isEditMode && transactionData?.note ? transactionData.note : '');
  const [date, setDate] = useState(() => {
    if (isEditMode && transactionData?.date) {
      const parsedDate = new Date(transactionData.date);
      // Ensure we use local timezone
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      );
    }
    return new Date();
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<number | null>(
    fromGroupOverview ? 0 : null // Set to 0 for group transactions
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Data
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<LocalCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<LocalCategory[]>([]);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  // State cho modal lỗi
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  // State cho modal thành công
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [onSuccessModalConfirm, setOnSuccessModalConfirm] = useState<(() => void) | null>(null);

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
    return () => {
      isMountedRef.current = false;
    };
  }, [authLoading]);

  // Refresh data when screen is focused với debounce
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have initially loaded data (not on first mount)
      if (hasInitiallyLoaded) {
        const now = Date.now();
        if (now - lastFetchTime > CACHE_DURATION) {
          console.log('🔄 AddExpenseScreen focused - refreshing data');
          refreshData();
        } else {
          console.log('🔄 AddExpenseScreen focused - using cached data');
        }
      }
    }, [hasInitiallyLoaded, lastFetchTime])
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

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (!isMountedRef.current) {
      setIsLoading(false);
      return;
    }

    // Prevent multiple concurrent calls
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏭️ Skipping data load - already loading');
      return;
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION && Object.keys(dataCache).length > 0) {
      console.log('📦 Using cached data, last fetch:', new Date(lastFetchTime));
      setWallets(dataCache.wallets || []);
      setExpenseCategories(dataCache.expenseCategories || []);
      setIncomeCategories(dataCache.incomeCategories || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Loading all data in parallel...');
      
      // Load wallets and user profile in parallel
      const [walletsData, userProfile] = await Promise.all([
        walletService.getAllWallets(),
        secureApiService.getCurrentUserProfile() // Use /me API
      ]);
      
      console.log('✅ Wallets loaded:', walletsData.length);
      console.log('✅ User profile loaded:', userProfile);

      // Determine userId and groupId based on context
      let userId, groupId;
      if (fromGroupOverview) {
        // When called from GroupOverviewScreen, use userId=0 and current groupId
        userId = 0;
        groupId = groupContextId ? parseInt(groupContextId) : 0; // Convert to number
      } else {
        // When called from other screens, use real userId and groupId=0
        userId = userProfile.user_id;
        groupId = 0;
      }
      
      console.log('🔄 Loading categories for both tabs');
      console.log('🔍 AddExpenseScreen context:', {
        fromGroupOverview: fromGroupOverview,
        groupContextId: groupContextId,
        groupContextIdType: typeof groupContextId,
        groupContextName: groupContextName,
        isEditMode: isEditMode,
        willUseUserId: userId,
        willUseGroupId: groupId,
        willUseGroupIdType: typeof groupId,
        realUserId: userProfile.user_id
      });
      
      // Fetch categories separately for each tab with correct categoryType values
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE,  groupId), // categoryType=1
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, groupId),  // categoryType=0
      ]);

      console.log('✅ Categories loaded:', {
        expenseCount: expenseCats.length,
        incomeCount: incomeCats.length,
      });
      
      console.log('📊 Raw expense categories from API:', expenseCats.map(cat => ({
        category_id: cat.category_id,
        category_name: cat.category_name,
        category_type: cat.category_type
      })));
      
      console.log('📊 Raw income categories from API:', incomeCats.map(cat => ({
        category_id: cat.category_id,
        category_name: cat.category_name,
        category_type: cat.category_type
      })));

      // IMPORTANT: Check if income categories are empty
      if (incomeCats.length === 0) {
        console.error('❌ INCOME CATEGORIES ARE EMPTY after API call with categoryType=0!');
        console.error('Please check if backend has income categories with categoryType=0.');
      }

      // Convert to local format và sort theo id tăng dần
      const categoryServiceInstance = CategoryService.getInstance();
      const convertedExpenseCategories = expenseCats
        .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
        .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0));
      
      const convertedIncomeCategories = incomeCats
        .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
        .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0));

      setWallets(walletsData);
      setExpenseCategories(convertedExpenseCategories);
      setIncomeCategories(convertedIncomeCategories);

      console.log('🔄 Converted expense categories:', expenseCats.map(cat => {
        const converted = categoryServiceInstance.convertToLocalCategory(cat);
        return {
          original_id: cat.category_id,
          converted_key: converted.key,
          converted_category_id: converted.category_id,
          label: converted.label
        };
      }));

      console.log('🔄 Converted income categories:', incomeCats.map(cat => {
        const converted = categoryServiceInstance.convertToLocalCategory(cat);
        return {
          original_id: cat.category_id,
          converted_key: converted.key,
          converted_category_id: converted.category_id,
          label: converted.label
        };
      }));

      // Set default category based on current active tab or edit mode
      if (isEditMode && transactionData?.category) {
        // In edit mode, try to find and select the matching category
        const allCategories = [...expenseCats, ...incomeCats];
        
        // First try to find by category_id if available (from group transaction list)
        let matchingCategory = null;
        if (transactionData.categoryId) {
          matchingCategory = allCategories.find(cat => cat.category_id === transactionData.categoryId);
          console.log('🔍 Looking for category by ID:', {
            categoryId: transactionData.categoryId,
            found: !!matchingCategory
          });
        }
        
        // If not found by ID, try by name
        if (!matchingCategory) {
          matchingCategory = allCategories.find(cat => cat.category_name === transactionData.category);
          console.log('🔍 Looking for category by name:', {
            categoryName: transactionData.category,
            found: !!matchingCategory
          });
        }
        
        if (matchingCategory) {
          const categoryKey = categoryServiceInstance.convertToLocalCategory(matchingCategory).key;
          console.log('🔍 Setting edit mode category:', {
            transactionCategory: transactionData.category,
            transactionCategoryId: transactionData.categoryId,
            matchingCategoryId: matchingCategory.category_id,
            categoryKey: categoryKey,
            fromGroupTransactionList: fromGroupTransactionList
          });
          setSelectedCategory(categoryKey);
        } else {
          console.log('⚠️ Could not find matching category for:', {
            category: transactionData.category,
            categoryId: transactionData.categoryId,
            availableCategories: allCategories.map(cat => ({
              id: cat.category_id,
              name: cat.category_name
            }))
          });
          // Fall back to default category selection
          const categories = activeTab === 'expense' ? expenseCats : incomeCats;
          if (categories.length > 0) {
            const defaultCategoryKey = categoryServiceInstance.convertToLocalCategory(categories[0]).key;
            setSelectedCategory(defaultCategoryKey);
          }
        }
      } else {
        // Normal mode - set default category based on current active tab
        if (activeTab === 'expense' && expenseCats.length > 0) {
          const defaultCategoryKey = categoryServiceInstance.convertToLocalCategory(expenseCats[0]).key;
          console.log('🔍 Setting default expense category:', {
            activeTab: activeTab,
            defaultCategoryKey: defaultCategoryKey,
            defaultCategory: expenseCats[0]
          });
          setSelectedCategory(defaultCategoryKey);
        } else if (activeTab === 'income' && incomeCats.length > 0) {
          const defaultCategoryKey = categoryServiceInstance.convertToLocalCategory(incomeCats[0]).key;
          console.log('🔍 Setting default income category:', {
            activeTab: activeTab,
            defaultCategoryKey: defaultCategoryKey,
            defaultCategory: incomeCats[0]
          });
          setSelectedCategory(defaultCategoryKey);
        }
      }

      // Set default wallet selection
      if (walletsData.length > 0) {
        const defaultWallet = walletsData.find(w => w.is_default) || walletsData[0];
        setSelectedWallet(defaultWallet.id);
        console.log('✅ Default wallet selected:', defaultWallet.wallet_name);
      }

      // Update cache
      setDataCache({
        wallets: walletsData,
        expenseCategories: convertedExpenseCategories,
        incomeCategories: convertedIncomeCategories
      });
      setLastFetchTime(now);

      console.log('✅ All data loaded successfully');
      setHasInitiallyLoaded(true);

    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Handle authentication errors specifically
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        Alert.alert(t('common.error'), t('common.pleaseLogin'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert(t('common.error'), t('common.failedToLoadData'));
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [fromGroupOverview, groupContextId, groupContextName, isEditMode, transactionData, activeTab, fromGroupTransactionList, lastFetchTime, dataCache, t, navigation]);

  const refreshCategories = async () => {
    try {
      console.log('🔄 Refreshing categories only...');
      
      // Get user profile
      const userProfile = await secureApiService.getCurrentUserProfile();
      
      // Determine userId and groupId based on context
      let userId, groupId;
      if (fromGroupOverview) {
        // When called from GroupOverviewScreen, use userId=0 and current groupId
        userId = 0;
        groupId = groupContextId ? parseInt(groupContextId) : 0; // Convert to number
      } else {
        // When called from other screens, use real userId and groupId=0
        userId = userProfile.user_id;
        groupId = 0;
      }
      
      console.log('🔄 Refreshing categories for both tabs');
      console.log('🔍 AddExpenseScreen context (refresh):', {
        fromGroupOverview: fromGroupOverview,
        groupContextId: groupContextId,
        groupContextIdType: typeof groupContextId,
        groupContextName: groupContextName,
        willUseUserId: userId,
        willUseGroupId: groupId,
        willUseGroupIdType: typeof groupId,
        realUserId: userProfile.user_id
      });
      
      // Fetch categories separately for each tab with correct categoryType values
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, groupId),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME,  groupId),
      ]);

      console.log('✅ Categories refreshed:', {
        expenseCount: expenseCats.length,
        incomeCount: incomeCats.length,
      });

      // Convert to local format và sort theo id tăng dần
      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(
        expenseCats
          .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
          .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0))
      );
      setIncomeCategories(
        incomeCats
          .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
          .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0))
      );

      // Update selected category if current one is invalid
      const currentCategories = activeTab === 'expense' ? expenseCats : incomeCats;
      const isCurrentCategoryValid = currentCategories.some(cat => cat.category_id.toString() === selectedCategory);
      
      if (!isCurrentCategoryValid && currentCategories.length > 0) {
        const newCategoryId = currentCategories[0].category_id.toString();
        console.log('🔄 Updating selected category after refresh:', newCategoryId);
        setSelectedCategory(newCategoryId);
      }

      console.log('✅ Categories refreshed successfully');

    } catch (error: any) {
      console.error('❌ Error refreshing categories:', error);
    }
  };

  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing categories and wallets...');
      
      // Refresh wallets and categories in parallel
      const [walletsData] = await Promise.all([
        walletService.getAllWallets(),
        refreshCategories(),
      ]);
      
      console.log('✅ Wallets refreshed:', walletsData.length);
      setWallets(walletsData);

      // Update wallet selection if current one is invalid or if no wallet selected
      // But don't reset if from group overview (keep it as 0)
      if (!fromGroupOverview && (!selectedWallet || !walletsData.some(w => w.id === selectedWallet))) {
        if (walletsData.length > 0) {
          const defaultWallet = walletsData.find(w => w.is_default) || walletsData[0];
          setSelectedWallet(defaultWallet.id);
          console.log('🔄 Updated selected wallet after refresh:', defaultWallet.wallet_name);
        } else {
          setSelectedWallet(null);
          console.log('🔄 No wallets available after refresh');
        }
      }

      console.log('✅ Data refreshed successfully');

    } catch (error: any) {
      console.error('❌ Error refreshing data:', error);
    }
  }, [fromGroupOverview, selectedWallet]);

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

  const takePhoto = async () => {
    try {
      console.log('📷 Starting camera capture...');
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('❌ Camera permission denied');
        return;
      }

      console.log('📷 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow taking full photo without cropping
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      console.log('📷 Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Photo taken successfully:', imageUri);
        setSelectedImage(imageUri);
        setShowImageOptions(false);
        
        // Auto-scan for expense tab without asking
        if (activeTab === 'expense') {
          console.log('🔄 Auto-scanning photo for expense...');
          scanInvoice(imageUri);
        } else {
          console.log('ℹ️ Photo saved for income tab (no auto-scan)');
        }
      } else {
        console.log('📷 Camera capture cancelled or failed');
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert(t('common.error'), t('common.failedToTakePhoto'));
    }
  };

  const pickFromGallery = async () => {
    try {
      console.log('🖼️ Starting gallery picker...');
      const hasPermission = await requestLibraryPermission();
      if (!hasPermission) {
        console.log('❌ Gallery permission denied');
        return;
      }

      console.log('🖼️ Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting full image without cropping
        quality: 0.8,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        legacy: Platform.OS === 'android', // Use legacy picker on Android for better file access
      });

      console.log('🖼️ Gallery result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Image selected successfully:', imageUri);
        setSelectedImage(imageUri);
        setShowImageOptions(false);
        
        // Auto-scan for expense tab without asking
        if (activeTab === 'expense') {
          console.log('🔄 Auto-scanning gallery image for expense...');
          scanInvoice(imageUri);
        } else {
          console.log('ℹ️ Photo saved for income tab (no auto-scan)');
        }
      } else {
        console.log('🖼️ Gallery selection cancelled or failed');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert(t('common.error'), t('common.failedToPickImage'));
    }
  };

  const pickFromGalleryWithCrop = async () => {
    try {
      console.log('✂️ Starting gallery picker with crop...');
      const hasPermission = await requestLibraryPermission();
      if (!hasPermission) {
        console.log('❌ Gallery permission denied for crop');
        return;
      }

      console.log('✂️ Launching image library with crop editor...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Allow editing/cropping
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      console.log('✂️ Gallery with crop result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Cropped image selected successfully:', imageUri);
        setSelectedImage(imageUri);
        setShowImageOptions(false);
        
        // Auto-scan for expense tab without asking
        if (activeTab === 'expense') {
          console.log('🔄 Auto-scanning cropped image for expense...');
          scanInvoice(imageUri);
        } else {
          console.log('ℹ️ Photo saved for income tab (no auto-scan)');
        }
    } else {
        console.log('✂️ Gallery with crop cancelled or failed');
      }
    } catch (error) {
      console.error('❌ Error picking image with crop:', error);
      Alert.alert(t('common.error'), t('common.failedToPickImage'));
    }
  };

  const scanInvoice = async (imageUri: string) => {
    console.log('🤖 Starting OCR scan process...');
    console.log('📸 Image URI:', imageUri);
    setIsScanning(true);
    try {
      console.log('🔄 Scanning invoice for OCR...');
      
      // Convert image URI to File/Blob for web or create proper format for mobile
      let file: File | Blob;
      
      if (Platform.OS === 'web') {
        console.log('🌐 Platform: Web - Converting URI to blob...');
        // For web, convert URI to blob
        const response = await fetch(imageUri);
        file = await response.blob();
        console.log('✅ Blob created for web:', file.size, 'bytes');
      } else {
        console.log('📱 Platform: Mobile - Creating file object...');
        // For mobile, create a file-like object
        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        console.log('📝 Original filename:', filename);
        
        file = {
          uri: imageUri,
          type: 'image/jpeg',
          name: filename,
        } as any;
        
        console.log('✅ File object created for mobile:', {
          uri: (file as any).uri,
          type: (file as any).type,
          name: (file as any).name
        });
      }
      
      console.log('🚀 Calling OCR service...');
      const ocrResult: TransactionOcrResponse = await ocrService.scanInvoice(file);
      console.log('📊 OCR Result received:', ocrResult);
      
      // Auto-fill form with OCR results
      if (ocrResult.total_amount) {
        console.log('💰 Setting amount:', ocrResult.total_amount);
        setAmount(formatAmountFromNumber(ocrResult.total_amount));
      } else {
        console.log('⚠️ No amount found in OCR result');
      }
      
      if (ocrResult.transaction_date) {
        console.log('📅 Setting date:', ocrResult.transaction_date);
        // Parse date properly to avoid timezone issues
        const parsedDate = new Date(ocrResult.transaction_date);
        if (!isNaN(parsedDate.getTime())) {
          // Create a new date object in local timezone to preserve the date
          const localDate = new Date(
            parsedDate.getFullYear(),
            parsedDate.getMonth(),
            parsedDate.getDate()
          );
          setDate(localDate);
          console.log('✅ Date set successfully (local):', localDate);
        } else {
          console.log('❌ Invalid date format:', ocrResult.transaction_date);
        }
      } else {
        console.log('⚠️ No date found in OCR result');
      }
      
      if (ocrResult.description_invoice) {
        console.log('📝 Setting note:', ocrResult.description_invoice);
        setNote(ocrResult.description_invoice);
      } else {
        console.log('⚠️ No description found in OCR result');
      }
      
      // Update the receipt image URL from OCR response
      if (ocrResult.receipt_image_url) {
        console.log('🖼️ Updating image URL:', ocrResult.receipt_image_url);
        setSelectedImage(ocrResult.receipt_image_url);
      } else {
        console.log('ℹ️ No receipt image URL in OCR result, keeping original');
      }
      
      console.log('✅ Invoice scanned and form auto-filled successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to scan invoice:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setToastMessage(t('common.failedToExtractText'));
      setToastType('error');
      setShowToast(true);
    } finally {
      console.log('🏁 OCR scan process completed');
      setIsScanning(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      console.log('🔄 Getting user profile for transaction...');
      
      // Get user profile to get real userId
      const userProfile = await secureApiService.getCurrentUserProfile();
      const userId = userProfile.user_id;
      
      console.log('✅ User ID for transaction:', userId);

      const amountValue = getNumericAmount(amount);
      const categoryId = parseInt(selectedCategory);

      console.log('🔍 Form debug info:', {
        selectedCategory: selectedCategory,
        parsedCategoryId: categoryId,
        activeTab: activeTab,
        transactionType: activeTab === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME,
        currentCategories: getCurrentCategories().map(cat => ({
          key: cat.key,
          label: cat.label,
          category_id: cat.category_id
        })),
        selectedCategoryDetails: getCurrentCategories().find(cat => cat.key === selectedCategory)
      });

      // Format date with current Vietnam time in ISO format
      const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Get current time (already in Vietnam timezone)
        const now = new Date();
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(2, '0');
        
        // Format: 2025-07-20T08:04:33.11
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
      };

      const transactionData: CreateTransactionRequest = {
        user_id: userId, // Use real userId from /me API
        wallet_id: fromGroupOverview ? 0 : selectedWallet!, // Set wallet_id to 0 for group transactions
        category_id: categoryId,
        group_id: fromGroupOverview && groupContextId ? parseInt(groupContextId) : undefined, // Convert groupId to number

        amount: amountValue,
        currency_code: 'VND',
        transaction_date: formatDateForAPI(date),
        description: note.trim() || undefined,
        receipt_image_url: selectedImage || null,
        payee_payer_name: undefined,
      };

      console.log('🔄 Saving transaction:', transactionData);
      console.log('🔍 Transaction context:', {
        fromGroupOverview: fromGroupOverview,
        groupContextId: groupContextId,
        groupContextIdType: typeof groupContextId,
        parsedGroupId: fromGroupOverview && groupContextId ? parseInt(groupContextId) : undefined,
        finalGroupId: fromGroupOverview && groupContextId ? parseInt(groupContextId) : undefined,
        isGroupTransaction: !!fromGroupOverview
      });
      console.log('📅 Date debugging:', {
        originalDate: date,
        localDateString: date.toLocaleDateString(),
        isoString: date.toISOString(),
        formattedForAPI: formatDateForAPI(date),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (isEditMode && routeParams?.transactionData?.id) {
        // Update existing transaction
        const transactionId = parseInt(routeParams.transactionData.id);
        console.log('🔄 Updating existing transaction with ID:', transactionId);
        await transactionService.updateTransaction(transactionId, transactionData);
        // Trigger global refresh và quay lại ngay
        refreshTransactions();
        setIsSaving(false); // Đặt trước navigation.goBack()
        setSuccessModalTitle(t('common.success'));
        setSuccessModalMessage(t('common.transactionUpdated'));
        setSuccessModalVisible(true);
        setOnSuccessModalConfirm(() => () => {
          setSuccessModalVisible(false);
          navigation.goBack();
        });
      } else {
        // Create new transaction
        if (activeTab === 'expense') {
          await transactionService.createExpense(transactionData);
        } else {
          await transactionService.createIncome(transactionData);
        }
        // Trigger global refresh và quay lại ngay
        refreshTransactions();
        setIsSaving(false); // Đặt trước navigation.goBack()
        setSuccessModalTitle(t('common.success'));
        setSuccessModalMessage(t('common.transactionSaved'));
        setSuccessModalVisible(true);
        setOnSuccessModalConfirm(() => () => {
          setSuccessModalVisible(false);
          navigation.goBack();
        });
      }

    } catch (error: any) {
      console.error('Error saving transaction:', error);
      
      // Handle authentication errors specifically  
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        setErrorModalTitle(t('common.error'));
        setErrorModalMessage(t('common.pleaseLogin'));
        setErrorModalVisible(true);
        setOnSuccessModalConfirm(() => () => {
          setErrorModalVisible(false);
          if (fromGroupTransactionList && groupContextId && groupContextName) {
            (navigation as any).reset({
              index: 1,
              routes: [
                { name: 'GroupDetail', params: { groupId: groupContextId, groupName: groupContextName } },
                { name: 'GroupTransactionList', params: { groupId: groupContextId, groupName: groupContextName } }
              ],
            });
          } else if (fromGroupOverview && groupContextId && groupContextName) {
            // For GroupOverview, just go back normally to avoid navigation stack issues
            navigation.goBack();
          } else {
            // Normal navigation back
            navigation.goBack();
          }
        });
      } else {
        setErrorModalTitle(t('common.error'));
        setErrorModalMessage(t('common.failedToSaveTransaction'));
        setErrorModalVisible(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    if (!amount.trim()) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.pleaseEnterAmount'));
      setErrorModalVisible(true);
      return false;
    }
    
    const amountValue = getNumericAmount(amount);
    if (amountValue <= 0) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.pleaseEnterValidAmount'));
      setErrorModalVisible(true);
      return false;
    }
    
    // Check if amount exceeds 15 digits
    const digitsOnly = amount.replace(/[^\d]/g, '');
    if (digitsOnly.length > 15) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.amountExceed15Digits'));
      setErrorModalVisible(true);
      return false;
    }
    
    // Check if amount is too large for JavaScript number precision
    if (amountValue > Number.MAX_SAFE_INTEGER) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.amountTooLarge'));
      setErrorModalVisible(true);
      return false;
    }
    
    // Validate note (optional but with constraints if provided)
    if (note.trim().length > 500) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.noteExceed500Chars'));
      setErrorModalVisible(true);
      return false;
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
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.noteInvalidChars'));
      setErrorModalVisible(true);
      return false;
    }
    
    if (!selectedCategory) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.pleaseSelectCategory'));
      setErrorModalVisible(true);
      return false;
    }
    
    // Only validate wallet selection if not from group overview
    if (!fromGroupOverview && !selectedWallet) {
      setErrorModalTitle(t('common.error'));
      setErrorModalMessage(t('common.pleaseSelectWallet'));
      setErrorModalVisible(true);
      return false;
    }
    
    return true;
  };

  const formatDate = (date: Date) => {
    const currentLocale = i18n.language || 'en';
    return date.toLocaleDateString(currentLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Ensure we use the selected date in local timezone
      const localDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setDate(localDate);
      console.log('📅 Date changed to (local):', {
        selected: selectedDate,
        local: localDate,
        localString: localDate.toLocaleDateString()
      });
    }
  };

  const getCurrentCategories = useCallback(() => {
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

  const getSelectedWalletName = useCallback(() => {
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

  const handleWalletPickerPress = () => {
    if (wallets.length === 0) {
      // No wallets available, show create wallet modal
      setShowCreateWalletModal(true);
    } else {
      // Has wallets, show wallet picker
      setShowWalletPicker(true);
    }
  };

  const handleCreateWallet = () => {
    setShowCreateWalletModal(false);
    (navigation as any).navigate('AddWalletScreen');
  };

  // Hàm format số tiền với dấu phẩy
  const formatAmountInput = (text: string): string => {
    // Loại bỏ tất cả ký tự không phải số
    const numericValue = text.replace(/[^\d]/g, '');
    
    if (numericValue === '') return '';
    
    // Giới hạn tối đa 15 chữ số - chỉ lấy 15 chữ số đầu tiên
    const limitedNumericValue = numericValue.slice(0, 15);
    
    // Chuyển thành số và format với dấu phẩy
    const number = parseInt(limitedNumericValue, 10);
    return number.toLocaleString('vi-VN');
  };

  // Hàm lấy giá trị số từ text đã format
  const getNumericAmount = (formattedText: string): number => {
    const numericValue = formattedText.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  // Thêm hàm copy transaction
  const handleCopyTransaction = () => {
    if (!isEditMode || !transactionData) return;
    navigation.navigate('AddExpenseScreen', {
      ...transactionData,
      editMode: false, // chuyển sang chế độ add
    });
  };


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

  // Skeleton Loading Component
  const SkeletonLoader = React.memo(() => (
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
  ));

  SkeletonLoader.displayName = 'SkeletonLoader';

  // Show full loading only when no data has been loaded
  if (showFullLoading) {
    return <SkeletonLoader />;
  }

  // Show scanning overlay when OCR is processing
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
                onPress={handleCopyTransaction}
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
            onPress={() => setShowDatePicker(true)}
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
              {getSelectedWalletName()}
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
                onChangeText={(text) => {
                  // Format with commas and limit to 15 digits
                  const formattedText = formatAmountInput(text);
                  setAmount(formattedText);
                }}
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
            <Text style={styles.label}>
              {activeTab === 'expense' ? 'Receipt' : 'Photo'}
            </Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.receiptImage} />
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
              data={getCurrentCategories()}
              renderItem={renderCategoryItem}
          keyExtractor={(item) => item.key}
          numColumns={4}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={{ width: '100%' }}
            />
        </View>

          {/* Save Button */}
          {/* LƯU Ý: XÓA nút Save khỏi ScrollView */}
      </ScrollView>
      {/* Đặt nút Save ra ngoài ScrollView, luôn cố định dưới cùng */}
      <View style={styles.fixedSaveButtonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode 
                ? (activeTab === 'expense' ? t('common.editExpense') : t('common.editIncome'))
                : (activeTab === 'expense' ? t('common.addExpense') : t('common.addIncome'))
              }
            </Text>
            )}
          </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButton}>{t('cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t('date')}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButton}>{t('done')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Wallet Picker Modal */}
      {showWalletPicker && (
        <Modal visible={showWalletPicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.walletModalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowWalletPicker(false)}
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
                    setShowWalletPicker(false);
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
        <Modal visible={showImageOptions} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
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
        </Modal>
      )}

      {/* Create Wallet Modal */}
      {showCreateWalletModal && (
        <Modal visible={showCreateWalletModal} transparent animationType="fade">
          <View style={styles.createWalletModalOverlay}>
            <View style={styles.createWalletContainer}>
                          <Text style={styles.createWalletTitle}>{t('common.noWallets')}</Text>
            <Text style={styles.createWalletMessage}>
              {t('common.noWalletsMessage')}
            </Text>
            
            <View style={styles.createWalletButtons}>
              <TouchableOpacity
                style={[styles.createWalletButton, styles.createWalletButtonCancel]}
                onPress={() => setShowCreateWalletModal(false)}
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
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
        duration={4000}
      />
      <CustomErrorModal
        visible={errorModalVisible}
        title={errorModalTitle}
        message={errorModalMessage}
        onDismiss={() => {
          setErrorModalVisible(false);
          if (onSuccessModalConfirm) {
            onSuccessModalConfirm();
            setOnSuccessModalConfirm(null);
          }
        }}
      />
      <CustomSuccessModal
        visible={successModalVisible}
        title={successModalTitle}
        message={successModalMessage}
        buttonText={t('common.ok')}
        onConfirm={() => {
          if (onSuccessModalConfirm) {
            onSuccessModalConfirm();
            setOnSuccessModalConfirm(null);
          } else {
            setSuccessModalVisible(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    ...typography.regular,
    fontSize: 16,
  },
  subLoadingText: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    ...typography.regular,
   
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 80, // Thêm padding bottom để tránh bị che bởi nút Save
    width: '100%', // Đảm bảo width đúng
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#007aff',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  editHeaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  editHeaderTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  label: { 
    width: 80,
    fontSize: 16, 
    color: '#333', 
    ...typography.regular, 
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative', // Thêm position relative
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1, // Cho phép text chiếm hết không gian có sẵn
    marginRight: 24, // Để lại khoảng trống cho icon dropdown
  },
  dateText: {
    fontSize: 16,
    color: '#007aff',
    ...typography.regular,
  },
  amountContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    minHeight: 44, // Đảm bảo chiều cao tối thiểu
  },
  currency: {
    marginLeft: 8, 
    color: '#666',
    fontSize: 16,
  },
  noteContainer: {
    flex: 1,
  },
  noteInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 16,
    ...typography.regular,
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 8, // Thêm padding horizontal cân bằng với categories
    width: '100%', // Đảm bảo title chiếm toàn bộ chiều rộng
  },
  categoriesContainer: { 
    paddingBottom: 20,
    paddingHorizontal: 8, // Thêm padding horizontal cân bằng hai bên
    width: '100%', // Đảm bảo container chiếm toàn bộ chiều rộng
    // Đảm bảo categories có margin cân bằng hai bên
  },
  categoryItem: {
    width: '25%', // Đảm bảo mỗi item chiếm đúng 1/4 chiều rộng
    aspectRatio: 1, // Đảm bảo item có hình vuông
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4, // Giảm padding hơn nữa
   // Tăng margin để tạo khoảng cách cân bằng
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  categoryItemSelected: {
    borderColor: '#007aff',
    backgroundColor: '#e6f2ff',
  },
  categoryText: { 
    fontSize: 9, // Giảm font size hơn nữa
    color: '#333', 
    marginTop: 2, // Giảm margin top
    textAlign: 'center',
    lineHeight: 11, // Giảm line height
    flexWrap: 'wrap',
    paddingHorizontal: 2, // Thêm padding horizontal cho text
  },
  saveButton: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0, // Bỏ margin top vì đã có padding trong container
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff', 
    fontSize: 16,
    ...typography.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    ...typography.semibold,
  },
  modalButton: {
    fontSize: 16,
    color: '#1e90ff',
  },
  walletModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  walletPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  walletPickerTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  walletPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  walletPickerItemSelected: {
    backgroundColor: '#e6f2ff',
  },
  walletPickerItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  walletPickerItemTextSelected: {
    color: '#1e90ff',
    ...typography.semibold,
  },
  walletPickerDefault: {
    fontSize: 12,
    color: '#1e90ff',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    ...typography.regular,
  },
  // Camera button styles
  cameraButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  // Image styles
  imageContainer: {
    position: 'relative',
    flex: 1,
  },
  receiptImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Image options modal styles
  imageOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  imageOptionsTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageOptionCancel: {
    borderBottomWidth: 0,
  },
  imageOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  imageOptionCancelText: {
    color: '#666',
  },
  // Create Wallet Modal styles
  createWalletModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  createWalletContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    padding: 20,
  },
  createWalletTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  createWalletMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  createWalletButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  createWalletButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createWalletButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  createWalletButtonConfirm: {
    backgroundColor: '#007aff',
  },
  createWalletButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    ...typography.regular,
  },
  createWalletButtonTextConfirm: {
    color: '#fff',
    fontSize: 16,
    ...typography.regular,
  },
  // Group context styles
  groupContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  groupContextText: {
    fontSize: 14,
    color: '#4A90E2',
    ...typography.regular,
    marginLeft: 6,
  },
  // Thêm style mới cho container cố định nút Save
  fixedSaveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    // Đảm bảo nút Save luôn ở dưới cùng và không bị che
  },
  
  // Skeleton Styles
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonBackButton: {
    width: 24,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  skeletonTabContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 16,
    height: 36,
  },
  skeletonTab: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    margin: 2,
  },
  skeletonCameraButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginLeft: 12,
  },
  skeletonFormContainer: {
    marginBottom: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonLabel: {
    width: 80,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 12,
  },
  skeletonAmountInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 12,
  },
  skeletonNoteInput: {
    flex: 1,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 12,
  },
  skeletonCategoriesContainer: {
    marginTop: 20,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonCategoryItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
});

