import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
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

// Icon configurations for different categories (matching EditCategoryScreen)
const EXPENSE_ICONS = [
  // Based on the Vietnamese categories in the image
  { name: 'silverware-fork-knife', color: '#ff9500' }, // Ăn uống - cam
  { name: 'food-apple', color: '#ff9500' },
  { name: 'hamburger', color: '#ff9500' },
  { name: 'coffee', color: '#ff9500' },
  { name: 'cake', color: '#ff9500' },
  
  { name: 'minus-circle', color: '#32d74b' }, // Chi tiêu hàng ngày - xanh lá
  { name: 'cart', color: '#32d74b' },
  { name: 'shopping', color: '#32d74b' },
  
  { name: 'tshirt-crew', color: '#007aff' }, // Quần áo - xanh dương
  { name: 'hanger', color: '#007aff' },
  { name: 'tshirt-v', color: '#007aff' }, // dress -> tshirt-v
  
  { name: 'lipstick', color: '#ff2d92' }, // Mỹ phẩm - hồng
  { name: 'face-woman', color: '#ff2d92' },
  { name: 'spray', color: '#ff2d92' }, // perfume -> spray
  
  { name: 'glass-wine', color: '#ffcc02' }, // Phí giao lưu - vàng
  { name: 'account-group', color: '#ffcc02' },
  { name: 'party-popper', color: '#ffcc02' },
  
  { name: 'hospital-box', color: '#30d158' }, // Y tế - xanh lá
  { name: 'pill', color: '#30d158' }, // pills -> pill
  { name: 'stethoscope', color: '#30d158' },
  { name: 'medical-bag', color: '#30d158' },
  
  { name: 'book-open', color: '#ff2d92' }, // Giáo dục - hồng
  { name: 'school', color: '#ff2d92' },
  { name: 'pencil', color: '#ff2d92' },
  
  { name: 'lightning-bolt', color: '#00c7be' }, // Tiền điện - xanh ngọc
  { name: 'flash', color: '#00c7be' },
  { name: 'power-plug', color: '#00c7be' },
  
  { name: 'car', color: '#9370db' }, // Đi lại - tím
  { name: 'bus', color: '#9370db' },
  { name: 'train', color: '#9370db' },
  { name: 'airplane', color: '#9370db' },
  { name: 'motorbike', color: '#9370db' }, // motorcycle -> motorbike
  { name: 'taxi', color: '#9370db' },
  
  { name: 'phone', color: '#00c7be' }, // Phí liên lạc - xanh ngọc
  { name: 'wifi', color: '#00c7be' },
  { name: 'cellphone', color: '#00c7be' },
  
  { name: 'home', color: '#ff9500' }, // Tiền nhà - cam
  { name: 'home-outline', color: '#ff9500' }, // house -> home-outline
  { name: 'key', color: '#ff9500' },
  
  { name: 'gamepad-variant', color: '#ff375f' }, // Đi chơi - đỏ
  { name: 'movie', color: '#ff375f' },
  { name: 'music', color: '#ff375f' },
  { name: 'ticket', color: '#ff375f' },
  
  // Other common icons
  { name: 'gift', color: '#bf5af2' },
  { name: 'tools', color: '#ff9500' },
  { name: 'water', color: '#00c7be' },
];

const INCOME_ICONS = [
  // Work & Salary
  { name: 'cash', color: '#32d74b' },
  { name: 'briefcase', color: '#708090' },
  { name: 'office-building', color: '#708090' },
  { name: 'laptop', color: '#ff375f' },
  
  // Investment & Business
  { name: 'chart-line', color: '#007aff' },
  { name: 'bank', color: '#ff2d92' },
  { name: 'percent', color: '#00c7be' },
  { name: 'store', color: '#30d158' },
  
  // Gifts & Rewards
  { name: 'gift', color: '#bf5af2' },
  { name: 'hand-heart', color: '#ff2d92' },
  { name: 'star', color: '#ffcc02' },
  { name: 'trophy', color: '#ffd700' },
  
  // Property & Rental
  { name: 'home-account', color: '#ffcc02' },
  { name: 'apartment', color: '#daa520' },
  { name: 'key', color: '#32d74b' },
  
  // Additional Income Sources
  { name: 'piggy-bank', color: '#32d74b' },
  { name: 'cash-plus', color: '#00ff00' },
  { name: 'credit-card', color: '#4682b4' },
  { name: 'wallet', color: '#8b4513' },
];

// Get color for an icon based on category type (matching EditCategoryScreen)
const getIconColor = (iconName: string, categoryType: 'expense' | 'income', dbColor?: string): string => {
  // If color exists in database, use it
  if (dbColor) {
    return dbColor;
  }
  
  // Otherwise, use default color mapping
  const iconSet = categoryType === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;
  const iconConfig = iconSet.find(icon => icon.name === iconName);
  return iconConfig ? iconConfig.color : '#666'; // Default color if not found
};

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  
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
      console.log('🔐 Requesting camera and photo library permissions...');
      // Request both camera and media library permissions
      const [cameraPermission, libraryPermission] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync(false) // false = request read and write permissions
      ]);
      
      console.log('📷 Camera permission status:', cameraPermission.status);
      console.log('🖼️ Library permission status:', libraryPermission.status);
      
      if (cameraPermission.status !== 'granted') {
        console.log('❌ Camera permission not granted');
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in settings to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      if (libraryPermission.status !== 'granted') {
        console.log('❌ Photo library permission not granted');
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access in settings to select images.',
          [{ text: 'OK' }]
        );
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

  const takePhoto = async () => {
    try {
      console.log('📷 Starting camera capture...');
      const hasPermission = await requestPermissions();
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
          console.log('ℹ️ Skipping scan for income tab');
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
      const hasPermission = await requestPermissions();
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
          console.log('ℹ️ Skipping scan for income tab');
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
      const hasPermission = await requestPermissions();
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
          console.log('ℹ️ Skipping scan for income tab');
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
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet ? wallet.wallet_name : 'Select Wallet';
  };

  const renderCategoryItem = ({ item }: { item: LocalCategory }) => {
    const isSelected = selectedCategory === item.key;
    
    // Handle Edit item specially
    if (item.key === 'edit_categories') {
      return (
        <TouchableOpacity
          style={[styles.categoryItem, styles.editCategoryItem]}
          onPress={() => {
            console.log('🔧 Navigating to EditCategoryScreen for tab:', activeTab);
            (navigation as any).navigate('EditCategoryScreen', {
              type: activeTab
            });
          }}
        >
          <Icon name={item.icon} size={24} color={item.color} />
          <Text style={[styles.categoryText, styles.editCategoryText]} numberOfLines={2}>
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
        <Icon name={item.icon} size={24} color={getIconColor(item.icon, activeTab, item.color)} />
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

                    {/* Camera Icon - Only show for expense tab */}
            {activeTab === 'expense' && (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowImageOptions(true)}
            >
                <Icon name="camera" size={24} color="#007aff" />
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
            onPress={() => setShowWalletPicker(!showWalletPicker)}
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
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Text style={styles.currency}>VND</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.row}>
          <Text style={styles.label}>{t('note')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter note"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* Receipt Image - Only show for expense tab */}
        {activeTab === 'expense' && selectedImage && (
          <View style={styles.row}>
            <Text style={styles.label}>Receipt</Text>
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
              <Text style={styles.imageOptionsTitle}>Add Receipt Photo</Text>
              
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

  editCategoryItem: {
    borderColor: '#007aff',
    backgroundColor: '#e6f2ff',
  },
  editCategoryText: {
    color: '#007aff',
    fontWeight: '600',
  },
});