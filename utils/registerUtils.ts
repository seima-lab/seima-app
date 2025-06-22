// Registration utility functions

/**
 * Validates email format using regex
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (9-15 digits)
 * @param phone - Phone number string to validate
 * @returns boolean indicating if phone is valid
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{9,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates password strength and format
 * @param password - Password string to validate
 * @returns Validation result with isValid flag and error message
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  error: string;
} => {
  // Kiểm tra ít nhất 8 ký tự
  if (password.length < 8) {
    return { isValid: false, error: 'validation.passwordTooShort' };
  }
  
  // Kiểm tra có ít nhất 1 chữ cái và 1 số
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'validation.passwordInvalid' };
  }
  
  return { isValid: true, error: '' };
};

/**
 * Validates complete registration form
 * @param formData - Registration form data
 * @param isGoogleUser - Whether this is a Google user (no password required)
 * @returns Validation result with errors object
 */
export interface RegisterFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  gender: 'male' | 'female' | '';
  hasSelectedDate?: boolean;
}

export interface ValidationErrors {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  password: string;
  confirmPassword: string;
}

export const validateRegisterForm = (
  formData: RegisterFormData,
  isGoogleUser: boolean = false
): {
  isValid: boolean;
  errors: ValidationErrors;
} => {
  const errors: ValidationErrors = {
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
  };
  
  let isValid = true;
  
  // Full Name validation
  if (!formData.fullName.trim()) {
    errors.fullName = 'validation.fullNameRequired';
    isValid = false;
  }
  
  // Email validation
  if (!formData.email.trim()) {
    errors.email = 'validation.emailRequired';
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.email = 'validation.invalidEmail';
    isValid = false;
  }
  
  // Phone number validation
  if (!formData.phoneNumber.trim()) {
    errors.phoneNumber = 'validation.phoneRequired';
    isValid = false;
  } else if (!validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'validation.invalidPhone';
    isValid = false;
  }
  
  // Gender validation
  if (!formData.gender) {
    errors.gender = 'validation.selectGender';
    isValid = false;
  }
  
  // Password validation (skip for Google users)
  if (!isGoogleUser) {
    if (!formData.password.trim()) {
      errors.password = 'validation.passwordRequired';
      isValid = false;
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error;
        isValid = false;
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'validation.confirmPasswordRequired';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'validation.passwordMismatch';
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Formats date for API (YYYY-MM-DD format without timezone issues)
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats date for display (dd/mm/yyyy format)
 * @param date - Date object to format
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

/**
 * Converts gender string to boolean for API
 * @param gender - Gender string ('male' | 'female')
 * @returns Boolean value (true = male, false = female)
 */
export const convertGenderToBoolean = (gender: 'male' | 'female' | ''): boolean | null => {
  if (gender === 'male') return true;
  if (gender === 'female') return false;
  return null;
};

/**
 * Prepares registration request data for API
 * @param formData - Form data from UI
 * @param dateOfBirth - Date of birth
 * @param hasSelectedDate - Whether user has selected a date
 * @returns Formatted registration request
 */
export const prepareRegisterRequest = (
  formData: RegisterFormData,
  dateOfBirth: Date,
  hasSelectedDate: boolean
) => {
  return {
    full_name: formData.fullName.trim(),
    email: formData.email.trim().toLowerCase(),
    dob: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '',
    phone_number: formData.phoneNumber.trim(),
    gender: convertGenderToBoolean(formData.gender) as boolean,
    password: formData.password.trim(),
    confirm_password: formData.confirmPassword.trim(),
  };
};

/**
 * Prepares Google user creation request data for API
 * @param formData - Form data from UI
 * @param dateOfBirth - Date of birth
 * @param hasSelectedDate - Whether user has selected a date
 * @returns Formatted user creation request
 */
export const prepareGoogleUserCreationRequest = (
  formData: RegisterFormData,
  dateOfBirth: Date,
  hasSelectedDate: boolean
) => {
  return {
    email: formData.email.trim().toLowerCase(),
    full_name: formData.fullName.trim(),
    birth_date: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '',
    phone_number: formData.phoneNumber.trim(),
    avatar_url: '',
    gender: convertGenderToBoolean(formData.gender) as boolean,
  };
};

/**
 * Determines if user is a Google user based on route params
 * @param googleUserData - Google user data from navigation params
 * @returns Boolean indicating if this is a Google user
 */
export const isGoogleUser = (googleUserData?: {
  isGoogleLogin: boolean;
  userIsActive: boolean;
}): boolean => {
  return !!(googleUserData?.isGoogleLogin && !googleUserData?.userIsActive);
};

/**
 * Extracts navigation params for OTP screen
 * @param formData - Form data
 * @param dateOfBirth - Date of birth
 * @param hasSelectedDate - Whether date was selected
 * @param otpCode - OTP code from API response
 * @returns Navigation params for OTP screen
 */
export const prepareOTPNavigationParams = (
  formData: RegisterFormData,
  dateOfBirth: Date,
  hasSelectedDate: boolean,
  otpCode: string
) => {
  return {
    email: formData.email,
    fullName: formData.fullName.trim(),
    phoneNumber: formData.phoneNumber,
    password: formData.password.trim(),
    dateOfBirth: hasSelectedDate ? formatDateForAPI(dateOfBirth) : '',
    gender: convertGenderToBoolean(formData.gender),
    otpCode: otpCode,
    type: 'register'
  };
}; 