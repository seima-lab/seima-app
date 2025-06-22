// Authentication utility functions

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
 * Validates login form data
 * @param email - Email string
 * @param password - Password string
 * @returns Validation result with isValid flag and error message
 */
export const validateLoginForm = (email: string, password: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!email.trim()) {
    return { isValid: false, error: 'validation.emailRequired' };
  }
  
  if (!validateEmail(email)) {
    return { isValid: false, error: 'validation.invalidEmail' };
  }
  
  if (!password.trim()) {
    return { isValid: false, error: 'validation.passwordRequired' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'validation.passwordTooShort' };
  }
  
  return { isValid: true };
};

/**
 * Prepares email login request data
 * @param email - Raw email input
 * @param password - Raw password input
 * @returns Formatted login request object
 */
export const prepareEmailLoginRequest = (email: string, password: string) => {
  return {
    email: email.trim().toLowerCase(),
    password: password.trim()
  };
};

/**
 * Maps API error to user-friendly error message key
 * @param error - Error object from API
 * @returns Translation key for error message
 */
export const mapAuthErrorToMessage = (error: any): string => {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('Invalid email or password') || errorMessage.includes('UNAUTHORIZED')) {
    return 'login.invalidCredentials';
  }
  
  if (errorMessage.includes('Account is not active')) {
    return 'login.accountNotActive';
  }
  
  if (errorMessage.includes('Google login')) {
    return 'login.googleAccountOnly';
  }
  
  return 'login.loginFailed';
};

/**
 * Creates user profile object from Google login response
 * @param userInfo - User information from Google response
 * @returns Formatted user profile
 */
export const createUserProfileFromGoogle = (userInfo: any) => {
  return {
    id: userInfo?.email || userInfo?.id || '',
    email: userInfo?.email || '',
    name: userInfo?.name || userInfo?.full_name || userInfo?.fullName || '',
    picture: userInfo?.picture || userInfo?.avatar_url || ''
  };
};

/**
 * Creates user profile object from email login response
 * @param userInformation - User information from email login response
 * @returns Formatted user profile
 */
export const createUserProfileFromEmail = (userInformation: any) => {
  return {
    id: userInformation?.email || '',
    email: userInformation?.email || '',
    name: userInformation?.full_name || '',
    picture: userInformation?.avatar_url || ''
  };
};

/**
 * Determines navigation route based on user status
 * @param isUserActive - Whether user account is active
 * @param isGoogleLogin - Whether this is a Google login
 * @returns Navigation route and params
 */
export const determineNavigationRoute = (
  isUserActive: boolean,
  isGoogleLogin: boolean = false,
  userInfo: any = null
) => {
  if (!isUserActive && isGoogleLogin) {
    return {
      route: 'Register',
      params: {
        googleUserData: {
          fullName: userInfo?.name || userInfo?.full_name || userInfo?.fullName || '',
          email: userInfo?.email || '',
          isGoogleLogin: true,
          userIsActive: isUserActive
        }
      }
    };
  }
  
  return {
    route: 'MainTab',
    params: {}
  };
}; 