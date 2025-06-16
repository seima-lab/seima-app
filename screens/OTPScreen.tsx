import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LogoWithText from '../components/Login/LogoWithText';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService } from '../services/authService';

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
  const insets = useSafeAreaInsets();
  
  const email = route?.params?.email || '';
  const phoneNumber = route?.params?.phoneNumber || '';
  const fullName = route?.params?.fullName || '';
  const dateOfBirth = route?.params?.dateOfBirth || '';
  const gender = route?.params?.gender;
  const type = route?.params?.type || 'register';
  const password = route?.params?.password || ''; // Password for account creation
  const testOtpCode = route?.params?.otpCode || ''; // For testing
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

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

  // Auto-fill OTP for testing (if provided)
  useEffect(() => {
    if (testOtpCode && testOtpCode.length === 6) {
      const otpArray = testOtpCode.split('');
      setOtp(otpArray);
      console.log('🟡 Auto-filled OTP for testing:', testOtpCode);
    }
  }, [testOtpCode]);

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
      Alert.alert(t('common.error'), t('otp.enterComplete'));
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
      const verified = await authService.verifyOtp(verifyRequest);
      
      console.log('🟢 OTP verification result:', verified);
      
      setIsLoading(false);
      
      if (verified) {
        if (type === 'forgot-password') {
          // Navigate to reset password screen
          Alert.alert(t('common.success'), t('otp.verifySuccessReset'), [
            {
              text: t('common.confirm'),
              onPress: () => navigation.navigate('ResetPassword', { email }),
            },
          ]);
        } else {
          // Navigate to login for register flow
          Alert.alert(t('common.success'), 'Account verified successfully! You can now login.', [
            {
              text: t('common.confirm'),
              onPress: () => navigation.replace('Login'),
            },
          ]);
        }
      } else {
        Alert.alert(t('common.error'), 'OTP verification failed. Please try again.');
      }
      
    } catch (error: any) {
      setIsLoading(false);
      console.error('🔴 OTP verification failed:', error);
      
      let errorMessage = t('otp.verifyFailed');
      
      if (error.message.includes('UNAUTHORIZED') || error.message.includes('Invalid')) {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.message.includes('NOT_FOUND')) {
        errorMessage = 'OTP not found. Please request a new one.';
      } else if (error.message.includes('TOO_MANY_REQUESTS')) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      console.log('🟡 Resending OTP to:', email);
      
      // Call resend OTP API
      await authService.resendOtp(email);
      
      console.log('🟢 OTP resent successfully');
      
      setResendLoading(false);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      Alert.alert(t('common.success'), 'OTP has been resent to your email.');
      
    } catch (error: any) {
      setResendLoading(false);
      console.error('🔴 Resend OTP failed:', error);
      
      let errorMessage = t('otp.resendFailed');
      
      if (error.message.includes('CONFLICT')) {
        errorMessage = 'Email already verified or does not exist.';
      } else if (error.message.includes('TOO_MANY_REQUESTS')) {
        errorMessage = 'Too many requests. Please wait before requesting again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleBackToPrevious = () => {
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
                {t('otp.resendIn')} {formatTime(timer)}
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
}); 