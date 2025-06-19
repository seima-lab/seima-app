import { useState } from 'react';
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
  
  // Error state
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });

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

  const handleChangePassword = async () => {
    // Current password validation
    if (!currentPassword.trim()) {
      Alert.alert(t('common.error'), t('validation.currentPasswordRequired'));
      return;
    }
    
    // New password validation
    if (!newPassword.trim()) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordTooShort'));
      return;
    }
    
    // Check if new password is different from current
    if (currentPassword === newPassword) {
      Alert.alert(t('common.error'), t('validation.samePassword'));
      return;
    }
    
    // Confirm password validation
    if (!confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('validation.confirmPasswordRequired'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      console.log('Change password');
      
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(t('common.success'), t('changePassword.success'), [
          {
            text: t('common.confirm'),
            onPress: () => navigation.goBack(),
          },
        ]);
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('common.error'), t('changePassword.failed'));
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
                onChangeText={setCurrentPassword}
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
            <View style={[styles.inputWrapper, errors.newPassword ? styles.inputError : null]}>
              <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.enterNewPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  // Real-time validation for new password
                  const newErrors = {...errors};
                  
                  if (text.trim()) {
                    const passwordValidation = validatePassword(text);
                    if (!passwordValidation.isValid) {
                      newErrors.newPassword = passwordValidation.error;
                    } else {
                      newErrors.newPassword = '';
                    }
                  } else {
                    // Clear error when field is empty (user is still typing)
                    newErrors.newPassword = '';
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
            {errors.newPassword ? (
              <View style={styles.errorRow}>
                <Icon name="error-outline" size={12} color="#EF4444" />
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              </View>
            ) : null}

            {/* Confirm New Password */}
            <Text style={styles.label}>{t('register.confirmPassword')}</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
              <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.confirmNewPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  // Real-time validation for confirm password
                  if (text.trim() && newPassword.trim()) {
                    if (newPassword !== text) {
                      setErrors({...errors, confirmPassword: t('validation.passwordMismatch')});
                    } else {
                      setErrors({...errors, confirmPassword: ''});
                    }
                  } else {
                    // Clear error when field is empty (user is still typing)
                    setErrors({...errors, confirmPassword: ''});
                  }
                }}
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
            {errors.confirmPassword ? (
              <View style={styles.errorRow}>
                <Icon name="error-outline" size={12} color="#EF4444" />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            ) : null}

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>{t('changePassword.requirements')}</Text>
              <Text style={styles.requirementText}>• Ít nhất 8 ký tự</Text>
              <Text style={styles.requirementText}>• Phải có ít nhất 1 chữ cái và 1 số</Text>
              <Text style={styles.requirementText}>• Khác với mật khẩu hiện tại</Text>
            </View>

            {/* Change Password Button */}
            <TouchableOpacity 
              style={[styles.changeButton, isLoading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
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
}); 