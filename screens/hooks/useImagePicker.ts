import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { ocrService, TransactionOcrResponse } from '../../services/ocrService';

interface UseImagePickerProps {
  activeTab: 'expense' | 'income';
  onOCRResult: (result: TransactionOcrResponse) => void;
}

export const useImagePicker = ({ activeTab, onOCRResult }: UseImagePickerProps) => {
  const { t } = useTranslation();
  
  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const requestCameraPermission = useCallback(async () => {
    try {
      console.log('🔐 Checking camera permission...');
      
      const currentStatus = await ImagePicker.getCameraPermissionsAsync();
      console.log('📷 Current camera permission:', {
        status: currentStatus.status,
        canAskAgain: currentStatus.canAskAgain,
        granted: currentStatus.granted,
        expires: currentStatus.expires
      });
      
      if (currentStatus.status === 'granted') {
        console.log('✅ Camera permission already granted');
        
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
      
      console.log('🔐 Requesting camera permission...');
      const result = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Camera permission result:', result);
      
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
  }, []);

  const requestLibraryPermission = useCallback(async () => {
    try {
      console.log('🔐 Checking library permission...');
      
      const currentStatus = await ImagePicker.getMediaLibraryPermissionsAsync(false);
      console.log('🖼️ Current library permission:', currentStatus.status);
      
      if (currentStatus.status === 'granted') {
        return true;
      }
      
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
  }, []);

  const scanInvoice = useCallback(async (imageUri: string) => {
    console.log('🤖 Starting OCR scan process...');
    setIsScanning(true);
    
    try {
      console.log('🔄 Scanning invoice for OCR...');
      
      let file: File | Blob;
      
      if (Platform.OS === 'web') {
        console.log('🌐 Platform: Web - Converting URI to blob...');
        const response = await fetch(imageUri);
        file = await response.blob();
        console.log('✅ Blob created for web:', file.size, 'bytes');
      } else {
        console.log('📱 Platform: Mobile - Creating file object...');
        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        
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
      
      // Update the receipt image URL from OCR response
      if (ocrResult.receipt_image_url) {
        console.log('🖼️ Updating image URL:', ocrResult.receipt_image_url);
        setSelectedImage(ocrResult.receipt_image_url);
      }
      
      // Pass OCR result to parent component
      onOCRResult(ocrResult);
      
      console.log('✅ Invoice scanned and form auto-filled successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to scan invoice:', error);
      Alert.alert(t('common.error'), t('common.failedToExtractText'));
    } finally {
      console.log('🏁 OCR scan process completed');
      setIsScanning(false);
    }
  }, [onOCRResult, t]);

  const takePhoto = useCallback(async () => {
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
        allowsEditing: false,
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
  }, [requestCameraPermission, activeTab, scanInvoice, t]);

  const pickFromGallery = useCallback(async () => {
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
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        legacy: Platform.OS === 'android',
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
  }, [requestLibraryPermission, activeTab, scanInvoice, t]);

  const pickFromGalleryWithCrop = useCallback(async () => {
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
        allowsEditing: true,
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
  }, [requestLibraryPermission, activeTab, scanInvoice, t]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return {
    // State
    selectedImage,
    isScanning,
    showImageOptions,
    
    // Setters
    setSelectedImage,
    setShowImageOptions,
    
    // Methods
    takePhoto,
    pickFromGallery,
    pickFromGalleryWithCrop,
    removeImage,
    scanInvoice,
    requestCameraPermission,
    requestLibraryPermission,
  };
};
