import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Form data
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
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

      // Now load categories using userId from /me API
      const userId = userProfile.user_id;
      // Per user's direction, groupId should be 0 to fetch all user-specific categories
      const groupId = 0; 
      
      console.log('🔄 Loading categories for both tabs with userId:', userId);
      
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

      // Set default category based on current active tab
      if (activeTab === 'expense' && expenseCats.length > 0) {
        const defaultCategoryId = expenseCats[0].category_id.toString();
        console.log('🔍 Setting default expense category:', {
          activeTab: activeTab,
          defaultCategoryId: defaultCategoryId,
          defaultCategory: expenseCats[0]
        });
        setSelectedCategory(defaultCategoryId);
      } else if (activeTab === 'income' && incomeCats.length > 0) {
        const defaultCategoryId = incomeCats[0].category_id.toString();
        console.log('🔍 Setting default income category:', {
          activeTab: activeTab,
          defaultCategoryId: defaultCategoryId,
          defaultCategory: incomeCats[0]
        });
        setSelectedCategory(defaultCategoryId);
      }

      console.log('✅ All data loaded successfully');
      setHasInitiallyLoaded(true);

    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Handle authentication errors specifically
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        Alert.alert('Authentication Required', 'Please login first.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load data. Please try again.');
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
      const userId = userProfile.user_id;
      const groupId = 0; 
      
      console.log('🔄 Loading categories for both tabs with userId:', userId);
      
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
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
        const parsedDate = new Date(ocrResult.transaction_date);
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
          console.log('✅ Date set successfully:', parsedDate);
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
      setToastMessage('Failed to extract text from invoice');
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

      const amountValue = parseFloat(amount);
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

      const transactionData: CreateTransactionRequest = {
        user_id: userId, // Use real userId from /me API
        wallet_id: selectedWallet!,
        category_id: categoryId,
        group_id: undefined,
        transaction_type: activeTab === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME,
        amount: amountValue,
        currency_code: 'VND',
        transaction_date: date.toISOString(),
        description: note.trim() || undefined,
        receipt_image_url: selectedImage || null,
        payee_payer_name: undefined,
      };

      console.log('🔄 Saving transaction:', transactionData);

      if (activeTab === 'expense') {
        await transactionService.createExpense(transactionData);
      } else {
        await transactionService.createIncome(transactionData);
      }

      Alert.alert('Success', 'Transaction saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error('Error saving transaction:', error);
      
      // Handle authentication errors specifically  
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        Alert.alert('Authentication Required', 'Please login first.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to save transaction. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return false;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    // Check if amount exceeds 16 digits
    const digitsOnly = amount.replace(/[^0-9]/g, '');
    if (digitsOnly.length > 16) {
      Alert.alert('Error', 'Amount cannot exceed 16 digits');
      return false;
    }
    
    // Check if amount is too large for JavaScript number precision
    if (amountValue > Number.MAX_SAFE_INTEGER) {
      Alert.alert('Error', 'Amount is too large');
      return false;
    }
    
    // Validate note (optional but with constraints if provided)
    if (note.trim().length > 500) {
      Alert.alert('Error', 'Note cannot exceed 500 characters');
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
      Alert.alert('Error', 'Note contains invalid characters');
      return false;
    }
    
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    
    if (!selectedWallet) {
      Alert.alert('Error', 'Please select a wallet');
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
      setDate(selectedDate);
    }
  };

  const getCurrentCategories = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    
    // Add "Edit" item at the end of the categories list
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
      return 'Tạo ví mới';
    }
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet ? wallet.wallet_name : 'Select Wallet';
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

  // Debug function to test permission status
  const debugPermissionStatus = async () => {
    try {
      console.log('🔍 === DEBUG PERMISSION STATUS ===');
      console.log('🕐 Current time:', new Date().toISOString());
      
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync(false);
      
      console.log('📷 Camera Permission:', {
        status: cameraStatus.status,
        canAskAgain: cameraStatus.canAskAgain,
        granted: cameraStatus.granted,
        expires: cameraStatus.expires,
        expiresDate: cameraStatus.expires && cameraStatus.expires !== 'never' ? new Date(cameraStatus.expires) : 'never'
      });
      
      console.log('🖼️ Library Permission:', {
        status: libraryStatus.status,
        canAskAgain: libraryStatus.canAskAgain,
        granted: libraryStatus.granted,
        expires: libraryStatus.expires,
        expiresDate: libraryStatus.expires && libraryStatus.expires !== 'never' ? new Date(libraryStatus.expires) : 'never'
      });
      
      Alert.alert(
        'Permission Debug',
        `Camera: ${cameraStatus.status}\nLibrary: ${libraryStatus.status}\n\nWould you like to test permission request?`,
        [
          { text: 'Cancel' },
          { 
            text: 'Test Camera', 
            onPress: async () => {
              console.log('🧪 Testing camera permission request...');
              const result = await ImagePicker.requestCameraPermissionsAsync();
              console.log('🧪 Force camera request result:', result);
              Alert.alert('Camera Test', `Result: ${result.status}`);
            }
          },
          { 
            text: 'Test Library', 
            onPress: async () => {
              console.log('🧪 Testing library permission request...');
              const result = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
              console.log('🧪 Force library request result:', result);
              Alert.alert('Library Test', `Result: ${result.status}`);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error checking permission status:', error);
    }
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
            {authLoading ? 'Checking authentication...' : 'Loading...'}
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
          <Text style={styles.loadingText}>Scanning invoice...</Text>
          <Text style={styles.subLoadingText}>Extracting text from your receipt</Text>
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

                    {/* Camera Icon - Available for both expense and income tabs */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowImageOptions(true)}
            >
                <Icon name="camera" size={24} color="#007aff" />
              </TouchableOpacity>

            {/* Debug Permission Button - Only show in development */}
            {__DEV__ && (
              <TouchableOpacity
                style={[styles.cameraButton, { backgroundColor: '#ff9500' }]}
                onPress={debugPermissionStatus}
              >
                <Icon name="bug" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

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
          <Text style={styles.label}>Wallet</Text>
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
          <Text style={styles.label}>Amount</Text>
            <View style={styles.amountContainer}>
              <TextInput
              style={styles.amountInput}
                placeholder="0"
                value={amount}
                onChangeText={(text) => {
                  // Remove any non-digit characters except decimal point
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  
                  // Ensure only one decimal point
                  const parts = cleanText.split('.');
                  let formattedText = parts[0];
                  if (parts.length > 1) {
                    formattedText += '.' + parts.slice(1).join('');
                  }
                  
                  // Limit to 16 digits total (including decimal places)
                  const digitsOnly = formattedText.replace(/\./g, '');
                  if (digitsOnly.length <= 16) {
                    setAmount(formattedText);
                  }
                }}
                keyboardType="numeric"
                maxLength={18} // 16 digits + 1 decimal point + 1 extra buffer
              />
            <Text style={styles.currency}>VND</Text>
            </View>
          </View>

          {/* Note */}
          <View style={styles.row}>
            <Text style={styles.label}>{t('note')}</Text>
            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="Enter note (optional)"
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
        <Text style={styles.sectionTitle}>Category</Text>
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
              {activeTab === 'expense' ? 'Add Expense' : 'Add Income'}
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
                  <Text style={styles.modalButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButton}>Done</Text>
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
              <Text style={styles.walletPickerTitle}>Select Wallet</Text>
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
                    <Text style={styles.walletPickerDefault}>Default</Text>
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
                {activeTab === 'expense' ? 'Add Receipt Photo' : 'Add Photo'}
              </Text>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={takePhoto}
              >
                <Icon name="camera" size={24} color="#007aff" />
                <Text style={styles.imageOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={pickFromGallery}
              >
                <Icon name="image" size={24} color="#007aff" />
                <Text style={styles.imageOptionText}>Photo Library</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={pickFromGalleryWithCrop}
              >
                <Icon name="crop" size={24} color="#007aff" />
                <Text style={styles.imageOptionText}>Photo Library (with Crop)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.imageOptionItem, styles.imageOptionCancel]}
                onPress={() => setShowImageOptions(false)}
              >
                <Icon name="close" size={24} color="#666" />
                <Text style={[styles.imageOptionText, styles.imageOptionCancelText]}>Cancel</Text>
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
              <Text style={styles.createWalletTitle}>Không có ví nào</Text>
              <Text style={styles.createWalletMessage}>
                Hiện tại bạn đang chưa có ví nào. Bạn có muốn tạo ví không?
              </Text>
              
              <View style={styles.createWalletButtons}>
                <TouchableOpacity
                  style={[styles.createWalletButton, styles.createWalletButtonCancel]}
                  onPress={() => setShowCreateWalletModal(false)}
                >
                  <Text style={styles.createWalletButtonTextCancel}>Không</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.createWalletButton, styles.createWalletButtonConfirm]}
                  onPress={handleCreateWallet}
                >
                  <Text style={styles.createWalletButtonTextConfirm}>Có</Text>
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
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
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
    fontSize: 12,
    color: '#333', 
    marginTop: 4,
    textAlign: 'center',
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
});