import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GoogleButton from '../components/Login/GoogleButton';
import Logo from '../components/Login/Logo';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { authService, EmailLoginRequest } from '../services/authService';
import { configureGoogleSignIn, signInWithGoogle } from '../services/googleSignIn';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { t } = useTranslation();
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('validation.emailRequired'));
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert(t('common.error'), t('validation.invalidEmail'));
      return;
    }
    
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return;
    }
    
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      console.log('🟡 Starting email login...');
      
      // Prepare login request
      const loginRequest: EmailLoginRequest = {
        email: email.trim().toLowerCase(),
        password: password.trim()
      };
      
      console.log('🟡 Login request:', { email: loginRequest.email, password: '[HIDDEN]' });
      
      // Call email login API
      const response = await authService.emailLogin(loginRequest);
      
      console.log('🟢 Email login successful:', response);
      
      // Create user profile for AuthContext (using snake_case from API)
      const userProfile = {
        id: response.user_information.email, // Use email as ID
        email: response.user_information.email,
        name: response.user_information.full_name,
        picture: response.user_information.avatar_url
      };
      
      // Update auth context with user data
      login(userProfile);
      
      setIsLoading(false);
      
      // Navigate to main app
      console.log('🟢 Navigating to MainTab');
      navigation.replace('MainTab');
      
    } catch (error: any) {
      setIsLoading(false);
      console.error('🔴 Email login failed:', error);
      
      // Handle specific error cases
      let errorMessage = t('login.loginFailed');
      
      if (error.message.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('Account is not active')) {
        errorMessage = 'Your account is not active. Please verify your email first.';
      } else if (error.message.includes('Google login')) {
        errorMessage = 'This account was created with Google. Please use Google login.';
      } else if (error.message.includes('UNAUTHORIZED')) {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('🟢 LoginScreen - Starting Google Sign-In...');
      const result = await signInWithGoogle();
      
      if (result.success && result.backendData) {
        console.log('🟢 Google Sign-In successful!');
        console.log('🟢 User Info:', result.userInfo);
        console.log('🟢 Backend Data:', result.backendData);
        const isUserActive = (result as any).is_user_active;
        
        console.log('🔍 DEBUG LOGIN LOGIC:', {
          is_user_active: isUserActive,
          'Logic: is_user_active=true should go to MainTab': isUserActive === true,
          'Logic: is_user_active=false should go to Register': isUserActive === false
        });
        
        // Update auth context with user data - tokens are automatically stored in SecureStore
        login(result.backendData.user_infomation);
        
        if (!isUserActive) {
          // First time login (user_is_active = false) - navigate to register screen for additional info
          console.log('🟢 First time login (user_is_active = false) - navigating to Register screen');
          
          // Extract Google user data for auto-fill
          console.log('🔍 Login Screen - Backend response structure:', {
            user_infomation: result.backendData?.user_infomation,
            user_is_active: result.backendData?.is_user_active
          });
          
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
          console.log('🟢 Returning user (user_is_active = true) - navigating to MainTab');
          navigation.replace('MainTab');
        }
      } else {
        console.error('🔴 Google Sign-In failed:', result.error);
        Alert.alert(t('common.error'), result.error || t('login.loginFailed'));
      }
    } catch (err) {
      console.error('🔴 LoginScreen - Google Sign-In error:', err);
      Alert.alert(t('common.error'), t('login.loginFailed'));
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

  return (
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
              <Text style={styles.autoFillText}>Auto-fill test data</Text>
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
            <GoogleButton onPress={handleGoogleLogin} />
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
    </View>
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
});

 