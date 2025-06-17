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
      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('refresh_token', refresh_token);
      console.log('🟢 Tokens stored successfully');
    } catch (error) {
      console.error('🔴 Error storing tokens:', error);
    }
  }

  // Clear stored tokens
  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      console.log('🟢 Tokens cleared successfully');
    } catch (error) {
      console.error('🔴 Error clearing tokens:', error);
    }
  }

  // Get stored access token
  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('access_token');
    } catch (error) {
      console.error('🔴 Error getting stored token:', error);
      return null;
    }
  }

  // Get stored refresh token
  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('refresh_token');
    } catch (error) {
      console.error('🔴 Error getting stored refresh token:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      const refresh_token = await this.getStoredRefreshToken();
      return !!(token && refresh_token);
    } catch (error) {
      console.error('🔴 Error checking authentication:', error);
      return false;
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
        await SecureStore.setItemAsync('access_token', result.accessToken);
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
}

// Export singleton instance
export const authService = AuthService.getInstance(); 