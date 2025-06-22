import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomToast from '../components/CustomToast';
import LogoWithText from '../components/Login/LogoWithText';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService, EmailLoginRequest } from '../services/authService';

const { width } = Dimensions.get('window');

interface OTPScreenProps {
  route?: {
    params?: {
      email?: string;
      phoneNumber?: string;
      fullName?: string;
      dateOfBirth?: string; // YYYY-MM-DD format
      gender?: boolean; // true = male, false = female
      type?: 'register' | 'forgot-password';
      password?: string; // Password for account creation
      otpCode?: string; // For testing purposes
    };
  };
}

export default function OTPScreen({ route }: OTPScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const navigationHook = useNavigation();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  
  const email = route?.params?.email || '';
  const phoneNumber = route?.params?.phoneNumber || '';
  const fullName = route?.params?.fullName || '';
  const dateOfBirth = route?.params?.dateOfBirth || '';
  const gender = route?.params?.gender;
  const type = route?.params?.type || 'register';
  const password = route?.params?.password || ''; // Password for account creation
  const testOtpCode = route?.params?.otpCode || ''; // For testing
  
  // Debug log to check received parameters
  useEffect(() => {
    console.log('🔍 OTPScreen - Received parameters:', {
      email,
      phoneNumber,
      fullName,
      dateOfBirth,
      gender,
      type,
      hasPassword: !!password,
      passwordLength: password.length,
      testOtpCode
    });
  }, []);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Resend modal states
  const [showResendLoadingModal, setShowResendLoadingModal] = useState(false);
  const [showResendSuccessModal, setShowResendSuccessModal] = useState(false);
  
  // Auto navigate timer
  const [autoNavigateTimer, setAutoNavigateTimer] = useState(3);
  
  // Spinning animation
  const spinValue = useRef(new Animated.Value(0)).current;
  
  const inputRefs = useRef<TextInput[]>([]);

  // Prevent uncontrolled back navigation for forgot-password flow
  useFocusEffect(
    React.useCallback(() => {
      // Remove the beforeRemove listener as it's causing issues
      // Just let normal back navigation work
      return () => {};
    }, [navigationHook, type])
  );

  // Timer for resend OTP
  useEffect(() => {
    let interval: number;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Removed auto-fill OTP to let user input manually

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('🟡 Verifying OTP:', { otpCode, email, type, fullName, dateOfBirth, gender });
      
      // Prepare verify OTP request based on type
      let verifyRequest;
      
      if (type === 'register' && fullName && dateOfBirth && gender !== undefined) {
        // Full registration verification with all user data
        verifyRequest = {
          email,
          full_name: fullName,
          dob: dateOfBirth,
          phone_number: phoneNumber,
          gender: gender,
          password: password,
          otp: otpCode
        };
      } else {
        // Simple verification for forgot password or legacy flow
        verifyRequest = {
          email,
          otp_code: otpCode,
          password: password || undefined
        };
      }
      
      console.log('🟡 Final verify request:', verifyRequest);
      
      // Call verify OTP API
      const verifyResult = await authService.verifyOtp(verifyRequest);
      
      console.log('🟢 OTP verification result:', verifyResult);
      
      setIsLoading(false);
      
      // Only proceed if status_code is exactly 200
      if (verifyResult.success && verifyResult.status_code === 200) {
        console.log('🟢 OTP verified successfully with status_code 200');
        
        if (type === 'forgot-password') {
          // Navigate directly to reset password screen without showing success alert
          navigation.navigate('ResetPassword', { 
            email,
            otpCode: otpCode 
          });
        } else {
          // Show success modal for registration
          setShowSuccessModal(true);
        }
      } else {
        // Status code is not 200 or success is false
        console.log('🔴 OTP verification failed - status_code:', verifyResult.status_code);
        
        let errorMessage = verifyResult.message || t('otp.verifyFailed');
        
        // Handle specific status codes
        if (verifyResult.status_code === 400) {
          errorMessage = 'Mã OTP không đúng. Vui lòng kiểm tra lại.';
        } else if (verifyResult.status_code === 404) {
          errorMessage = 'Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.';
        } else if (verifyResult.status_code === 429) {
          errorMessage = 'Quá nhiều lần thử. Vui lòng thử lại sau.';
        } else if (verifyResult.status_code === 500) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }
        
        showToast(errorMessage, 'error');
      }
      
    } catch (error: any) {
      setIsLoading(false);
      console.error('🔴 OTP verification failed:', error);
      
      let errorMessage = t('otp.verifyFailed');
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setShowResendLoadingModal(true);
    setResendLoading(true);
    
    try {
      console.log('🟡 Resending OTP to:', email);
      
      // Call resend OTP API
      await authService.resendOtp(email);
      
      console.log('🟢 OTP resent successfully');
      
      setResendLoading(false);
      setShowResendLoadingModal(false);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // Show success modal
      setShowResendSuccessModal(true);
      
      // Auto hide success modal after 2 seconds
      setTimeout(() => {
        setShowResendSuccessModal(false);
      }, 2000);
      
    } catch (error: any) {
      setResendLoading(false);
      setShowResendLoadingModal(false);
      console.error('🔴 Resend OTP failed:', error);
      
      let errorMessage = t('otp.resendFailed');
      
      if (error.message.includes('CONFLICT')) {
        errorMessage = t('otp.emailAlreadyVerified');
      } else if (error.message.includes('TOO_MANY_REQUESTS')) {
        errorMessage = t('otp.tooManyRequests');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleBackToPrevious = () => {
    // Simply go back to previous screen for all cases
    navigation.goBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTitle = () => {
    return type === 'forgot-password' 
      ? t('otp.verifyReset') 
      : t('otp.verifyAccount');
  };

  const getSubtitle = () => {
    return type === 'forgot-password' 
      ? t('otp.sentToReset') 
      : t('otp.sentTo');
  };

  const showToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const handleSuccessModalOk = async () => {
    setShowSuccessModal(false);
    
    // Clear pending registration data since verification was successful
    try {
      await authService.clearPendingRegistration();
      console.log('🟢 Pending registration data cleared after successful verification');
    } catch (error) {
      console.error('🔴 Failed to clear pending registration data:', error);
    }
    
    // Auto login after successful registration verification
    console.log('🟢 OTP verified successfully, attempting auto login...');
    console.log('🔍 Debug - Password check:', {
      hasPassword: !!password,
      passwordLength: password.length,
      passwordTrimmed: password.trim().length
    });
    
    if (password && password.trim()) {
      try {
        console.log('🟡 Starting auto login process...');
        
        // Prepare login request
        const loginRequest: EmailLoginRequest = {
          email: email.trim().toLowerCase(),
          password: password.trim()
        };
        
        console.log('🟡 Auto login request:', { email: loginRequest.email, password: '[HIDDEN]' });
        
        // Call email login API
        const loginResponse = await authService.emailLogin(loginRequest);
        
        console.log('🟢 Auto login successful:', loginResponse);
        
        // Create user profile for AuthContext
        const userProfile = {
          id: loginResponse.user_information.email,
          email: loginResponse.user_information.email,
          name: loginResponse.user_information.full_name,
          picture: loginResponse.user_information.avatar_url
        };
        
        console.log('🟡 Updating auth context with user profile...');
        
        // Update auth context with user data
        await login(userProfile);
        
        console.log('🟢 Auto login complete, navigating to MainTab');
        
        // Navigate directly to main app
        navigation.replace('MainTab');
        
      } catch (loginError: any) {
        console.error('🔴 Auto login failed:', loginError);
        // Fallback to login screen if auto login fails
        navigation.replace('Login');
      }
    } else {
      // No password available, navigate to login
      console.log('🔴 No password available for auto login, navigating to login screen');
      navigation.replace('Login');
    }
  };

  // Auto navigate countdown
  useEffect(() => {
    let interval: number;
    if (showSuccessModal && autoNavigateTimer > 0) {
      interval = setInterval(() => {
        setAutoNavigateTimer(autoNavigateTimer - 1);
      }, 1000);
    } else if (showSuccessModal && autoNavigateTimer === 0) {
      handleSuccessModalOk();
    }
    return () => clearInterval(interval);
  }, [showSuccessModal, autoNavigateTimer]);

  // Reset auto navigate timer when modal shows
  useEffect(() => {
    if (showSuccessModal) {
      setAutoNavigateTimer(3);
    }
  }, [showSuccessModal]);

  // Spinning animation effect
  useEffect(() => {
    if (showResendLoadingModal) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      
      return () => {
        spinAnimation.stop();
        spinValue.setValue(0);
      };
    }
  }, [showResendLoadingModal, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header with back button and logo */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleBackToPrevious} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1e90ff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.compactLogo}>
              <LogoWithText />
            </View>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>
              {getSubtitle()} {email || phoneNumber}
            </Text>
          </View>
          
          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
                placeholderTextColor="#9CA3AF"
              />
            ))}
          </View>

          {/* Timer and Resend */}
          <View style={styles.resendContainer}>
            {!canResend ? (
              <Text style={styles.timerText}>
                {t('otp.resendIn', { seconds: timer })}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendLoading}
                style={styles.resendButton}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading ? t('common.loading') : t('otp.resendCode')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? t('common.loading') : t('otp.verify')}
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>{t('otp.helpText')}</Text>
        </View>
      </ScrollView>
      
      {/* Resend Loading Modal */}
      <Modal
        visible={showResendLoadingModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingIconContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Icon name="sync" size={40} color="#1e90ff" />
              </Animated.View>
            </View>
            <Text style={styles.modalTitle}>{t('otp.sendingOtp')}</Text>
            <Text style={styles.modalMessage}>
              {t('otp.pleaseWait')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Resend Success Modal */}
      <Modal
        visible={showResendSuccessModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={40} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>{t('otp.otpSentSuccess')}</Text>
            <Text style={styles.modalMessage}>
              {t('otp.newOtpSent')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={60} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>{t('otp.success')}</Text>
            <Text style={styles.modalMessage}>
              {t('otp.accountCreatedSuccess')}
            </Text>
            <Text style={styles.timerText}>
              {t('otp.autoNavigateIn', { seconds: autoNavigateTimer })}
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleSuccessModalOk}
            >
              <Text style={styles.modalButtonText}>{t('common.okay')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactLogo: {
    transform: [{ scale: 0.7 }],
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
    marginHorizontal: 4,
  },
  otpInputFilled: {
    borderColor: '#1e90ff',
    backgroundColor: '#EBF4FF',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#1e90ff',
    fontWeight: '600',
  },
  verifyButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  helpText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  modalButton: {
    padding: 12,
    backgroundColor: '#1e90ff',
    borderRadius: 8,
    marginTop: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingIconContainer: {
    marginBottom: 20,
  },
}); 