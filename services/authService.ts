import * as SecureStore from 'expo-secure-store';

// API endpoints - read from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const ENDPOINTS = {
  GOOGLE_LOGIN: '/api/v1/auth/google',
  EMAIL_LOGIN: '/api/v1/auth/login', 
  REGISTER: '/api/v1/auth/register',
  VERIFY_OTP: '/api/v1/auth/verify-otp',
  RESEND_OTP: '/api/v1/auth/resend-otp',
  REFRESH_TOKEN: '/api/v1/auth/refresh',
  LOGOUT: '/api/v1/auth/logout',
  UPDATE_PROFILE: '/api/v1/users/update',
  GET_PROFILE: '/api/v1/users/me',
  UPLOAD_AVATAR: '/api/v1/users/upload-avatar',
};

// Token storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  LOGIN_TIME: 'login_time',
};

// Token configuration based on backend settings
const TOKEN_CONFIG = {
  ACCESS_TOKEN_DURATION: 3600 * 1000, // 1 hour in milliseconds
  REFRESH_TOKEN_DURATION: 604800 * 1000, // 7 days in milliseconds
  WARNING_THRESHOLD: 59 * 60 * 1000, // Warn 1 minute before expiry
  REFRESH_THRESHOLD: 15 * 60 * 1000, // Auto-refresh 15 minutes before expiry
};

// Helper function to decode JWT and get expiry time
const getTokenExpiry = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    console.error('🔴 Error decoding token:', error);
    return null;
  }
};

// Check if token is about to expire (using configurable threshold)
const isTokenNearExpiry = (expiryTime: number): boolean => {
  const now = Date.now();
  return (expiryTime - now) <= TOKEN_CONFIG.WARNING_THRESHOLD;
};

// Check if token should be auto-refreshed (15 minutes before expiry)
const shouldAutoRefresh = (expiryTime: number): boolean => {
  const now = Date.now();
  return (expiryTime - now) <= TOKEN_CONFIG.REFRESH_THRESHOLD;
};

// Check if token is expired
const isTokenExpired = (expiryTime: number): boolean => {
  return Date.now() >= expiryTime;
};

// Types for authentication
export interface GoogleLoginRequest {
  id_token: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user_information: UserInGoogleReponseDto;
  message: string;
}

export interface UserInGoogleReponseDto {
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  dob: string; // Backend expects LocalDate format (YYYY-MM-DD)
  phone_number: string;
  gender: boolean; // Backend expects boolean: true = male, false = female
  password: string;
  confirm_password: string; // Backend validation requires this field
}

export interface RegisterResponse {
  full_name: string;
  email: string;
  dob: string;
  phone_number: string;
  gender: boolean;
  password: string;
  otp_code: string;
}

export interface VerifyOtpRequest {
  email: string;
  full_name?: string;
  dob?: string; // LocalDate format (YYYY-MM-DD)
  phone_number?: string;
  gender?: boolean; // true = male, false = female
  password?: string;
  otp?: string;
  otp_code?: string; // For backward compatibility
}

export interface ResendOtpRequest {
  email: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  picture?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  birth_date?: string; // YYYY-MM-DD format
  phone_number?: string;
  avatar_url?: string;
  gender?: boolean; // true = male, false = female
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  is_user_active: boolean; // ✅ Snake case from backend
  user_infomation: UserProfile; // ✅ đúng tên JSON trả về
}

