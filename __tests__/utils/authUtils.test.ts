/**
 * Auth Utils Unit Tests
 * 
 * Testing Strategy: F.I.R.S.T Principles & AAA Pattern
 * 
 * F.I.R.S.T:
 * - Fast: Tests run quickly without external dependencies
 * - Independent: Each test can run in isolation
 * - Repeatable: Same results in any environment
 * - Self-validating: Clear pass/fail with meaningful assertions
 * - Timely: Tests written alongside production code
 * 
 * AAA Pattern:
 * - Arrange: Set up test data and conditions
 * - Act: Execute the function being tested
 * - Assert: Verify expected outcome
 */

import {
    createUserProfileFromEmail,
    createUserProfileFromGoogle,
    determineNavigationRoute,
    mapAuthErrorToMessage,
    prepareEmailLoginRequest,
    validateEmail,
    validateLoginForm
} from '../../utils/authUtils';

describe('AuthUtils', () => {

  // ====================================
  // TEST DATA FACTORIES
  // ====================================
  const TestData = {
    validEmails: [
      { email: 'test@example.com', description: 'standard format' },
      { email: 'user.name@domain.com', description: 'dot in local part' },
      { email: 'user+tag@example.org', description: 'plus sign in local part' },
      { email: 'test123@test-domain.co.uk', description: 'subdomain with hyphen' }
    ],

    invalidEmails: [
      { email: '', description: 'empty string' },
      { email: 'invalid', description: 'no @ symbol' },
      { email: 'invalid@', description: 'missing domain' },
      { email: '@invalid.com', description: 'missing local part' },
      { email: 'invalid@.com', description: 'domain starts with dot' },
      { email: 'test @example.com', description: 'space in local part' }
    ],

    validLoginForms: [
      { email: 'test@example.com', password: 'password123', description: 'standard valid form' },
      { email: 'user@domain.org', password: '123456', description: 'minimum password length' }
    ],

    invalidLoginForms: [
      { email: '', password: 'password123', expectedError: 'validation.emailRequired', description: 'empty email' },
      { email: '   ', password: 'password123', expectedError: 'validation.emailRequired', description: 'whitespace email' },
      { email: 'invalid-email', password: 'password123', expectedError: 'validation.invalidEmail', description: 'invalid email format' },
      { email: 'test@example.com', password: '', expectedError: 'validation.passwordRequired', description: 'empty password' },
      { email: 'test@example.com', password: '   ', expectedError: 'validation.passwordRequired', description: 'whitespace password' },
      { email: 'test@example.com', password: '12345', expectedError: 'validation.passwordTooShort', description: 'short password' }
    ],

    authErrors: [
      { message: 'Invalid email or password', expectedKey: 'login.invalidCredentials', description: 'invalid credentials' },
      { message: 'UNAUTHORIZED: Access denied', expectedKey: 'login.invalidCredentials', description: 'unauthorized access' },
      { message: 'Account is not active', expectedKey: 'login.accountNotActive', description: 'inactive account' },
      { message: 'Google login required for this account', expectedKey: 'login.googleAccountOnly', description: 'Google login required' }
    ],

    unknownErrors: [
      { error: { message: 'Unknown server error' }, description: 'unknown error message' },
      { error: {}, description: 'error without message' },
      { error: null, description: 'null error' },
      { error: undefined, description: 'undefined error' }
    ],

    googleUserData: {
      complete: {
        id: 'google123',
        email: 'user@gmail.com',
        name: 'John Doe',
        picture: 'https://photo.url'
      },
      alternative: {
        email: 'user@gmail.com',
        full_name: 'Jane Doe',
        avatar_url: 'https://avatar.url'
      },
      minimal: {
        id: 'google123',
        email: 'user@gmail.com'
      },
      empty: {}
    },

    emailUserData: {
      complete: {
        email: 'user@example.com',
        full_name: 'John Smith',
        avatar_url: 'https://avatar.example.com'
      },
      empty: {}
    },

    navigationScenarios: [
      {
        isUserActive: false,
        isGoogleLogin: true,
        userInfo: { name: 'John Doe', email: 'john@gmail.com' },
        expectedRoute: 'Register',
        description: 'inactive Google user to registration'
      },
      {
        isUserActive: true,
        isGoogleLogin: true,
        userInfo: {},
        expectedRoute: 'MainTab',
        description: 'active Google user to main app'
      },
      {
        isUserActive: false,
        isGoogleLogin: false,
        userInfo: {},
        expectedRoute: 'MainTab',
        description: 'email user to main app'
      }
    ]
  };

  // ====================================
  // EMAIL VALIDATION TESTS
  // ====================================
  describe('validateEmail', () => {
    describe('WHEN email format is valid', () => {
      TestData.validEmails.forEach(({ email, description }) => {
        it(`should return true for ${description}`, () => {
          // Arrange
          const inputEmail = email;

          // Act
          const result = validateEmail(inputEmail);

          // Assert
          expect(result).toBe(true);
        });
      });
    });

    describe('WHEN email format is invalid', () => {
      TestData.invalidEmails.forEach(({ email, description }) => {
        it(`should return false for ${description}`, () => {
          // Arrange
          const inputEmail = email;

          // Act
          const result = validateEmail(inputEmail);

          // Assert
          expect(result).toBe(false);
        });
      });
    });
  });

  // ====================================
  // LOGIN FORM VALIDATION TESTS
  // ====================================
  describe('validateLoginForm', () => {
    describe('WHEN form data is valid', () => {
      TestData.validLoginForms.forEach(({ email, password, description }) => {
        it(`should return success for ${description}`, () => {
          // Arrange
          const inputEmail = email;
          const inputPassword = password;

          // Act
          const result = validateLoginForm(inputEmail, inputPassword);

          // Assert
          expect(result).toEqual({
            isValid: true,
            error: undefined
          });
        });
      });
    });

    describe('WHEN form data is invalid', () => {
      TestData.invalidLoginForms.forEach(({ email, password, expectedError, description }) => {
        it(`should return error for ${description}`, () => {
          // Arrange
          const inputEmail = email;
          const inputPassword = password;

          // Act
          const result = validateLoginForm(inputEmail, inputPassword);

          // Assert
          expect(result.isValid).toBe(false);
          expect(result.error).toBe(expectedError);
        });
      });
    });
  });

  // ====================================
  // LOGIN REQUEST PREPARATION TESTS
  // ====================================
  describe('prepareEmailLoginRequest', () => {
    describe('WHEN preparing login request data', () => {
      it('should trim and normalize email while preserving password case', () => {
        // Arrange
        const rawEmail = '  TEST@EXAMPLE.COM  ';
        const rawPassword = '  PassWord123  ';

        // Act
        const result = prepareEmailLoginRequest(rawEmail, rawPassword);

        // Assert
        expect(result).toEqual({
          email: 'test@example.com',
          password: 'PassWord123'
        });
      });

      it('should handle clean input without modification', () => {
        // Arrange
        const cleanEmail = 'user@domain.com';
        const cleanPassword = 'mypassword';

        // Act
        const result = prepareEmailLoginRequest(cleanEmail, cleanPassword);

        // Assert
        expect(result).toEqual({
          email: 'user@domain.com',
          password: 'mypassword'
        });
      });
    });
  });

  // ====================================
  // ERROR MESSAGE MAPPING TESTS
  // ====================================
  describe('mapAuthErrorToMessage', () => {
    describe('WHEN mapping known error types', () => {
      TestData.authErrors.forEach(({ message, expectedKey, description }) => {
        it(`should map ${description} correctly`, () => {
          // Arrange
          const error = { message };

          // Act
          const result = mapAuthErrorToMessage(error);

          // Assert
          expect(result).toBe(expectedKey);
        });
      });
    });

    describe('WHEN handling unknown or malformed errors', () => {
      TestData.unknownErrors.forEach(({ error, description }) => {
        it(`should return default error for ${description}`, () => {
          // Arrange
          const inputError = error;

          // Act
          const result = mapAuthErrorToMessage(inputError);

          // Assert
          expect(result).toBe('login.loginFailed');
        });
      });
    });
  });

  // ====================================
  // USER PROFILE CREATION TESTS
  // ====================================
  describe('createUserProfileFromGoogle', () => {
    describe('WHEN creating profile from Google data', () => {
      it('should map complete Google user data correctly', () => {
        // Arrange
        const googleUserData = TestData.googleUserData.complete;

        // Act
        const result = createUserProfileFromGoogle(googleUserData);

        // Assert
        expect(result).toEqual({
          id: 'user@gmail.com', // Uses email as ID
          email: 'user@gmail.com',
          name: 'John Doe',
          picture: 'https://photo.url'
        });
      });

      it('should handle alternative field names from API', () => {
        // Arrange
        const googleUserData = TestData.googleUserData.alternative;

        // Act
        const result = createUserProfileFromGoogle(googleUserData);

        // Assert
        expect(result).toEqual({
          id: 'user@gmail.com',
          email: 'user@gmail.com',
          name: 'Jane Doe',
          picture: 'https://avatar.url'
        });
      });

      it('should prefer email over id for user identification', () => {
        // Arrange
        const googleUserData = TestData.googleUserData.minimal;

        // Act
        const result = createUserProfileFromGoogle(googleUserData);

        // Assert
        expect(result.id).toBe('user@gmail.com');
      });

      it('should handle empty user data gracefully', () => {
        // Arrange
        const googleUserData = TestData.googleUserData.empty;

        // Act
        const result = createUserProfileFromGoogle(googleUserData);

        // Assert
        expect(result).toEqual({
          id: '',
          email: '',
          name: '',
          picture: ''
        });
      });
    });
  });

  describe('createUserProfileFromEmail', () => {
    describe('WHEN creating profile from email login data', () => {
      it('should map complete email user data correctly', () => {
        // Arrange
        const emailUserData = TestData.emailUserData.complete;

        // Act
        const result = createUserProfileFromEmail(emailUserData);

        // Assert
        expect(result).toEqual({
          id: 'user@example.com',
          email: 'user@example.com',
          name: 'John Smith',
          picture: 'https://avatar.example.com'
        });
      });

      it('should handle empty email user data gracefully', () => {
        // Arrange
        const emailUserData = TestData.emailUserData.empty;

        // Act
        const result = createUserProfileFromEmail(emailUserData);

        // Assert
        expect(result).toEqual({
          id: '',
          email: '',
          name: '',
          picture: ''
        });
      });
    });
  });

  // ====================================
  // NAVIGATION ROUTE DETERMINATION TESTS
  // ====================================
  describe('determineNavigationRoute', () => {
    describe('WHEN determining post-login navigation', () => {
      TestData.navigationScenarios.forEach(({ isUserActive, isGoogleLogin, userInfo, expectedRoute, description }) => {
        it(`should route ${description}`, () => {
          // Arrange
          const inputIsUserActive = isUserActive;
          const inputIsGoogleLogin = isGoogleLogin;
          const inputUserInfo = userInfo;

          // Act
          const result = determineNavigationRoute(inputIsUserActive, inputIsGoogleLogin, inputUserInfo);

          // Assert
          expect(result.route).toBe(expectedRoute);
        });
      });

      it('should include Google user data for inactive Google users', () => {
        // Arrange
        const isUserActive = false;
        const isGoogleLogin = true;
        const userInfo = { name: 'John Doe', email: 'john@gmail.com' };

        // Act
        const result = determineNavigationRoute(isUserActive, isGoogleLogin, userInfo);

        // Assert
        expect(result.params).toEqual({
          googleUserData: {
            fullName: 'John Doe',
            email: 'john@gmail.com',
            isGoogleLogin: true,
            userIsActive: false
          }
        });
      });

      it('should handle alternative user info field names', () => {
        // Arrange
        const isUserActive = false;
        const isGoogleLogin = true;
        const userInfo = { full_name: 'Jane Smith', email: 'jane@gmail.com' };

        // Act
        const result = determineNavigationRoute(isUserActive, isGoogleLogin, userInfo);

        // Assert
        expect((result.params as any).googleUserData.fullName).toBe('Jane Smith');
      });

      it('should handle missing user info gracefully', () => {
        // Arrange
        const isUserActive = false;
        const isGoogleLogin = true;
        const userInfo = null;

        // Act
        const result = determineNavigationRoute(isUserActive, isGoogleLogin, userInfo);

        // Assert
        expect((result.params as any).googleUserData).toEqual({
          fullName: '',
          email: '',
          isGoogleLogin: true,
          userIsActive: false
        });
      });
    });
  });
}); 