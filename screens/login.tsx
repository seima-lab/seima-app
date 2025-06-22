import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomToast from '../components/CustomToast';
import GoogleButton from '../components/Login/GoogleButton';
import Logo from '../components/Login/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService } from '../services/authService';
import { configureGoogleSignIn, signInWithGoogle } from '../services/googleSignIn';
import {
  createUserProfileFromEmail,
  mapAuthErrorToMessage,
  prepareEmailLoginRequest,
  validateLoginForm
} from '../utils/authUtils';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoFillTest, setAutoFillTest] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'warning' | 'info'
  });
  
  // Account activation modal state
  const [showActivationModal, setShowActivationModal] = useState(false);
  
  // Card animation
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Configure Google Sign-In when component mounts
    configureGoogleSignIn();
    
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 900,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const cardOpacity = cardAnim;

  const showToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleEmailLogin = async () => {
    // Validate form using pure function
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      showToast(t(validation.error!), 'warning');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🟡 Starting email login...');
      
      // Prepare login request using pure function
      const loginRequest = prepareEmailLoginRequest(email, password);
      
      console.log('🟡 Login request:', { email: loginRequest.email, password: '[HIDDEN]' });
      
      // Call email login API
      const response = await authService.emailLogin(loginRequest);
      
      console.log('🟢 Email login successful:', response);
      
      // Add null check for response
      if (!response || !response.user_information) {
        throw new Error('Invalid response from server');
      }
      
      // Create user profile using pure function
      const userProfile = createUserProfileFromEmail(response.user_information);
      
      // Update auth context with user data
      await login(userProfile);
      
      console.log('🟢 Email login successful, navigating to MainTab');
      
      // Navigate immediately without delay
      navigation.replace('MainTab');
      
      setIsLoading(false);
      
    } catch (error: any) {
      setIsLoading(false);
      console.log('🔴 Email login failed:', error);
      
      // Map error to user-friendly message using pure function
      const errorMessageKey = mapAuthErrorToMessage(error);
      
      if (errorMessageKey === 'SHOW_ACTIVATION_MODAL') {
        console.log('🟡 DEBUG - Showing activation modal');
        setShowActivationModal(true);
      } else {
        const translatedMessage = t(errorMessageKey);
        showToast(translatedMessage, 'error');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('🟢 LoginScreen - Starting Google Sign-In...');
      const result = await signInWithGoogle();
      
      // Add null check for result
      if (!result) {
        throw new Error('Google Sign-In returned no result');
      }
      
      if (result.success && result.backendData) {
        console.log('🟢 Google Sign-In successful!');
        console.log('🟢 User Info:', result.userInfo);
        console.log('🟢 Backend Data:', result.backendData);
        
        // Extract user active status from backend response
        const isUserActive = result.backendData?.is_user_active;
        
        console.log('🔍 DEBUG LOGIN LOGIC:', {
          is_user_active: isUserActive,
          'Logic: Should go to Register if': '!isUserActive',
          'Should go to Register': !isUserActive
        });
        
        // Update auth context with user data - tokens are automatically stored in SecureStore
        await login(result.backendData.user_infomation);
        
        // Check if user needs to complete profile
        if (!isUserActive) {
          // First time login or inactive user - navigate to register screen for additional info
          console.log('🟢 First time login or inactive user - navigating to Register screen');
          
          const userInfo = result.backendData?.user_infomation as any;
          const googleUserData = {
            fullName: userInfo?.name || userInfo?.full_name || userInfo?.fullName || '',
            email: userInfo?.email || '',
            isGoogleLogin: true,
            userIsActive: isUserActive
          };
          
          console.log('🟢 Passing Google user data to Register:', googleUserData);
          navigation.replace('Register', { googleUserData });
        } else {
          // Returning user (user_is_active = true) - go directly to main app
          console.log('🟢 Returning user (user is active) - navigating to MainTab');
          navigation.replace('MainTab');
        }
      } else {
        console.log('🔴 Google Sign-In failed:', result.error);
        showToast(result.error || t('login.loginFailed'), 'error');
      }
    } catch (err) {
      console.log('🔴 LoginScreen - Google Sign-In error:', err);
      showToast(t('login.loginFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleAutoFillToggle = (value: boolean) => {
    setAutoFillTest(value);
    
    if (value) {
      // Auto-fill test data
      setEmail('cnguyenmanh2612@gmail.com');
      setPassword('123123Mn@');
    } else {
      // Clear fields
      setEmail('');
      setPassword('');
    }
  };

  const handleActivateAccount = async () => {
    setShowActivationModal(false);
    setIsLoading(true);
    
    try {
      // Get pending registration data
      console.log('🟡 Getting pending registration data...');
      const pendingData = await authService.getPendingRegistration();
      
      if (!pendingData) {
        console.log('🔴 No pending registration data found, fallback to resend OTP');
        // Fallback: resend OTP if no pending data
        await authService.resendOtp(email.trim().toLowerCase());
        console.log('🟢 OTP resent successfully for activation');
        
        navigation.navigate('OTP', {
          email: email.trim().toLowerCase(),
          password: password.trim(),
          type: 'register'
        });
      } else {
        console.log('🟢 Found pending registration data, navigating to OTP with full data');
        // Use pending registration data to navigate to OTP
        navigation.navigate('OTP', {
          email: pendingData.email,
          fullName: pendingData.full_name,
          phoneNumber: pendingData.phone_number,
          password: pendingData.password,
          dateOfBirth: pendingData.dob,
          gender: pendingData.gender,
          type: 'register'
        });
      }
      
    } catch (error: any) {
      console.error('🔴 Failed to handle account activation:', error);
      
      let errorMessage = 'Không thể kích hoạt tài khoản. Vui lòng thử lại.';
      
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelActivation = () => {
    setShowActivationModal(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          {/* Compact Logo */}
          <View style={styles.logoContainer}>
            <Logo />
          </View>
          
          {/* Animated Login Card */}
          <Animated.View style={[
            styles.loginCard, 
            { 
              opacity: cardOpacity, 
              transform: [{ translateY: cardTranslateY }] 
            }
          ]}> 
              <Text style={styles.loginTitle}>{t('login.signInTitle')}</Text>
              
              {/* Auto-fill Test Data Checkbox */}
              <TouchableOpacity 
                style={styles.autoFillContainer}
                onPress={() => handleAutoFillToggle(!autoFillTest)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, autoFillTest && styles.checkboxChecked]}>
                  {autoFillTest && (
                    <Icon name="check" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.autoFillText}>{t('register.autoFillTest')}</Text>
              </TouchableOpacity>
              
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('email')}</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('placeholders.enterEmail')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('login.password')}</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('placeholders.enterPassword')}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleEmailLogin}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    testID="password-toggle"
                  >
                    <Icon 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me */}
              <TouchableOpacity 
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Icon name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.rememberMeText}>{t('login.rememberMe')}</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleEmailLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? t('common.loading') : t('login.signIn')}
                </Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('login.orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Login */}
              <GoogleButton onPress={handleGoogleLogin} disabled={isLoading} />
          </Animated.View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {t('login.noAccount')} 
            </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signupLink}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <Text style={styles.footerText}>
              {t('login.termsText')}
            </Text>
          </View>
        </View>

        {/* Account Activation Modal */}
        <Modal
          visible={showActivationModal}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Icon name="error-outline" size={50} color="#FFA500" />
              </View>
              <Text style={styles.modalTitle}>Tài khoản chưa được kích hoạt</Text>
              <Text style={styles.modalMessage}>
                Tài khoản của bạn chưa được kích hoạt. Vui lòng kích hoạt tài khoản để tiếp tục.
              </Text>
              
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelActivation}
                >
                  <Text style={styles.cancelButtonText}>Huỷ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.activateButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleActivateAccount}
                  disabled={isLoading}
                >
                  <Text style={styles.activateButtonText}>
                    {isLoading ? 'Đang gửi...' : 'Kích hoạt'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Toast */}
        <CustomToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          duration={4000}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  loginCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
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
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: '#1e90ff',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#1e90ff',
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  autoFillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoFillText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
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
    borderRadius: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFA500',
  },
  activateButton: {
    backgroundColor: '#1e90ff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

 