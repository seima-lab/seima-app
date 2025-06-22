/**
 * LoginScreen Component Tests
 * 
 * Testing Strategy: F.I.R.S.T Principles & AAA Pattern
 * Focus: Authentication flow, form validation, user interactions
 * 
 * F.I.R.S.T:
 * - Fast: Tests run quickly with mocked dependencies
 * - Independent: Each test can run in isolation
 * - Repeatable: Same results in any environment
 * - Self-validating: Clear pass/fail with meaningful assertions
 * - Timely: Tests written alongside production code
 * 
 * AAA Pattern:
 * - Arrange: Set up component, mocks, and initial state
 * - Act: Trigger user interactions or form submissions
 * - Assert: Verify expected UI behavior and API calls
 */

import '@testing-library/jest-native/extend-expect';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../screens/login';

// Mock dependencies
jest.mock('../../services/authService', () => ({
  authService: {
    emailLogin: jest.fn()
  }
}));

jest.mock('../../services/googleSignIn', () => ({
  configureGoogleSignIn: jest.fn(),
  signInWithGoogle: jest.fn()
}));

// Create mock functions that can be accessed in tests
const mockLogin = jest.fn();
const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en'
  })
}));

jest.mock('../../navigation/NavigationService', () => ({
  useNavigationService: () => ({
    navigate: mockNavigate,
    replace: mockReplace
  })
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'validation.emailRequired': 'Email is required',
        'validation.invalidEmail': 'Invalid email format',
        'validation.passwordRequired': 'Password is required',
        'validation.passwordTooShort': 'Password must be at least 6 characters',
        'login.loginFailed': 'Login failed',
        'login.invalidCredentials': 'Invalid email or password',
        'login.accountNotActive': 'Account is not active',
        'login.googleAccountOnly': 'This account can only login with Google',
        'auth.signIn': 'Sign In',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.forgotPassword': 'Forgot Password?',
        'auth.signUp': 'Sign Up',
        'auth.orSignInWith': 'Or sign in with'
      };
      return translations[key] || key;
    }
  })
}));

jest.mock('../../i18n', () => ({}));

// Mock utils to test integration
jest.mock('../../utils/authUtils', () => ({
  validateLoginForm: jest.fn(),
  prepareEmailLoginRequest: jest.fn(),
  mapAuthErrorToMessage: jest.fn(),
  createUserProfileFromEmail: jest.fn(),
  createUserProfileFromGoogle: jest.fn(),
  determineNavigationRoute: jest.fn()
}));

// Mock React Native components with simpler structure
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('../../components/CustomToast', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CustomToast({ visible, message, type }: any) {
    if (!visible) return null;
    return React.createElement(Text, { 
      testID: 'toast-message',
      'data-type': type 
    }, message);
  };
});

jest.mock('../../components/Login/GoogleButton', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return function GoogleButton({ onPress, disabled }: any) {
    return React.createElement(
      TouchableOpacity,
      { 
        testID: 'google-login-button',
        onPress,
        disabled
      },
      React.createElement(Text, null, 'Sign in with Google')
    );
  };
});

jest.mock('../../components/Login/Logo', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function Logo() {
    return React.createElement(View, { testID: 'logo-component' });
  };
});

