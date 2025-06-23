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
import IconBack from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { categoryService, CategoryService, CategoryType, LocalCategory } from '../services/categoryService';
import { ocrService, TransactionOcrResponse } from '../services/ocrService';
import { secureApiService } from '../services/secureApiService';
import { CreateTransactionRequest, transactionService, TransactionType } from '../services/transactionService';
import { WalletResponse, walletService } from '../services/walletService';

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
      const groupId = 1; // Default group ID
      
      console.log('🔄 Loading categories with userId:', userId);
      
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, userId, groupId),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, userId, groupId),
      ]);

      console.log('✅ Expense categories loaded:', expenseCats.length);
      console.log('✅ Income categories loaded:', incomeCats.length);

      // Convert to local format
      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(expenseCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));
      setIncomeCategories(incomeCats.map(cat => categoryServiceInstance.convertToLocalCategory(cat)));

      // Set default category
      const defaultCategories = activeTab === 'expense' ? expenseCats : incomeCats;
      if (defaultCategories.length > 0) {
        setSelectedCategory(defaultCategories[0].category_id.toString());
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
    setActiveTab(tab);
    // Reset category selection when switching tabs
    const categories = tab === 'expense' ? expenseCategories : incomeCategories;
    if (categories.length > 0) {
      setSelectedCategory(categories[0].key);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request both camera and media library permissions
      const [cameraPermission, libraryPermission] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync(false) // false = request read and write permissions
      ]);
      
      console.log('Camera permission:', cameraPermission);
      console.log('Library permission:', libraryPermission);
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in settings to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      if (libraryPermission.status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access in settings to select images.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
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
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow taking full photo without cropping
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setShowImageOptions(false);
        console.log('Photo taken:', imageUri);
        
        // Ask user if they want to scan the invoice for auto-fill
        if (activeTab === 'expense') {
          Alert.alert(
            'Scan Invoice?',
            'Would you like to automatically extract information from this receipt?',
            [
              { 
                text: 'Skip', 
                style: 'cancel' 
              },
              { 
                text: 'Scan', 
                onPress: () => scanInvoice(imageUri) 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting full image without cropping
        quality: 0.8,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        legacy: Platform.OS === 'android', // Use legacy picker on Android for better file access
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setShowImageOptions(false);
        console.log('Image selected:', imageUri);
        
        // Ask user if they want to scan the invoice for auto-fill
        if (activeTab === 'expense') {
          Alert.alert(
            'Scan Invoice?',
            'Would you like to automatically extract information from this receipt?',
            [
              { 
                text: 'Skip', 
                style: 'cancel' 
              },
              { 
                text: 'Scan', 
                onPress: () => scanInvoice(imageUri) 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickFromGalleryWithCrop = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Allow editing/cropping
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setShowImageOptions(false);
        console.log('Cropped image selected:', imageUri);
        
        // Ask user if they want to scan the invoice for auto-fill
        if (activeTab === 'expense') {
          Alert.alert(
            'Scan Invoice?',
            'Would you like to automatically extract information from this receipt?',
            [
              { 
                text: 'Skip', 
                style: 'cancel' 
              },
              { 
                text: 'Scan', 
                onPress: () => scanInvoice(imageUri) 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error picking image with crop:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const scanInvoice = async (imageUri: string) => {
    setIsScanning(true);
    try {
      console.log('🔄 Scanning invoice for OCR...');
      
      // Convert image URI to File/Blob for web or create proper format for mobile
      let file: File | Blob;
      
      if (Platform.OS === 'web') {
        // For web, convert URI to blob
        const response = await fetch(imageUri);
        file = await response.blob();
      } else {
        // For mobile, create a file-like object
        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        file = {
          uri: imageUri,
          type: 'image/jpeg',
          name: filename,
        } as any;
      }
      
      const ocrResult: TransactionOcrResponse = await ocrService.scanInvoice(file);
      
      // Auto-fill form with OCR results
      if (ocrResult.total_amount) {
        setAmount(ocrResult.total_amount.toString());
      }
      
      if (ocrResult.transaction_date) {
        const parsedDate = new Date(ocrResult.transaction_date);
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      }
      
      if (ocrResult.description_invoice) {
        setNote(ocrResult.description_invoice);
      }
      
      // Update the receipt image URL from OCR response
      if (ocrResult.receipt_image_url) {
        setSelectedImage(ocrResult.receipt_image_url);
      }
      
      Alert.alert(
        'Invoice Scanned Successfully!', 
        'Form has been auto-filled with extracted information. Please verify the details.',
        [{ text: 'OK' }]
      );
      
      console.log('✅ Invoice scanned and form auto-filled:', ocrResult);
      
    } catch (error: any) {
      console.error('❌ Failed to scan invoice:', error);
      Alert.alert(
        'OCR Error', 
        'Failed to extract text from invoice. You can still add the transaction manually.',
        [{ text: 'OK' }]
      );
    } finally {
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
    return activeTab === 'expense' ? expenseCategories : incomeCategories;
  };

  const getSelectedWalletName = () => {
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet ? wallet.wallet_name : 'Select Wallet';
  };

  const renderCategoryItem = ({ item }: { item: LocalCategory }) => {
    const isSelected = selectedCategory === item.key;
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => setSelectedCategory(item.key)}
      >
        <Icon name={item.icon} size={24} color={item.color} />
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
            <IconBack name="arrow-back" size={24} color="#1e90ff" />
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
              <Icon name="camera" size={24} color="#1e90ff" />
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
                <Icon name="camera" size={24} color="#1e90ff" />
                <Text style={styles.imageOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={pickFromGallery}
              >
                <Icon name="image" size={24} color="#1e90ff" />
                <Text style={styles.imageOptionText}>Photo Library</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={pickFromGalleryWithCrop}
              >
                <Icon name="crop" size={24} color="#1e90ff" />
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
    backgroundColor: '#1e90ff',
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
    color: '#1e90ff',
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
    borderColor: '#1e90ff',
    backgroundColor: '#e6f2ff',
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1e90ff',
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
});