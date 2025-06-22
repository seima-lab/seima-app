import {
    calculateAge,
    convertBooleanToGender,
    convertGenderToBoolean,
    formatDateForDisplay,
    getFirstValidationError,
    isLocalAvatarUri,
    isValidationErrorsEmpty,
    parseUserProfileData,
    prepareUpdateProfilePayload,
    ProfileFormData,
    UserProfile,
    validateDateOfBirth,
    validateFullName,
    validateGender,
    validatePhoneNumber,
    validateProfileForm,
    ValidationError
} from '../../utils/updateProfileUtils';

describe('UpdateProfile Utils', () => {
  
  // ========================
  // VALIDATION FUNCTIONS
  // ========================
  
  describe('validateFullName', () => {
    
    describe('when full name is empty', () => {
      test('should return error for empty string', () => {
        // Arrange
        const fullName = '';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBe('validation.fullNameRequired');
      });
      
      test('should return error for whitespace only', () => {
        // Arrange
        const fullName = '   ';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBe('validation.fullNameRequired');
      });
    });
    
    describe('when full name is too short', () => {
      test('should return error for single character', () => {
        // Arrange
        const fullName = 'A';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBe('validation.fullNameTooShort');
      });
    });
    
    describe('when full name is too long', () => {
      test('should return error for name longer than 50 characters', () => {
        // Arrange
        const fullName = 'A'.repeat(51);
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBe('validation.fullNameTooLong');
      });
    });
    
    describe('when full name contains invalid characters', () => {
      test('should return error for names with numbers', () => {
        // Arrange
        const fullName = 'John123';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBe('validation.fullNameInvalid');
      });
      
      test('should return error for names with special characters', () => {
        // Arrange
        const fullName = 'John@Doe';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBe('validation.fullNameInvalid');
      });
    });
    
    describe('when full name is valid', () => {
      test('should return null for valid English name', () => {
        // Arrange
        const fullName = 'John Doe';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for valid Vietnamese name', () => {
        // Arrange
        const fullName = 'Nguyễn Văn Nam';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for name with exactly 2 characters', () => {
        // Arrange
        const fullName = 'An';
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for name with exactly 50 characters', () => {
        // Arrange
        const fullName = 'A'.repeat(50);
        
        // Act
        const result = validateFullName(fullName);
        
        // Assert
        expect(result).toBeNull();
      });
    });
  });
  
  describe('validatePhoneNumber', () => {
    
    describe('when phone number is empty', () => {
      test('should return null for empty string (optional field)', () => {
        // Arrange
        const phoneNumber = '';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for whitespace only', () => {
        // Arrange
        const phoneNumber = '   ';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBeNull();
      });
    });
    
    describe('when phone number is invalid', () => {
      test('should return error for invalid Vietnamese format', () => {
        // Arrange
        const phoneNumber = '0123456789';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBe('validation.invalidPhone');
      });
      
      test('should return error for too short number', () => {
        // Arrange
        const phoneNumber = '0912345';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBe('validation.invalidPhone');
      });
      
      test('should return error for too long number', () => {
        // Arrange
        const phoneNumber = '09123456789';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBe('validation.invalidPhone');
      });
      
      test('should return error for number with letters', () => {
        // Arrange
        const phoneNumber = '0912abc789';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBe('validation.invalidPhone');
      });
    });
    
    describe('when phone number is valid', () => {
      test('should return null for valid mobile number starting with 03', () => {
        // Arrange
        const phoneNumber = '0312345678';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for valid mobile number starting with 09', () => {
        // Arrange
        const phoneNumber = '0912345678';
        
        // Act
        const result = validatePhoneNumber(phoneNumber);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for all valid prefixes', () => {
        // Arrange & Act & Assert
        const validPrefixes = ['03', '05', '07', '08', '09'];
        
        validPrefixes.forEach(prefix => {
          const phoneNumber = `${prefix}12345678`;
          const result = validatePhoneNumber(phoneNumber);
          expect(result).toBeNull();
        });
      });
    });
  });
  
  describe('validateGender', () => {
    
    test('should return error when gender is empty', () => {
      // Arrange
      const gender = '';
      
      // Act
      const result = validateGender(gender);
      
      // Assert
      expect(result).toBe('validation.selectGender');
    });
    
    test('should return null when gender is Male', () => {
      // Arrange
      const gender = 'Male';
      
      // Act
      const result = validateGender(gender);
      
      // Assert
      expect(result).toBeNull();
    });
    
    test('should return null when gender is Female', () => {
      // Arrange
      const gender = 'Female';
      
      // Act
      const result = validateGender(gender);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('validateDateOfBirth', () => {
    
    describe('when date of birth is not set', () => {
      test('should return null when hasDateOfBirth is false', () => {
        // Arrange
        const dateOfBirth = new Date();
        const hasDateOfBirth = false;
        
        // Act
        const result = validateDateOfBirth(dateOfBirth, hasDateOfBirth);
        
        // Assert
        expect(result).toBeNull();
      });
    });
    
    describe('when date of birth is invalid', () => {
      test('should return error for invalid date', () => {
        // Arrange
        const dateOfBirth = new Date('invalid');
        const hasDateOfBirth = true;
        
        // Act
        const result = validateDateOfBirth(dateOfBirth, hasDateOfBirth);
        
        // Assert
        expect(result).toBe('validation.invalidDate');
      });
      
      test('should return error for future date', () => {
        // Arrange
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const hasDateOfBirth = true;
        
        // Act
        const result = validateDateOfBirth(tomorrow, hasDateOfBirth);
        
        // Assert
        expect(result).toBe('validation.futureDateNotAllowed');
      });
      
      test('should return error for age over 120 years', () => {
        // Arrange
        const veryOldDate = new Date();
        veryOldDate.setFullYear(veryOldDate.getFullYear() - 121);
        const hasDateOfBirth = true;
        
        // Act
        const result = validateDateOfBirth(veryOldDate, hasDateOfBirth);
        
        // Assert
        expect(result).toBe('validation.ageTooOld');
      });
    });
    
    describe('when date of birth is valid', () => {
      test('should return null for valid birth date', () => {
        // Arrange
        const birthDate = new Date('1990-01-01');
        const hasDateOfBirth = true;
        
        // Act
        const result = validateDateOfBirth(birthDate, hasDateOfBirth);
        
        // Assert
        expect(result).toBeNull();
      });
      
      test('should return null for today date', () => {
        // Arrange
        const today = new Date();
        const hasDateOfBirth = true;
        
        // Act
        const result = validateDateOfBirth(today, hasDateOfBirth);
        
        // Assert
        expect(result).toBeNull();
      });
    });
  });
  
  describe('validateProfileForm', () => {
    
    const createValidFormData = (): ProfileFormData => ({
      fullName: 'John Doe',
      phoneNumber: '0912345678',
      gender: 'Male',
      dateOfBirth: new Date('1990-01-01'),
      hasDateOfBirth: true
    });
    
    test('should return empty errors for valid form data', () => {
      // Arrange
      const formData = createValidFormData();
      
      // Act
      const result = validateProfileForm(formData);
      
      // Assert
      expect(result).toEqual({});
    });
    
    test('should return multiple errors for invalid form data', () => {
      // Arrange
      const formData: ProfileFormData = {
        fullName: '',
        phoneNumber: 'invalid',
        gender: '',
        dateOfBirth: new Date('invalid'),
        hasDateOfBirth: true
      };
      
      // Act
      const result = validateProfileForm(formData);
      
      // Assert
      expect(result).toEqual({
        fullName: 'validation.fullNameRequired',
        phoneNumber: 'validation.invalidPhone',
        gender: 'validation.selectGender',
        dateOfBirth: 'validation.invalidDate'
      });
    });
    
    test('should validate optional fields correctly', () => {
      // Arrange
      const formData: ProfileFormData = {
        fullName: 'John Doe',
        phoneNumber: '', // empty but valid (optional)
        gender: 'Male',
        dateOfBirth: new Date('1990-01-01'),
        hasDateOfBirth: false // not set, should be valid
      };
      
      // Act
      const result = validateProfileForm(formData);
      
      // Assert
      expect(result).toEqual({});
    });
  });
  
  // ========================
  // DATA TRANSFORMATION FUNCTIONS
  // ========================
  
  describe('parseUserProfileData', () => {
    
    test('should parse complete user profile data', () => {
      // Arrange
      const userProfile: UserProfile = {
        user_full_name: 'John Doe',
        user_email: 'john@example.com',
        user_phone_number: '0912345678',
        user_dob: '1990-01-01',
        user_gender: true,
        user_avatar_url: 'https://example.com/avatar.jpg'
      };
      
      // Act
      const result = parseUserProfileData(userProfile);
      
      // Assert
      expect(result).toEqual({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '0912345678',
        dateOfBirth: new Date('1990-01-01'),
        hasDateOfBirth: true,
        gender: 'Male',
        avatarUri: 'https://example.com/avatar.jpg'
      });
    });
    
    test('should parse user profile with female gender', () => {
      // Arrange
      const userProfile: UserProfile = {
        user_full_name: 'Jane Doe',
        user_gender: false
      };
      
      // Act
      const result = parseUserProfileData(userProfile);
      
      // Assert
      expect(result.gender).toBe('Female');
    });
    
    test('should handle empty user profile', () => {
      // Arrange
      const userProfile: UserProfile = {};
      
      // Act
      const result = parseUserProfileData(userProfile);
      
      // Assert
      expect(result).toEqual({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: expect.any(Date),
        hasDateOfBirth: false,
        gender: '',
        avatarUri: null
      });
    });
    
    test('should handle missing optional fields', () => {
      // Arrange
      const userProfile: UserProfile = {
        user_full_name: 'John Doe',
        user_email: 'john@example.com'
      };
      
      // Act
      const result = parseUserProfileData(userProfile);
      
      // Assert
      expect(result).toEqual({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '',
        dateOfBirth: expect.any(Date),
        hasDateOfBirth: false,
        gender: '',
        avatarUri: null
      });
    });
  });
  
  describe('prepareUpdateProfilePayload', () => {
    
    test('should prepare complete payload', () => {
      // Arrange
      const formData: ProfileFormData = {
        fullName: 'John Doe',
        phoneNumber: '0912345678',
        gender: 'Male',
        dateOfBirth: new Date('1990-01-01'),
        hasDateOfBirth: true
      };
      
      // Act
      const result = prepareUpdateProfilePayload(formData);
      
      // Assert
      expect(result).toEqual({
        full_name: 'John Doe',
        phone_number: '0912345678',
        gender: true,
        birth_date: '1990-01-01'
      });
    });
    
    test('should prepare payload with female gender', () => {
      // Arrange
      const formData: ProfileFormData = {
        fullName: 'Jane Doe',
        phoneNumber: '',
        gender: 'Female',
        dateOfBirth: new Date('1990-01-01'),
        hasDateOfBirth: false
      };
      
      // Act
      const result = prepareUpdateProfilePayload(formData);
      
      // Assert
      expect(result).toEqual({
        full_name: 'Jane Doe',
        gender: false
      });
    });
    
    test('should handle optional fields correctly', () => {
      // Arrange
      const formData: ProfileFormData = {
        fullName: '  John Doe  ', // with whitespace
        phoneNumber: '  ', // empty with whitespace
        gender: 'Male',
        dateOfBirth: new Date('1990-01-01'),
        hasDateOfBirth: false // not set
      };
      
      // Act
      const result = prepareUpdateProfilePayload(formData);
      
      // Assert
      expect(result).toEqual({
        full_name: 'John Doe', // trimmed
        gender: true
        // no phone_number or birth_date
      });
    });
    
    test('should exclude empty fields', () => {
      // Arrange
      const formData: ProfileFormData = {
        fullName: '',
        phoneNumber: '',
        gender: '',
        dateOfBirth: new Date('1990-01-01'),
        hasDateOfBirth: false
      };
      
      // Act
      const result = prepareUpdateProfilePayload(formData);
      
      // Assert
      expect(result).toEqual({});
    });
  });
  
  // ========================
  // UTILITY FUNCTIONS
  // ========================
  
  describe('formatDateForDisplay', () => {
    
    test('should format date correctly', () => {
      // Arrange
      const date = new Date('1990-01-15');
      
      // Act
      const result = formatDateForDisplay(date);
      
      // Assert
      expect(result).toBe('01/15/1990');
    });
    
    test('should format single digit months and days with leading zeros', () => {
      // Arrange
      const date = new Date('2000-03-05');
      
      // Act
      const result = formatDateForDisplay(date);
      
      // Assert
      expect(result).toBe('03/05/2000');
    });
  });
  
  describe('isLocalAvatarUri', () => {
    
    test('should return true for local file URI', () => {
      // Arrange
      const avatarUri = 'file:///path/to/local/image.jpg';
      
      // Act
      const result = isLocalAvatarUri(avatarUri);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return false for HTTP URL', () => {
      // Arrange
      const avatarUri = 'https://example.com/avatar.jpg';
      
      // Act
      const result = isLocalAvatarUri(avatarUri);
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should return false for HTTPS URL', () => {
      // Arrange
      const avatarUri = 'http://example.com/avatar.jpg';
      
      // Act
      const result = isLocalAvatarUri(avatarUri);
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should return false for empty string', () => {
      // Arrange
      const avatarUri = '';
      
      // Act
      const result = isLocalAvatarUri(avatarUri);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('isValidationErrorsEmpty', () => {
    
    test('should return true for empty errors object', () => {
      // Arrange
      const errors: ValidationError = {};
      
      // Act
      const result = isValidationErrorsEmpty(errors);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return false for errors object with errors', () => {
      // Arrange
      const errors: ValidationError = {
        fullName: 'validation.fullNameRequired'
      };
      
      // Act
      const result = isValidationErrorsEmpty(errors);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getFirstValidationError', () => {
    
    test('should return first error message', () => {
      // Arrange
      const errors: ValidationError = {
        fullName: 'First error',
        phoneNumber: 'Second error'
      };
      
      // Act
      const result = getFirstValidationError(errors);
      
      // Assert
      expect(result).toBe('First error');
    });
    
    test('should return null for empty errors', () => {
      // Arrange
      const errors: ValidationError = {};
      
      // Act
      const result = getFirstValidationError(errors);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('calculateAge', () => {
    
    test('should calculate correct age', () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - 30;
      const dateOfBirth = new Date(`${birthYear}-01-01`);
      
      // Act
      const result = calculateAge(dateOfBirth);
      
      // Assert
      expect(result).toBe(30);
    });
    
    test('should calculate age for this year birth', () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const dateOfBirth = new Date(`${currentYear}-01-01`);
      
      // Act
      const result = calculateAge(dateOfBirth);
      
      // Assert
      expect(result).toBe(0);
    });
  });
  
  describe('convertGenderToBoolean', () => {
    
    test('should convert Male to true', () => {
      // Arrange
      const gender = 'Male';
      
      // Act
      const result = convertGenderToBoolean(gender);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should convert Female to false', () => {
      // Arrange
      const gender = 'Female';
      
      // Act
      const result = convertGenderToBoolean(gender);
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should convert empty string to null', () => {
      // Arrange
      const gender = '';
      
      // Act
      const result = convertGenderToBoolean(gender);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('convertBooleanToGender', () => {
    
    test('should convert true to Male', () => {
      // Arrange
      const gender = true;
      
      // Act
      const result = convertBooleanToGender(gender);
      
      // Assert
      expect(result).toBe('Male');
    });
    
    test('should convert false to Female', () => {
      // Arrange
      const gender = false;
      
      // Act
      const result = convertBooleanToGender(gender);
      
      // Assert
      expect(result).toBe('Female');
    });
    
    test('should convert null to empty string', () => {
      // Arrange
      const gender = null;
      
      // Act
      const result = convertBooleanToGender(gender);
      
      // Assert
      expect(result).toBe('');
    });
    
    test('should convert undefined to empty string', () => {
      // Arrange
      const gender = undefined;
      
      // Act
      const result = convertBooleanToGender(gender);
      
      // Assert
      expect(result).toBe('');
    });
  });
}); 