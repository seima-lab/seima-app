import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
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
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import {
    authService,
    ResendForgotPasswordOtpRequest,
    VerifyForgotPasswordOtpRequest
} from '../services/authService';

const { width } = Dimensions.get('window');

interface VerifyOTPScreenProps {
  route?: {
    params?: {
      email?: string;
    };
  };
}

export default function VerifyOTPScreen({ route }: VerifyOTPScreenProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Props
  const email = route?.params?.email || '';
  
  // Form state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  // Refs for OTP inputs
  const otpInputRefs = useRef<TextInput[]>([]);
  
  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

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

    // Focus first input after animation
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 800);

    // Start countdown immediately when screen mounts
    setResendCooldown(60);
  }, [fadeAnim, slideAnim]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      showToast(t('otp.enterCompleteOtp'), 'warning');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🟡 Verifying forgot password OTP for:', email);
      
      const request: VerifyForgotPasswordOtpRequest = {
        email: email.trim().toLowerCase(),
        otp: otpCode
      };
      
      const response = await authService.verifyForgotPasswordOtp(request);
      
      console.log('🟢 Forgot password OTP verified successfully:', response);
      
      // Navigate immediately without showing any success message or toast
      navigation.navigate('ResetPassword', { 
        email: email,
        verificationToken: response.verification_token
      });
      
    } catch (error: any) {
      console.log('🔴 Verify forgot password OTP failed:', error);
      
      let errorMessage = t('otp.verifyFailed');
      if (error.message) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          errorMessage = t('otp.invalidOrExpired');
        } else if (error.message.includes('not found')) {
          errorMessage = t('otp.userNotFound');
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      showToast(t('otp.resendCooldown', { seconds: resendCooldown }), 'warning');
      return;
    }

    setIsResending(true);

    try {
      console.log('🟡 Resending forgot password OTP for:', email);
      
      const request: ResendForgotPasswordOtpRequest = {
        email: email.trim().toLowerCase()
      };
      
      await authService.resendForgotPasswordOtp(request);
      
      console.log('🟢 Forgot password OTP resent successfully');
      
      showToast(t('otp.resendSuccess'), 'success');
      
      // Start cooldown
      setResendCooldown(60);
      
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      setFocusedIndex(0);
      
    } catch (error: any) {
      console.log('🔴 Resend forgot password OTP failed:', error);
      
      let errorMessage = t('otp.resendFailed');
      if (error.message) {
        if (error.message.includes('not found')) {
          errorMessage = t('otp.userNotFound');
        } else if (error.message.includes('too many requests') || error.message.includes('rate limit')) {
          errorMessage = t('otp.tooManyRequests');
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToForgotPassword = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
      
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
              <TouchableOpacity style={styles.backButton} onPress={handleBackToForgotPassword}>
                <Icon name="arrow-back-ios" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.title}>{t('verifyOtp.title')}</Text>
                <Text style={styles.subtitle}>{t('verifyOtp.subtitle')}</Text>
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
                {/* OTP Information */}
                <View style={styles.otpInfo}>
                  <View style={styles.emailContainer}>
                    <Icon name="email" size={20} color="#1e90ff" />
                    <Text style={styles.emailText}>{email}</Text>
                  </View>
                  <Text style={styles.infoText}>{t('verifyOtp.info')}</Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  <Text style={styles.otpLabel}>{t('verifyOtp.enterOtp')}</Text>
                  <View style={styles.otpInputContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          if (ref) otpInputRefs.current[index] = ref;
                        }}
                        style={[
                          styles.otpInput,
                          focusedIndex === index && styles.otpInputFocused,
                          digit && styles.otpInputFilled
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(key, index)}
                        onFocus={() => setFocusedIndex(index)}
                        keyboardType="numeric"
                        maxLength={1}
                        selectTextOnFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="oneTimeCode"
                      />
                    ))}
                  </View>
                </View>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>{t('verifyOtp.didntReceive')}</Text>
                  <TouchableOpacity
                    style={[styles.resendButton, (resendCooldown > 0 || isResending) && styles.resendButtonDisabled]}
                    onPress={handleResendOTP}
                    disabled={resendCooldown > 0 || isResending}
                    activeOpacity={0.7}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color="#1e90ff" />
                    ) : (
                      <>
                        <Icon name="refresh" size={14} color={resendCooldown > 0 ? "#9CA3AF" : "#1e90ff"} />
                        <Text style={[
                          styles.resendButtonText,
                          resendCooldown > 0 && styles.resendButtonTextDisabled
                        ]}>
                          {resendCooldown > 0 
                            ? t('verifyOtp.resendIn', { seconds: resendCooldown })
                            : t('verifyOtp.resend')
                          }
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading || otp.join('').length !== 6}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.verifyButtonText}>{t('verifyOtp.verify')}</Text>
                      <Icon name="arrow-forward" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Back to Forgot Password Link */}
                <TouchableOpacity onPress={handleBackToForgotPassword} style={styles.backLinkContainer}>
                  <Text style={styles.backLinkText}>
                    {t('verifyOtp.backToForgotPassword')}
                  </Text>
                </TouchableOpacity>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontFamily: 'Roboto',
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
    padding: 20,
    paddingBottom: 30,
  },
  otpInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e90ff',
    marginLeft: 8,
    fontFamily: 'Roboto',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Roboto',
  },
  otpInputFocused: {
    borderColor: '#1e90ff',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1e90ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  otpInputFilled: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  resendButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  resendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e90ff',
    marginLeft: 6,
    fontFamily: 'Roboto',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  verifyButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#1e90ff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  backLinkContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 13,
    color: '#1e90ff',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
}); 