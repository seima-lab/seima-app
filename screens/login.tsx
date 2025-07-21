import messaging from '@react-native-firebase/messaging';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomToast from '../components/CustomToast';
import GoogleButton from '../components/Login/GoogleButton';
import Logo from '../components/Login/Logo';
import { typography } from '../constants/typography';
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

const { height, width } = Dimensions.get('window');

// Enhanced responsive utilities for all screen sizes
const responsiveUtils = {
  isSmallScreen: width < 375 || height < 667,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  screenWidth: width,
  screenHeight: height,
  
  // Responsive padding/margin
  rp: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minSize = size * 0.7;
    const maxSize = size * 1.3;
    const scaledSize = size * scale;
    return Math.max(Math.min(scaledSize, maxSize), minSize);
  },
  
  // Responsive font size
  rf: (fontSize: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minFontScale = 0.8;
    const maxFontScale = 1.2;
    const fontScale = Math.min(Math.max(scale, minFontScale), maxFontScale);
    return fontSize * fontScale;
  },
  
  // Width percentage
  wp: (percentage: number) => (width * percentage) / 100,
  
  // Height percentage
  hp: (percentage: number) => (height * percentage) / 100,
  
  // Responsive border radius
  rb: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    return Math.max(size * scale, size * 0.8);
  }
};

// Extract utilities for easier use
const { isSmallScreen, isMediumScreen, isLargeScreen, rp, rf, wp, hp, rb } = responsiveUtils;

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
      // Lấy device_id và fcm_token
      const device_id = await DeviceInfo.getUniqueId();
      const fcm_token = await messaging().getToken();
      // Prepare login request using pure function
      const loginRequest = {
        ...prepareEmailLoginRequest(email, password),
        device_id,
        fcm_token,
      };
      console.log('🟡 Login request:', { email: loginRequest.email, password: '[HIDDEN]', device_id, fcm_token });
      
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
      
      console.log('🟢 Email login successful - AuthNavigator will handle navigation');
      
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
        const isUserActive = result.backendData?.is_user_active;
        if (!isUserActive) {
          // Lần đầu đăng nhập Google, cần bổ sung thông tin
          const userInfo = result.backendData?.user_infomation as any;
          const googleUserData = {
            fullName: userInfo?.name || userInfo?.full_name || userInfo?.fullName || '',
            email: userInfo?.email || '',
            isGoogleLogin: true,
            userIsActive: isUserActive
          };
          navigation.replace('Register', { googleUserData });
        } else {
          // Đã từng đăng nhập, vào thẳng app
          await login(result.backendData.user_infomation);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={[styles.content, { paddingTop: insets.top + rp(20) }]}>
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
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('email')}</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="email" size={rf(20)} color="#9CA3AF" style={styles.inputIcon} />
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
                      <Icon name="lock" size={rf(20)} color="#9CA3AF" style={styles.inputIcon} />
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
                          size={rf(20)} 
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
                      {rememberMe && <Icon name="check" size={rf(14)} color="#fff" />}
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

                  {/* Sign Up Link - moved inside card */}
                  <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>
                      {t('login.noAccount')} 
                    </Text>
                    <TouchableOpacity onPress={handleSignUp}>
                      <Text style={styles.signupLink}>{t('login.signUp')}</Text>
                    </TouchableOpacity>
                  </View>
              </Animated.View>
              
              {/* Footer */}
              <View style={[styles.footer, { paddingBottom: insets.bottom + rp(10) }]}>
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
                    <Icon name="error-outline" size={rf(50)} color="#FFA500" />
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
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: rp(16),
  },
  logoContainer: {
    height: isSmallScreen ? hp(6) : hp(8),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: rp(10),
  },
  loginCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: wp(90),
    padding: rp(10),
    borderRadius: rb(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    justifyContent: 'space-around',
    marginHorizontal: rp(16),
    marginTop: rp(-10),
    marginBottom: rp(50),
  },
  inputContainer: {
    marginTop: rp(10),
    marginBottom: rp(10),
  },
  inputLabel: {   
    ...typography.medium,
    color: '#374151',
    marginBottom: rp(6),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: rb(12),
    paddingHorizontal: rp(16),
    paddingVertical: rp(12),
  },
  inputIcon: {
    marginRight: rp(12),
  },
  textInput: {
    flex: 1,
    fontSize: rf(12),
    color: '#1F2937',
  },
  eyeButton: {
    padding: rp(4),
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rp(10),
  },
  checkbox: {
    width: rp(20),
    height: rp(20),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: rb(4),
    marginRight: rp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },
  rememberMeText: {
    fontSize: rf(14),
    color: '#6B7280',
  },
  loginButton: {
    backgroundColor: '#1e90ff',
    borderRadius: rb(12),
    paddingVertical: rp(16),
    alignItems: 'center',
    marginBottom: rp(10),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: rf(16),
    ...typography.semibold,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: rp(10),
  },
  forgotPasswordText: {
    color: '#1e90ff',
    fontSize: rf(14),
    ...typography.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rp(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: rp(16),
    fontSize: rf(14),
    color: '#6B7280',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rp(16),
    paddingTop: rp(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  signupText: {
    fontSize: rf(14),
    color: '#6B7280',
    ...typography.medium,
  },
  signupLink: {
    fontSize: rf(14),
    color: '#1e90ff',
    ...typography.semibold,
    marginLeft: rp(4),
  },
  footer: {
    width: '100%',
    paddingHorizontal: rp(20),
    paddingTop: rp(5),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: rf(12),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: rf(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rp(20),
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: rp(20),
    borderRadius: rb(20),
    width: '100%',
    maxWidth: wp(85),
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: rp(20),
  },
  modalTitle: {
    fontSize: rf(20),
    ...typography.semibold,
    color: '#1F2937',
    marginBottom: rp(16),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: rf(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: rp(20),
    lineHeight: rf(20),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: rp(16),
  },
  modalButton: {
    flex: 1,
    paddingVertical: rp(12),
    paddingHorizontal: rp(16),
    borderRadius: rb(8),
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
    fontSize: rf(14),
    ...typography.semibold,
  },
  activateButtonText: {
    color: '#fff',
    fontSize: rf(14),
    ...typography.semibold,
  },
});

 