describe('LoginScreen', () => {

  // ====================================
  // TEST SETUP AND HELPERS
  // ====================================
  
  const renderLoginScreen = async () => {
    const user = userEvent.setup();
    const renderResult = render(<LoginScreen />);
    return { user, ...renderResult };
  };

  // Mock implementations
  const mockAuthService = require('../../services/authService').authService;
  const mockGoogleSignIn = require('../../services/googleSignIn');
  const mockAuthUtils = require('../../utils/authUtils');

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockAuthUtils.validateLoginForm.mockReturnValue({ isValid: true });
    mockAuthUtils.prepareEmailLoginRequest.mockImplementation((email: string, password: string) => ({
      email: email.trim().toLowerCase(),
      password: password.trim()
    }));
    mockAuthUtils.mapAuthErrorToMessage.mockReturnValue('login.loginFailed');
    mockAuthUtils.createUserProfileFromEmail.mockImplementation((userInfo: any) => ({
      id: userInfo.email,
      email: userInfo.email,
      name: userInfo.full_name,
      picture: userInfo.avatar_url
    }));
    
    mockAuthService.emailLogin.mockResolvedValue({
      user_information: {
        email: 'test@example.com',
        full_name: 'Test User',
        avatar_url: 'https://avatar.url'
      }
    });
    
    mockGoogleSignIn.signInWithGoogle.mockResolvedValue({
      success: true,
      backendData: {
        is_user_active: true,
        user_infomation: {
          email: 'google@example.com',
          name: 'Google User'
        }
      }
    });
  });

  // ====================================
  // INITIAL RENDER TESTS
  // ====================================
  describe('Initial Rendering', () => {
    describe('WHEN component mounts', () => {
      it('should render all form elements', async () => {
        // Arrange & Act
        await renderLoginScreen();

        // Assert
        expect(screen.getByTestId('logo-component')).toBeOnTheScreen();
        expect(screen.getByPlaceholderText('placeholders.enterEmail')).toBeOnTheScreen();
        expect(screen.getByPlaceholderText('placeholders.enterPassword')).toBeOnTheScreen();
        expect(screen.getByText('login.signIn')).toBeOnTheScreen();
        expect(screen.getByTestId('google-login-button')).toBeOnTheScreen();
      });

      it('should render additional UI elements', async () => {
        // Arrange & Act
        await renderLoginScreen();

        // Assert
        expect(screen.getByText('login.forgotPassword')).toBeOnTheScreen();
        expect(screen.getByText('login.signUp')).toBeOnTheScreen();
        expect(screen.getByText('login.orContinueWith')).toBeOnTheScreen();
      });

      it('should configure Google Sign-In on mount', async () => {
        // Arrange & Act
        await renderLoginScreen();

        // Assert
        expect(mockGoogleSignIn.configureGoogleSignIn).toHaveBeenCalledTimes(1);
      });
    });

    describe('WHEN checking initial form state', () => {
      it('should have empty form fields initially', async () => {
        // Arrange & Act
        await renderLoginScreen();

        // Assert
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        
        expect(emailInput.props.value).toBe('');
        expect(passwordInput.props.value).toBe('');
      });

      it('should have password field hidden initially', async () => {
        // Arrange & Act
        await renderLoginScreen();

        // Assert
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        expect(passwordInput.props.secureTextEntry).toBe(true);
      });
    });
  });

  // ====================================
  // FORM INTERACTION TESTS
  // ====================================
  describe('Form Interactions', () => {
    describe('WHEN user types in form fields', () => {
      it('should update email field when user types', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');

        // Act
        await user.type(emailInput, 'test@example.com');

        // Assert
        expect(emailInput.props.value).toBe('test@example.com');
      });

      it('should update password field when user types', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');

        // Act
        await user.type(passwordInput, 'password123');

        // Assert
        expect(passwordInput.props.value).toBe('password123');
      });
    });

    describe('WHEN user toggles password visibility', () => {
      it('should toggle password visibility when eye icon is pressed', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const passwordToggle = screen.getByTestId('password-toggle');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');

        // Act
        await user.press(passwordToggle);

        // Assert
        expect(passwordInput.props.secureTextEntry).toBe(false);

        // Act again
        await user.press(passwordToggle);

        // Assert
        expect(passwordInput.props.secureTextEntry).toBe(true);
      });
    });
  });

  // ====================================
  // FORM VALIDATION TESTS
  // ====================================
  describe('Form Validation', () => {
    describe('WHEN user submits form with invalid data', () => {
      it('should call validation function with form data', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert
        expect(mockAuthUtils.validateLoginForm).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      it('should show validation error when validation fails', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const signInButton = screen.getByText('login.signIn');
        
        mockAuthUtils.validateLoginForm.mockReturnValue({
          isValid: false,
          error: 'validation.emailRequired'
        });

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(screen.getByTestId('toast-message')).toBeOnTheScreen();
          expect(screen.getByTestId('toast-message')).toHaveTextContent('validation.emailRequired');
        });
      });

      it('should not proceed with login when validation fails', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const signInButton = screen.getByText('login.signIn');
        
        mockAuthUtils.validateLoginForm.mockReturnValue({
          isValid: false,
          error: 'validation.invalidEmail'
        });

        // Act
        await user.press(signInButton);

        // Assert
        expect(mockAuthService.emailLogin).not.toHaveBeenCalled();
      });
    });
  });

  // ====================================
  // EMAIL LOGIN TESTS
  // ====================================
  describe('Email Login Flow', () => {
    describe('WHEN user submits valid credentials', () => {
      it('should prepare login request using utils', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(mockAuthUtils.prepareEmailLoginRequest).toHaveBeenCalledWith('test@example.com', 'password123');
        });
      });

      it('should call email login API with prepared data', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(mockAuthService.emailLogin).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123'
          });
        });
      });

      it('should create user profile from API response', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(mockAuthUtils.createUserProfileFromEmail).toHaveBeenCalledWith({
            email: 'test@example.com',
            full_name: 'Test User',
            avatar_url: 'https://avatar.url'
          });
        });
      });

      it('should call auth context login with user profile', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        const mockUserProfile = {
          id: 'test@example.com',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://avatar.url'
        };

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalledWith(mockUserProfile);
        });
      });

      it('should navigate to MainTab on successful login', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('MainTab');
        });
      });
    });

    describe('WHEN email login fails', () => {
      it('should map error to user-friendly message', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');

        const mockError = new Error('Invalid email or password');
        mockAuthService.emailLogin.mockRejectedValue(mockError);
        mockAuthUtils.mapAuthErrorToMessage.mockReturnValue('login.invalidCredentials');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(mockAuthUtils.mapAuthErrorToMessage).toHaveBeenCalledWith(mockError);
        });
      });

      it('should show error toast with mapped message', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');

        mockAuthService.emailLogin.mockRejectedValue(new Error('API Error'));
        mockAuthUtils.mapAuthErrorToMessage.mockReturnValue('login.invalidCredentials');

        // Act
        await user.press(signInButton);

        // Assert
        await waitFor(() => {
          expect(screen.getByTestId('toast-message')).toBeOnTheScreen();
          expect(screen.getByTestId('toast-message')).toHaveTextContent('login.invalidCredentials');
        });
      });
    });
  });

  // ====================================
  // GOOGLE LOGIN TESTS
  // ====================================
  describe('Google Login Flow', () => {
    describe('WHEN user presses Google login button', () => {
      it('should call Google Sign-In service', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const googleButton = screen.getByTestId('google-login-button');

        // Act
        await user.press(googleButton);

        // Assert
        await waitFor(() => {
          expect(mockGoogleSignIn.signInWithGoogle).toHaveBeenCalledTimes(1);
        });
      });

      it('should handle successful Google login for active user', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const googleButton = screen.getByTestId('google-login-button');

        mockGoogleSignIn.signInWithGoogle.mockResolvedValue({
          success: true,
          backendData: {
            is_user_active: true,
            user_infomation: {
              email: 'google@example.com',
              name: 'Google User'
            }
          }
        });

        // Act
        await user.press(googleButton);

        // Assert
        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('MainTab');
        });
      });

      it('should handle successful Google login for inactive user', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const googleButton = screen.getByTestId('google-login-button');

        mockGoogleSignIn.signInWithGoogle.mockResolvedValue({
          success: true,
          backendData: {
            is_user_active: false,
            user_infomation: {
              email: 'newgoogle@example.com',
              name: 'New Google User'
            }
          }
        });

        // Act
        await user.press(googleButton);

        // Assert
        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('Register', {
            googleUserData: expect.objectContaining({
              email: 'newgoogle@example.com',
              isGoogleLogin: true,
              userIsActive: false
            })
          });
        });
      });

      it('should handle Google login failure', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const googleButton = screen.getByTestId('google-login-button');

        mockGoogleSignIn.signInWithGoogle.mockResolvedValue({
          success: false,
          error: 'Google Sign-In cancelled'
        });

        // Act
        await user.press(googleButton);

        // Assert
        await waitFor(() => {
          expect(screen.getByTestId('toast-message')).toBeOnTheScreen();
          expect(screen.getByTestId('toast-message')).toHaveTextContent('Google Sign-In cancelled');
        });
      });
    });
  });

  // ====================================
  // NAVIGATION TESTS
  // ====================================
  describe('Navigation', () => {
    describe('WHEN user interacts with navigation elements', () => {
      it('should navigate to Register when Sign Up is pressed', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const signUpButton = screen.getByText('login.signUp');

        // Act
        await user.press(signUpButton);

        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('Register');
      });

      it('should navigate to ForgotPassword when link is pressed', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const forgotPasswordLink = screen.getByText('login.forgotPassword');

        // Act
        await user.press(forgotPasswordLink);

        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
      });
    });
  });

  // ====================================
  // LOADING STATE TESTS
  // ====================================
  describe('Loading States', () => {
    describe('WHEN authentication is in progress', () => {
      it('should show loading text during email login', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Mock a slow response to test loading state
        mockAuthService.emailLogin.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            user_information: {
              email: 'test@example.com',
              full_name: 'Test User',
              avatar_url: 'https://avatar.url'
            }
          }), 100))
        );

        // Act
        const signInButton = screen.getByText('login.signIn');
        await user.press(signInButton);

        // Assert - Check that loading text appears
        await waitFor(() => {
          expect(screen.getByText('common.loading')).toBeOnTheScreen();
        });
      });

      it('should prevent multiple Google login attempts', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const googleButton = screen.getByTestId('google-login-button');

        // Mock a slow Google sign-in response
        mockGoogleSignIn.signInWithGoogle.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            success: true,
            backendData: {
              is_user_active: true,
              user_infomation: {
                email: 'google@example.com',
                name: 'Google User'
              }
            }
          }), 100))
        );

        // Act - Press button twice quickly
        await user.press(googleButton);
        await user.press(googleButton);

        // Assert - Google sign-in should only be called once
        await waitFor(() => {
          expect(mockGoogleSignIn.signInWithGoogle).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  // ====================================
  // INTEGRATION TESTS
  // ====================================
  describe('Integration Tests', () => {
    describe('WHEN testing complete auth flow', () => {
      it('should complete full email login flow', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Act
        await user.press(signInButton);

        // Assert - Verify entire flow
        await waitFor(() => {
          expect(mockAuthUtils.validateLoginForm).toHaveBeenCalled();
          expect(mockAuthUtils.prepareEmailLoginRequest).toHaveBeenCalled();
          expect(mockAuthService.emailLogin).toHaveBeenCalled();
          expect(mockAuthUtils.createUserProfileFromEmail).toHaveBeenCalled();
          expect(mockLogin).toHaveBeenCalled();
          expect(mockReplace).toHaveBeenCalledWith('MainTab');
        });
      });

      it('should maintain consistency between form state and API calls', async () => {
        // Arrange
        const { user } = await renderLoginScreen();
        const emailInput = screen.getByPlaceholderText('placeholders.enterEmail');
        const passwordInput = screen.getByPlaceholderText('placeholders.enterPassword');
        const signInButton = screen.getByText('login.signIn');

        const testEmail = 'consistency@test.com';
        const testPassword = 'consistentPassword123';

        // Act - Complete form and submit
        await user.type(emailInput, testEmail);
        await user.type(passwordInput, testPassword);
        await user.press(signInButton);

        // Assert - Verify data consistency through the flow
        await waitFor(() => {
          expect(mockAuthUtils.validateLoginForm).toHaveBeenCalledWith(testEmail, testPassword);
          expect(mockAuthUtils.prepareEmailLoginRequest).toHaveBeenCalledWith(testEmail, testPassword);
        });
      });
    });
  });
}); 