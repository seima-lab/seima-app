import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
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

import CustomToast from '../components/CustomToast';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { categoryService, CategoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { ocrService, TransactionOcrResponse } from '../services/ocrService';
import { secureApiService } from '../services/secureApiService';
import { CreateTransactionRequest, transactionService, TransactionType } from '../services/transactionService';
import { WalletResponse, walletService } from '../services/walletService';

// Import centralized icon color utility
import { getIconColor } from '../utils/iconUtils';

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
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
  
  // Form data - pre-fill if in edit mode
  const [amount, setAmount] = useState(isEditMode && transactionData?.amount ? transactionData.amount.toLocaleString('vi-VN') : '');
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
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
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
  }, [authLoading]);

  // Refresh data when screen is focused (for updated categories and wallets)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have initially loaded data (not on first mount)
      if (hasInitiallyLoaded) {
        console.log('🔄 AddExpenseScreen focused - refreshing categories and wallets');
        refreshData();
      }
    }, [hasInitiallyLoaded])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading wallets and user profile...');
      
      // Load wallets and user profile in parallel
      const [walletsData, userProfile] = await Promise.all([
        walletService.getAllWallets(),
        secureApiService.getCurrentUserProfile() // Use /me API
      ]);
      
      console.log('✅ Wallets loaded:', walletsData.length);
      console.log('✅ User profile loaded:', userProfile);

      setWallets(walletsData);

      // Set default wallet selection
      if (walletsData.length > 0) {
        const defaultWallet = walletsData.find(w => w.is_default) || walletsData[0];
        setSelectedWallet(defaultWallet.id);
        console.log('✅ Default wallet selected:', defaultWallet.wallet_name);
      }

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
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, userId, groupId), // categoryType=1
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, userId, groupId),  // categoryType=0
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

      // Convert to local format
      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(expenseCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));
      setIncomeCategories(incomeCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));

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
        const matchingCategory = allCategories.find(cat => cat.category_name === transactionData.category);
        if (matchingCategory) {
          const categoryKey = categoryServiceInstance.convertToLocalCategory(matchingCategory).key;
          console.log('🔍 Setting edit mode category:', {
            transactionCategory: transactionData.category,
            matchingCategoryId: matchingCategory.category_id,
            categoryKey: categoryKey
          });
          setSelectedCategory(categoryKey);
        } else {
          console.log('⚠️ Could not find matching category for:', transactionData.category);
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
    }
  };

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
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, userId, groupId),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, userId, groupId),
      ]);

      console.log('✅ Categories refreshed:', {
        expenseCount: expenseCats.length,
        incomeCount: incomeCats.length,
      });

      // Convert to local format
      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(expenseCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));
      setIncomeCategories(incomeCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));

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

  const refreshData = async () => {
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
      if (!selectedWallet || !walletsData.some(w => w.id === selectedWallet)) {
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
  };

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
    
    console.log('🔍 Categories for new tab:', {
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
        setAmount(ocrResult.total_amount.toString());
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

      // Format date - use noon time to avoid timezone issues
      const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        // Use noon (12:00) to avoid timezone conversion issues
        return `${year}-${month}-${day}T12:00:00.000Z`;
      };

      const transactionData: CreateTransactionRequest = {
        user_id: userId, // Use real userId from /me API
        wallet_id: selectedWallet!,
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
        
        // Trigger global refresh
        refreshTransactions();
        
        Alert.alert(t('common.success'), t('common.transactionUpdated'), [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to appropriate screen
              if (fromGroupTransactionList && groupContextId && groupContextName) {
                // Navigate back to GroupTransactionList screen
                (navigation as any).navigate('GroupTransactionList', {
                  groupId: groupContextId,
                  groupName: groupContextName
                });
              } else if (fromGroupOverview && groupContextId && groupContextName) {
                // Navigate back to GroupDetail screen
                (navigation as any).navigate('GroupDetail', {
                  groupId: groupContextId,
                  groupName: groupContextName
                });
              } else {
                // Normal navigation back
                navigation.goBack();
              }
            }
          }
        ]);
      } else {
        // Create new transaction
        if (activeTab === 'expense') {
          await transactionService.createExpense(transactionData);
        } else {
          await transactionService.createIncome(transactionData);
        }
        
        // Trigger global refresh
        refreshTransactions();
        
        Alert.alert(t('common.success'), t('common.transactionSaved'), [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to appropriate screen
              if (fromGroupTransactionList && groupContextId && groupContextName) {
                // Navigate back to GroupTransactionList screen
                (navigation as any).navigate('GroupTransactionList', {
                  groupId: groupContextId,
                  groupName: groupContextName
                });
              } else if (fromGroupOverview && groupContextId && groupContextName) {
                // Navigate back to GroupDetail screen
                (navigation as any).navigate('GroupDetail', {
                  groupId: groupContextId,
                  groupName: groupContextName
                });
              } else {
                // Normal navigation back
                navigation.goBack();
              }
            }
          }
        ]);
      }

    } catch (error: any) {
      console.error('Error saving transaction:', error);
      
      // Handle authentication errors specifically  
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        Alert.alert(t('common.error'), t('common.pleaseLogin'), [
          { 
            text: 'OK', 
            onPress: () => {
              if (fromGroupTransactionList && groupContextId && groupContextName) {
                // Navigate back to GroupTransactionList screen
                (navigation as any).navigate('GroupTransactionList', {
                  groupId: groupContextId,
                  groupName: groupContextName
                });
              } else if (fromGroupOverview && groupContextId && groupContextName) {
                // Navigate back to GroupDetail screen
                (navigation as any).navigate('GroupDetail', {
                  groupId: groupContextId,
                  groupName: groupContextName
                });
              } else {
                // Normal navigation back
                navigation.goBack();
              }
            }
          }
        ]);
      } else {
        Alert.alert(t('common.error'), t('common.failedToSaveTransaction'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    if (!amount.trim()) {
      Alert.alert(t('common.error'), t('common.pleaseEnterAmount'));
      return false;
    }
    
    const amountValue = getNumericAmount(amount);
    if (amountValue <= 0) {
      Alert.alert(t('common.error'), t('common.pleaseEnterValidAmount'));
      return false;
    }
    
    // Check if amount exceeds 15 digits
    const digitsOnly = amount.replace(/[^\d]/g, '');
    if (digitsOnly.length > 15) {
      Alert.alert(t('common.error'), t('common.amountExceed15Digits'));
      return false;
    }
    
    // Check if amount is too large for JavaScript number precision
    if (amountValue > Number.MAX_SAFE_INTEGER) {
      Alert.alert(t('common.error'), t('common.amountTooLarge'));
      return false;
    }
    
    // Validate note (optional but with constraints if provided)
    if (note.trim().length > 500) {
      Alert.alert(t('common.error'), t('common.noteExceed500Chars'));
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
      Alert.alert(t('common.error'), t('common.noteInvalidChars'));
      return false;
    }
    
    if (!selectedCategory) {
      Alert.alert(t('common.error'), t('common.pleaseSelectCategory'));
      return false;
    }
    
    if (!selectedWallet) {
      Alert.alert(t('common.error'), t('common.pleaseSelectWallet'));
      return false;
    }
    
    return true;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
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

  const getCurrentCategories = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    
    // Only add "Edit" item if not called from GroupOverviewScreen
    if (fromGroupOverview) {
      // Return categories without edit option when from group overview
      return categories;
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
    
    return [...categories, editItem];
  };

  const getSelectedWalletName = () => {
    if (wallets.length === 0) {
      return t('wallet.addWallet');
    }
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet ? wallet.wallet_name : t('wallet.addWallet');
  };

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
    
    // Giới hạn tối đa 15 chữ số
    if (numericValue.length > 15) {
      return '';
    }
    
    // Chuyển thành số và format với dấu phẩy
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('vi-VN');
  };

  // Hàm lấy giá trị số từ text đã format
  const getNumericAmount = (formattedText: string): number => {
    const numericValue = formattedText.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };



  const renderCategoryItem = ({ item }: { item: LocalCategory }) => {
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
  };

  if (authLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#1e90ff" />
                      <Text style={styles.loadingText}>
              {authLoading ? t('common.loading') : t('common.loading')}
            </Text>
      </View>
      </SafeAreaView>
    );
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
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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

            {/* Debug Permission Button - Only show in development */}
       
          </View>

        {/* Group Context Indicator */}
        {fromGroupOverview && groupContextName && (
          <View style={styles.groupContextContainer}>
            <Icon name="account-group" size={16} color="#4A90E2" />
            <Text style={styles.groupContextText}>
              Thêm cho nhóm "{groupContextName}"
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

        {/* Wallet */}
          <View style={styles.row}>
          <Text style={styles.label}>{t('wallet.title')}</Text>
              <TouchableOpacity 
            style={styles.input}
                onPress={handleWalletPickerPress}
              >
            <Text style={styles.inputText}>{getSelectedWalletName()}</Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
          </View>

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
        <Text style={styles.sectionTitle}>{t('category')}</Text>
            <FlatList
          data={getCurrentCategories()}
              renderItem={renderCategoryItem}
          keyExtractor={(item) => item.key}
          numColumns={4}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
            />

          {/* Save Button */}
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
      </ScrollView>

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
                  <Text style={[
                    styles.walletPickerItemText,
                    selectedWallet === wallet.id && styles.walletPickerItemTextSelected
                  ]}>
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
  },
  subLoadingText: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
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
    fontWeight: '600',
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
    fontWeight: '500', 
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
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  dateText: {
    fontSize: 16,
    color: '#007aff',
    fontWeight: '500',
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
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: { 
    paddingBottom: 20,
    paddingHorizontal: 4, // Thêm padding để cân bằng margin của các item
  },
  categoryItem: {
    width: '25%', // Đảm bảo mỗi item chiếm đúng 1/4 chiều rộng
    aspectRatio: 1, // Đảm bảo item có hình vuông
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    margin: 2,
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
    fontSize: 11,
    color: '#333', 
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  saveButton: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  walletPickerDefault: {
    fontSize: 12,
    color: '#1e90ff',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '500',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '500',
  },
  createWalletButtonTextConfirm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '500',
    marginLeft: 6,
  },
});