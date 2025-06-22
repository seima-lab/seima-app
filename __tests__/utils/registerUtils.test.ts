/**
 * Register Utils Unit Tests
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
    convertGenderToBoolean,
    formatDateForAPI,
    formatDateForDisplay,
    isGoogleUser,
    prepareGoogleUserCreationRequest,
    prepareOTPNavigationParams,
    prepareRegisterRequest,
    RegisterFormData,
    validateEmail,
    validatePassword,
    validatePhoneNumber,
    validateRegisterForm
} from '../../utils/registerUtils';

describe('RegisterUtils', () => {

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

    validPhoneNumbers: [
      { phone: '123456789', description: '9 digits (minimum)' },
      { phone: '1234567890', description: '10 digits' },
      { phone: '12345678901', description: '11 digits' },
      { phone: '123456789012345', description: '15 digits (maximum)' }
    ],

    invalidPhoneNumbers: [
      { phone: '', description: 'empty string' },
      { phone: '12345678', description: '8 digits (too short)' },
      { phone: '1234567890123456', description: '16 digits (too long)' },
      { phone: 'abc123456789', description: 'contains letters' },
      { phone: '123-456-789', description: 'contains dashes' },
      { phone: '123 456 789', description: 'contains spaces' },
      { phone: '+84123456789', description: 'contains plus sign' }
    ],

    validPasswords: [
      { password: 'password123', description: 'lowercase letters + numbers' },
      { password: 'Pass1234', description: 'mixed case + numbers' },
      { password: 'MySecure1', description: 'camelCase + number' },
      { password: 'a1b2c3d4e5f6g7h8', description: 'long alternating pattern' }
    ],

    invalidPasswords: [
      { password: 'pass1', expectedError: 'validation.passwordTooShort', description: 'too short (5 chars)' },
      { password: '12345678', expectedError: 'validation.passwordInvalid', description: 'numbers only' },
      { password: 'password', expectedError: 'validation.passwordInvalid', description: 'letters only' }
    ],

    genderConversions: [
      { input: 'male' as const, expected: true, description: 'male to true' },
      { input: 'female' as const, expected: false, description: 'female to false' },
      { input: '' as const, expected: null, description: 'empty string to null' }
    ],

    dateFormattingTests: [
      { 
        input: new Date('2024-01-15'), 
        apiFormat: '2024-01-15', 
        displayFormat: '15/01/2024',
        description: 'mid-month date'
      },
      { 
        input: new Date('2023-12-31'), 
        apiFormat: '2023-12-31', 
        displayFormat: '31/12/2023',
        description: 'year-end date'
      }
    ],

    googleUserDetectionTests: [
      { 
        googleUserData: { isGoogleLogin: true, userIsActive: false },
        expected: true,
        description: 'Google user with inactive status'
      },
      { 
        googleUserData: undefined,
        expected: false,
        description: 'regular user without googleUserData'
      },
      { 
        googleUserData: { isGoogleLogin: true, userIsActive: true },
        expected: false,
        description: 'Google user with active status'
      }
    ]
  };

  const createValidFormData = (): RegisterFormData => ({
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '1234567890',
    password: 'password123',
    confirmPassword: 'password123',
    gender: 'male'
  });

  const createGoogleUserFormData = (): RegisterFormData => ({
    fullName: 'Google User',
    email: 'google@gmail.com',
    phoneNumber: '9876543210',
    password: '',
    confirmPassword: '',
    gender: 'female'
  });

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
  // PHONE NUMBER VALIDATION TESTS
  // ====================================
  describe('validatePhoneNumber', () => {
    describe('WHEN phone number is valid', () => {
      TestData.validPhoneNumbers.forEach(({ phone, description }) => {
        it(`should return true for ${description}`, () => {
          // Arrange
          const inputPhone = phone;

          // Act
          const result = validatePhoneNumber(inputPhone);

          // Assert
          expect(result).toBe(true);
        });
      });
    });

    describe('WHEN phone number is invalid', () => {
      TestData.invalidPhoneNumbers.forEach(({ phone, description }) => {
        it(`should return false for ${description}`, () => {
          // Arrange
          const inputPhone = phone;

          // Act
          const result = validatePhoneNumber(inputPhone);

          // Assert
          expect(result).toBe(false);
        });
      });
    });
  });

  // ====================================
  // PASSWORD VALIDATION TESTS
  // ====================================
  describe('validatePassword', () => {
    describe('WHEN password is strong', () => {
      TestData.validPasswords.forEach(({ password, description }) => {
        it(`should return valid for ${description}`, () => {
          // Arrange
          const inputPassword = password;

          // Act
          const result = validatePassword(inputPassword);

          // Assert
          expect(result).toEqual({
            isValid: true,
            error: ''
          });
        });
      });
    });

    describe('WHEN password is weak', () => {
      TestData.invalidPasswords.forEach(({ password, expectedError, description }) => {
        it(`should return error for ${description}`, () => {
          // Arrange
          const inputPassword = password;

          // Act
          const result = validatePassword(inputPassword);

          // Assert
          expect(result.isValid).toBe(false);
          expect(result.error).toBe(expectedError);
        });
      });
    });
  });

  // ====================================
  // GENDER CONVERSION TESTS
  // ====================================
  describe('convertGenderToBoolean', () => {
    describe('WHEN converting gender values', () => {
      TestData.genderConversions.forEach(({ input, expected, description }) => {
        it(`should convert ${description}`, () => {
          // Arrange
          const genderInput = input;

          // Act
          const result = convertGenderToBoolean(genderInput);

          // Assert
          expect(result).toBe(expected);
        });
      });
    });
  });

  // ====================================
  // DATE FORMATTING TESTS
  // ====================================
  describe('formatDateForAPI', () => {
    describe('WHEN formatting dates for API', () => {
      TestData.dateFormattingTests.forEach(({ input, apiFormat, description }) => {
        it(`should format ${description} to YYYY-MM-DD`, () => {
          // Arrange
          const dateInput = input;

          // Act
          const result = formatDateForAPI(dateInput);

          // Assert
          expect(result).toBe(apiFormat);
        });
      });
    });
  });

  describe('formatDateForDisplay', () => {
    describe('WHEN formatting dates for display', () => {
      TestData.dateFormattingTests.forEach(({ input, displayFormat, description }) => {
        it(`should format ${description} to dd/mm/yyyy`, () => {
          // Arrange
          const dateInput = input;

          // Act
          const result = formatDateForDisplay(dateInput);

          // Assert
          expect(result).toBe(displayFormat);
        });
      });
    });
  });

  // ====================================
  // GOOGLE USER DETECTION TESTS
  // ====================================
  describe('isGoogleUser', () => {
    describe('WHEN detecting Google users', () => {
      TestData.googleUserDetectionTests.forEach(({ googleUserData, expected, description }) => {
        it(`should identify ${description}`, () => {
          // Arrange
          const inputGoogleUserData = googleUserData;

          // Act
          const result = isGoogleUser(inputGoogleUserData);

          // Assert
          expect(result).toBe(expected);
        });
      });
    });
  });

  // ====================================
  // FORM VALIDATION TESTS
  // ====================================
  describe('validateRegisterForm', () => {
    describe('WHEN validating complete forms', () => {
      it('should return success for valid regular user form', () => {
        // Arrange
        const formData = createValidFormData();

        // Act
        const result = validateRegisterForm(formData);

        // Assert
        expect(result.isValid).toBe(true);
        expect(Object.values(result.errors).every(error => error === '')).toBe(true);
      });

      it('should return success for valid Google user form', () => {
        // Arrange
        const formData = createGoogleUserFormData();

        // Act
        const result = validateRegisterForm(formData, true); // isGoogleUser = true

        // Assert
        expect(result.isValid).toBe(true);
        expect(Object.values(result.errors).every(error => error === '')).toBe(true);
      });
    });

    describe('WHEN validating forms with missing required fields', () => {
      const requiredFieldTests = [
        { field: 'fullName', value: '', expectedError: 'validation.fullNameRequired' },
        { field: 'email', value: '', expectedError: 'validation.emailRequired' },
        { field: 'phoneNumber', value: '', expectedError: 'validation.phoneRequired' }
      ];

      requiredFieldTests.forEach(({ field, value, expectedError }) => {
        it(`should return error for missing ${field}`, () => {
          // Arrange
          const formData = createValidFormData();
          (formData as any)[field] = value;

          // Act
          const result = validateRegisterForm(formData);

          // Assert
          expect(result.isValid).toBe(false);
          expect((result.errors as any)[field]).toBe(expectedError);
        });
      });
    });

    describe('WHEN validating password fields for regular users', () => {
      it('should return error for missing password', () => {
        // Arrange
        const formData = createValidFormData();
        formData.password = '';

        // Act
        const result = validateRegisterForm(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.password).toBe('validation.passwordRequired');
      });

      it('should return error for mismatched password confirmation', () => {
        // Arrange
        const formData = createValidFormData();
        formData.confirmPassword = 'different';

        // Act
        const result = validateRegisterForm(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.confirmPassword).toBe('validation.passwordMismatch');
      });

      it('should return error for weak password', () => {
        // Arrange
        const formData = createValidFormData();
        formData.password = 'weak';
        formData.confirmPassword = 'weak';

        // Act
        const result = validateRegisterForm(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.password).toBe('validation.passwordTooShort');
      });
    });

    describe('WHEN validating invalid field formats', () => {
      it('should return error for invalid email format', () => {
        // Arrange
        const formData = createValidFormData();
        formData.email = 'invalid-email';

        // Act
        const result = validateRegisterForm(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBe('validation.invalidEmail');
      });

      it('should return error for invalid phone number', () => {
        // Arrange
        const formData = createValidFormData();
        formData.phoneNumber = '123';

        // Act
        const result = validateRegisterForm(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.phoneNumber).toBe('validation.invalidPhone');
      });
    });
  });

  // ====================================
  // REQUEST PREPARATION TESTS
  // ====================================
  describe('prepareRegisterRequest', () => {
    describe('WHEN preparing regular user registration request', () => {
      it('should format all fields correctly', () => {
        // Arrange
        const formData = createValidFormData();
        const birthDate = new Date('1990-05-15');
        const hasSelectedDate = true;

        // Act
        const result = prepareRegisterRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result).toEqual({
          full_name: 'John Doe',
          email: 'john@example.com',
          dob: '1990-05-15',
          phone_number: '1234567890',
          gender: true,
          password: 'password123',
          confirm_password: 'password123'
        });
      });

      it('should handle female gender conversion', () => {
        // Arrange
        const formData = createValidFormData();
        formData.gender = 'female';
        const birthDate = new Date('1990-05-15');
        const hasSelectedDate = true;

        // Act
        const result = prepareRegisterRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result.gender).toBe(false);
      });

      it('should trim whitespace from text fields', () => {
        // Arrange
        const formData = createValidFormData();
        formData.fullName = '  John Doe  ';
        formData.email = '  john@example.com  ';
        const birthDate = new Date('1990-05-15');
        const hasSelectedDate = true;

        // Act
        const result = prepareRegisterRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result.full_name).toBe('John Doe');
        expect(result.email).toBe('john@example.com');
      });

      it('should handle empty date when not selected', () => {
        // Arrange
        const formData = createValidFormData();
        const birthDate = new Date('1990-05-15');
        const hasSelectedDate = false;

        // Act
        const result = prepareRegisterRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result.dob).toBe('');
      });
    });
  });

  describe('prepareGoogleUserCreationRequest', () => {
    describe('WHEN preparing Google user creation request', () => {
      it('should format Google user data correctly', () => {
        // Arrange
        const formData = createGoogleUserFormData();
        const birthDate = new Date('1985-12-25');
        const hasSelectedDate = true;

        // Act
        const result = prepareGoogleUserCreationRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result).toEqual({
          email: 'google@gmail.com',
          full_name: 'Google User',
          birth_date: '1985-12-25',
          phone_number: '9876543210',
          avatar_url: '',
          gender: false
        });
      });

      it('should exclude password fields for Google users', () => {
        // Arrange
        const formData = createGoogleUserFormData();
        const birthDate = new Date('1985-12-25');
        const hasSelectedDate = true;

        // Act
        const result = prepareGoogleUserCreationRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result).not.toHaveProperty('password');
        expect(result).not.toHaveProperty('confirm_password');
      });

      it('should handle empty date when not selected', () => {
        // Arrange
        const formData = createGoogleUserFormData();
        const birthDate = new Date('1985-12-25');
        const hasSelectedDate = false;

        // Act
        const result = prepareGoogleUserCreationRequest(formData, birthDate, hasSelectedDate);

        // Assert
        expect(result.birth_date).toBe('');
      });
    });
  });

  // ====================================
  // NAVIGATION PARAMETER TESTS
  // ====================================
  describe('prepareOTPNavigationParams', () => {
    describe('WHEN preparing OTP navigation parameters', () => {
      it('should format parameters for regular user', () => {
        // Arrange
        const formData = createValidFormData();
        const birthDate = new Date('1990-05-15');
        const hasSelectedDate = true;
        const otpCode = '123456';

        // Act
        const result = prepareOTPNavigationParams(formData, birthDate, hasSelectedDate, otpCode);

        // Assert
        expect(result).toEqual({
          email: 'john@example.com',
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          password: 'password123',
          dateOfBirth: '1990-05-15',
          gender: true,
          otpCode: '123456',
          type: 'register'
        });
      });

      it('should format parameters for Google user', () => {
        // Arrange
        const formData = createGoogleUserFormData();
        const birthDate = new Date('1985-12-25');
        const hasSelectedDate = true;
        const otpCode = '654321';

        // Act
        const result = prepareOTPNavigationParams(formData, birthDate, hasSelectedDate, otpCode);

        // Assert
        expect(result).toEqual({
          email: 'google@gmail.com',
          fullName: 'Google User',
          phoneNumber: '9876543210',
          password: '',
          dateOfBirth: '1985-12-25',
          gender: false,
          otpCode: '654321',
          type: 'register'
        });
      });

      it('should handle empty date when not selected', () => {
        // Arrange
        const formData = createValidFormData();
        const birthDate = new Date('1990-05-15');
        const hasSelectedDate = false;
        const otpCode = '789012';

        // Act
        const result = prepareOTPNavigationParams(formData, birthDate, hasSelectedDate, otpCode);

        // Assert
        expect(result.dateOfBirth).toBe('');
      });
    });
  });
}); 