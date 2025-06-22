// Regular expressions for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/; // Vietnamese phone number format
const fullNameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/; // Allow Vietnamese characters, 2-50 chars

// Types
export interface ValidationError {
  fullName?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface ProfileFormData {
  fullName: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | '';
  dateOfBirth: Date;
  hasDateOfBirth: boolean;
}

export interface UserProfile {
  user_full_name?: string;
  user_email?: string;
  user_phone_number?: string;
  user_dob?: string;
  user_gender?: boolean;
  user_avatar_url?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  gender?: boolean;
  birth_date?: string;
  avatar_url?: string;
}

// Validation functions
export const validateFullName = (fullName: string): string | null => {
  const trimmed = fullName.trim();
  
  if (!trimmed) {
    return 'validation.fullNameRequired';
  }
  
  if (trimmed.length < 2) {
    return 'validation.fullNameTooShort';
  }
  
  if (trimmed.length > 50) {
    return 'validation.fullNameTooLong';
  }
  
  if (!fullNameRegex.test(trimmed)) {
    return 'validation.fullNameInvalid';
  }
  
  return null;
};

export const validatePhoneNumber = (phoneNumber: string): string | null => {
  const trimmed = phoneNumber.trim();
  
  // Phone number is optional, but if provided must be valid
  if (trimmed && !phoneRegex.test(trimmed)) {
    return 'validation.invalidPhone';
  }
  
  return null;
};

export const validateGender = (gender: string): string | null => {
  if (!gender) {
    return 'validation.selectGender';
  }
  
  return null;
};

export const validateDateOfBirth = (dateOfBirth: Date, hasDateOfBirth: boolean): string | null => {
  // Date of birth is optional, but if set must be valid
  if (!hasDateOfBirth) {
    return null;
  }
  
  if (!dateOfBirth || isNaN(dateOfBirth.getTime())) {
    return 'validation.invalidDate';
  }
  
  // Check if date is not in the future
  const today = new Date();
  if (dateOfBirth > today) {
    return 'validation.futureDateNotAllowed';
  }
  
  // Check if age is reasonable (not more than 120 years)
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  if (age > 120) {
    return 'validation.ageTooOld';
  }
  
  return null;
};

export const validateProfileForm = (formData: ProfileFormData): ValidationError => {
  const errors: ValidationError = {};
  
  const fullNameError = validateFullName(formData.fullName);
  if (fullNameError) {
    errors.fullName = fullNameError;
  }
  
  const phoneNumberError = validatePhoneNumber(formData.phoneNumber);
  if (phoneNumberError) {
    errors.phoneNumber = phoneNumberError;
  }
  
  const genderError = validateGender(formData.gender);
  if (genderError) {
    errors.gender = genderError;
  }
  
  const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth, formData.hasDateOfBirth);
  if (dateOfBirthError) {
    errors.dateOfBirth = dateOfBirthError;
  }
  
  return errors;
};

// Profile data transformation functions
export const parseUserProfileData = (userProfile: UserProfile) => {
  const profileData = {
    fullName: userProfile.user_full_name || '',
    email: userProfile.user_email || '',
    phoneNumber: userProfile.user_phone_number || '',
    dateOfBirth: new Date(),
    hasDateOfBirth: false,
    gender: '' as 'Male' | 'Female' | '',
    avatarUri: null as string | null
  };
  
  // Set date of birth if available
  if (userProfile.user_dob) {
    profileData.dateOfBirth = new Date(userProfile.user_dob);
    profileData.hasDateOfBirth = true;
  }
  
  // Set gender
  if (userProfile.user_gender === true) {
    profileData.gender = 'Male';
  } else if (userProfile.user_gender === false) {
    profileData.gender = 'Female';
  }
  
  // Set avatar if available
  if (userProfile.user_avatar_url) {
    profileData.avatarUri = userProfile.user_avatar_url;
  }
  
  return profileData;
};

export const prepareUpdateProfilePayload = (formData: ProfileFormData): UpdateProfilePayload => {
  const payload: UpdateProfilePayload = {};
  
  if (formData.fullName.trim()) {
    payload.full_name = formData.fullName.trim();
  }
  
  if (formData.phoneNumber.trim()) {
    payload.phone_number = formData.phoneNumber.trim();
  }
  
  if (formData.gender) {
    payload.gender = formData.gender === 'Male';
  }
  
  // Only include birth_date if it's been set
  if (formData.hasDateOfBirth) {
    payload.birth_date = formData.dateOfBirth.toISOString().split('T')[0];
  }
  
  return payload;
};

// Date formatting functions
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Avatar URL validation
export const isLocalAvatarUri = (avatarUri: string): boolean => {
  return Boolean(avatarUri && !avatarUri.startsWith('http'));
};

// Validation helpers
export const isValidationErrorsEmpty = (errors: ValidationError): boolean => {
  return Object.keys(errors).length === 0;
};

export const getFirstValidationError = (errors: ValidationError): string | null => {
  const errorValues = Object.values(errors);
  return errorValues.length > 0 ? errorValues[0] : null;
};

// Age calculation
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  return today.getFullYear() - dateOfBirth.getFullYear();
};

// Gender conversion utilities
export const convertGenderToBoolean = (gender: 'Male' | 'Female' | ''): boolean | null => {
  if (gender === 'Male') return true;
  if (gender === 'Female') return false;
  return null;
};

export const convertBooleanToGender = (gender: boolean | null | undefined): 'Male' | 'Female' | '' => {
  if (gender === true) return 'Male';
  if (gender === false) return 'Female';
  return '';
}; 