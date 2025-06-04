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

const { width } = Dimensions.get('window');

interface OTPScreenProps {
  route?: {
    params?: {
      email?: string;
      phoneNumber?: string;
      type?: 'register' | 'forgot-password';
    };
  };
}

export default function OTPScreen({ route }: OTPScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  const email = route?.params?.email || '';
  const phoneNumber = route?.params?.phoneNumber || '';
  const type = route?.params?.type || 'register';
  
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
      // Simulate API call
      console.log('Verify OTP:', { otpCode, email, phoneNumber, type });
      
      setTimeout(() => {
        setIsLoading(false);
        
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
          Alert.alert(t('common.success'), t('otp.verifySuccess'), [
            {
              text: t('common.confirm'),
              onPress: () => navigation.replace('Login'),
            },
          ]);
        }
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('common.error'), t('otp.verifyFailed'));
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      // Simulate API call
      console.log('Resend OTP to:', email || phoneNumber, 'for', type);
      
      setTimeout(() => {
        setResendLoading(false);
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        Alert.alert(t('common.success'), t('otp.resendSuccess'));
      }, 1000);
      
    } catch (error) {
      setResendLoading(false);
      Alert.alert(t('common.error'), t('otp.resendFailed'));
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