
// API endpoints - read from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const ENDPOINTS = {
  GOOGLE_LOGIN: '/api/v1/auth/google',
  EMAIL_LOGIN: '/api/v1/auth/login', 
  REGISTER: '/api/v1/auth/register',
  REFRESH_TOKEN: '/api/v1/auth/refresh',
  LOGOUT: '/api/v1/auth/logout',
};

// Types for authentication
export interface GoogleLoginRequest {
  idToken: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  picture?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userInformation: UserProfile;
  isFirstLogin: boolean;
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
      
      const response = await fetch(this.buildUrl(ENDPOINTS.GOOGLE_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (response.ok && result.data) {
        // Store tokens if needed
        await this.storeTokens(result.data.accessToken, result.data.refreshToken);
        return result.data;
      }
      
      throw new Error(result.message || 'Google login failed');
    } catch (error) {
      console.error('🔴 AuthService - Google Login Error:', error);
      throw error;
    }
  }

  // Email/Password Login
  async emailLogin(request: EmailLoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(this.buildUrl(ENDPOINTS.EMAIL_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (response.ok && result.data) {
        await this.storeTokens(result.data.accessToken, result.data.refreshToken);
        return result.data;
      }
      
      throw new Error(result.message || 'Login failed');
    } catch (error) {
      console.error('🔴 AuthService - Email Login Error:', error);
      throw error;
    }
  }

  // Register new user
  async register(request: RegisterRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(this.buildUrl(ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (response.ok && result.data) {
        return result.data;
      }
      
      throw new Error(result.message || 'Registration failed');
    } catch (error) {
      console.error('🔴 AuthService - Register Error:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch(this.buildUrl(ENDPOINTS.LOGOUT), {
        method: 'POST',
      });
      await this.clearTokens();
    } catch (error) {
      console.error('🔴 AuthService - Logout Error:', error);
      // Clear tokens anyway
      await this.clearTokens();
    }
  }

  // Token management (you might want to use AsyncStorage here)
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // TODO: Implement with AsyncStorage
      // await AsyncStorage.setItem('accessToken', accessToken);
      // await AsyncStorage.setItem('refreshToken', refreshToken);
      
      console.log('🟢 Tokens stored successfully');
    } catch (error) {
      console.error('🔴 Error storing tokens:', error);
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      // TODO: Implement with AsyncStorage
      // await AsyncStorage.removeItem('accessToken');
      // await AsyncStorage.removeItem('refreshToken');
      
      console.log('🟢 Tokens cleared successfully');
    } catch (error) {
      console.error('🔴 Error clearing tokens:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      // TODO: Implement with AsyncStorage
      // return await AsyncStorage.getItem('accessToken');
      return null;
    } catch (error) {
      console.error('🔴 Error getting stored token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 