// Authentication Service
export class AuthService {
  private static instance: AuthService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_BASE_URL;
    console.log('🟢 AuthService initialized with base URL:', this.baseUrl);
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Build full URL
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  // Google Login
  async googleLogin(request: GoogleLoginRequest): Promise<AuthResponse> {
    try {
      console.log('🟢 AuthService - Calling:', this.buildUrl(ENDPOINTS.GOOGLE_LOGIN));
      console.log('🟢 request', request);
      console.log('🟢 Sendding', API_BASE_URL );
      const idToken=request.id_token
      const response = await fetch(this.buildUrl(ENDPOINTS.GOOGLE_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
    
      console.log('🟢 result', result);
      if (response.ok && result.data) {
        console.log('🟢 result.data', result.data);
        console.log('🔍 AUTHSERVICE - Checking user active fields:', {
          'result.data.user_is_active': result.data.user_is_active,
          'result.data.isUserActive': result.data.isUserActive,
          'typeof user_is_active': typeof result.data.user_is_active,
          'typeof isUserActive': typeof result.data.isUserActive,
          'All fields in result.data': Object.keys(result.data)
        });
        
        // Store tokens if needed
        await this.storeTokens(result.data.access_token, result.data.refresh_token);
        console.log("ok");
        
        return result.data;
      }
      
      throw new Error(result.message || 'Google login failed');
    } catch (error) {
      console.error('🔴 AuthService - Google Login Error:', error);
      throw error;
    }
  }

  // Email/Password Login
  async emailLogin(request: EmailLoginRequest): Promise<LoginResponseDto> {
    try {
      console.log('🟡 Email login request:', request);
      const response = await fetch(this.buildUrl(ENDPOINTS.EMAIL_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      console.log('🟡 Email login response:', result);
      
      if (response.ok && result.data) {
        // Store tokens
        await this.storeTokens(result.data.access_token, result.data.refresh_token);
        return result.data;
      }
      
      throw new Error(result.message || 'Login failed');
    } catch (error) {
      console.error('🔴 AuthService - Email Login Error:', error);
      throw error;
    }
  }

  // Register new user
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log('🟡 Registering user:', request);
      const response = await fetch(this.buildUrl(ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      console.log('🟡 Register response:', result);
      
      if (response.ok && result.data) {
        return result.data;
      }
      
      throw new Error(result.message || 'Registration failed');
    } catch (error) {
      console.error('🔴 AuthService - Registration Error:', error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOtp(request: VerifyOtpRequest): Promise<boolean> {
    try {
      console.log('🟡 Verifying OTP:', request);
      
      // Prepare request body - handle both old and new format
      const requestBody: any = {
        email: request.email,
      };
      
      // Handle OTP field (both otp and otp_code for backward compatibility)
      const otpValue = request.otp || request.otp_code;
      if (!otpValue) {
        throw new Error('OTP code is required');
      }
      requestBody.otp = otpValue;
      
      // If we have full user information, include it (for registration flow)
      if (request.full_name) {
        requestBody.full_name = request.full_name;
        requestBody.dob = request.dob;
        requestBody.phone_number = request.phone_number;
        requestBody.gender = request.gender;
        requestBody.password = request.password;
      }
      // For simple OTP verification (forgot password flow), just send email and otp
      else if (request.password) {
        requestBody.password = request.password;
      }
      
      console.log('🟡 Final request body:', requestBody);
      
      const response = await fetch(this.buildUrl(ENDPOINTS.VERIFY_OTP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('🟡 Verify OTP response:', result);
      
      // Check both response status and result status
      if (response.ok && result.status_code !== 500) {
        console.log('🟢 OTP verification result: true');
        return true;
      }
      
      console.log('🔴 OTP verification result: false');
      throw new Error(result.message || 'OTP verification failed');
    } catch (error) {
      console.error('🔴 AuthService - OTP Verification Error:', error);
      throw error;
    }
  }

  // Resend OTP
  async resendOtp(email: string): Promise<void> {
    try {
      console.log('🟡 Resending OTP to:', email);
      const response = await fetch(this.buildUrl(ENDPOINTS.RESEND_OTP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log('🟡 Resend OTP response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('🔴 AuthService - Resend OTP Error:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      console.log('🟡 Getting current user profile...');
      
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(this.buildUrl(ENDPOINTS.GET_PROFILE), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log('🟡 Get profile response:', result);
      
      if (response.ok && result.data) {
        return result.data;
      }
      
      throw new Error(result.message || 'Failed to get user profile');
    } catch (error) {
      console.error('🔴 AuthService - Get Profile Error:', error);
      throw error;
    }
  }

  // Update user profile with snake_case payload
  async updateUserProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    try {
      console.log('🟡 Updating user profile...');
      console.log('🟡 Update payload:', JSON.stringify(payload, null, 2));
      
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No access token available');
      }

      if (!payload || Object.keys(payload).length === 0) {
        throw new Error('No fields to update. Please provide at least one field to update.');
      }

      const response = await fetch(this.buildUrl(ENDPOINTS.UPDATE_PROFILE), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('🟡 Update profile response:', result);
      
      if (response.ok && result.data) {
        console.log('🟢 Profile updated successfully');
        return result.data;
      }
      
      throw new Error(result.message || 'Failed to update user profile');
    } catch (error) {
      console.error('🔴 AuthService - Update Profile Error:', error);
      throw error;
    }
  }

  // Upload user avatar
  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      console.log('🟡 Uploading avatar...');
      console.log('🟡 Image URI:', imageUri);
      
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Extract filename from URI or use default
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      
      // Determine MIME type based on file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg'; // default
      
      switch (extension) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
      }
      
      // Append file to FormData
      formData.append('avatar', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);

      const response = await fetch(this.buildUrl(ENDPOINTS.UPLOAD_AVATAR), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      const result = await response.json();
      console.log('🟡 Upload avatar response:', result);
      
      if (response.ok && result.data) {
        const avatarUrl = result.data.avatar_url || result.data.url || result.data;
        console.log('🟢 Avatar uploaded successfully:', avatarUrl);
        return avatarUrl;
      }
      
      throw new Error(result.message || 'Failed to upload avatar');
    } catch (error) {
      console.error('🔴 AuthService - Upload Avatar Error:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const refresh_token = await this.getStoredRefreshToken();
      if (refresh_token) {
        await fetch(this.buildUrl(ENDPOINTS.LOGOUT), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refresh_token}`,
          },
        });
      }
    } catch (error) {
      console.error('🔴 AuthService - Logout Error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // Store tokens securely
  private async storeTokens(access_token: string, refresh_token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      
      // Store token expiry time
      const expiryTime = getTokenExpiry(access_token);
      if (expiryTime) {
        await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      }
      
      // Store login time
      await SecureStore.setItemAsync(STORAGE_KEYS.LOGIN_TIME, Date.now().toString());
      
      console.log('🟢 Tokens stored successfully');
    } catch (error) {
      console.error('🔴 Error storing tokens:', error);
    }
  }

  // Clear stored tokens
  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_EXPIRY);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.LOGIN_TIME);
      console.log('🟢 Tokens cleared successfully');
    } catch (error) {
      console.error('🔴 Error clearing tokens:', error);
    }
  }

  // Get stored access token
  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('🔴 Error getting stored token:', error);
      return null;
    }
  }

  // Get stored refresh token
  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('🔴 Error getting stored refresh token:', error);
      return null;
    }
  }

  // Get token expiry time
  async getTokenExpiry(): Promise<number | null> {
    try {
      const expiry = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN_EXPIRY);
      return expiry ? parseInt(expiry) : null;
    } catch (error) {
      console.error('🔴 Error getting token expiry:', error);
      return null;
    }
  }

  // Check if token is near expiry and show notification
  async checkTokenExpiry(): Promise<{ isExpired: boolean; isNearExpiry: boolean; remainingTime?: number }> {
    try {
      const expiryTime = await this.getTokenExpiry();
      if (!expiryTime) {
        return { isExpired: true, isNearExpiry: false };
      }

      const now = Date.now();
      const remainingTime = expiryTime - now;
      const expired = isTokenExpired(expiryTime);
      const nearExpiry = isTokenNearExpiry(expiryTime);

      if (expired) {
        console.log('🔴 Token has expired');
        return { isExpired: true, isNearExpiry: false, remainingTime: 0 };
      }

      if (nearExpiry) {
        console.log('🟡 Token is near expiry, remaining time:', Math.floor(remainingTime / 1000 / 60), 'minutes');
        return { isExpired: false, isNearExpiry: true, remainingTime };
      }

      return { isExpired: false, isNearExpiry: false, remainingTime };
    } catch (error) {
      console.error('🔴 Error checking token expiry:', error);
      return { isExpired: true, isNearExpiry: false };
    }
  }

  // Check if user is authenticated with token validation
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      const refresh_token = await this.getStoredRefreshToken();
      
      if (!token || !refresh_token) {
        return false;
      }

      // Check token expiry
      const { isExpired } = await this.checkTokenExpiry();
      if (isExpired) {
        console.log('🔴 Token expired, attempting refresh...');
        const newToken = await this.refreshAccessToken();
        return !!newToken;
      }

      return true;
    } catch (error) {
      console.error('🔴 Error checking authentication:', error);
      return false;
    }
  }

  // Auto-refresh token if needed
  async getValidToken(): Promise<string | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) return null;

      const expiryTime = await this.getTokenExpiry();
      if (!expiryTime) return null;

      const expired = isTokenExpired(expiryTime);
      const shouldRefresh = shouldAutoRefresh(expiryTime);
      
      if (expired) {
        console.log('🔴 Token expired, refreshing...');
        return await this.refreshAccessToken();
      }
      
      if (shouldRefresh) {
        console.log('🟡 Token will expire soon, refreshing preemptively...');
        const newToken = await this.refreshAccessToken();
        return newToken || token; // Return new token or fallback to current
      }

      return token;
    } catch (error) {
      console.error('🔴 Error getting valid token:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refresh_token = await this.getStoredRefreshToken();
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      console.log('🟡 Refreshing access token...');

      const response = await fetch(this.buildUrl(ENDPOINTS.REFRESH_TOKEN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refresh_token}`, // ✅ Send refresh token in Authorization header
        },
        // ✅ No body needed as backend reads from Authorization header
      });

      const result = await response.json();
      console.log('🟡 Refresh token response:', result);
      
      // ✅ Backend returns "accessToken" (camelCase), not "access_token"
      if (response.ok && result.accessToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
        
        // Store new token expiry time
        const expiryTime = getTokenExpiry(result.accessToken);
        if (expiryTime) {
          await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
        }
        
        console.log('🟢 Access token refreshed successfully');
        return result.accessToken;
      }
      
      // Handle error response
      const errorMessage = result.error || 'Failed to refresh token';
      throw new Error(errorMessage);
    } catch (error) {
      console.error('🔴 AuthService - Token Refresh Error:', error);
      await this.clearTokens();
      return null;
    }
  }

  // Check refresh token expiry (7 days)
  async checkRefreshTokenExpiry(): Promise<{ isExpired: boolean; isNearExpiry: boolean; remainingDays?: number }> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        return { isExpired: true, isNearExpiry: false };
      }

      const expiryTime = getTokenExpiry(refreshToken);
      if (!expiryTime) {
        return { isExpired: true, isNearExpiry: false };
      }

      const now = Date.now();
      const remainingTime = expiryTime - now;
      const expired = isTokenExpired(expiryTime);
      
      // Warn user 1 day before refresh token expires
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const nearExpiry = (remainingTime <= oneDayInMs) && !expired;

      if (expired) {
        console.log('🔴 Refresh token has expired');
        return { isExpired: true, isNearExpiry: false, remainingDays: 0 };
      }

      if (nearExpiry) {
        const remainingDays = Math.ceil(remainingTime / oneDayInMs);
        console.log('🟡 Refresh token expires in:', remainingDays, 'days');
        return { isExpired: false, isNearExpiry: true, remainingDays };
      }

      return { isExpired: false, isNearExpiry: false, remainingDays: Math.ceil(remainingTime / oneDayInMs) };
    } catch (error) {
      console.error('🔴 Error checking refresh token expiry:', error);
      return { isExpired: true, isNearExpiry: false };
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 