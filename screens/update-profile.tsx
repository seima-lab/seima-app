import { typography } from '@/constants/typography';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomToast from '../components/CustomToast';
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { userService } from '../services/userService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/; // Vietnamese phone number format
const fullNameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/; // Allow Vietnamese characters, 2-50 chars

const UpdateProfile = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  // State
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDateOfBirth, setHasDateOfBirth] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  // Refs for TextInputs
  const fullNameRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);

  // Toast functions
  const showToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Fetch user profile when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching user profile...');
      const userProfile = await userService.getCurrentUserProfile();
      console.log('📋 User profile received:', JSON.stringify(userProfile, null, 2));
      
      // Populate form with user data (using raw API format like SettingScreen)
      setFullName(userProfile.user_full_name || '');
      setEmail(userProfile.user_email || '');
      setPhoneNumber(userProfile.user_phone_number || '');
      
      // Set date of birth if available
      if (userProfile.user_dob) {
        console.log('📅 Setting date of birth:', userProfile.user_dob);
        setDateOfBirth(new Date(userProfile.user_dob));
        setHasDateOfBirth(true);
      } else {
        setHasDateOfBirth(false);
      }
      
      // Set gender
      if (userProfile.user_gender === true) {
        setGender('Male');
        console.log('👨 Setting gender: Male');
      } else if (userProfile.user_gender === false) {
        setGender('Female');
        console.log('👩 Setting gender: Female');
      }
      
      // Set avatar if available
      if (userProfile.user_avatar_url) {
        console.log('🖼️ Setting avatar URL:', userProfile.user_avatar_url);
        setAvatarUri(userProfile.user_avatar_url);
      }
      
      console.log('✅ Profile data loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Failed to fetch user profile:', err);
      setError(err.message || t('updateProfilePage.loadFailed'));
      showToast(t('updateProfilePage.loadFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors: any = {};
    
    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t('validation.fullNameTooShort');
    } else if (fullName.trim().length > 50) {
      newErrors.fullName = t('validation.fullNameTooLong');
    } else if (!fullNameRegex.test(fullName.trim())) {
      newErrors.fullName = t('validation.fullNameInvalid');
    }
    
    // Phone number validation (optional but if provided must be valid)
    if (phoneNumber.trim() && !phoneRegex.test(phoneNumber.trim())) {
      newErrors.phoneNumber = t('validation.invalidPhone');
    }
    
    // Gender validation
    if (!gender) {
      newErrors.gender = t('validation.selectGender');
    }
    
    // Date of birth validation (optional but if set must be valid)
    if (hasDateOfBirth) {
      if (!dateOfBirth || isNaN(dateOfBirth.getTime())) {
        newErrors.dateOfBirth = t('validation.invalidDate');
      } else {
        // Check if date is not in the future
        const today = new Date();
        if (dateOfBirth > today) {
          newErrors.dateOfBirth = t('validation.futureDateNotAllowed');
        }
        
        // Check if age is reasonable (not more than 120 years)
        const age = today.getFullYear() - dateOfBirth.getFullYear();
        if (age > 120) {
          newErrors.dateOfBirth = t('validation.ageTooOld');
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validate()) {
      // Show first validation error with toast
      const firstError = Object.values(errors)[0] as string;
      showToast(firstError, 'warning');
      
      // Shake animation for error
      const shakeAnimation = Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]);
      shakeAnimation.start();
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare payload directly with snake_case format
      const payload: any = {};
      
      // Add fields to payload
      if (fullName.trim()) {
        payload.full_name = fullName.trim();
      }
      
      if (phoneNumber.trim()) {
        payload.phone_number = phoneNumber.trim();
      }
      
      if (gender) {
        payload.gender = gender === 'Male';
      }
      
      // Only include birth_date if it's been set
      if (hasDateOfBirth) {
        payload.birth_date = dateOfBirth.toISOString().split('T')[0];
      }
      
      // If avatar was changed and is a local file (not a URL), add it to payload as image
      if (avatarUri && !avatarUri.startsWith('http')) {
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        let mimeType = 'image/jpeg';
        if (filename.endsWith('.png')) mimeType = 'image/png';
        if (filename.endsWith('.gif')) mimeType = 'image/gif';
        if (filename.endsWith('.webp')) mimeType = 'image/webp';
        payload.image = {
          uri: avatarUri,
          type: mimeType,
          name: filename,
        };
      }
      // Update profile
      console.log('📤 Updating profile with payload:', payload);
      await userService.updateUserProfile(payload);
      
      // Refresh local profile data
      console.log('🔄 Refreshing local profile data after update...');
      await fetchUserProfile();
      
      showToast(t('updateProfilePage.updateSuccess'), 'success');
      
      // Navigate back after showing success message
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Failed to update profile:', err);
      
      let errorMessage = t('updateProfilePage.updateFailed');
      if (err.message && err.message.includes('validation')) {
        errorMessage = t('updateProfilePage.validationError');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      showToast(t('permissions.permissionMessage'), 'warning');
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image from camera:', error);
      showToast(t('permissions.cameraError'), 'error');
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image from gallery:', error);
      showToast(t('permissions.galleryError'), 'error');
    }
  };

  const handleChangeAvatar = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Camera', 'Photo Gallery', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            pickImageFromCamera();
          } else if (buttonIndex === 1) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        t('permissions.chooseOption'),
        '',
        [
          { text: t('permissions.camera'), onPress: pickImageFromCamera },
          { text: t('permissions.gallery'), onPress: pickImageFromGallery },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setHasDateOfBirth(true);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Debug function for input focus
  const handleInputFocus = (fieldName: string) => {
    console.log(`🎯 Input focus: ${fieldName}`);
    setFocusedField(fieldName);
    
    // Force keyboard to show manually if needed
    setTimeout(() => {
      if (fieldName === 'fullName' && fullNameRef.current) {
        fullNameRef.current.focus();
      } else if (fieldName === 'phoneNumber' && phoneNumberRef.current) {
        phoneNumberRef.current.focus();
      }
    }, 100);
  };

  const handleInputBlur = () => {
    console.log('🎯 Input blur');
    setFocusedField(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={22} color="#1e90ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('updateProfile')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          <Animated.View 
            style={[
              styles.mainContent, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            {/* Avatar Section */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    avatarUri 
                      ? { uri: avatarUri }
                      : require('../assets/images/maleavatar.png')
                  }
                  style={styles.avatar}
                />
              </View>
              <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar}>
                <Text style={styles.changeAvatarText}>{t('profile.changeAvatar')}</Text>
                <Icon name="edit" size={16} color="#fff" style={styles.editIcon} />
              </TouchableOpacity>
            </View>

            {/* Form Fields Container */}
            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="person" size={16} color="#1e90ff" style={styles.inputIcon} />
                  {t('profile.fullName')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'fullName' && styles.inputFocused,
                    errors.fullName && styles.inputError
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t('placeholders.enterFullName')}
                  placeholderTextColor="#9ca3af"
                  onFocus={() => handleInputFocus('fullName')}
                  onBlur={handleInputBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  ref={fullNameRef}
                />
                {errors.fullName && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.fullName}</Text>
                  </View>
                )}
              </View>

              {/* Date of Birth */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="cake" size={16} color="#1e90ff" style={styles.inputIcon} />
                  {t('dateOfBirth')}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.input,
                    focusedField === 'dateOfBirth' && styles.inputFocused,
                    errors.dateOfBirth && styles.inputError
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  onFocus={() => handleInputFocus('dateOfBirth')}
                  onBlur={handleInputBlur}
                >
                  <View style={styles.datePickerContent}>
                    <Text style={[
                      styles.dateText, 
                      !hasDateOfBirth && { color: '#9ca3af' }
                    ]}>
                      {hasDateOfBirth ? formatDate(dateOfBirth) : t('profile.selectDate')}
                    </Text>
                    <Icon name="event" size={20} color="#1e90ff" />
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    themeVariant="light"
                  />
                )}
                {errors.dateOfBirth && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.dateOfBirth}</Text>
                  </View>
                )}
              </View>

              {/* Email - Read Only */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="email" size={16} color="#1e90ff" style={styles.inputIcon} />
                  {t('email')}
                </Text>
                <View style={[styles.input, styles.disabledInput]}>
                  <Text style={styles.readOnlyText}>
                    {email || t('updateProfilePage.noEmailProvided')}
                  </Text>
                  <Icon name="lock-outline" size={18} color="#8E8E93" />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="phone" size={16} color="#1e90ff" style={styles.inputIcon} />
                  {t('placeholders.phoneNumber')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'phoneNumber' && styles.inputFocused,
                    errors.phoneNumber && styles.inputError
                  ]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder={t('placeholders.enterPhone')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  onFocus={() => handleInputFocus('phoneNumber')}
                  onBlur={handleInputBlur}
                  autoCorrect={false}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  ref={phoneNumberRef}
                />
                {errors.phoneNumber && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.phoneNumber}</Text>
                  </View>
                )}
                <Text style={styles.helperText}>{t('updateProfilePage.phoneFormat')}</Text>
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="people" size={16} color="#1e90ff" style={styles.inputIcon} />
                  {t('gender')}
                </Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Male' && styles.genderOptionSelected
                    ]}
                    onPress={() => setGender('Male')}
                  >
                    <View style={[
                      styles.radioButton,
                      gender === 'Male' && styles.radioButtonSelected
                    ]}>
                      {gender === 'Male' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.genderText,
                      gender === 'Male' && styles.genderTextSelected
                    ]}>
                      <Icon 
                        name="male" 
                        size={16} 
                        color={gender === 'Male' ? "#1e90ff" : "#8E8E93"} 
                        style={styles.genderIcon} 
                      />
                      {t('male')}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.genderDivider} />

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Female' && styles.genderOptionSelected
                    ]}
                    onPress={() => setGender('Female')}
                  >
                    <View style={[
                      styles.radioButton,
                      gender === 'Female' && styles.radioButtonSelected
                    ]}>
                      {gender === 'Female' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.genderText,
                      gender === 'Female' && styles.genderTextSelected
                    ]}>
                      <Icon 
                        name="female" 
                        size={16} 
                        color={gender === 'Female' ? "#1e90ff" : "#8E8E93"} 
                        style={styles.genderIcon} 
                      />
                      {t('female')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.gender && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.gender}</Text>
                  </View>
                )}
              </View>

              {/* Save Button */}
              <Animated.View style={[styles.saveButtonContainer, { opacity: fadeAnim }]}>
                <TouchableOpacity 
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
                      <Icon name="check-circle" size={20} color="#fff" style={styles.saveIcon} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Toast */}
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  flexOne: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1e90ff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    ...typography.semibold,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e90ff',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    backgroundColor: '#1e90ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  changeAvatarText: {
    color: 'white',
    fontSize: 16,
    ...typography.semibold,
    fontFamily: 'Roboto',
  },
  editIcon: {
    marginLeft: 6,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
    ...typography.semibold,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Roboto',
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    fontFamily: 'Roboto',
  },
  inputFocused: {
    borderColor: '#1e90ff',
    shadowColor: '#1e90ff',
    shadowOpacity: 0.1,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Roboto',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  genderContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  genderDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(30, 144, 255, 0.08)',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C8C8CD',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1e90ff',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e90ff',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
    ...typography.semibold,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Roboto',
  },
  genderTextSelected: {
    color: '#1e90ff',
    ...typography.semibold,
  },
  genderIcon: {
    marginRight: 4,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(30, 144, 255, 0.6)',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    ...typography.semibold,
    fontFamily: 'Roboto',
  },
  saveIcon: {
    marginLeft: 8,
  },
  validationErrorText: {
    color: '#ff3b30',
    fontSize: 13,
    marginLeft: 4,
    fontFamily: 'Roboto',
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Roboto',
  },
});

export default UpdateProfile; 