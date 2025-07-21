import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typography } from '../constants/typography';
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService, RegisterRequest } from '../services/authService';
import { UserCreationRequestDto, UserService } from '../services/userService';
const { width, height } = Dimensions.get('window');

interface GoogleUserData {
  fullName: string;
  email: string;
  isGoogleLogin: boolean;
  userIsActive: boolean;
}

interface RegisterScreenProps {
  route?: {
    params?: {
      googleUserData?: GoogleUserData;
    };
  };
}

export default function RegisterScreen({ route }: RegisterScreenProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  
  // Error state
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Loading modal state
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isLoadingSuccess, setIsLoadingSuccess] = useState(false);

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Auto-fill Google user data if available
  useEffect(() => {
    const googleUserData = route?.params?.googleUserData;
    console.log('🔍 Register Screen - Route params:', route?.params);
    console.log('🔍 Register Screen - Google user data:', googleUserData);
    
    if (googleUserData?.isGoogleLogin) {
      console.log('🟢 Auto-filling Google user data:', {
        fullName: googleUserData.fullName,
        email: googleUserData.email,
        userIsActive: googleUserData.userIsActive
      });
      setFullName(googleUserData.fullName);
      setEmail(googleUserData.email);
      // Note: Google doesn't provide gender or date of birth, so those remain empty
    } else {
      console.log('🔴 No Google user data found or not Google login');
    }
  }, [route?.params?.googleUserData]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\d{9,15}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    // Kiểm tra ít nhất 8 ký tự
    if (password.length < 8) {
      return { isValid: false, error: t('validation.passwordTooShort') };
    }
    
    // Kiểm tra có ít nhất 1 chữ cái và 1 số
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return { isValid: false, error: t('validation.passwordInvalid') };
    }
    
    return { isValid: true, error: '' };
  };

  const validateForm = () => {
    // Reset all errors
    const newErrors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      password: '',
      confirmPassword: '',
    };
    
    let isValid = true;
    
    // Check if this is a Google user (no password required)
    const googleUserData = route?.params?.googleUserData;
    const isGoogleUser = googleUserData?.isGoogleLogin && !googleUserData?.userIsActive;
    
    // Full Name validation
    if (!fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
      isValid = false;
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = t('validation.invalidEmail');
      isValid = false;
    }
    
    // Phone number validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('validation.phoneRequired');
      isValid = false;
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = t('validation.invalidPhone');
      isValid = false;
    }
    
    // Date of birth validation - Now optional
    // if (!hasSelectedDate) {
    //   newErrors.dateOfBirth = t('register.selectDateOfBirth');
    //   isValid = false;
    // }
    
    // Gender validation
    if (!gender) {
      newErrors.gender = t('validation.selectGender');
      isValid = false;
    }
    
    // Password validation (skip for Google users)
    if (!isGoogleUser) {
      if (!password.trim()) {
        newErrors.password = t('validation.passwordRequired');
        isValid = false;
      } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          newErrors.password = passwordValidation.error;
          isValid = false;
        }
      }
      
      // Confirm password validation
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = t('validation.confirmPasswordRequired');
        isValid = false;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = t('validation.passwordMismatch');
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      // Shake animation for error
      const shakeAnimation = Animated.sequence([
        Animated.timing(slideAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]);
      shakeAnimation.start();
      return;
    }

    const googleUserData = route?.params?.googleUserData;
    const isGoogleUser = googleUserData?.isGoogleLogin && !googleUserData?.userIsActive;
    
    // Show loading modal immediately after validation
    setIsLoading(true);
    setShowLoadingModal(true);
    setIsLoadingSuccess(false);
    setLoadingMessage(isGoogleUser ? 'Đang tạo hồ sơ của bạn...' : 'Đang gửi mã OTP đến email của bạn...');

    try {
      if (isGoogleUser) {
        // Handle Google user profile creation (first login)
        console.log('🟡 Creating Google user profile...');
        
        // Format date without timezone issues
        const formatDateForAPI = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const createData: UserCreationRequestDto = {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          birth_date: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '', // Send empty string if no date selected
          phone_number: phoneNumber.trim(),
          avatar_url: '', // Empty for now, can be updated later
          gender: gender === 'male', // Convert to boolean: true = male, false = female
        };

        console.log('🟡 Create data (snake_case):', createData);
        
        const userService = UserService.getInstance();
        await userService.createUser(createData);
        
        console.log('🟢 Google user created successfully');
        
        // Show success state
        setIsLoadingSuccess(true);
        setLoadingMessage('Hồ sơ đã được tạo thành công');
        
        // Auto navigate to main app after 2 seconds
        setTimeout(() => {
          setShowLoadingModal(false);
          setIsLoading(false);
          navigation.replace('MainTab');
        }, 2000);
        
      } else {
        // Handle normal registration flow
        console.log('🟡 Normal registration flow...');
        
        // Double check password match before sending (only for normal registration)
        if (password.trim() !== confirmPassword.trim()) {
          setShowLoadingModal(false);
          setIsLoading(false);
          setErrors({...errors, confirmPassword: t('validation.passwordMismatch')});
          return;
        }

        // Format date without timezone issues
        const formatDateForAPI = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };    

        // Prepare request data according to backend format (snake_case)
         
        const registerData: RegisterRequest = {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          dob: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '', // Send empty string if no date selected
          phone_number: phoneNumber.trim(),
          gender: gender === 'male', // Convert to boolean: true = male, false = female
          password: password.trim(),
          confirm_password: confirmPassword.trim(), // Backend validation requires this field
          
        };

        console.log('🟡 Registering with data:', registerData);
        
        // Call register API
        const response = await authService.register(registerData);
        
        console.log('🟢 Registration successful:', response);
        
        // Store pending registration data for 4 minutes
        await authService.storePendingRegistration(registerData);
        console.log('🟢 Pending registration data stored');
        
        // Show success state
        setIsLoadingSuccess(true);
        setLoadingMessage('Mã OTP đã được gửi thành công');
        
        // Auto navigate to OTP screen after 2 seconds
        setTimeout(() => {
          setShowLoadingModal(false);
          setIsLoading(false);
          
          // Debug log before navigation
          console.log('🔍 Register - Navigating to OTP with params:', {
            email: email,
            fullName: fullName.trim(),
            phoneNumber: phoneNumber,
            hasPassword: !!password.trim(),
            passwordLength: password.trim().length,
            dateOfBirth: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '',
            gender: gender === 'male',
            type: 'register'
          });
          
          navigation.navigate('OTP', { 
            email: email,
            fullName: fullName.trim(),
            phoneNumber: phoneNumber,
            password: password.trim(),
            dateOfBirth: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '', // Send empty string if no date selected
            gender: gender === 'male', // Convert to boolean
            otpCode: response.otp_code,
            type: 'register' // To distinguish from forgot password flow
          });
        }, 2000);
      }
      
    } catch (error: any) {
      setIsLoading(false);
      setShowLoadingModal(false); // Hide loading modal on error
      console.error('🔴 Registration/Update failed:', error);
      
      // Show error under email field (most common registration errors are email-related)
      let errorMessage = isGoogleUser 
        ? 'Failed to create profile. Please try again.'
        : t('register.registerFailed');
        
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Set error under email field instead of showing alert
      setErrors({...errors, email: errorMessage});
    }
  };  

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setHasSelectedDate(true);
      if (errors.dateOfBirth) {
        setErrors({...errors, dateOfBirth: ''});
      }
    }
  };

  const formatDate = (date: Date) => {
    // Use local date parts to avoid timezone issues - Vietnamese format dd/mm/yyyy
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };



  const handleInputFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleInputBlur = () => {
    setFocusedField(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      
      {/* Loading Modal */}
      <Modal
        visible={showLoadingModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!isLoadingSuccess ? (
              <>
                <ActivityIndicator size="large" color="#1e90ff" style={styles.spinner} />
                <Text style={styles.loadingTitle}>
                  {loadingMessage.includes('hồ sơ') ? 'Đang tạo hồ sơ' : 'Đang gửi OTP'}
                </Text>
                <Text style={styles.loadingMessage}>{loadingMessage}</Text>
              </>
            ) : (
              <>
                <View style={styles.successIcon}>
                  <Icon name="check-circle" size={50} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>
                  {loadingMessage.includes('hồ sơ') ? 'Hoàn thành!' : 'Đã gửi xong!'}
                </Text>
                <Text style={styles.successMessage}>
                  {loadingMessage.includes('hồ sơ') ? 'Hồ sơ đã được tạo thành công' : 'Mã OTP đã được gửi thành công'}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Blue Background */}
      <View style={styles.backgroundGradient}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
            {/* Header */}
            <Animated.View 
              style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
                <Icon name="arrow-back-ios" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.title}>{t('register.createAccount')}</Text>
                <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
              </View>
              <View style={styles.placeholder} />
            </Animated.View>

            {/* White Card Container */}
            <Animated.View 
              style={[
                styles.cardContainer, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }] 
                }
              ]}
            >
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >


                {/* Google Data Pre-filled Indicator */}
                {route?.params?.googleUserData?.isGoogleLogin && (
                  <View style={styles.googleDataIndicator}>
                    <Icon name="account-circle" size={14} color="#4285F4" />
                    <Text style={styles.googleDataText}>
                      {t('register.googleDataNote')}
                    </Text>
                  </View>
                )}

                {/* Form Fields */}
                <View style={styles.form}>
                  {/* Full Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Icon name="person" size={12} color="#1e90ff" style={styles.labelIcon} />
                      {t('register.fullName')}
                    </Text>
                    <View style={[
                      styles.inputContainer, 
                      focusedField === 'fullName' && styles.inputFocused,
                      errors.fullName ? styles.inputError : null
                    ]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('register.enterFullName')}
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={(text) => {
                          setFullName(text);
                          if (errors.fullName) setErrors({...errors, fullName: ''});
                        }}
                        onFocus={() => handleInputFocus('fullName')}
                        onBlur={handleInputBlur}
                        returnKeyType="next"
                        autoCapitalize="words"
                      />
                      {fullName ? (
                        <Icon name="check-circle" size={16} color="#10B981" />
                      ) : null}
                    </View>
                                          {errors.fullName ? (
                        <View style={styles.errorRow}>
                          <Icon name="error-outline" size={10} color="#EF4444" />
                          <Text style={styles.errorText}>{errors.fullName}</Text>
                        </View>
                      ) : null}
                  </View>

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Icon name="email" size={12} color="#1e90ff" style={styles.labelIcon} />
                      {t('register.emailAddress')}
                    </Text>
                    <View style={[
                      styles.inputContainer,
                      focusedField === 'email' && styles.inputFocused,
                      errors.email ? styles.inputError : null
                    ]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('register.enterEmail')}
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          // Real-time email validation
                          const newErrors = {...errors};
                          
                          if (text.trim()) {
                            if (!validateEmail(text)) {
                              newErrors.email = t('validation.invalidEmail');
                            } else {
                              newErrors.email = '';
                            }
                          } else {
                            // Clear error when field is empty (user is still typing)
                            newErrors.email = '';
                          }
                          
                          setErrors(newErrors);
                        }}
                        onFocus={() => handleInputFocus('email')}
                        onBlur={handleInputBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                      />
                      {email && validateEmail(email) ? (
                        <Icon name="check-circle" size={16} color="#10B981" />
                      ) : email && !validateEmail(email) ? (
                        <Icon name="error-outline" size={16} color="#EF4444" />
                      ) : null}
                    </View>
                    {errors.email ? (
                      <View style={styles.errorRow}>
                        <Icon name="error-outline" size={10} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.email}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Phone Number */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Icon name="phone" size={12} color="#1e90ff" style={styles.labelIcon} />
                      {t('register.phoneNumber')}
                    </Text>
                    <View style={[
                      styles.inputContainer,
                      focusedField === 'phone' && styles.inputFocused,
                      errors.phoneNumber ? styles.inputError : null
                    ]}>
                      <Text style={styles.countryCode}>+84</Text>
                      <TextInput
                        style={[styles.textInput, { marginLeft: 10 }]}
                        placeholder={t('register.enterPhone')}
                        placeholderTextColor="#9CA3AF"
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text);
                          if (errors.phoneNumber) setErrors({...errors, phoneNumber: ''});
                        }}
                        onFocus={() => handleInputFocus('phone')}
                        onBlur={handleInputBlur}
                        keyboardType="phone-pad"
                        returnKeyType="next"
                      />
                      {phoneNumber && validatePhoneNumber(phoneNumber) ? (
                        <Icon name="check-circle" size={16} color="#10B981" />
                      ) : null}
                    </View>
                    {errors.phoneNumber ? (
                      <View style={styles.errorRow}>
                        <Icon name="error-outline" size={10} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Date of Birth - Updated to match update-profile.tsx format */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Icon name="cake" size={12} color="#1e90ff" style={styles.labelIcon} />
                      {t('register.dateOfBirth')}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        focusedField === 'dateOfBirth' && styles.inputFocused,
                        errors.dateOfBirth ? styles.inputError : null,
                        styles.datePickerInput
                      ]}
                      onPress={() => {
                        console.log('📅 Date picker opening...');
                        setShowDatePicker(true);
                        if (errors.dateOfBirth) setErrors({...errors, dateOfBirth: ''});
                      }}
                      onFocus={() => handleInputFocus('dateOfBirth')}
                      onBlur={handleInputBlur}
                      activeOpacity={0.7}
                    >
                      <View style={styles.datePickerContent}>
                        <Text style={[
                          styles.dateText, 
                          !hasSelectedDate && styles.placeholderText
                        ]}>
                          {hasSelectedDate ? formatDate(dateOfBirth) : t('register.selectDatePlaceholder')}
                        </Text>
                                                  <Icon name="event" size={16} color="#1e90ff" />
                      </View>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={dateOfBirth}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        themeVariant="light"
                      />
                    )}
                    {errors.dateOfBirth ? (
                      <View style={styles.errorRow}>
                        <Icon name="error-outline" size={10} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Gender - Updated to horizontal button layout */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Icon name="people" size={12} color="#1e90ff" style={styles.labelIcon} />
                      {t('register.gender')}
                    </Text>
                    <View style={styles.genderContainer}>
                      <TouchableOpacity
                        style={[
                          styles.genderButton,
                          gender === 'male' && styles.genderButtonSelected
                        ]}
                        onPress={() => {
                          setGender('male');
                          if (errors.gender) setErrors({...errors, gender: ''});
                        }}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name="male" 
                          size={14} 
                          color={gender === 'male' ? "#FFFFFF" : "#6B7280"} 
                        />
                        <Text style={[
                          styles.genderText,
                          gender === 'male' && styles.genderTextSelected
                        ]}>
                          {t('register.male')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.genderButton,
                          gender === 'female' && styles.genderButtonSelected
                        ]}
                        onPress={() => {
                          setGender('female');
                          if (errors.gender) setErrors({...errors, gender: ''});
                        }}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name="female" 
                          size={14} 
                          color={gender === 'female' ? "#FFFFFF" : "#6B7280"} 
                        />
                        <Text style={[
                          styles.genderText,
                          gender === 'female' && styles.genderTextSelected
                        ]}>
                          {t('register.female')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {errors.gender ? (
                      <View style={styles.errorRow}>
                        <Icon name="error-outline" size={10} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.gender}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Password Fields - Hidden for Google Users */}
                  {!(route?.params?.googleUserData?.isGoogleLogin && !route?.params?.googleUserData?.userIsActive) && (
                    <>
                      {/* Password */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          <Icon name="lock" size={12} color="#1e90ff" style={styles.labelIcon} />
                          {t('register.password')}
                        </Text>
                        <View style={[
                          styles.inputContainer,
                          focusedField === 'password' && styles.inputFocused,
                          errors.password ? styles.inputError : null
                        ]}>
                          <TextInput
                            style={styles.textInput}
                            placeholder={t('register.enterPassword')}
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              // Real-time validation for password
                              const newErrors = {...errors};
                              
                              if (text.trim()) {
                                const passwordValidation = validatePassword(text);
                                if (!passwordValidation.isValid) {
                                  newErrors.password = passwordValidation.error;
                                } else {
                                  newErrors.password = '';
                                }
                              } else {
                                // Clear error when field is empty (user is still typing)
                                newErrors.password = '';
                              }
                              
                              // Also check confirm password if it exists
                              if (confirmPassword.trim() && text.trim()) {
                                if (text !== confirmPassword) {
                                  newErrors.confirmPassword = t('validation.passwordMismatch');
                                } else {
                                  newErrors.confirmPassword = '';
                                }
                              }
                              
                              setErrors(newErrors);
                            }}
                            onFocus={() => handleInputFocus('password')}
                            onBlur={handleInputBlur}
                            secureTextEntry={!showPassword}
                            returnKeyType="next"
                            autoCapitalize="none"
                          />
                          <TouchableOpacity 
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                          >
                            <Icon 
                              name={showPassword ? "visibility" : "visibility-off"} 
                              size={16} 
                              color="#6B7280" 
                            />
                          </TouchableOpacity>
                        </View>
                        {errors.password ? (
                          <View style={styles.errorRow}>
                            <Icon name="error-outline" size={12} color="#EF4444" />
                            <Text style={styles.errorText}>{errors.password}</Text>
                          </View>
                        ) : focusedField === 'password' ? (
                          <View style={styles.passwordRequirements}>
                            <Text style={styles.requirementsTitle}>{t('register.passwordRequirements')}</Text>
                            <Text style={styles.requirementText}>{t('register.passwordMinLength')}</Text>
                            <Text style={styles.requirementText}>{t('register.passwordMustContain')}</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Confirm Password */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          <Icon name="lock-outline" size={12} color="#1e90ff" style={styles.labelIcon} />
                          {t('register.confirmPassword')}
                        </Text>
                        <View style={[
                          styles.inputContainer,
                          focusedField === 'confirmPassword' && styles.inputFocused,
                          errors.confirmPassword ? styles.inputError : null
                        ]}>
                          <TextInput
                            style={styles.textInput}
                            placeholder={t('register.enterConfirmPassword')}
                            placeholderTextColor="#9CA3AF"
                            value={confirmPassword}
                            onChangeText={(text) => {
                              setConfirmPassword(text);
                              // Real-time validation for confirm password
                              if (text.trim() && password.trim()) {
                                if (password !== text) {
                                  setErrors({...errors, confirmPassword: t('validation.passwordMismatch')});
                                } else {
                                  setErrors({...errors, confirmPassword: ''});
                                }
                              } else {
                                // Clear error when field is empty (user is still typing)
                                setErrors({...errors, confirmPassword: ''});
                              }
                            }}
                            onFocus={() => handleInputFocus('confirmPassword')}
                            onBlur={handleInputBlur}
                            secureTextEntry={!showConfirmPassword}
                            returnKeyType="done"
                            autoCapitalize="none"
                            onSubmitEditing={handleRegister}
                          />
                          <TouchableOpacity 
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeButton}
                          >
                            <Icon 
                              name={showConfirmPassword ? "visibility" : "visibility-off"} 
                              size={16} 
                              color="#6B7280" 
                            />
                          </TouchableOpacity>
                        </View>
                        {errors.confirmPassword ? (
                          <View style={styles.errorRow}>
                            <Icon name="error-outline" size={12} color="#EF4444" />
                            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                          </View>
                        ) : null}
                      </View>
                    </>
                  )}
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                  {/* Create Account Button */}
                  <TouchableOpacity
                    style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                    onPress={handleRegister}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createButtonText}>
                      {isLoading ? 
                        (route?.params?.googleUserData?.isGoogleLogin && !route?.params?.googleUserData?.userIsActive ? 
                          t('register.creatingProfile') : t('register.creatingAccount')) : 
                        (route?.params?.googleUserData?.isGoogleLogin && !route?.params?.googleUserData?.userIsActive ? 
                          t('register.completeProfile') : t('register.createButton'))
                      }
                    </Text>
                    {!isLoading && <Icon name="arrow-forward" size={16} color="#FFFFFF" style={styles.buttonIcon} />}
                  </TouchableOpacity>

                  {/* Back to Login Link */}
                  <TouchableOpacity onPress={handleBackToLogin} style={styles.backToLoginContainer}>
                    <Text style={styles.backToLoginText}>
                      {t('register.alreadyHaveAccount')} <Text style={styles.backToLoginLink}>{t('register.signIn')}</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e90ff',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#1e90ff',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingTop: 5,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 36,
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    ...typography.semibold,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    ...typography.medium,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },

  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Roboto',
  },
  labelIcon: {
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: '#1e90ff',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1e90ff',
    shadowOpacity: 0.15,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  countryCode: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    fontFamily: 'Roboto',
  },
  eyeButton: {
    padding: 2,
  },
  datePickerInput: {
    minHeight: 40,
    paddingVertical: 8,
  },
  datePickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 4,
    minHeight: 36,
  },
  genderButtonSelected: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },
  genderText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 10,
    color: '#EF4444',
    marginLeft: 3,
    flex: 1,
    fontFamily: 'Roboto',
  },
  bottomSection: {
    marginTop: 16,
  },
  createButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1e90ff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  },
  buttonIcon: {
    marginLeft: 6,
  },
  backToLoginContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  backToLoginLink: {
    color: '#1e90ff',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  googleDataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  googleDataText: {
    fontSize: 11,
    color: '#4285F4',
    marginLeft: 6,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  // Loading Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  loadingMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  passwordRequirements: {
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 3,
    fontFamily: 'Roboto',
  },
  requirementText: {
    fontSize: 10,
    color: '#0284C7',
    lineHeight: 14,
    marginBottom: 1,
    fontFamily: 'Roboto',
  },
});

