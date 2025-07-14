import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import LogoWithText from '../components/Login/LogoWithText';
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService, ResetPasswordRequest, SetNewPasswordAfterVerificationRequest } from '../services/authService';

const { width } = Dimensions.get('window');

interface ResetPasswordScreenProps {
  route?: {
    params?: {
      email?: string;
      otpCode?: string;
      verificationToken?: string;
    };
  };
}

export default function ResetPasswordScreen({ route }: ResetPasswordScreenProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  const email = route?.params?.email || '';
  const otpCode = route?.params?.otpCode || '';
  const verificationToken = route?.params?.verificationToken || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real-time password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    passwordsMatch: false
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  // Toast functions
  const showToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  // Real-time password validation
  const validatePasswordRealTime = (password: string, confirmPwd: string = confirmPassword) => {
    const validation = {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      passwordsMatch: password === confirmPwd && password.length > 0 && confirmPwd.length > 0
    };
    setPasswordValidation(validation);
    return validation;
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    validatePasswordRealTime(text, confirmPassword);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    validatePasswordRealTime(newPassword, text);
  };

  const handleResetPassword = async () => {
    // Check if all validations pass
    const validation = validatePasswordRealTime(newPassword, confirmPassword);
    
    if (!newPassword.trim() || !validation.minLength || !validation.hasLetter || !validation.hasNumber) {
      return;
    }
    
    if (!confirmPassword.trim() || !validation.passwordsMatch) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('🟡 Resetting password for:', email);
      
      if (verificationToken) {
        // Use new API flow with verification token
        const request: SetNewPasswordAfterVerificationRequest = {
          email: email.trim().toLowerCase(),
          new_password: newPassword.trim(),
          verification_token: verificationToken
        };
        
        await authService.setNewPasswordAfterVerification(request);
      } else {
        // Use legacy API flow
        const request: ResetPasswordRequest = {
          email: email.trim().toLowerCase(),
          otp_code: otpCode,
          new_password: newPassword.trim(),
          confirm_password: confirmPassword.trim()
        };
        
        await authService.resetPassword(request);
      }
      
      showToast(t('resetPassword.success'), 'success');
      
      // Navigate to login after success
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
      
    } catch (error: any) {
      console.log('🔴 Reset password failed:', error);
      
      let errorMessage = t('resetPassword.failed');
      if (error.message) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          errorMessage = t('resetPassword.invalidOtp');
        } else if (error.message.includes('password')) {
          errorMessage = t('resetPassword.weakPassword');
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.replace('Login');
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
        {/* Header with logo only */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.logoContainer}>
            <View style={styles.compactLogo}>
              <LogoWithText />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('resetPassword.title')}</Text>
            <Text style={styles.subtitle}>{t('resetPassword.subtitle')}</Text>
          </View>
          
          <View style={styles.form}>
            {/* New Password */}
            <Text style={styles.label}>{t('resetPassword.newPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.enterNewPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity 
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Icon 
                  name={showNewPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password validation messages */}
            {newPassword.length > 0 && (
              <View style={styles.validationContainer}>
                <View style={styles.validationRow}>
                  <Icon 
                    name={passwordValidation.minLength ? "check-circle" : "cancel"} 
                    size={16} 
                    color={passwordValidation.minLength ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[
                    styles.validationText,
                    { color: passwordValidation.minLength ? "#10B981" : "#EF4444" }
                  ]}>
                    {t('resetPassword.minLength')}
                  </Text>
                </View>
                <View style={styles.validationRow}>
                  <Icon 
                    name={passwordValidation.hasLetter ? "check-circle" : "cancel"} 
                    size={16} 
                    color={passwordValidation.hasLetter ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[
                    styles.validationText,
                    { color: passwordValidation.hasLetter ? "#10B981" : "#EF4444" }
                  ]}>
                    Chứa ít nhất 1 chữ cái
                  </Text>
                </View>
                <View style={styles.validationRow}>
                  <Icon 
                    name={passwordValidation.hasNumber ? "check-circle" : "cancel"} 
                    size={16} 
                    color={passwordValidation.hasNumber ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[
                    styles.validationText,
                    { color: passwordValidation.hasNumber ? "#10B981" : "#EF4444" }
                  ]}>
                    Chứa ít nhất 1 chữ số
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm Password */}
            <Text style={styles.label}>{t('register.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.confirmNewPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Icon 
                  name={showConfirmPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Confirm password validation message */}
            {confirmPassword.length > 0 && !passwordValidation.passwordsMatch && (
              <View style={styles.validationContainer}>
                <View style={styles.validationRow}>
                  <Icon name="cancel" size={16} color="#EF4444" />
                  <Text style={[styles.validationText, { color: "#EF4444" }]}>
                    Mật khẩu xác nhận không khớp
                  </Text>
                </View>
              </View>
            )}



            {/* Reset Password Button */}
            <TouchableOpacity 
              style={[
                styles.resetButton, 
                (isLoading || !passwordValidation.minLength || !passwordValidation.hasLetter || !passwordValidation.hasNumber || !passwordValidation.passwordsMatch) && styles.resetButtonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={isLoading || !passwordValidation.minLength || !passwordValidation.hasLetter || !passwordValidation.hasNumber || !passwordValidation.passwordsMatch}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? t('common.loading') : t('resetPassword.reset')}
              </Text>
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('resetPassword.backToLogin')} </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginLink}>{t('login.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Custom Toast */}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactLogo: {
    transform: [{ scale: 0.7 }],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    fontFamily: 'Roboto',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
    fontFamily: 'Roboto',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  eyeButton: {
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#1e90ff',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    fontFamily: 'Roboto',
  },
  requirementText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Roboto',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  loginLink: {
    fontSize: 14,
    color: '#1e90ff',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  validationContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validationText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Roboto',
  },
}); 