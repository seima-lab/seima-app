import { apiService } from './apiService';
import { authService } from './authService';

export interface UserData {
  user_id: number;
  user_full_name: string;
  user_email: string;
  user_dob?: string | null;
  user_gender?: boolean | null; // true = male, false = female
  user_phone_number?: string | null;
  user_avatar_url?: string | null;
}

// Helper interface for easier usage in components
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  phoneNumber?: string;
  avatarUrl?: string;
}

// Utility function to convert API response to UserProfile
export const mapUserDataToProfile = (userData: UserData): UserProfile => {
  return {
    id: userData.user_id,
    fullName: userData.user_full_name,
    email: userData.user_email,
    dateOfBirth: userData.user_dob || undefined,
    gender: userData.user_gender === true ? 'male' : userData.user_gender === false ? 'female' : undefined,
    phoneNumber: userData.user_phone_number || undefined,
    avatarUrl: userData.user_avatar_url || undefined,
  };
};

export interface TransactionData {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export class SecureApiService {
  private static instance: SecureApiService;

  public static getInstance(): SecureApiService {
    if (!SecureApiService.instance) {
      SecureApiService.instance = new SecureApiService();
    }
    return SecureApiService.instance;
  }

  // ✅ Get current user profile from /me endpoint
  async getCurrentUserProfile(): Promise<UserData> {
    try {
      console.log('🟡 Making request to /api/v1/users/me...');
      const response = await apiService.get<any>('/api/v1/users/me');
      
      console.log('🟢 Full response:', JSON.stringify(response, null, 2));
      console.log('🟢 Response.data:', response.data);
      
      // Check if response has the expected structure
      if (response.data) {
        // If data is nested in response.data.data (standard API format)
        if (response.data.data) {
          console.log('🟢 Using nested data structure');
          return response.data.data as UserData;
        }
        // If data is directly in response.data (some APIs return this way)
        else if (response.data.user_id) {
          console.log('🟢 Using direct data structure');
          return response.data as UserData;
        }
      }
      
      console.error('🔴 Unexpected response structure:', response);
      throw new Error('Invalid response structure');
    } catch (error: any) {
      console.error('🔴 getCurrentUserProfile error:', error);
      throw error;
    }
  }

  // ✅ Get user profile (with automatic Authorization header from SecureStore)
  async getUserProfile(): Promise<UserData> {
    const response = await apiService.get<UserData>('/api/v1/user/profile');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user profile');
  }

  // ✅ Update user profile
  async updateUserProfile(userData: Partial<UserData>): Promise<UserData> {
    const response = await apiService.put<UserData>('/api/v1/user/profile', userData);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update profile');
  }

  // ✅ Get user transactions
  async getTransactions(page = 1, limit = 20): Promise<TransactionData[]> {
    const response = await apiService.get<TransactionData[]>(`/api/v1/transactions?page=${page}&limit=${limit}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get transactions');
  }

  // ✅ Create new transaction
  async createTransaction(transaction: Omit<TransactionData, 'id'>): Promise<TransactionData> {
    const response = await apiService.post<TransactionData>('/api/v1/transactions', transaction);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create transaction');
  }

  // ✅ Upload user avatar
  async uploadAvatar(imageUri: string): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await apiService.post<{ avatarUrl: string }>('/api/v1/user/avatar', formData, {
      'Content-Type': 'multipart/form-data',
    });

    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to upload avatar');
  }

  // ✅ Handle token refresh automatically
  async makeAuthenticatedRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
    try {
      let response;
      
      switch (method) {
        case 'GET':
          response = await apiService.get<T>(endpoint);
          break;
        case 'POST':
          response = await apiService.post<T>(endpoint, data);
          break;
        case 'PUT':
          response = await apiService.put<T>(endpoint, data);
          break;
        case 'DELETE':
          response = await apiService.delete<T>(endpoint);
          break;
      }

      // For DELETE requests, success means API didn't throw an error
      if (method === 'DELETE') {
        console.log('✅ DELETE request completed successfully');
        return undefined as T;
      }
      
      // For other methods, check if we have data
      if (response.data !== undefined) {
        return response.data;
      }
      
      // If no data but also no error from API, it might be success
      console.log('⚠️ No data in response but request succeeded');
      return undefined as T;

    } catch (error: any) {
      // If token expired, try to refresh and retry
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.log('🟡 Token expired, attempting refresh...');
        
        const newToken = await authService.refreshAccessToken();
        if (newToken) {
          console.log('🟢 Token refreshed, retrying request...');
          // Retry the request with new token
          return this.makeAuthenticatedRequest<T>(endpoint, method, data);
        } else {
          // Refresh failed, user needs to login again
          console.log('🔴 Token refresh failed, clearing tokens and triggering logout');
          await authService.clearTokens();
          
          // Import NavigationService dynamically to avoid circular dependency
          const NavigationServiceModule = await import('../navigation/NavigationService');
          
          // Use timeout to ensure this runs after current call stack
          setTimeout(() => {
            try {
              // Force navigation to login screen
              NavigationServiceModule.NavigationService.resetToLogin();
            } catch (navError) {
              console.error('🔴 Navigation error:', navError);
            }
          }, 100);
          
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      }
      
      throw error;
    }
  }
}

export const secureApiService = SecureApiService.getInstance(); 