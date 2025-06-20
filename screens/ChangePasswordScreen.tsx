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
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService, ChangePasswordRequest } from '../services/authService';

const { width } = Dimensions.get('window');

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real-time password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    passwordsMatch: false,
    isDifferentFromCurrent: false
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
  const validatePasswordRealTime = (newPwd: string, confirmPwd: string = confirmPassword, currentPwd: string = currentPassword) => {
    const validation = {
      minLength: newPwd.length >= 8,
      hasLetter: /[a-zA-Z]/.test(newPwd),
      hasNumber: /\d/.test(newPwd),
      passwordsMatch: newPwd === confirmPwd && newPwd.length > 0 && confirmPwd.length > 0,
      isDifferentFromCurrent: newPwd !== currentPwd && newPwd.length > 0 && currentPwd.length > 0
    };
    setPasswordValidation(validation);
    return validation;
  };

  const handleCurrentPasswordChange = (text: string) => {
    setCurrentPassword(text);
    validatePasswordRealTime(newPassword, confirmPassword, text);
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    validatePasswordRealTime(text, confirmPassword, currentPassword);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    validatePasswordRealTime(newPassword, text, currentPassword);
  };

  const handleChangePassword = async () => {
    // Check if all validations pass
    const validation = validatePasswordRealTime(newPassword, confirmPassword, currentPassword);
    
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return;
    }
    
    if (!validation.minLength || !validation.hasLetter || !validation.hasNumber || 
        !validation.passwordsMatch || !validation.isDifferentFromCurrent) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('🟡 Changing password...');
      
      const request: ChangePasswordRequest = {
        old_password: currentPassword.trim(),
        new_password: newPassword.trim(),
        confirm_new_password: confirmPassword.trim()
      };
      
      await authService.changePassword(request);
      
      showToast(t('changePassword.success'), 'success');
      
      // Navigate back after success
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error: any) {
      console.log('🔴 Change password failed:', error);
      
      let errorMessage = t('changePassword.failed');
      if (error.message) {
        if (error.message.includes('current password') || error.message.includes('old password')) {
          errorMessage = 'Mật khẩu hiện tại không đúng';
        } else if (error.message.includes('password')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
            <Text style={styles.title}>{t('changePassword.title')}</Text>
            <Text style={styles.subtitle}>{t('changePassword.subtitle')}</Text>
          </View>
          
          <View style={styles.form}>
            {/* Current Password */}
            <Text style={styles.label}>{t('changePassword.currentPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.enterCurrentPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={handleCurrentPasswordChange}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity 
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Icon 
                  name={showCurrentPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={styles.label}>{t('changePassword.newPassword')}</Text>
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
            
            {/* New Password validation messages */}
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
                    Ít nhất 8 ký tự
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
                <View style={styles.validationRow}>
                  <Icon 
                    name={passwordValidation.isDifferentFromCurrent ? "check-circle" : "cancel"} 
                    size={16} 
                    color={passwordValidation.isDifferentFromCurrent ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[
                    styles.validationText,
                    { color: passwordValidation.isDifferentFromCurrent ? "#10B981" : "#EF4444" }
                  ]}>
                    Khác với mật khẩu hiện tại
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm New Password */}
            <Text style={styles.label}>{t('register.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.confirmNewPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
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

            {/* Change Password Button */}
            <TouchableOpacity 
              style={[
                styles.changeButton, 
                (isLoading || !passwordValidation.minLength || !passwordValidation.hasLetter || 
                 !passwordValidation.hasNumber || !passwordValidation.passwordsMatch || 
                 !passwordValidation.isDifferentFromCurrent || !currentPassword.trim()) && styles.changeButtonDisabled
              ]}
              onPress={handleChangePassword}
              disabled={isLoading || !passwordValidation.minLength || !passwordValidation.hasLetter || 
                       !passwordValidation.hasNumber || !passwordValidation.passwordsMatch || 
                       !passwordValidation.isDifferentFromCurrent || !currentPassword.trim()}
            >
              <Text style={styles.changeButtonText}>
                {isLoading ? t('common.loading') : t('changePassword.change')}
              </Text>
            </TouchableOpacity>

            {/* Security Tip */}
            <View style={styles.tipContainer}>
              <Icon name="info" size={20} color="#1e90ff" style={styles.tipIcon} />
              <Text style={styles.tipText}>{t('changePassword.securityTip')}</Text>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
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
  },
  requirementText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  changeButton: {
    width: '100%',
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    flex: 1,
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
  },
}); 