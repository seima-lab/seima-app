import React, { useState } from 'react';
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

interface ResetPasswordScreenProps {
  route?: {
    params?: {
      email?: string;
    };
  };
}

export default function ResetPasswordScreen({ route }: ResetPasswordScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  const email = route?.params?.email || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    // Password validation
    if (!newPassword.trim()) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordTooShort'));
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
      console.log('Reset password for:', email);
      
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(t('common.success'), t('resetPassword.success'), [
          {
            text: t('common.confirm'),
            onPress: () => navigation.replace('Login'),
          },
        ]);
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('common.error'), t('resetPassword.failed'));
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
                onChangeText={setNewPassword}
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
                onChangeText={setConfirmPassword}
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

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>{t('resetPassword.requirements')}</Text>
              <Text style={styles.requirementText}>• {t('resetPassword.minLength')}</Text>
              <Text style={styles.requirementText}>• {t('resetPassword.recommendation')}</Text>
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity 
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
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
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#1e90ff',
    fontWeight: '600',
  },
}); 