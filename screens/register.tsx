import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LogoWithText from '../components/Login/LogoWithText';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(dateOfBirth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\d{9,15}$/;
    return phoneRegex.test(phone);
  };

  const handleRegister = async () => {
    // Full Name validation
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('validation.fullNameRequired'));
      return;
    }
    
    // Email validation
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('validation.emailRequired'));
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert(t('common.error'), t('validation.invalidEmail'));
      return;
    }
    
    // Phone number validation
    if (!phoneNumber.trim()) {
      Alert.alert(t('common.error'), t('validation.phoneRequired'));
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(t('common.error'), t('validation.invalidPhone'));
      return;
    }
    
    // Date of birth validation
    if (!hasSelectedDate) {
      Alert.alert(t('common.error'), t('register.selectDateOfBirth'));
      return;
    }
    
    // Gender validation
    if (!gender) {
      Alert.alert(t('common.error'), t('validation.selectGender'));
      return;
    }
    
    // Password validation
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return;
    }
    
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordTooShort'));
      return;
    }
    
    // Confirm password validation
    if (!confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('validation.confirmPasswordRequired'));
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      console.log('Register:', { 
        fullName, 
        email, 
        phoneNumber, 
        password, 
        dateOfBirth, 
        gender 
      });
      
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(t('common.success'), t('register.registerSuccess'), [
          {
            text: t('common.confirm'),
            onPress: () => navigation.navigate('OTP', { 
              email: email,
              phoneNumber: phoneNumber 
            }),
          },
        ]);
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('common.error'), t('register.registerFailed'));
    }
  };

  const openDatePicker = () => {
    setTempDate(dateOfBirth);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmDate = () => {
    setDateOfBirth(tempDate);
    setHasSelectedDate(true);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleBackToLogin = () => {
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
          <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
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
            <Text style={styles.title}>{t('register.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
          </View>
          
          <View style={styles.form}>
            {/* 1. Full Name */}
            <Text style={styles.label}>{t('profile.fullName')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('placeholders.enterFullName')}
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={setFullName}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>

            {/* 2. Email */}
            <Text style={styles.label}>{t('email')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('placeholders.enterEmail')}
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* 3. Phone Number */}
            <Text style={styles.label}>{t('placeholders.phoneNumber')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('placeholders.enterPhone')}
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                returnKeyType="next"
              />
            </View>

            {/* 4. Date of Birth */}
            <Text style={styles.label}>{t('dateOfBirth')}</Text>
            <Pressable style={styles.inputWrapper} onPress={openDatePicker}>
              <Icon name="event" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <Text style={[styles.dateInput, { color: hasSelectedDate ? '#374151' : '#9ca3af' }]}>
                {hasSelectedDate ? formatDate(dateOfBirth) : t('register.selectDatePlaceholder')}
              </Text>
              <Icon name="keyboard-arrow-down" size={20} color="#9CA3AF" />
            </Pressable>

            {/* Date Picker Modal */}
            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={handleCancelDate}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{t('register.selectDateOfBirth')}</Text>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    themeVariant="light"
                    style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalButton} onPress={handleCancelDate}>
                      <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmDate}>
                      <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>{t('common.confirm')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* 5. Gender */}
            <Text style={styles.label}>{t('gender')}</Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
                onPress={() => setGender('male')}
              >
                <Icon 
                  name="male" 
                  size={20} 
                  color={gender === 'male' ? '#fff' : '#9CA3AF'} 
                  style={styles.genderIcon}
                />
                <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextSelected]}>
                  {t('male')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
                onPress={() => setGender('female')}
              >
                <Icon 
                  name="female" 
                  size={20} 
                  color={gender === 'female' ? '#fff' : '#9CA3AF'} 
                  style={styles.genderIcon}
                />
                <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextSelected]}>
                  {t('female')}
                </Text>
              </Pressable>
            </View>

            {/* 6. Password */}
            <Text style={styles.label}>{t('login.password')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.enterPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Icon 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>

            {/* 7. Confirm Password */}
            <Text style={styles.label}>{t('register.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('placeholders.confirmPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
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
            
            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? t('common.loading') : t('register.register')}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('register.haveAccount')} </Text>
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
  placeholder: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    marginTop: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  eyeButton: {
    padding: 4,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
  },
  genderRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 3,
    backgroundColor: '#F9FAFB',
  },
  genderButtonSelected: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },
  genderIcon: {
    marginRight: 6,
  },
  genderButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#1e90ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loginText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 13,
    color: '#1e90ff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 6,
  },
  modalButtonConfirm: {
    backgroundColor: '#1e90ff',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontWeight: '600',
  },
  iosDatePicker: {
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  compactLogo: {
    width: 100,
    height: 100,
  },
});